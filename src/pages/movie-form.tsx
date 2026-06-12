import { useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import {
  ImageIcon, Plus, X, Trash2, Sparkles, Upload as UploadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Tab =
  | "Movie Details"
  | "Basic Info"
  | "Quality Info"
  | "Subtitle Info"
  | "SEO Settings"
  | "Clip Details"
  | "Download Info";

const TABS: Tab[] = [
  "Movie Details",
  "Basic Info",
  "Quality Info",
  "Subtitle Info",
  "SEO Settings",
  "Clip Details",
  "Download Info",
];

type QualityRow = { id: string; type: string; quality: string; file: File | null };
type SubtitleRow = { id: string; language: string; file: File | null };
type ClipRow = { id: string; name: string; type: string; url: string; file: File | null };
type DownloadRow = { id: string; type: string; quality: string; file: File | null };

/* ---- Reusable image upload box ---- */
function ImageBox({
  label,
  preview,
  onChange,
}: {
  label: string;
  preview: string;
  onChange: (file: File | null, url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <div
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-border rounded-xl aspect-[4/3] flex items-center justify-center cursor-pointer hover:border-red-500/40 bg-muted/20 transition-colors overflow-hidden"
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-10 w-10 text-zinc-700" />
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          onChange(f, f ? URL.createObjectURL(f) : "");
        }}
      />
    </div>
  );
}

export default function MovieForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState<Tab>("Movie Details");
  const [tmdbId, setTmdbId] = useState("");

  /* ---- Movie Details state ---- */
  const [thumbnail, setThumbnail] = useState({ file: null as File | null, preview: "" });
  const [poster, setPoster] = useState({ file: null as File | null, preview: "" });
  const [posterTv, setPosterTv] = useState({ file: null as File | null, preview: "" });
  const [name, setName] = useState("");
  const [trailerUrlType, setTrailerUrlType] = useState("local");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [trailerFile, setTrailerFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [access, setAccess] = useState<"paid" | "free" | "pay_per_view">("paid");
  const [plan, setPlan] = useState("");
  const [statusActive, setStatusActive] = useState(true);

  /* ---- Basic Info state ---- */
  const [language, setLanguage] = useState("");
  const [genres, setGenres] = useState("");
  const [countries, setCountries] = useState("");
  const [imdbRating, setImdbRating] = useState("");
  const [contentRating, setContentRating] = useState("");
  const [duration, setDuration] = useState("");
  const [skipIntroStart, setSkipIntroStart] = useState("");
  const [skipIntroEnd, setSkipIntroEnd] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [ageRestricted, setAgeRestricted] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(true);
  const [actors, setActors] = useState("");
  const [directors, setDirectors] = useState("");

  /* ---- Quality Info state ---- */
  const [videoUploadType, setVideoUploadType] = useState("local");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [qualityEnabled, setQualityEnabled] = useState(true);
  const [qualityRows, setQualityRows] = useState<QualityRow[]>([
    { id: "1", type: "local", quality: "480p", file: null },
  ]);

  /* ---- Subtitle Info state ---- */
  const [subtitleRows, setSubtitleRows] = useState<SubtitleRow[]>([]);

  /* ---- SEO Settings state ---- */
  const [seoEnabled, setSeoEnabled] = useState(true);
  const [seoImagePreview, setSeoImagePreview] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [googleVerification, setGoogleVerification] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const seoImageRef = useRef<HTMLInputElement>(null);

  /* ---- Clip Details state ---- */
  const [clipRows, setClipRows] = useState<ClipRow[]>([]);

  /* ---- Download Info state ---- */
  const [downloadRows, setDownloadRows] = useState<DownloadRow[]>([]);

  /* ---- Helpers ---- */
  const addQualityRow = () =>
    setQualityRows((p) => [...p, { id: Date.now().toString(), type: "local", quality: "480p", file: null }]);
  const removeQualityRow = (id: string) =>
    setQualityRows((p) => p.filter((r) => r.id !== id));
  const updateQualityRow = (id: string, key: keyof QualityRow, value: any) =>
    setQualityRows((p) => p.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const addSubtitleRow = () =>
    setSubtitleRows((p) => [...p, { id: Date.now().toString(), language: "", file: null }]);
  const removeSubtitleRow = (id: string) =>
    setSubtitleRows((p) => p.filter((r) => r.id !== id));

  const addClipRow = () =>
    setClipRows((p) => [...p, { id: Date.now().toString(), name: "", type: "local", url: "", file: null }]);
  const removeClipRow = (id: string) =>
    setClipRows((p) => p.filter((r) => r.id !== id));

  const addDownloadRow = () =>
    setDownloadRows((p) => [...p, { id: Date.now().toString(), type: "local", quality: "480p", file: null }]);
  const removeDownloadRow = (id: string) =>
    setDownloadRows((p) => p.filter((r) => r.id !== id));

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && keywordInput.trim()) {
      e.preventDefault();
      const kw = keywordInput.trim().replace(/,$/, "");
      if (!keywords.includes(kw)) setKeywords((p) => [...p, kw]);
      setKeywordInput("");
    }
  };

  const handleSave = () => {
    toast({ title: isEdit ? "Movie updated successfully!" : "Movie created successfully!" });
    setLocation("/movies");
  };

  /* ---- Shared section heading ---- */
  const SectionHeading = ({ title }: { title: string }) => (
    <p className="text-base font-semibold text-foreground">{title}</p>
  );

  /* ---- Empty state placeholder ---- */
  const EmptyState = ({ message }: { message: string }) => (
    <div className="rounded-xl border-2 border-dashed border-border bg-muted/10 py-16 flex flex-col items-center gap-3">
      <UploadIcon className="h-9 w-9 text-zinc-600" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <div className="space-y-5 pb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => setLocation("/movies")} className="hover:text-foreground transition-colors">
          Dashboard
        </button>
        <span>/</span>
        <button onClick={() => setLocation("/movies")} className="hover:text-foreground transition-colors">
          Movies
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{isEdit ? "Edit Movie" : "New Movie"}</span>
      </div>

      {/* TMDB Import */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-zinc-400 mb-3 flex items-center gap-1.5">
          <span className="text-red-500 font-bold">ⓘ</span>
          Import movie from TMDB (Add the Movie ID)
        </p>
        <div className="flex gap-3">
          <Input
            placeholder="e.g. #mv123456"
            value={tmdbId}
            onChange={(e) => setTmdbId(e.target.value)}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm max-w-sm"
          />
          <Button className="bg-red-600 hover:bg-red-700 text-white h-10 px-6 rounded-lg font-semibold text-sm">
            Import
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
              activeTab === tab
                ? "bg-red-600 text-white shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Card */}
      <div className="rounded-xl border border-border bg-card">

        {/* =========== MOVIE DETAILS =========== */}
        {activeTab === "Movie Details" && (
          <div className="p-6 space-y-6">
            <SectionHeading title="About Movie" />

            {/* Image Upload Row */}
            <div className="rounded-xl border border-border bg-muted/10 p-5">
              <div className="flex gap-5">
                <ImageBox
                  label="Thumbnail"
                  preview={thumbnail.preview}
                  onChange={(f, url) => setThumbnail({ file: f, preview: url })}
                />
                <ImageBox
                  label="Poster"
                  preview={poster.preview}
                  onChange={(f, url) => setPoster({ file: f, preview: url })}
                />
                <ImageBox
                  label="Poster Tv Image"
                  preview={posterTv.preview}
                  onChange={(f, url) => setPosterTv({ file: f, preview: url })}
                />
              </div>
            </div>

            {/* Name + Trailer URL Type + Trailer File/URL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Avengers: Endgame"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">
                  Trailer URL Type <span className="text-red-500">*</span>
                </Label>
                <Select value={trailerUrlType} onValueChange={setTrailerUrlType}>
                  <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="url">External URL</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="vimeo">Vimeo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                {trailerUrlType === "local" ? (
                  <>
                    <Label className="text-foreground text-sm font-medium">Trailer Video File</Label>
                    <div className="relative">
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setTrailerFile(e.target.files?.[0] ?? null)}
                        className="bg-muted border-border text-foreground h-10 rounded-lg text-sm file:mr-3 file:text-muted-foreground file:bg-muted file:border-0 file:text-sm cursor-pointer"
                      />
                    </div>
                    {trailerFile && (
                      <p className="text-xs text-zinc-500 truncate">{trailerFile.name}</p>
                    )}
                  </>
                ) : (
                  <>
                    <Label className="text-foreground text-sm font-medium">
                      Trailer URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. https://cdn.example.com/trailer.m3u8"
                      value={trailerUrl}
                      onChange={(e) => setTrailerUrl(e.target.value)}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-foreground text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </Label>
                <button className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors">
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate Description with AI
                </button>
              </div>
              <Textarea
                placeholder="Enter movie description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm resize-none"
              />
            </div>

            {/* Access + Plan + Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">Access</Label>
                <div className="flex gap-2 flex-wrap pt-0.5">
                  {(["paid", "free", "pay_per_view"] as const).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAccess(a)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        access === a
                          ? "bg-red-600 border-red-600 text-white"
                          : "bg-muted border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {a === "pay_per_view" ? "Pay Per View" : a.charAt(0).toUpperCase() + a.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">
                  Plan <span className="text-red-500">*</span>
                </Label>
                <Select value={plan} onValueChange={setPlan}>
                  <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                    <SelectValue placeholder="Select Plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">Status</Label>
                <div className="flex items-center gap-3 h-10">
                  <span className="text-sm text-foreground">
                    {statusActive ? "Active" : "Inactive"}
                  </span>
                  <Switch
                    checked={statusActive}
                    onCheckedChange={setStatusActive}
                    className="data-[state=checked]:bg-red-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========== BASIC INFO =========== */}
        {activeTab === "Basic Info" && (
          <div className="p-6 space-y-6">
            <SectionHeading title="Basic Info" />
            <div className="rounded-xl border border-border bg-muted/10 p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">
                    Language <span className="text-red-500">*</span>
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground">
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">Hindi</SelectItem>
                      <SelectItem value="tamil">Tamil</SelectItem>
                      <SelectItem value="telugu">Telugu</SelectItem>
                      <SelectItem value="kannada">Kannada</SelectItem>
                      <SelectItem value="malayalam">Malayalam</SelectItem>
                      <SelectItem value="marathi">Marathi</SelectItem>
                      <SelectItem value="punjabi">Punjabi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">
                    Genres <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Action, Drama, Comedy..."
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Countries</Label>
                  <Input
                    placeholder="USA, India, UK..."
                    value={countries}
                    onChange={(e) => setCountries(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">IMDb Rating</Label>
                  <Input
                    placeholder="IMDb Rating"
                    value={imdbRating}
                    onChange={(e) => setImdbRating(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">
                    Content Rating <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Everyone. Content is generally suitable for all ages"
                    value={contentRating}
                    onChange={(e) => setContentRating(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">
                    Duration <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="time"
                    step="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="bg-muted border-border text-foreground h-10 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Skip Intro Start Time</Label>
                  <Input
                    type="time"
                    step="1"
                    value={skipIntroStart}
                    onChange={(e) => setSkipIntroStart(e.target.value)}
                    className="bg-muted border-border text-foreground h-10 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Skip Intro End Time</Label>
                  <Input
                    type="time"
                    step="1"
                    value={skipIntroEnd}
                    onChange={(e) => setSkipIntroEnd(e.target.value)}
                    className="bg-muted border-border text-foreground h-10 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">
                    Release Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="bg-muted border-border text-foreground h-10 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                  <div>
                    <p className="text-sm font-medium text-foreground">Age Restricted</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Restricted Content</p>
                  </div>
                  <Switch
                    checked={ageRestricted}
                    onCheckedChange={setAgeRestricted}
                    className="data-[state=checked]:bg-red-600"
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                  <div>
                    <p className="text-sm font-medium text-foreground">Download Status</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{downloadStatus ? "On" : "Off"}</p>
                  </div>
                  <Switch
                    checked={downloadStatus}
                    onCheckedChange={setDownloadStatus}
                    className="data-[state=checked]:bg-red-600"
                  />
                </div>
              </div>
            </div>

            {/* Actors & Directors */}
            <SectionHeading title="Actors & Directors" />
            <div className="rounded-xl border border-border bg-muted/10 p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">
                    Actors <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="Enter actor names, comma separated..."
                    value={actors}
                    onChange={(e) => setActors(e.target.value)}
                    rows={3}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">
                    Directors <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="Enter director names, comma separated..."
                    value={directors}
                    onChange={(e) => setDirectors(e.target.value)}
                    rows={3}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========== QUALITY INFO =========== */}
        {activeTab === "Quality Info" && (
          <div className="p-6 space-y-6">
            {/* Video Info */}
            <SectionHeading title="Video Info" />
            <div className="rounded-xl border border-border bg-muted/10 p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">
                    Video Upload Type <span className="text-red-500">*</span>
                  </Label>
                  <Select value={videoUploadType} onValueChange={setVideoUploadType}>
                    <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground">
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="url">External URL</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="vimeo">Vimeo</SelectItem>
                      <SelectItem value="hls">HLS URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">
                    Video File <span className="text-red-500">*</span>
                  </Label>
                  {videoUploadType === "local" ? (
                    <>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
                        className="bg-muted border-border text-foreground h-10 rounded-lg text-sm file:mr-3 file:text-muted-foreground file:bg-muted file:border-0 file:text-sm cursor-pointer"
                      />
                      {videoFile && <p className="text-xs text-zinc-500 truncate">{videoFile.name}</p>}
                    </>
                  ) : (
                    <Input
                      placeholder="Enter video URL..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Quality rows */}
            <SectionHeading title="Quality Info" />
            <div className="rounded-xl border border-border bg-muted/10 p-5 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground">Turn on switch to upload quality wise video</p>
                <Switch
                  checked={qualityEnabled}
                  onCheckedChange={setQualityEnabled}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>

              {qualityEnabled && (
                <div className="space-y-4 pt-1">
                  {qualityRows.map((row) => (
                    <div key={row.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-1.5">
                        <Label className="text-foreground text-sm font-medium">Video Upload Type</Label>
                        <Select value={row.type} onValueChange={(v) => updateQualityRow(row.id, "type", v)}>
                          <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-foreground">
                            <SelectItem value="local">Local</SelectItem>
                            <SelectItem value="url">External URL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-foreground text-sm font-medium">Video Quality</Label>
                        <Select value={row.quality} onValueChange={(v) => updateQualityRow(row.id, "quality", v)}>
                          <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-foreground">
                            <SelectItem value="480p">480p</SelectItem>
                            <SelectItem value="720p">720p</SelectItem>
                            <SelectItem value="1080p">1080p</SelectItem>
                            <SelectItem value="4k">4K</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-foreground text-sm font-medium">Video File</Label>
                          <Input
                            type="file"
                            accept="video/*"
                            onChange={(e) => updateQualityRow(row.id, "file", e.target.files?.[0] ?? null)}
                            className="bg-muted border-border text-foreground h-10 rounded-lg text-sm file:mr-3 file:text-muted-foreground file:bg-muted file:border-0 file:text-sm cursor-pointer"
                          />
                        </div>
                        {qualityRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQualityRow(row.id)}
                            className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/30 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      onClick={addQualityRow}
                      className="bg-red-600 hover:bg-red-700 text-white h-9 gap-2 rounded-lg px-4 text-sm font-semibold"
                    >
                      <Plus className="h-4 w-4" />
                      Add More
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========== SUBTITLE INFO =========== */}
        {activeTab === "Subtitle Info" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeading title="Subtitle Info" />
              <Button
                type="button"
                onClick={addSubtitleRow}
                className="bg-red-600 hover:bg-red-700 text-white h-9 gap-2 rounded-lg px-4 text-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                Add Subtitle
              </Button>
            </div>

            {subtitleRows.length === 0 ? (
              <EmptyState message='No subtitles added yet. Click "Add Subtitle" to get started.' />
            ) : (
              <div className="space-y-3">
                {subtitleRows.map((row) => (
                  <div key={row.id} className="rounded-xl border border-border bg-muted/10 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-foreground text-sm font-medium">Language</Label>
                      <Select
                        value={row.language}
                        onValueChange={(v) =>
                          setSubtitleRows((p) => p.map((r) => r.id === row.id ? { ...r, language: v } : r))
                        }
                      >
                        <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                          <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-foreground">
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="hindi">Hindi</SelectItem>
                          <SelectItem value="tamil">Tamil</SelectItem>
                          <SelectItem value="telugu">Telugu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-foreground text-sm font-medium">Subtitle File (.srt, .vtt)</Label>
                        <Input
                          type="file"
                          accept=".srt,.vtt,.ass,.ssa"
                          onChange={(e) =>
                            setSubtitleRows((p) => p.map((r) => r.id === row.id ? { ...r, file: e.target.files?.[0] ?? null } : r))
                          }
                          className="bg-muted border-border text-foreground h-10 rounded-lg text-sm file:mr-3 file:text-muted-foreground file:bg-muted file:border-0 file:text-sm cursor-pointer"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSubtitleRow(row.id)}
                        className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/30 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========== SEO SETTINGS =========== */}
        {activeTab === "SEO Settings" && (
          <div className="p-6 space-y-5">
            <SectionHeading title="SEO Settings" />
            <div className="rounded-xl border border-border bg-muted/10 p-5 space-y-5">
              {/* Enable toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                <p className="text-sm font-medium text-foreground">Enable SEO Setting</p>
                <Switch
                  checked={seoEnabled}
                  onCheckedChange={setSeoEnabled}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>

              {seoEnabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* SEO Image */}
                    <div className="space-y-1.5">
                      <Label className="text-foreground text-sm font-medium">
                        SEO Image <span className="text-red-500">*</span>
                      </Label>
                      <div
                        onClick={() => seoImageRef.current?.click()}
                        className="border-2 border-dashed border-border rounded-xl h-40 flex items-center justify-center cursor-pointer hover:border-red-500/40 bg-card transition-colors overflow-hidden"
                      >
                        {seoImagePreview ? (
                          <img src={seoImagePreview} alt="SEO" className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-zinc-700" />
                        )}
                      </div>
                      <input
                        ref={seoImageRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setSeoImagePreview(URL.createObjectURL(f));
                        }}
                      />
                    </div>

                    {/* Meta Title + Meta Keywords */}
                    <div className="md:col-span-2 space-y-5">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <Label className="text-foreground text-sm font-medium">
                            Meta Title <span className="text-red-500">*</span>
                          </Label>
                          <span className="text-xs text-muted-foreground">{metaTitle.length}/100</span>
                        </div>
                        <Input
                          placeholder="Enter Meta Title"
                          value={metaTitle}
                          onChange={(e) => setMetaTitle(e.target.value.slice(0, 100))}
                          className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-foreground text-sm font-medium">
                          Meta Keywords <span className="text-red-500">*</span>
                        </Label>
                        <div
                          className="min-h-[42px] bg-muted border border-border rounded-lg px-3 py-2 flex flex-wrap gap-1.5 cursor-text"
                          onClick={() => document.getElementById("kw-input")?.focus()}
                        >
                          {keywords.map((kw) => (
                            <span
                              key={kw}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-300 text-xs font-medium"
                            >
                              {kw}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setKeywords((p) => p.filter((k) => k !== kw)); }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                          <input
                            id="kw-input"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            onKeyDown={handleKeywordKeyDown}
                            placeholder={keywords.length === 0 ? "Type and press enter" : ""}
                            className="flex-1 min-w-[140px] bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-foreground text-sm font-medium">
                        Google Site Verification <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Google site verification"
                        value={googleVerification}
                        onChange={(e) => setGoogleVerification(e.target.value)}
                        className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-foreground text-sm font-medium">
                        Global Canonical URL <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="Enter Global Canonical url"
                        value={canonicalUrl}
                        onChange={(e) => setCanonicalUrl(e.target.value)}
                        className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-foreground text-sm font-medium">
                        Site Meta Description <span className="text-red-500">*</span>
                      </Label>
                      <span className="text-xs text-muted-foreground">{metaDescription.length}/200</span>
                    </div>
                    <Textarea
                      placeholder="Enter Meta Description"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value.slice(0, 200))}
                      rows={4}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm resize-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* =========== CLIP DETAILS =========== */}
        {activeTab === "Clip Details" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeading title="Clip Details" />
              <Button
                type="button"
                onClick={addClipRow}
                className="bg-red-600 hover:bg-red-700 text-white h-9 gap-2 rounded-lg px-4 text-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                Add Clip
              </Button>
            </div>

            {clipRows.length === 0 ? (
              <EmptyState message='No clips added yet. Click "Add Clip" to get started.' />
            ) : (
              <div className="space-y-3">
                {clipRows.map((row) => (
                  <div key={row.id} className="rounded-xl border border-border bg-muted/10 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-1.5">
                        <Label className="text-foreground text-sm font-medium">Clip Name</Label>
                        <Input
                          placeholder="Enter clip name"
                          value={row.name}
                          onChange={(e) =>
                            setClipRows((p) => p.map((r) => r.id === row.id ? { ...r, name: e.target.value } : r))
                          }
                          className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-foreground text-sm font-medium">Upload Type</Label>
                        <Select
                          value={row.type}
                          onValueChange={(v) =>
                            setClipRows((p) => p.map((r) => r.id === row.id ? { ...r, type: v } : r))
                          }
                        >
                          <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-foreground">
                            <SelectItem value="local">Local</SelectItem>
                            <SelectItem value="url">External URL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-foreground text-sm font-medium">
                            {row.type === "local" ? "Clip File" : "Clip URL"}
                          </Label>
                          {row.type === "local" ? (
                            <Input
                              type="file"
                              accept="video/*"
                              onChange={(e) =>
                                setClipRows((p) => p.map((r) => r.id === row.id ? { ...r, file: e.target.files?.[0] ?? null } : r))
                              }
                              className="bg-muted border-border text-foreground h-10 rounded-lg text-sm file:mr-3 file:text-muted-foreground file:bg-muted file:border-0 file:text-sm cursor-pointer"
                            />
                          ) : (
                            <Input
                              placeholder="https://..."
                              value={row.url}
                              onChange={(e) =>
                                setClipRows((p) => p.map((r) => r.id === row.id ? { ...r, url: e.target.value } : r))
                              }
                              className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeClipRow(row.id)}
                          className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/30 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========== DOWNLOAD INFO =========== */}
        {activeTab === "Download Info" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeading title="Download Info" />
              <Button
                type="button"
                onClick={addDownloadRow}
                className="bg-red-600 hover:bg-red-700 text-white h-9 gap-2 rounded-lg px-4 text-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                Add Download
              </Button>
            </div>

            {downloadRows.length === 0 ? (
              <EmptyState message="No download options added yet. Click &quot;Add Download&quot; to get started." />
            ) : (
              <div className="space-y-3">
                {downloadRows.map((row) => (
                  <div key={row.id} className="rounded-xl border border-border bg-muted/10 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-1.5">
                        <Label className="text-foreground text-sm font-medium">Upload Type</Label>
                        <Select
                          value={row.type}
                          onValueChange={(v) =>
                            setDownloadRows((p) => p.map((r) => r.id === row.id ? { ...r, type: v } : r))
                          }
                        >
                          <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-foreground">
                            <SelectItem value="local">Local</SelectItem>
                            <SelectItem value="url">External URL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-foreground text-sm font-medium">Quality</Label>
                        <Select
                          value={row.quality}
                          onValueChange={(v) =>
                            setDownloadRows((p) => p.map((r) => r.id === row.id ? { ...r, quality: v } : r))
                          }
                        >
                          <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-foreground">
                            <SelectItem value="480p">480p</SelectItem>
                            <SelectItem value="720p">720p</SelectItem>
                            <SelectItem value="1080p">1080p</SelectItem>
                            <SelectItem value="4k">4K</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-foreground text-sm font-medium">
                            {row.type === "local" ? "File" : "Download URL"}
                          </Label>
                          {row.type === "local" ? (
                            <Input
                              type="file"
                              accept="video/*"
                              onChange={(e) =>
                                setDownloadRows((p) => p.map((r) => r.id === row.id ? { ...r, file: e.target.files?.[0] ?? null } : r))
                              }
                              className="bg-muted border-border text-foreground h-10 rounded-lg text-sm file:mr-3 file:text-muted-foreground file:bg-muted file:border-0 file:text-sm cursor-pointer"
                            />
                          ) : (
                            <Input
                              placeholder="https://..."
                              className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDownloadRow(row.id)}
                          className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/30 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-red-600 hover:bg-red-700 text-white h-11 px-10 rounded-lg font-semibold text-sm"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
