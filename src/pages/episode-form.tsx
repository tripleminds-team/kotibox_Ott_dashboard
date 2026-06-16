import { useState, useRef, KeyboardEvent } from "react";
import { useLocation, useParams } from "wouter";
import { ImageIcon, Sparkles, Trash2, X, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Tab = "Episode Details" | "Basic Info" | "Quality Info" | "Subtitle Info" | "SEO Settings" | "Download Info";
const TABS: Tab[] = ["Episode Details", "Basic Info", "Quality Info", "Subtitle Info", "SEO Settings", "Download Info"];

const MOCK_SHOWS = [
  { _id: "1", name: "The Smiling doll" },
  { _id: "2", name: "Gunslinger's Justice" },
  { _id: "3", name: "Raziel's Daring Rescue" },
  { _id: "4", name: "Shadow Pursuit" },
  { _id: "5", name: "Neon Dreams" },
];

const MOCK_SEASONS = [
  { _id: "1", name: "Season 1", showId: "1" },
  { _id: "2", name: "Season 2", showId: "1" },
  { _id: "3", name: "Season 1", showId: "2" },
  { _id: "4", name: "Season 1", showId: "3" },
  { _id: "5", name: "Season 1", showId: "4" },
];

const MOCK_EPISODES_TMDB = [
  { _id: "1", label: "Episode 1" },
  { _id: "2", label: "Episode 2" },
  { _id: "3", label: "Episode 3" },
];

type AccessType = "paid" | "free" | "pay_per_view";
type QualityRow = { _id: string; uploadType: string; quality: string; file: string };
type SubtitleRow = { _id: string; language: string; url: string };
type DownloadRow = { _id: string; uploadType: string; quality: string; file: string };

function ImageUploadBox({ label, preview, onUpload, tall = false }: {
  label: string; preview: string; onUpload: (url: string) => void; tall?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <Label className="text-foreground text-sm font-medium">{label}</Label>
      <div
        onClick={() => ref.current?.click()}
        className={`border-2 border-dashed border-border rounded-xl flex items-center justify-center cursor-pointer hover:border-red-500/40 bg-muted/20 transition-colors overflow-hidden ${tall ? "h-48" : "h-44"}`}
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-9 w-9 text-zinc-600" />
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(URL.createObjectURL(f)); }} />
    </div>
  );
}

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-muted/60 border-b border-border px-3 py-1.5 flex flex-wrap gap-1">
        {["File", "Edit", "View", "Insert", "Format"].map((m) => (
          <button key={m} type="button" className="text-xs text-zinc-400 hover:text-foreground px-1.5 py-0.5 rounded transition-colors">{m} ▾</button>
        ))}
      </div>
      <div className="bg-muted/60 border-b border-border px-3 py-1.5 flex flex-wrap gap-1 items-center">
        <button type="button" className="text-xs text-zinc-400 hover:text-foreground w-6 h-6 rounded border border-border flex items-center justify-center">↩</button>
        <button type="button" className="text-xs text-zinc-400 hover:text-foreground w-6 h-6 rounded border border-border flex items-center justify-center">↪</button>
        <button type="button" className="text-xs text-zinc-400 hover:text-foreground px-2 h-6 rounded border border-border">Formats ▾</button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button type="button" className="text-xs font-bold text-zinc-400 hover:text-foreground w-6 h-6 rounded border border-border flex items-center justify-center">B</button>
        <button type="button" className="text-xs italic text-zinc-400 hover:text-foreground w-6 h-6 rounded border border-border flex items-center justify-center">I</button>
        <button type="button" className="text-xs line-through text-zinc-400 hover:text-foreground w-6 h-6 rounded border border-border flex items-center justify-center">S</button>
        <button type="button" className="text-xs text-zinc-400 hover:text-foreground w-6 h-6 rounded border border-border flex items-center justify-center">🔗</button>
        <div className="w-px h-4 bg-border mx-0.5" />
        {["≡", "≡", "≡", "≡"].map((a, i) => (
          <button key={i} type="button" className="text-xs text-zinc-400 hover:text-foreground w-6 h-6 rounded border border-border flex items-center justify-center">{a}</button>
        ))}
        <button type="button" className="text-xs text-zinc-400 hover:text-foreground w-6 h-6 rounded border border-border flex items-center justify-center">T̲</button>
        <button type="button" className="text-xs text-zinc-400 hover:text-foreground w-6 h-6 rounded border border-border flex items-center justify-center">&lt;/&gt;</button>
        <button type="button" className="text-xs text-zinc-400 hover:text-foreground w-6 h-6 rounded border border-border flex items-center justify-center">🖼</button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="bg-white dark:bg-zinc-900 border-0 text-foreground rounded-none text-sm resize-none focus-visible:ring-0"
      />
      <div className="bg-muted/40 border-t border-border px-3 py-1 text-right">
        <span className="text-xs text-zinc-500">POWERED BY TINYMCE</span>
      </div>
    </div>
  );
}

