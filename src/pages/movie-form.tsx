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
import MediaPicker from "@/components/MediaPicker";
import { useGetDirectors, useGetActors, useCreateMovie, useUpdateMovie, useGetGenres, useGetLanguagesList } from "@/lib/api-client";

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

type QualityRow = { id: string; type: string; quality: string; filePath: string; url: string };
type SubtitleRow = { id: string; language: string; filePath: string };
type ClipRow = { id: string; name: string; type: string; url: string; filePath: string };
type DownloadRow = { id: string; type: string; quality: string; filePath: string; url: string };

/* ---- Reusable image upload box ---- */
function ImageBox({
  label,
  preview,
  onOpen,
}: {
  label: string;
  preview: string;
  onOpen: () => void;
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <div
        onClick={onOpen}
        className="border-2 border-dashed border-border rounded-xl aspect-[4/3] flex items-center justify-center cursor-pointer hover:border-red-500/40 bg-muted/20 transition-colors overflow-hidden"
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-contain" />
        ) : (
          <ImageIcon className="h-10 w-10 text-zinc-700" />
        )}
      </div>
    </div>
  );
}

export default function MovieForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState<Tab>("Movie Details");

  // Media picker states
  const [thumbnailPickerOpen, setThumbnailPickerOpen] = useState(false);
  const [posterPickerOpen, setPosterPickerOpen] = useState(false);
  const [posterTvPickerOpen, setPosterTvPickerOpen] = useState(false);
  const [trailerPickerOpen, setTrailerPickerOpen] = useState(false);
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);
  const [downloadPickerOpen, setDownloadPickerOpen] = useState(false);
  const [currentDownloadRowId, setCurrentDownloadRowId] = useState<string | null>(null);
  const [qualityPickerOpen, setQualityPickerOpen] = useState(false);
  const [currentQualityRowId, setCurrentQualityRowId] = useState<string | null>(null);
  const [clipPickerOpen, setClipPickerOpen] = useState(false);
  const [currentClipRowId, setCurrentClipRowId] = useState<string | null>(null);
  const [subtitlePickerOpen, setSubtitlePickerOpen] = useState(false);
  const [currentSubtitleRowId, setCurrentSubtitleRowId] = useState<string | null>(null);
  const [seoImagePickerOpen, setSeoImagePickerOpen] = useState(false);

  // Fetch directors and actors
  const { data: directorsData } = useGetDirectors({ page: 1, limit: 100 });
  const directorsList = directorsData?.data || [];
  const { data: actorsData } = useGetActors({ page: 1, limit: 100 });
  const actorsList = actorsData?.data || [];
  const { data: genresData } = useGetGenres({ page: 1, limit: 100 });
  const genresList = genresData?.data || [];
  const { data: languagesData } = useGetLanguagesList();
  const languagesList = languagesData?.data || [];
  const createMovieMutation = useCreateMovie();
  const updateMovieMutation = useUpdateMovie();
  const params = useParams<{ id: string }>();

  /* ---- Movie Details state ---- */
  const [thumbnail, setThumbnail] = useState({ filePath: "", preview: "" });
  const [poster, setPoster] = useState({ filePath: "", preview: "" });
  const [posterTv, setPosterTv] = useState({ filePath: "", preview: "" });
  const [name, setName] = useState("");
  const [trailerUrlType, setTrailerUrlType] = useState("local");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [trailerFilePath, setTrailerFilePath] = useState("");
  const [description, setDescription] = useState("");
  const [access, setAccess] = useState<"paid" | "free" | "pay_per_view">("paid");
  const [plan, setPlan] = useState("");
  const [statusActive, setStatusActive] = useState(true);

  /* ---- Basic Info state ---- */
  const [language, setLanguage] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [genreSearch, setGenreSearch] = useState("");
  const [languageSearch, setLanguageSearch] = useState("");
  const [countries, setCountries] = useState("");
  const [imdbRating, setImdbRating] = useState("");
  const [contentRating, setContentRating] = useState("");
  const [duration, setDuration] = useState("");
  const [skipIntroStart, setSkipIntroStart] = useState("");
  const [skipIntroEnd, setSkipIntroEnd] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [ageRestricted, setAgeRestricted] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState(true);
  const [selectedActors, setSelectedActors] = useState<string[]>([]);
  const [actorSearch, setActorSearch] = useState("");
  const [selectedDirectors, setSelectedDirectors] = useState<string[]>([]);
  const [directorSearch, setDirectorSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  /* ---- Quality Info state ---- */
  const [videoUploadType, setVideoUploadType] = useState("local");
  const [videoFilePath, setVideoFilePath] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [qualityEnabled, setQualityEnabled] = useState(true);
  const [qualityRows, setQualityRows] = useState<QualityRow[]>([
    { id: "1", type: "local", quality: "480p", filePath: "", url: "" },
  ]);

  /* ---- Subtitle Info state ---- */
  const [subtitleRows, setSubtitleRows] = useState<SubtitleRow[]>([]);

  /* ---- SEO Settings state ---- */
  const [seoEnabled, setSeoEnabled] = useState(true);
  const [seoImage, setSeoImage] = useState({ filePath: "", preview: "" });
  const [metaTitle, setMetaTitle] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [googleVerification, setGoogleVerification] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  /* ---- Clip Details state ---- */
  const [clipRows, setClipRows] = useState<ClipRow[]>([]);

  /* ---- Download Info state ---- */
  const [downloadRows, setDownloadRows] = useState<DownloadRow[]>([]);

  /* ---- Helpers ---- */
  const addQualityRow = () =>
    setQualityRows((p) => [...p, { id: Date.now().toString(), type: "local", quality: "480p", filePath: "", url: "" }]);
  const removeQualityRow = (id: string) =>
    setQualityRows((p) => p.filter((r) => r.id !== id));
  const updateQualityRow = (id: string, key: keyof QualityRow, value: any) =>
    setQualityRows((p) => p.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const addSubtitleRow = () =>
    setSubtitleRows((p) => [...p, { id: Date.now().toString(), language: "", filePath: "" }]);
  const removeSubtitleRow = (id: string) =>
    setSubtitleRows((p) => p.filter((r) => r.id !== id));

  const addClipRow = () =>
    setClipRows((p) => [...p, { id: Date.now().toString(), name: "", type: "local", url: "", filePath: "" }]);
  const removeClipRow = (id: string) =>
    setClipRows((p) => p.filter((r) => r.id !== id));

  const addDownloadRow = () =>
    setDownloadRows((p) => [...p, { id: Date.now().toString(), type: "local", quality: "480p", filePath: "", url: "" }]);
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

  const handleSave = async () => {
    if (uploadStatus === "uploading") return;
    
    setIsSaving(true);
    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      // Prepare movie data
      const movieData = {
        title: name,
        description,
        thumbnail: thumbnail.filePath,
        posterImage: poster.filePath,
        bannerImage: posterTv.filePath,
        trailerUrl: trailerFilePath,
        hlsUrl: videoUploadType === "hls" ? videoUrl : undefined,
        videoQualities: videoUploadType === "local" ? qualityRows.map(q => ({
          quality: q.quality as '144p' | '360p' | '480p' | '720p' | '1080p' | '4k',
          url: q.type === "local" ? q.filePath : q.url,
          size: 0
        })) : undefined,
        genres: selectedGenres,
        languages: selectedLanguages,
        subtitleLanguages: [],
        audioLanguages: selectedLanguages,
        releaseDate: releaseDate ? new Date(releaseDate) : undefined,
        duration: duration ? parseInt(duration) : undefined,
        ageRating: ageRestricted ? 18 : 0,
        downloadAllowed: downloadStatus,
        cast: selectedActors.map(actorId => ({ actor: actorId, role: "Actor" })),
        crew: selectedDirectors.map(directorId => ({ director: directorId, role: "Director" })),
        planRequired: access === "free" ? "free" : access === "pay_per_view" ? "premium" : "basic",
        status: "draft" as const,
        metaTitle,
        metaDescription,
        tags: keywords
      };

      // Call API to save movie data
      if (isEdit) {
        await updateMovieMutation.mutateAsync({ id: params.id!, data: movieData });
      } else {
        await createMovieMutation.mutateAsync(movieData);
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus("success");
      
      toast({ title: isEdit ? "Movie updated successfully!" : "Movie created successfully!" });
      
      // Redirect after success
      setTimeout(() => {
        setLocation("/movies");
      }, 1500);
    } catch (error) {
      setUploadStatus("error");
      setUploadProgress(0);
      toast({ title: "Upload failed. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
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
                  onOpen={() => setThumbnailPickerOpen(true)}
                />
                <ImageBox
                  label="Poster"
                  preview={poster.preview}
                  onOpen={() => setPosterPickerOpen(true)}
                />
                <ImageBox
                  label="Poster Tv Image"
                  preview={posterTv.preview}
                  onOpen={() => setPosterTvPickerOpen(true)}
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
                    <Label className="text-foreground text-sm font-medium">Trailer Video</Label>
                    <div
                      onClick={() => setTrailerPickerOpen(true)}
                      className="border-2 border-dashed border-border rounded-lg h-10 flex items-center justify-center cursor-pointer hover:border-red-500/40 bg-muted/20 transition-colors"
                    >
                      {trailerFilePath ? (
                        <span className="text-sm text-foreground truncate px-3">{trailerFilePath}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Click to select video from media library</span>
                      )}
                    </div>
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
                    Languages <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {selectedLanguages.map((langId) => {
                        const lang = languagesList.find((l: any) => l.id === langId || l._id === langId);
                        return (
                          <div
                            key={langId}
                            className="flex items-center gap-1.5 bg-muted border border-border rounded-lg px-3 py-1.5 text-sm"
                          >
                            <span className="text-foreground">{lang?.name || langId}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedLanguages((prev) => prev.filter((id) => id !== langId))}
                              className="text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (value && !selectedLanguages.includes(value)) {
                          setSelectedLanguages((prev) => [...prev, value]);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                        <SelectValue placeholder="Select languages..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-foreground max-h-60">
                        {languagesList
                          .filter((l: any) => !selectedLanguages.includes(l.id) && !selectedLanguages.includes(l._id))
                          .map((lang: any) => (
                            <SelectItem key={lang.id || lang._id} value={lang.id || lang._id}>
                              {lang.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">
                    Genres <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {selectedGenres.map((genreId) => {
                        const genre = genresList.find((g: any) => g.id === genreId || g._id === genreId);
                        return (
                          <div
                            key={genreId}
                            className="flex items-center gap-1.5 bg-muted border border-border rounded-lg px-3 py-1.5 text-sm"
                          >
                            <span className="text-foreground">{genre?.name || genreId}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedGenres((prev) => prev.filter((id) => id !== genreId))}
                              className="text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (value && !selectedGenres.includes(value)) {
                          setSelectedGenres((prev) => [...prev, value]);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                        <SelectValue placeholder="Select genres..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-foreground max-h-60">
                        {genresList
                          .filter((g: any) => !selectedGenres.includes(g.id) && !selectedGenres.includes(g._id))
                          .map((genre: any) => (
                            <SelectItem key={genre.id || genre._id} value={genre.id || genre._id}>
                              {genre.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {selectedActors.map((actorId) => {
                        const actor = actorsList.find((a: any) => a.id === actorId || a._id === actorId);
                        return (
                          <div
                            key={actorId}
                            className="flex items-center gap-1.5 bg-muted border border-border rounded-lg px-3 py-1.5 text-sm"
                          >
                            <span className="text-foreground">{actor?.name || actorId}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedActors((prev) => prev.filter((id) => id !== actorId))}
                              className="text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <Select
                      value={actorSearch}
                      onValueChange={(value) => {
                        if (value && !selectedActors.includes(value)) {
                          setSelectedActors((prev) => [...prev, value]);
                        }
                        setActorSearch("");
                      }}
                    >
                      <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                        <SelectValue placeholder="Select actors..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-foreground max-h-60">
                        {actorsList
                          .filter((a: any) => !selectedActors.includes(a.id) && !selectedActors.includes(a._id))
                          .map((actor: any) => (
                            <SelectItem key={actor.id || actor._id} value={actor.id || actor._id}>
                              {actor.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">
                    Directors <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {selectedDirectors.map((dirId) => {
                        const director = directorsList.find((d: any) => d.id === dirId || d._id === dirId);
                        return (
                          <div
                            key={dirId}
                            className="flex items-center gap-1.5 bg-muted border border-border rounded-lg px-3 py-1.5 text-sm"
                          >
                            <span className="text-foreground">{director?.name || dirId}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedDirectors((prev) => prev.filter((id) => id !== dirId))}
                              className="text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <Select
                      value={directorSearch}
                      onValueChange={(value) => {
                        if (value && !selectedDirectors.includes(value)) {
                          setSelectedDirectors((prev) => [...prev, value]);
                        }
                        setDirectorSearch("");
                      }}
                    >
                      <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                        <SelectValue placeholder="Select directors..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-foreground max-h-60">
                        {directorsList
                          .filter((d: any) => !selectedDirectors.includes(d.id) && !selectedDirectors.includes(d._id))
                          .map((director: any) => (
                            <SelectItem key={director.id || director._id} value={director.id || director._id}>
                              {director.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                      <SelectItem value="hls">HLS URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">
                    Video File <span className="text-red-500">*</span>
                  </Label>
                  {videoUploadType === "local" ? (
                    <div
                      onClick={() => setVideoPickerOpen(true)}
                      className="border-2 border-dashed border-border rounded-lg h-10 flex items-center justify-center cursor-pointer hover:border-red-500/40 bg-muted/20 transition-colors"
                    >
                      {videoFilePath ? (
                        <span className="text-sm text-foreground truncate px-3">{videoFilePath}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Click to select video from media library</span>
                      )}
                    </div>
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
                          {row.type === "local" ? (
                            <div
                              onClick={() => {
                                setCurrentQualityRowId(row.id);
                                setQualityPickerOpen(true);
                              }}
                              className="border-2 border-dashed border-border rounded-lg h-10 flex items-center justify-center cursor-pointer hover:border-red-500/40 bg-muted/20 transition-colors"
                            >
                              {row.filePath ? (
                                <span className="text-sm text-foreground truncate px-3">{row.filePath}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">Click to select video from media library</span>
                              )}
                            </div>
                          ) : (
                            <Input
                              placeholder="Enter video URL..."
                              value={row.url || ""}
                              onChange={(e) => updateQualityRow(row.id, "url", e.target.value)}
                              className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                            />
                          )}
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
                        <div
                          onClick={() => {
                            setCurrentSubtitleRowId(row.id);
                            setSubtitlePickerOpen(true);
                          }}
                          className="border-2 border-dashed border-border rounded-lg h-10 flex items-center justify-center cursor-pointer hover:border-red-500/40 bg-muted/20 transition-colors"
                        >
                          {row.filePath ? (
                            <span className="text-sm text-foreground truncate px-3">{row.filePath}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Click to select subtitle from media library</span>
                          )}
                        </div>
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
                        onClick={() => setSeoImagePickerOpen(true)}
                        className="border-2 border-dashed border-border rounded-xl h-40 flex items-center justify-center cursor-pointer hover:border-red-500/40 bg-card transition-colors overflow-hidden"
                      >
                        {seoImage.preview ? (
                          <img src={seoImage.preview} alt="SEO" className="h-full w-full object-contain" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-zinc-700" />
                        )}
                      </div>
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
                            <div
                              onClick={() => {
                                setCurrentClipRowId(row.id);
                                setClipPickerOpen(true);
                              }}
                              className="border-2 border-dashed border-border rounded-lg h-10 flex items-center justify-center cursor-pointer hover:border-red-500/40 bg-muted/20 transition-colors"
                            >
                              {row.filePath ? (
                                <span className="text-sm text-foreground truncate px-3">{row.filePath}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">Click to select video from media library</span>
                              )}
                            </div>
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
                            <div
                              onClick={() => {
                                setCurrentDownloadRowId(row.id);
                                setDownloadPickerOpen(true);
                              }}
                              className="border-2 border-dashed border-border rounded-lg h-10 flex items-center justify-center cursor-pointer hover:border-red-500/40 bg-muted/20 transition-colors"
                            >
                              {row.filePath ? (
                                <span className="text-sm text-foreground truncate px-3">{row.filePath}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">Click to select video from media library</span>
                              )}
                            </div>
                          ) : (
                            <Input
                              placeholder="https://..."
                              value={row.url}
                              onChange={(e) =>
                                setDownloadRows((p) => p.map((r) => r.id === row.id ? { ...r, url: e.target.value } : r))
                              }
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
      <div className="flex flex-col gap-4">
        {/* Upload Progress Bar */}
        {uploadStatus !== "idle" && (
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground font-medium">
                {uploadStatus === "uploading" && "Uploading video..."}
                {uploadStatus === "success" && "Upload complete!"}
                {uploadStatus === "error" && "Upload failed"}
              </span>
              <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  uploadStatus === "success" ? "bg-green-500" : uploadStatus === "error" ? "bg-red-500" : "bg-red-600"
                }`}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            {uploadStatus === "error" && (
              <button
                type="button"
                onClick={handleSave}
                className="mt-2 text-sm text-red-400 hover:text-red-300 font-medium"
              >
                Retry upload
              </button>
            )}
          </div>
        )}
        
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || uploadStatus === "uploading"}
            className="bg-red-600 hover:bg-red-700 text-white h-11 px-10 rounded-lg font-semibold text-sm"
          >
            {isSaving ? "Saving..." : uploadStatus === "uploading" ? "Uploading..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Media Pickers */}
      <MediaPicker
        open={thumbnailPickerOpen}
        onClose={() => setThumbnailPickerOpen(false)}
        onSelect={(media) => setThumbnail({ filePath: media.filePath, preview: media.url })}
        source="movie"
        accept="image/*"
      />
      <MediaPicker
        open={posterPickerOpen}
        onClose={() => setPosterPickerOpen(false)}
        onSelect={(media) => setPoster({ filePath: media.filePath, preview: media.url })}
        source="movie"
        accept="image/*"
      />
      <MediaPicker
        open={posterTvPickerOpen}
        onClose={() => setPosterTvPickerOpen(false)}
        onSelect={(media) => setPosterTv({ filePath: media.filePath, preview: media.url })}
        source="movie"
        accept="image/*"
      />
      <MediaPicker
        open={trailerPickerOpen}
        onClose={() => setTrailerPickerOpen(false)}
        onSelect={(media) => setTrailerFilePath(media.filePath)}
        source="movie"
        accept="video/*"
      />
      <MediaPicker
        open={videoPickerOpen}
        onClose={() => setVideoPickerOpen(false)}
        onSelect={(media) => setVideoFilePath(media.filePath)}
        source="movie"
        accept="video/*"
      />
      <MediaPicker
        open={downloadPickerOpen}
        onClose={() => {
          setDownloadPickerOpen(false);
          setCurrentDownloadRowId(null);
        }}
        onSelect={(media) => {
          if (currentDownloadRowId) {
            setDownloadRows((p) => p.map((r) => r.id === currentDownloadRowId ? { ...r, filePath: media.filePath } : r));
          }
        }}
        source="movie"
        accept="video/*"
      />
      <MediaPicker
        open={qualityPickerOpen}
        onClose={() => {
          setQualityPickerOpen(false);
          setCurrentQualityRowId(null);
        }}
        onSelect={(media) => {
          if (currentQualityRowId) {
            setQualityRows((p) => p.map((r) => r.id === currentQualityRowId ? { ...r, filePath: media.filePath } : r));
          }
        }}
        source="movie"
        accept="video/*"
      />
      <MediaPicker
        open={subtitlePickerOpen}
        onClose={() => {
          setSubtitlePickerOpen(false);
          setCurrentSubtitleRowId(null);
        }}
        onSelect={(media) => {
          if (currentSubtitleRowId) {
            setSubtitleRows((p) => p.map((r) => r.id === currentSubtitleRowId ? { ...r, filePath: media.filePath } : r));
          }
        }}
        source="movie"
        accept=".srt,.vtt,.ass,.ssa"
      />
      <MediaPicker
        open={seoImagePickerOpen}
        onClose={() => setSeoImagePickerOpen(false)}
        onSelect={(media) => setSeoImage({ filePath: media.filePath, preview: media.url })}
        source="movie"
        accept="image/*"
      />
    </div>
  );
}
