import { useState, useRef, KeyboardEvent } from "react";
import { useLocation, useParams } from "wouter";
import { ImageIcon, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Tab = "Season Details" | "SEO Settings";

const MOCK_SHOWS = [
  { _id: "1", name: "The Smiling doll" },
  { _id: "2", name: "Gunslinger's Justice" },
  { _id: "3", name: "Raziel's Daring Rescue" },
  { _id: "4", name: "Shadow Pursuit" },
  { _id: "5", name: "Neon Dreams" },
];

const MOCK_SEASONS = [
  { _id: "1", label: "Season 1" },
  { _id: "2", label: "Season 2" },
  { _id: "3", label: "Season 3" },
];

function ImageUploadBox({ label, preview, onUpload }: {
  label: string;
  preview: string;
  onUpload: (url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <Label className="text-foreground text-sm font-medium">{label}</Label>
      <div
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed border-border rounded-xl h-52 flex items-center justify-center cursor-pointer hover:border-red-500/40 bg-muted/20 transition-colors overflow-hidden"
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-10 w-10 text-zinc-600" />
        )}
      </div>
      <input
        ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(URL.createObjectURL(f));
        }}
      />
    </div>
  );
}

export default function SeasonForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState<Tab>("Season Details");

  // TMDB import
  const [tmdbShow, setTmdbShow] = useState("");
  const [tmdbSeason, setTmdbSeason] = useState("");

  // Season Details
  const [posterPreview, setPosterPreview] = useState("");
  const [posterTvPreview, setPosterTvPreview] = useState("");
  const [name, setName] = useState("");
  const [showId, setShowId] = useState("");
  const [trailerUrlType, setTrailerUrlType] = useState("");
  const [seasonNumber, setSeasonNumber] = useState("");
  const [statusActive, setStatusActive] = useState(true);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

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

  const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keywordInput.trim()) {
      e.preventDefault();
      if (!metaKeywords.includes(keywordInput.trim())) {
        setMetaKeywords((prev) => [...prev, keywordInput.trim()]);
      }
      setKeywordInput("");
    }
  };

  const handleSave = () => {
    toast({ title: isEdit ? "Season updated successfully!" : "Season created successfully!" });
    setLocation("/seasons");
  };

  const TABS: Tab[] = ["Season Details", "SEO Settings"];

  return (
    <div className="space-y-5 pb-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => setLocation("/dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
        <span>/</span>
        <span className="text-foreground font-medium">{isEdit ? "Edit Season" : "New Season"}</span>
      </div>

      {/* Back */}
      <button
        onClick={() => setLocation("/seasons")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        «&nbsp;Back
      </button>

      {/* TMDB Import */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground mb-4">Import Season From TMDB</p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px] space-y-1.5">
            <Label className="text-foreground text-xs font-medium flex items-center gap-1">
              TV Shows <span className="text-zinc-500 text-xs">ℹ</span>
            </Label>
            <Select value={tmdbShow} onValueChange={setTmdbShow}>
              <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                <SelectValue placeholder="Select TV Show" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                {MOCK_SHOWS.map((s) => (
                  <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[180px] space-y-1.5">
            <Label className="text-foreground text-xs font-medium">Season</Label>
            <Select value={tmdbSeason} onValueChange={setTmdbSeason}>
              <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                <SelectValue placeholder="Select Season" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-foreground">
                {MOCK_SEASONS.map((s) => (
                  <SelectItem key={s._id} value={s._id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white h-10 px-6 rounded-lg font-semibold text-sm shrink-0">
            Import
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === tab
                ? "bg-red-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Season Details Tab */}
      {activeTab === "Season Details" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <p className="text-sm font-semibold text-foreground">Season Details</p>

          {/* Images + Right Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <ImageUploadBox label="Poster" preview={posterPreview} onUpload={setPosterPreview} />
            <ImageUploadBox label="Poster Tv Image" preview={posterTvPreview} onUpload={setPosterTvPreview} />

            {/* Right side fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Season 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">
                  TV Show <span className="text-red-500">*</span>
                </Label>
                <Select value={showId} onValueChange={setShowId}>
                  <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                    <SelectValue placeholder="Select TV Show" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    {MOCK_SHOWS.map((show) => (
                      <SelectItem key={show._id} value={show._id}>{show.name}</SelectItem>
                    ))}
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
                    <SelectItem value="upload">Upload</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Season Number + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm font-medium">
                Season Number <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                placeholder="Enter Season Number"
                value={seasonNumber}
                onChange={(e) => setSeasonNumber(e.target.value)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm font-medium">Status</Label>
              <div className="flex items-center gap-3 h-10">
                <span className="text-sm text-foreground">{statusActive ? "Active" : "Inactive"}</span>
                <Switch
                  checked={statusActive}
                  onCheckedChange={setStatusActive}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
            </div>
          </div>

          {/* Short Description + Description side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-foreground text-sm font-medium">Short Description</Label>
                <button className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                  <Sparkles className="h-3 w-3" /> Generate Description with AI
                </button>
              </div>
              <Textarea
                placeholder="e.g. Season 10, 236th overall episode of TV Shows"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={6}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-foreground text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </Label>
                <button className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                  <Sparkles className="h-3 w-3" /> Generate Description with AI
                </button>
              </div>
              {/* Rich text editor mock */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/60 border-b border-border px-3 py-1.5 flex flex-wrap gap-1">
                  {["File", "Edit", "View", "Insert", "Format"].map((m) => (
                    <button key={m} className="text-xs text-zinc-400 hover:text-foreground px-1.5 py-0.5 rounded transition-colors">{m} ▾</button>
                  ))}
                </div>
                <div className="bg-muted/60 border-b border-border px-3 py-1.5 flex flex-wrap gap-1.5 items-center">
                  {["B", "I", "S"].map((f) => (
                    <button key={f} className={`text-xs font-${f === "B" ? "bold" : f === "I" ? "italic" : "normal"} text-zinc-400 hover:text-foreground w-6 h-6 rounded border border-border flex items-center justify-center transition-colors`}>{f}</button>
                  ))}
                  <div className="w-px h-4 bg-border mx-1" />
                  {["≡", "≡", "≡", "≡"].map((a, i) => (
                    <button key={i} className="text-xs text-zinc-400 hover:text-foreground w-6 h-6 rounded border border-border flex items-center justify-center transition-colors">{a}</button>
                  ))}
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="bg-white dark:bg-zinc-900 border-0 text-foreground rounded-none text-sm resize-none focus-visible:ring-0"
                />
                <div className="bg-muted/40 border-t border-border px-3 py-1 text-right">
                  <span className="text-xs text-zinc-500">POWERED BY TINYMCE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEO Settings Tab */}
      {activeTab === "SEO Settings" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Enable SEO toggle row */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <span className="text-sm font-medium text-foreground">Enable SEO Setting</span>
            <Switch
              checked={seoEnabled}
              onCheckedChange={setSeoEnabled}
              className="data-[state=checked]:bg-red-600"
            />
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              {/* SEO Image */}
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">
                  SEO Image <span className="text-red-500">*</span>
                </Label>
                <div
                  onClick={() => seoImageRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl h-52 flex items-center justify-center cursor-pointer hover:border-red-500/40 bg-muted/20 transition-colors overflow-hidden"
                >
                  {seoImagePreview ? (
                    <img src={seoImagePreview} alt="SEO" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-zinc-600" />
                  )}
                </div>
                <input
                  ref={seoImageRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setSeoImagePreview(URL.createObjectURL(f));
                  }}
                />
              </div>

              {/* Right fields 2-col */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground text-sm font-medium">
                      Meta Title <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-xs text-zinc-500">{metaTitle.length}/100</span>
                  </div>
                  <Input
                    placeholder="Enter Meta Title"
                    value={metaTitle}
                    maxLength={100}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">
                    Meta Keywords <span className="text-red-500">*</span>
                  </Label>
                  <div className="min-h-10 bg-muted border border-border rounded-lg px-2 py-1.5 flex flex-wrap gap-1.5 cursor-text"
                    onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}
                  >
                    {metaKeywords.map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-1 bg-zinc-700 text-zinc-200 text-xs px-2 py-0.5 rounded">
                        {kw}
                        <button onClick={() => setMetaKeywords((p) => p.filter((k) => k !== kw))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                      placeholder={metaKeywords.length === 0 ? "Type and press enter" : ""}
                      className="flex-1 min-w-[120px] bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none"
                    />
                  </div>
                </div>
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
            </div>

            {/* Meta Description full width */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-foreground text-sm font-medium">
                  Site Meta Description <span className="text-red-500">*</span>
                </Label>
                <span className="text-xs text-zinc-500">{metaDescription.length}/200</span>
              </div>
              <Textarea
                placeholder="Enter Meta Description"
                value={metaDescription}
                maxLength={200}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={4}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm resize-none"
              />
            </div>
          </div>
        </div>
      )}

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