export default function EpisodeForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState<Tab>("Episode Details");

  // TMDB Import
  const [tmdbShow, setTmdbShow] = useState("");
  const [tmdbSeason, setTmdbSeason] = useState("");
  const [tmdbEpisode, setTmdbEpisode] = useState("");

  // Episode Details
  const [posterPreview, setPosterPreview] = useState("");
  const [posterTvPreview, setPosterTvPreview] = useState("");
  const [showId, setShowId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [name, setName] = useState("");
  const [statusActive, setStatusActive] = useState(true);
  const [description, setDescription] = useState("");
  const [access, setAccess] = useState<AccessType>("paid");
  const [plan, setPlan] = useState("");
  const [trailerUrlType, setTrailerUrlType] = useState("");

  // Basic Info
  const [duration, setDuration] = useState("");
  const [skipIntroStart, setSkipIntroStart] = useState("");
  const [skipIntroEnd, setSkipIntroEnd] = useState("");
  const [imdbRating, setImdbRating] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [contentRating, setContentRating] = useState("");
  const [downloadStatus, setDownloadStatus] = useState(true);

  // Quality Info
  const [videoUploadType, setVideoUploadType] = useState("local");
  const [videoFile, setVideoFile] = useState("");
  const [qualityEnabled, setQualityEnabled] = useState(true);
  const [qualities, setQualities] = useState<QualityRow[]>([
    { _id: "1", uploadType: "local", quality: "1080p", file: "" },
  ]);

  // Subtitle Info
  const [subtitles, setSubtitles] = useState<SubtitleRow[]>([
    { _id: "1", language: "", url: "" },
  ]);

  // SEO Settings
  const [seoEnabled, setSeoEnabled] = useState(true);
  const [seoImagePreview, setSeoImagePreview] = useState("");
  const seoImageRef = useRef<HTMLInputElement>(null);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaKeywords, setMetaKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [googleVerification, setGoogleVerification] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // Download Info
  const [downloads, setDownloads] = useState<DownloadRow[]>([
    { _id: "1", uploadType: "local", quality: "1080p", file: "" },
  ]);

  const filteredSeasons = MOCK_SEASONS.filter((s) => !showId || s.showId === showId);

  const addQuality = () =>
    setQualities((p) => [...p, { _id: Date.now().toString(), uploadType: "local", quality: "720p", file: "" }]);
  const removeQuality = (id: string) => setQualities((p) => p.filter((q) => q._id !== id));
  const updateQuality = (id: string, field: keyof QualityRow, val: string) =>
    setQualities((p) => p.map((q) => (q._id === id ? { ...q, [field]: val } : q)));

  const addSubtitle = () =>
    setSubtitles((p) => [...p, { _id: Date.now().toString(), language: "", url: "" }]);
  const removeSubtitle = (id: string) => setSubtitles((p) => p.filter((s) => s._id !== id));
  const updateSubtitle = (id: string, field: keyof SubtitleRow, val: string) =>
    setSubtitles((p) => p.map((s) => (s._id === id ? { ...s, [field]: val } : s)));

  const addDownload = () =>
    setDownloads((p) => [...p, { _id: Date.now().toString(), uploadType: "local", quality: "720p", file: "" }]);
  const removeDownload = (id: string) => setDownloads((p) => p.filter((d) => d._id !== id));
  const updateDownload = (id: string, field: keyof DownloadRow, val: string) =>
    setDownloads((p) => p.map((d) => (d._id === id ? { ...d, [field]: val } : d)));

  const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keywordInput.trim()) {
      e.preventDefault();
      if (!metaKeywords.includes(keywordInput.trim()))
        setMetaKeywords((p) => [...p, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleSave = () => {
    toast({ title: isEdit ? "Episode updated successfully!" : "Episode created successfully!" });
    setLocation("/episodes");
  };

  const FileInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="relative">
      <Input
        placeholder="Choose File to Upload"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm pr-10"
      />
      <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
    </div>
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => setLocation("/dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
        <span>/</span>
        <span className="text-foreground font-medium">{isEdit ? "Edit Episode" : "New Episode"}</span>
      </div>

      {/* Back */}
      <button onClick={() => setLocation("/episodes")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
        «&nbsp;Back
      </button>

      {/* Import From TMDB */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Import Episode From TMDB</p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[150px] space-y-1.5">
            <Label className="text-foreground text-xs font-medium flex items-center gap-1">
              TV Shows <span className="text-zinc-500 text-xs">ℹ</span>
            </Label>
            <Select value={tmdbShow} onValueChange={setTmdbShow}>
              <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                <SelectValue placeholder="Select TV Show" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                {MOCK_SHOWS.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px] space-y-1.5">
            <Label className="text-foreground text-xs font-medium">Season</Label>
            <Select value={tmdbSeason} onValueChange={setTmdbSeason}>
              <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                <SelectValue placeholder="Select Season" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                {MOCK_SEASONS.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px] space-y-1.5">
            <Label className="text-foreground text-xs font-medium">Episode</Label>
            <Select value={tmdbEpisode} onValueChange={setTmdbEpisode}>
              <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                <SelectValue placeholder="Select Episode" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                {MOCK_EPISODES_TMDB.map((e) => <SelectItem key={e._id} value={e._id}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white h-10 px-6 rounded-lg font-semibold text-sm shrink-0">
            Import
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "bg-red-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── EPISODE DETAILS ── */}
      {activeTab === "Episode Details" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <p className="text-sm font-semibold text-foreground">Episode Details</p>

          {/* 4-col: Poster | Poster TV | [Show/Season] | [Ep#/Name] */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            <ImageUploadBox label="Poster" preview={posterPreview} onUpload={setPosterPreview} tall />
            <ImageUploadBox label="Poster Tv Image" preview={posterTvPreview} onUpload={setPosterTvPreview} tall />

            {/* Show + Season */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">TV Show <span className="text-red-500">*</span></Label>
                <Select value={showId} onValueChange={(v) => { setShowId(v); setSeasonId(""); }}>
                  <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                    <SelectValue placeholder="Select TV Show" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    {MOCK_SHOWS.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">Season <span className="text-red-500">*</span></Label>
                <Select value={seasonId} onValueChange={setSeasonId}>
                  <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                    <SelectValue placeholder="Select Season" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    {filteredSeasons.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ep Number + Name */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">Episode Number</Label>
                <Input
                  type="number" placeholder="e.g. 1"
                  value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. When a prison bus crashes, some in..."
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <Label className="text-foreground text-sm font-medium">Status</Label>
            <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-4 h-10 min-w-[140px]">
              <span className="text-sm text-foreground flex-1">{statusActive ? "Active" : "Inactive"}</span>
              <Switch checked={statusActive} onCheckedChange={setStatusActive} className="data-[state=checked]:bg-red-600" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-foreground text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </Label>
              <button type="button" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                <Sparkles className="h-3 w-3" /> Generate Description with AI
              </button>
            </div>
            <RichEditor value={description} onChange={setDescription} />
          </div>

          {/* Access */}
          <div className="space-y-2">
            <Label className="text-foreground text-sm font-medium">Access</Label>
            <div className="flex flex-wrap gap-3">
              {([
                { value: "paid", label: "Paid" },
                { value: "free", label: "Free" },
                { value: "pay_per_view", label: "Pay Per View" },
              ] as { value: AccessType; label: string }[]).map((a) => (
                <label key={a.value} className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setAccess(a.value)}
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      access === a.value ? "border-red-500" : "border-zinc-500"
                    }`}
                  >
                    {access === a.value && <div className="h-2 w-2 rounded-full bg-red-500" />}
                  </div>
                  <span
                    onClick={() => setAccess(a.value)}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {a.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Plan + Trailer URL Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm font-medium">
                Plan <span className="text-red-500">*</span>
              </Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                  <SelectValue placeholder="Select Plan" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium Plan</SelectItem>
                  <SelectItem value="ultimate">Ultimate Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm font-medium">
                Trailer URL Type <span className="text-red-500">*</span>
              </Label>
              <Select value={trailerUrlType} onValueChange={setTrailerUrlType}>
                <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="upload">Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* ── BASIC INFO ── */}
      {activeTab === "Basic Info" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <p className="text-sm font-semibold text-foreground">Basic Info</p>
          <div className="rounded-xl border border-border p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">Duration <span className="text-red-500">*</span></Label>
                <Input placeholder="Duration" value={duration} onChange={(e) => setDuration(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">Skip Intro Start Time</Label>
                <Input placeholder="Skip Intro Start Time" value={skipIntroStart} onChange={(e) => setSkipIntroStart(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">Skip Intro End Time</Label>
                <Input placeholder="Skip Intro End Time" value={skipIntroEnd} onChange={(e) => setSkipIntroEnd(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">IMDb Rating</Label>
                <Input placeholder="IMDb Rating" value={imdbRating} onChange={(e) => setImdbRating(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">Release Date <span className="text-red-500">*</span></Label>
                <Input placeholder="Release Date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">Content Rating <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. Everyone. Content is generally suitable for all ages"
                  value={contentRating} onChange={(e) => setContentRating(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-foreground text-sm font-medium">Download Status</Label>
              <div className="flex items-center gap-2 bg-muted border border-border rounded-lg px-4 h-10 min-w-[140px]">
                <span className="text-sm text-foreground flex-1">{downloadStatus ? "On" : "Off"}</span>
                <Switch checked={downloadStatus} onCheckedChange={setDownloadStatus} className="data-[state=checked]:bg-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── QUALITY INFO ── */}
      {activeTab === "Quality Info" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          {/* Video Info section */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">Video Info</p>
            <div className="rounded-xl border border-border p-5 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Video Upload Type</Label>
                  <Select value={videoUploadType} onValueChange={setVideoUploadType}>
                    <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground">
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="s3">Amazon S3</SelectItem>
                      <SelectItem value="bunny">BunnyCDN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">
                    Video File <span className="text-red-500">*</span>
                  </Label>
                  <FileInput value={videoFile} onChange={setVideoFile} />
                  {!videoFile && (
                    <p className="text-xs text-red-500">Video File field is required</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quality Info section */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">Quality Info</p>
            <div className="rounded-xl border border-border overflow-hidden">
              {/* Toggle row */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
                <span className="text-sm text-foreground">Turn on switch to upload quality wise video</span>
                <Switch checked={qualityEnabled} onCheckedChange={setQualityEnabled} className="data-[state=checked]:bg-red-600" />
              </div>

              {qualityEnabled && (
                <div className="p-5 space-y-3">
                  {/* Header row */}
                  <div className="grid grid-cols-3 gap-3 text-xs text-zinc-400 font-semibold uppercase tracking-wide px-1">
                    <span>Video Upload Type</span>
                    <span>Video Quality</span>
                    <span>Video File</span>
                  </div>

                  {qualities.map((q) => (
                    <div key={q._id} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-3 items-center">
                      <Select value={q.uploadType} onValueChange={(v) => updateQuality(q._id, "uploadType", v)}>
                        <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-foreground">
                          <SelectItem value="local">Local</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="s3">Amazon S3</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={q.quality} onValueChange={(v) => updateQuality(q._id, "quality", v)}>
                        <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-foreground">
                          {["360p", "480p", "720p", "1080p", "4K"].map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FileInput value={q.file} onChange={(v) => updateQuality(q._id, "file", v)} />
                      <button onClick={() => removeQuality(q._id)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/30 transition-colors shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex justify-end pt-1">
                    <Button onClick={addQuality}
                      className="bg-red-600 hover:bg-red-700 text-white h-9 gap-1.5 rounded-lg px-4 text-sm">
                      <Plus className="h-3.5 w-3.5" /> Add More
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBTITLE INFO ── */}
      {activeTab === "Subtitle Info" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <p className="text-sm font-semibold text-foreground">Subtitle Info</p>
          <div className="rounded-xl border border-border p-5 space-y-3">
            {/* Header */}
            <div className="grid grid-cols-[1fr_2fr_auto] gap-3 text-xs text-zinc-400 font-semibold uppercase tracking-wide px-1">
              <span>Language</span>
              <span>Subtitle URL</span>
              <span />
            </div>
            {subtitles.map((s) => (
              <div key={s._id} className="grid grid-cols-[1fr_2fr_auto] gap-3 items-center">
                <Input placeholder="e.g. English" value={s.language} onChange={(e) => updateSubtitle(s._id, "language", e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
                <Input placeholder="Subtitle URL (.srt, .vtt)..." value={s.url} onChange={(e) => updateSubtitle(s._id, "url", e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
                <button onClick={() => removeSubtitle(s._id)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/30 transition-colors shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex justify-end pt-1">
              <Button onClick={addSubtitle}
                className="bg-red-600 hover:bg-red-700 text-white h-9 gap-1.5 rounded-lg px-4 text-sm">
                <Plus className="h-3.5 w-3.5" /> Add More
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── SEO SETTINGS ── */}
      {activeTab === "SEO Settings" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <p className="text-sm font-semibold text-foreground px-6 pt-5 pb-4">SEO Settings</p>
          <div className="rounded-xl border border-border mx-6 mb-6 overflow-hidden">
            {/* Enable toggle */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-sm font-medium text-foreground">Enable SEO Setting</span>
              <Switch checked={seoEnabled} onCheckedChange={setSeoEnabled} className="data-[state=checked]:bg-red-600" />
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                {/* SEO Image */}
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">SEO Image <span className="text-red-500">*</span></Label>
                  <div onClick={() => seoImageRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl h-48 flex items-center justify-center cursor-pointer hover:border-red-500/40 bg-muted/20 transition-colors overflow-hidden">
                    {seoImagePreview ? (
                      <img src={seoImagePreview} alt="SEO" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-9 w-9 text-zinc-600" />
                    )}
                  </div>
                  <input ref={seoImageRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setSeoImagePreview(URL.createObjectURL(f)); }} />
                </div>

                {/* Right 2-col fields */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground text-sm font-medium">Meta Title <span className="text-red-500">*</span></Label>
                      <span className="text-xs text-zinc-500">{metaTitle.length}/100</span>
                    </div>
                    <Input placeholder="Enter Meta Title" value={metaTitle} maxLength={100}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm font-medium">Meta Keywords <span className="text-red-500">*</span></Label>
                    <div className="min-h-10 bg-muted border border-border rounded-lg px-2 py-1.5 flex flex-wrap gap-1.5 cursor-text"
                      onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}>
                      {metaKeywords.map((kw) => (
                        <span key={kw} className="inline-flex items-center gap-1 bg-zinc-700 text-zinc-200 text-xs px-2 py-0.5 rounded">
                          {kw}
                          <button type="button" onClick={() => setMetaKeywords((p) => p.filter((k) => k !== kw))}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <input value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={handleKeywordKeyDown}
                        placeholder={metaKeywords.length === 0 ? "Type and press enter" : ""}
                        className="flex-1 min-w-[100px] bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm font-medium">Google Site Verification <span className="text-red-500">*</span></Label>
                    <Input placeholder="Enter Google site verification" value={googleVerification}
                      onChange={(e) => setGoogleVerification(e.target.value)}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm font-medium">Global Canonical URL <span className="text-red-500">*</span></Label>
                    <Input placeholder="Enter Global Canonical url" value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
                  </div>
                </div>
              </div>

              {/* Meta Description full width */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground text-sm font-medium">Site Meta Description <span className="text-red-500">*</span></Label>
                  <span className="text-xs text-zinc-500">{metaDescription.length}/200</span>
                </div>
                <Textarea placeholder="Enter Meta Description" value={metaDescription} maxLength={200}
                  onChange={(e) => setMetaDescription(e.target.value)} rows={4}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm resize-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DOWNLOAD INFO ── */}
      {activeTab === "Download Info" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <p className="text-sm font-semibold text-foreground">Download Info</p>
          <div className="rounded-xl border border-border p-5 space-y-3">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_2fr_auto] gap-3 text-xs text-zinc-400 font-semibold uppercase tracking-wide px-1">
              <span>Upload Type</span>
              <span>Quality</span>
              <span>File</span>
              <span />
            </div>
            {downloads.map((d) => (
              <div key={d._id} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-3 items-center">
                <Select value={d.uploadType} onValueChange={(v) => updateDownload(d._id, "uploadType", v)}>
                  <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="s3">Amazon S3</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={d.quality} onValueChange={(v) => updateDownload(d._id, "quality", v)}>
                  <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    {["360p", "480p", "720p", "1080p", "4K"].map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FileInput value={d.file} onChange={(v) => updateDownload(d._id, "file", v)} />
                <button onClick={() => removeDownload(d._id)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/30 transition-colors shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex justify-end pt-1">
              <Button onClick={addDownload}
                className="bg-red-600 hover:bg-red-700 text-white h-9 gap-1.5 rounded-lg px-4 text-sm">
                <Plus className="h-3.5 w-3.5" /> Add More
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave}
          className="bg-red-600 hover:bg-red-700 text-white h-11 px-10 rounded-lg font-semibold text-sm">
          Save
        </Button>
      </div>
    </div>
  );
}
