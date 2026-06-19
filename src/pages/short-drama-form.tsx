import { useState, useEffect, useRef } from "react";
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
import {
  useGetContentById, useCreateContent, useUpdateContent, getImageUrl,
  createEpisode, updateEpisode,
  useGetGenres, useGetLanguagesList, useGetActors, useGetDirectors,
  useGetCountries, useGetCrews,
} from "@/lib/api-client";

type Tab = "Short Drama" | "Basic Info" | "Quality Info" | "Subtitle Info" | "SEO Settings";
const TABS: Tab[] = ["Short Drama", "Basic Info", "Quality Info", "Subtitle Info", "SEO Settings"];

type QualityRow = { id: string; type: string; quality: string; filePath: string; url: string };
type CastRow  = { id: string; name: string; character: string; role: string };
type CrewRow  = { id: string; name: string; role: string };

const secsToDuration = (s: number): string => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
};

const durationToSecs = (d: string): number => {
  if (!d) return 0;
  const parts = d.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseInt(d) || 0;
};

function DynamicChipSelect({
  label, chips, options, onAdd, onRemove, placeholder,
}: {
  label: string; chips: string[]; options: string[];
  onAdd: (v: string) => void; onRemove: (v: string) => void; placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(
    (o) => o.toLowerCase().includes(search.toLowerCase()) && !chips.includes(o)
  );

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <Label className="text-foreground text-sm font-medium">{label}</Label>
      <div
        className="min-h-[42px] bg-muted border border-border rounded-lg px-3 py-2 flex flex-wrap gap-1.5 cursor-text"
        onClick={() => setOpen(true)}
      >
        {chips.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/20 text-red-300 text-xs font-medium">
            {v}
            <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(v); }}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={chips.length === 0 ? (placeholder || `Search ${label}...`) : ""}
          className="flex-1 min-w-[100px] bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg">
          {filtered.slice(0, 20).map((o) => (
            <button
              key={o}
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              onMouseDown={(e) => { e.preventDefault(); onAdd(o); setSearch(""); setOpen(false); }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AutocompleteInput({
  value, onChange, suggestions, placeholder, className,
}: {
  value: string; onChange: (v: string) => void; suggestions: string[];
  placeholder?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = value.length >= 1
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="relative" ref={containerRef}>
      <Input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => { if (value.length >= 1) setOpen(true); }}
        placeholder={placeholder}
        className={className}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              onMouseDown={(e) => { e.preventDefault(); onChange(s); setOpen(false); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageBox({ label, preview, onOpen }: { label: string; preview: string; onOpen: () => void }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      <div
        onClick={onOpen}
        className="border-2 border-dashed border-border rounded-xl aspect-[4/3] flex items-center justify-center cursor-pointer hover:border-primary/40 bg-muted/20 transition-colors overflow-hidden"
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

export default function ShortDramaForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState<Tab>("Short Drama");

  /* ---- Media picker states ---- */
  const [thumbnailPickerOpen, setThumbnailPickerOpen] = useState(false);
  const [bannerPickerOpen, setBannerPickerOpen] = useState(false);
  const [trailerPickerOpen, setTrailerPickerOpen] = useState(false);
  const [videoPickerOpen, setVideoPickerOpen] = useState(false);
  const [qualityPickerOpen, setQualityPickerOpen] = useState(false);
  const [currentQualityRowId, setCurrentQualityRowId] = useState<string | null>(null);
  const [seoImagePickerOpen, setSeoImagePickerOpen] = useState(false);

  /* ---- API ---- */
  const { data: existingData } = useGetContentById(isEdit ? id! : "");
  const createMutation = useCreateContent();
  const updateMutation = useUpdateContent();

  /* ---- Dynamic lookup data ---- */
  const { data: genresData } = useGetGenres({ limit: 100 });
  const { data: languagesData } = useGetLanguagesList();
  const { data: actorsData } = useGetActors({ limit: 200 });
  const { data: directorsData } = useGetDirectors({ limit: 100 });
  const { data: countriesData } = useGetCountries({ limit: 300 });
  const { data: crewsData } = useGetCrews({ limit: 100 });

  const genreOptions: string[] = genresData?.data?.map((g: any) => g.name) || [];
  const languageOptions: string[] = languagesData?.data?.map((l: any) => l.name) || [];
  const actorOptions: string[] = actorsData?.data?.map((a: any) => a.name) || [];
  const directorOptions: string[] = directorsData?.data?.map((d: any) => d.name) || [];
  const countryOptions: string[] = countriesData?.data?.map((c: any) => c.name) || [];
  const crewOptions: string[] = crewsData?.data?.map((c: any) => c.name) || [];

  // getContentById returns { content, episodes }
  const content = (existingData as any)?.content;

  /* ---- Short Drama tab state ---- */
  const [thumbnail, setThumbnail] = useState({ filePath: "", preview: "" });
  const [banner, setBanner] = useState({ filePath: "", preview: "" });
  const [title, setTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [trailerUrlType, setTrailerUrlType] = useState("url");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [trailerFilePath, setTrailerFilePath] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [planRequired, setPlanRequired] = useState<"free" | "basic" | "standard" | "premium">("free");
  const [status, setStatus] = useState<"published" | "draft" | "processing" | "moderation" | "rejected">("draft");

  /* ---- Basic Info state ---- */
  const [genres, setGenres] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [audioLanguages, setAudioLanguages] = useState<string[]>([]);
  const [year, setYear] = useState("");
  const [rating, setRating] = useState("");
  const [imdbRating, setImdbRating] = useState("");
  const [ageRating, setAgeRating] = useState("0");
  const [duration, setDuration] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [country, setCountry] = useState("");
  const [producer, setProducer] = useState("");
  const [studio, setStudio] = useState("");
  const [director, setDirector] = useState("");
  const [seasons, setSeasons] = useState("");
  const [downloadAllowed, setDownloadAllowed] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [isNewContent, setIsNewContent] = useState(true);
  const [isExclusive, setIsExclusive] = useState(false);
  const [maturityContent, setMaturityContent] = useState<string[]>([]);
  const [maturityInput, setMaturityInput] = useState("");
  const [castRows, setCastRows] = useState<CastRow[]>([]);
  const [crewRows, setCrewRows] = useState<CrewRow[]>([]);

  /* ---- Quality Info state ---- */
  const [videoUploadType, setVideoUploadType] = useState("url");
  const [videoFilePath, setVideoFilePath] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [qualityEnabled, setQualityEnabled] = useState(false);
  const [qualityRows, setQualityRows] = useState<QualityRow[]>([
    { id: "1", type: "url", quality: "480p", filePath: "", url: "" },
  ]);

  /* ---- Subtitle Info state ---- */
  const [subtitleLanguages, setSubtitleLanguages] = useState<string[]>([]);
  const [subtitleLangInput, setSubtitleLangInput] = useState("");

  /* ---- SEO Settings state ---- */
  const [seoImage, setSeoImage] = useState({ filePath: "", preview: "" });
  const [slug, setSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  /* ---- Populate form on edit ---- */
  useEffect(() => {
    if (!isEdit || !content) return;

    setTitle(content.title || "");
    setOriginalTitle(content.originalTitle || "");
    setDescription(content.description || "");
    setShortDescription(content.shortDescription || "");
    setPlanRequired(content.planRequired || "free");
    setStatus(content.status || "draft");

    if (content.thumbnail)
      setThumbnail({ filePath: content.thumbnail, preview: getImageUrl(content.thumbnail) });
    if (content.bannerImage)
      setBanner({ filePath: content.bannerImage, preview: getImageUrl(content.bannerImage) });

    if (content.trailerUrl) {
      setTrailerUrlType("url");
      setTrailerUrl(content.trailerUrl);
    }

    setYear(content.year ? String(content.year) : "");
    setRating(content.rating || "");
    setImdbRating(content.imdbRating != null ? String(content.imdbRating) : "");
    setAgeRating(content.ageRating != null ? String(content.ageRating) : "0");
    setDuration(content.duration ? secsToDuration(content.duration) : "");
    setReleaseDate(
      content.releaseDate ? new Date(content.releaseDate).toISOString().split("T")[0]
        : content.year ? `${content.year}-01-01` : ""
    );
    setCountry(content.country || "");
    setProducer(content.producer || "");
    setStudio(content.studio || "");
    setDirector(content.director || "");
    setSeasons(content.seasons != null ? String(content.seasons) : "");
    setDownloadAllowed(content.downloadAllowed !== false);
    setFeatured(!!content.featured);
    setTrending(!!content.trending);
    setIsNewContent(content.isNewContent !== false);
    setIsExclusive(!!content.isExclusive);
    setMaturityContent(Array.isArray(content.maturityContent) ? content.maturityContent : []);

    setGenres(Array.isArray(content.genres) ? content.genres : []);
    setLanguages(Array.isArray(content.languages) ? content.languages : []);
    setAudioLanguages(Array.isArray(content.audioLanguages) ? content.audioLanguages : []);
    setSubtitleLanguages(Array.isArray(content.subtitleLanguages) ? content.subtitleLanguages : []);

    if (Array.isArray(content.cast)) {
      setCastRows(
        content.cast.map((c: any, i: number) => ({
          id: String(i),
          name: c.name || "",
          character: c.character || "",
          role: c.role || "Actor",
        }))
      );
    }
    if (Array.isArray(content.crew)) {
      setCrewRows(
        content.crew.map((c: any, i: number) => ({
          id: String(i),
          name: c.name || "",
          role: c.role || "Director",
        }))
      );
    }

    if (content.hlsUrl) {
      setVideoUploadType("url");
      setVideoUrl(content.hlsUrl);
    }
    if (Array.isArray(content.videoQualities) && content.videoQualities.length > 0) {
      setQualityEnabled(true);
      setQualityRows(
        content.videoQualities.map((q: any, i: number) => ({
          id: String(i + 1),
          type: "url",
          quality: q.quality || "480p",
          filePath: "",
          url: q.url || "",
        }))
      );
    }

    setSlug(content.slug || "");
    setMetaTitle(content.metaTitle || "");
    setMetaDescription(content.metaDescription || "");
    setTags(Array.isArray(content.tags) ? content.tags : []);
  }, [isEdit, content]);

  /* ---- Helpers ---- */
  const makeChipHandler = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    inputSetter: React.Dispatch<React.SetStateAction<string>>,
    inputValue: string
  ) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      const val = inputValue.trim().replace(/,$/, "");
      setter((p) => (p.includes(val) ? p : [...p, val]));
      inputSetter("");
    }
  };

  const addQualityRow = () =>
    setQualityRows((p) => [...p, { id: Date.now().toString(), type: "url", quality: "480p", filePath: "", url: "" }]);
  const removeQualityRow = (rowId: string) =>
    setQualityRows((p) => p.filter((r) => r.id !== rowId));
  const updateQualityRow = (rowId: string, key: keyof QualityRow, value: string) =>
    setQualityRows((p) => p.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)));

  const addCastRow = () =>
    setCastRows((p) => [...p, { id: Date.now().toString(), name: "", character: "", role: "Actor" }]);
  const removeCastRow = (rowId: string) =>
    setCastRows((p) => p.filter((r) => r.id !== rowId));
  const updateCastRow = (rowId: string, key: keyof CastRow, value: string) =>
    setCastRows((p) => p.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)));

  const addCrewRow = () =>
    setCrewRows((p) => [...p, { id: Date.now().toString(), name: "", role: "Director" }]);
  const removeCrewRow = (rowId: string) =>
    setCrewRows((p) => p.filter((r) => r.id !== rowId));
  const updateCrewRow = (rowId: string, key: keyof CrewRow, value: string) =>
    setCrewRows((p) => p.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)));

  /* ---- Save ---- */
  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const effectiveTrailerUrl = trailerUrlType === "local" ? trailerFilePath : trailerUrl;
      // Resolve the main video URL regardless of upload type
      const mainVideoUrl = videoUploadType === "local" ? videoFilePath : videoUrl;

      const payload: Record<string, any> = {
        title: title.trim(),
        type: "series",
        contentType: "drama",
        ...(originalTitle.trim() && { originalTitle: originalTitle.trim() }),
        ...(description.trim() && { description: description.trim() }),
        ...(shortDescription.trim() && { shortDescription: shortDescription.trim() }),
        ...(thumbnail.filePath && { thumbnail: thumbnail.filePath }),
        ...(banner.filePath && { bannerImage: banner.filePath }),
        ...(effectiveTrailerUrl && { trailerUrl: effectiveTrailerUrl }),
        planRequired,
        status,
        genres,
        languages,
        audioLanguages: audioLanguages.length > 0 ? audioLanguages : languages,
        subtitleLanguages,
        ...(year && { year: parseInt(year) }),
        ...(rating.trim() && { rating: rating.trim() }),
        ...(imdbRating && { imdbRating: parseFloat(imdbRating) }),
        ...(duration && { duration: durationToSecs(duration) }),
        ...(releaseDate && { releaseDate: new Date(releaseDate).toISOString() }),
        ...(country.trim() && { country: country.trim() }),
        ...(producer.trim() && { producer: producer.trim() }),
        ...(studio.trim() && { studio: studio.trim() }),
        ...(director.trim() && { director: director.trim() }),
        ...(seasons && { seasons: parseInt(seasons) }),
        ageRating: parseInt(ageRating) || 0,
        downloadAllowed,
        featured,
        trending,
        isNewContent,
        isExclusive,
        maturityContent,
        tags,
        cast: castRows
          .filter((r) => r.name.trim())
          .map((r) => ({ name: r.name.trim(), character: r.character, role: r.role })),
        crew: crewRows
          .filter((r) => r.name.trim())
          .map((r) => ({ name: r.name.trim(), role: r.role })),
        // Save main video URL as hlsUrl for all upload types
        ...(mainVideoUrl && { hlsUrl: mainVideoUrl }),
        ...(qualityEnabled && {
          videoQualities: qualityRows
            .filter((q) => q.url || q.filePath)
            .map((q) => ({
              quality: q.quality as any,
              url: q.type === "local" ? q.filePath : q.url,
              size: 0,
            })),
        }),
        ...(slug.trim() && { slug: slug.trim() }),
        ...(metaTitle.trim() && { metaTitle: metaTitle.trim() }),
        ...(metaDescription.trim() && { metaDescription: metaDescription.trim() }),
      };

      let savedContentId = isEdit ? id! : "";

      if (isEdit) {
        await updateMutation.mutateAsync({ id: id!, data: payload });
      } else {
        const res = await createMutation.mutateAsync({ data: JSON.stringify(payload) });
        // Extract newly created content ID
        savedContentId = res?.data?.id || res?.data?._id || res?.id || res?._id || "";
      }

      // Auto-upsert Episode 1 whenever a main video URL is provided
      if (savedContentId && mainVideoUrl) {
        const existingEpisodes: any[] = (existingData as any)?.episodes || [];
        const existingEp1 = existingEpisodes.find(
          (e: any) => (e.season === 1 || !e.season) && (e.episode === 1 || !e.episode)
        );
        const epPayload = {
          contentId: savedContentId,
          season: 1,
          episode: 1,
          title: `${title.trim()} - Episode 1`,
          hlsUrl: mainVideoUrl,
          isFree: planRequired === "free",
          isLocked: planRequired !== "free",
          processingStatus: "ready",
          downloadAllowed,
        };
        try {
          if (existingEp1) {
            await updateEpisode(existingEp1.id || existingEp1._id, epPayload);
          } else {
            await createEpisode(epPayload);
          }
        } catch (epErr) {
          console.error("Episode upsert failed:", epErr);
          // Non-fatal — content was saved successfully
        }
      }

      toast({ title: isEdit ? "Short Drama updated successfully!" : "Short Drama created successfully!" });
      setLocation("/short-dramas");
    } catch (error: any) {
      toast({
        title: error?.message || "Failed to save. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const SH = ({ title: t }: { title: string }) => (
    <p className="text-base font-semibold text-foreground">{t}</p>
  );

  const ChipInput = ({
    label, chips, onRemove, inputValue, onInputChange, onKeyDown, placeholder,
  }: {
    label: string; chips: string[]; onRemove: (v: string) => void;
    inputValue: string; onInputChange: (v: string) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    placeholder?: string;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-foreground text-sm font-medium">{label}</Label>
      <div
        className="min-h-[42px] bg-muted border border-border rounded-lg px-3 py-2 flex flex-wrap gap-1.5 cursor-text"
        onClick={() => document.getElementById(`chip-drama-${label}`)?.focus()}
      >
        {chips.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/20 text-red-300 text-xs font-medium">
            {v}
            <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(v); }}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={`chip-drama-${label}`}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={chips.length === 0 ? (placeholder || "Type and press Enter") : ""}
          className="flex-1 min-w-[120px] bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => setLocation("/short-dramas")} className="hover:text-foreground transition-colors">
          Dashboard
        </button>
        <span>/</span>
        <button onClick={() => setLocation("/short-dramas")} className="hover:text-foreground transition-colors">
          Short Dramas
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{isEdit ? "Edit Short Drama" : "New Short Drama"}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
              activeTab === tab
                ? "bg-primary text-white shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-border bg-card">

        {/* =========== SHORT DRAMA =========== */}
        {activeTab === "Short Drama" && (
          <div className="p-6 space-y-6">
            <SH title="About Short Drama" />

            {/* Images */}
            <div className="rounded-xl border border-border bg-muted/10 p-5">
              <div className="flex gap-5">
                <ImageBox label="Thumbnail" preview={thumbnail.preview} onOpen={() => setThumbnailPickerOpen(true)} />
                <ImageBox label="Banner Image" preview={banner.preview} onOpen={() => setBannerPickerOpen(true)} />
              </div>
            </div>

            {/* Title + Original Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">
                  Title <span className="text-primary">*</span>
                </Label>
                <Input
                  placeholder="e.g. My Drama Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">Original Title</Label>
                <Input
                  placeholder="Original language title (optional)"
                  value={originalTitle}
                  onChange={(e) => setOriginalTitle(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Trailer */}
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm font-medium">Trailer URL Type</Label>
              <Select value={trailerUrlType} onValueChange={setTrailerUrlType}>
                <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  <SelectItem value="url">External URL</SelectItem>
                  <SelectItem value="local">Local (Media Library)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              {trailerUrlType === "local" ? (
                <>
                  <Label className="text-foreground text-sm font-medium">Trailer Video</Label>
                  <div
                    onClick={() => setTrailerPickerOpen(true)}
                    className="border-2 border-dashed border-border rounded-lg h-10 flex items-center justify-center cursor-pointer hover:border-primary/40 bg-muted/20 transition-colors"
                  >
                    {trailerFilePath ? (
                      <span className="text-sm text-foreground truncate px-3">{trailerFilePath}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Click to select from media library</span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Label className="text-foreground text-sm font-medium">Trailer URL</Label>
                  <Input
                    placeholder="https://..."
                    value={trailerUrl}
                    onChange={(e) => setTrailerUrl(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                  />
                </>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-foreground text-sm font-medium">
                  Description <span className="text-primary">*</span>
                </Label>
                <button className="text-xs text-primary hover:text-red-300 flex items-center gap-1.5 transition-colors">
                  <Sparkles className="h-3.5 w-3.5" /> Generate with AI
                </button>
              </div>
              <Textarea
                placeholder="Full short drama description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm resize-none"
              />
            </div>

            {/* Short Description */}
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm font-medium">Short Description</Label>
              <Textarea
                placeholder="Brief summary shown in listings..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={2}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm resize-none"
              />
            </div>

            {/* Plan + Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">
                  Plan Required <span className="text-primary">*</span>
                </Label>
                <Select value={planRequired} onValueChange={(v) => setPlanRequired(v as any)}>
                  <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                    <SelectValue />
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
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="moderation">Moderation</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* =========== BASIC INFO =========== */}
        {activeTab === "Basic Info" && (
          <div className="p-6 space-y-6">
            <SH title="Media Info" />
            <div className="rounded-xl border border-border bg-muted/10 p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DynamicChipSelect
                  label="Genres"
                  chips={genres}
                  options={genreOptions}
                  onAdd={(v) => setGenres((p) => p.includes(v) ? p : [...p, v])}
                  onRemove={(v) => setGenres((p) => p.filter((x) => x !== v))}
                  placeholder="Search genres..."
                />
                <DynamicChipSelect
                  label="Languages"
                  chips={languages}
                  options={languageOptions}
                  onAdd={(v) => setLanguages((p) => p.includes(v) ? p : [...p, v])}
                  onRemove={(v) => setLanguages((p) => p.filter((x) => x !== v))}
                  placeholder="Search languages..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DynamicChipSelect
                  label="Audio Languages"
                  chips={audioLanguages}
                  options={languageOptions}
                  onAdd={(v) => setAudioLanguages((p) => p.includes(v) ? p : [...p, v])}
                  onRemove={(v) => setAudioLanguages((p) => p.filter((x) => x !== v))}
                  placeholder="Search languages..."
                />
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Country</Label>
                  <AutocompleteInput
                    value={country}
                    onChange={setCountry}
                    suggestions={countryOptions}
                    placeholder="e.g. South Korea"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Year</Label>
                  <Input type="number" placeholder="2024" value={year} onChange={(e) => setYear(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Seasons</Label>
                  <Input type="number" placeholder="1" min="1" value={seasons} onChange={(e) => setSeasons(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">IMDb Rating</Label>
                  <Input type="number" placeholder="0.0–10.0" min="0" max="10" step="0.1" value={imdbRating}
                    onChange={(e) => setImdbRating(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Age Rating</Label>
                  <Input type="number" placeholder="0" min="0" value={ageRating} onChange={(e) => setAgeRating(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Episode Duration</Label>
                  <Input type="time" step="1" value={duration} onChange={(e) => setDuration(e.target.value)}
                    className="bg-muted border-border text-foreground h-10 rounded-lg text-sm" />
                  <p className="text-xs text-muted-foreground">Format: HH:MM:SS</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Release Date</Label>
                  <Input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)}
                    className="bg-muted border-border text-foreground h-10 rounded-lg text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Content Rating</Label>
                  <Input placeholder="e.g. PG-13, TV-MA" value={rating} onChange={(e) => setRating(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Director</Label>
                  <AutocompleteInput
                    value={director}
                    onChange={setDirector}
                    suggestions={directorOptions}
                    placeholder="Director name"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Producer</Label>
                  <Input placeholder="Producer name" value={producer} onChange={(e) => setProducer(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Studio</Label>
                  <Input placeholder="Production studio" value={studio} onChange={(e) => setStudio(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
                </div>
              </div>

              <ChipInput
                label="Maturity Content"
                chips={maturityContent}
                onRemove={(v) => setMaturityContent((p) => p.filter((x) => x !== v))}
                inputValue={maturityInput}
                onInputChange={setMaturityInput}
                onKeyDown={makeChipHandler(setMaturityContent, setMaturityInput, maturityInput)}
                placeholder="e.g. Violence, Language..."
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Featured", value: featured, setter: setFeatured },
                  { label: "Trending", value: trending, setter: setTrending },
                  { label: "New Content", value: isNewContent, setter: setIsNewContent },
                  { label: "Exclusive", value: isExclusive, setter: setIsExclusive },
                ].map(({ label, value, setter }) => (
                  <div key={label} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <Switch checked={value} onCheckedChange={setter} className="data-[state=checked]:bg-primary" />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                <div>
                  <p className="text-sm font-medium text-foreground">Download Allowed</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Allow users to download episodes</p>
                </div>
                <Switch checked={downloadAllowed} onCheckedChange={setDownloadAllowed} className="data-[state=checked]:bg-primary" />
              </div>
            </div>

            {/* Cast */}
            <SH title="Cast & Crew" />
            <div className="rounded-xl border border-border bg-muted/10 p-5 space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Cast (Actors)</p>
                  <Button type="button" onClick={addCastRow}
                    className="bg-primary hover:bg-primary/90 text-white h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold">
                    <Plus className="h-3.5 w-3.5" /> Add Actor
                  </Button>
                </div>
                {castRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No cast added yet.</p>
                ) : (
                  castRows.map((row) => (
                    <div key={row.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 rounded-xl border border-border bg-card">
                      <div className="space-y-1">
                        <Label className="text-foreground text-xs font-medium">Actor Name</Label>
                        <AutocompleteInput
                          value={row.name}
                          onChange={(v) => updateCastRow(row.id, "name", v)}
                          suggestions={actorOptions}
                          placeholder="Full name"
                          className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-9 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-foreground text-xs font-medium">Character</Label>
                        <Input placeholder="Character name" value={row.character}
                          onChange={(e) => updateCastRow(row.id, "character", e.target.value)}
                          className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-9 rounded-lg text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-foreground text-xs font-medium">Role</Label>
                        <Select value={row.role} onValueChange={(v) => updateCastRow(row.id, "role", v)}>
                          <SelectTrigger className="bg-muted border-border text-foreground h-9 rounded-lg text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-foreground">
                            <SelectItem value="Actor">Actor</SelectItem>
                            <SelectItem value="Lead">Lead</SelectItem>
                            <SelectItem value="Supporting">Supporting</SelectItem>
                            <SelectItem value="Cameo">Cameo</SelectItem>
                            <SelectItem value="Voice">Voice</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <button type="button" onClick={() => removeCastRow(row.id)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary/15 text-primary hover:bg-primary/80/30">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Crew</p>
                  <Button type="button" onClick={addCrewRow}
                    className="bg-primary hover:bg-primary/90 text-white h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold">
                    <Plus className="h-3.5 w-3.5" /> Add Crew
                  </Button>
                </div>
                {crewRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No crew added yet.</p>
                ) : (
                  crewRows.map((row) => (
                    <div key={row.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-3 rounded-xl border border-border bg-card">
                      <div className="space-y-1">
                        <Label className="text-foreground text-xs font-medium">Name</Label>
                        <AutocompleteInput
                          value={row.name}
                          onChange={(v) => updateCrewRow(row.id, "name", v)}
                          suggestions={crewOptions}
                          placeholder="Full name"
                          className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-9 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-foreground text-xs font-medium">Role</Label>
                        <Select value={row.role} onValueChange={(v) => updateCrewRow(row.id, "role", v)}>
                          <SelectTrigger className="bg-muted border-border text-foreground h-9 rounded-lg text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-foreground">
                            <SelectItem value="Director">Director</SelectItem>
                            <SelectItem value="Co-Director">Co-Director</SelectItem>
                            <SelectItem value="Executive Producer">Executive Producer</SelectItem>
                            <SelectItem value="Cinematographer">Cinematographer</SelectItem>
                            <SelectItem value="Writer">Writer</SelectItem>
                            <SelectItem value="Editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <button type="button" onClick={() => removeCrewRow(row.id)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary/15 text-primary hover:bg-primary/80/30">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========== QUALITY INFO =========== */}
        {activeTab === "Quality Info" && (
          <div className="p-6 space-y-6">
            <SH title="Video Source" />
            <div className="rounded-xl border border-border bg-muted/10 p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Video Upload Type</Label>
                  <Select value={videoUploadType} onValueChange={setVideoUploadType}>
                    <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground">
                      <SelectItem value="url">External URL</SelectItem>
                      <SelectItem value="hls">HLS / M3U8 URL</SelectItem>
                      <SelectItem value="local">Local (Media Library)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">Video</Label>
                  {videoUploadType === "local" ? (
                    <div onClick={() => setVideoPickerOpen(true)}
                      className="border-2 border-dashed border-border rounded-lg h-10 flex items-center justify-center cursor-pointer hover:border-primary/40 bg-muted/20 transition-colors">
                      {videoFilePath ? (
                        <span className="text-sm text-foreground truncate px-3">{videoFilePath}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Click to select from media library</span>
                      )}
                    </div>
                  ) : (
                    <Input
                      placeholder={videoUploadType === "hls" ? "https://cdn.example.com/video.m3u8" : "https://..."}
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                    />
                  )}
                </div>
              </div>
            </div>

            <SH title="Quality Variants" />
            <div className="rounded-xl border border-border bg-muted/10 p-5 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-foreground">Enable quality-specific video files</p>
                <Switch checked={qualityEnabled} onCheckedChange={setQualityEnabled} className="data-[state=checked]:bg-primary" />
              </div>
              {qualityEnabled && (
                <div className="space-y-4">
                  {qualityRows.map((row) => (
                    <div key={row.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="space-y-1.5">
                        <Label className="text-foreground text-sm font-medium">Upload Type</Label>
                        <Select value={row.type} onValueChange={(v) => updateQualityRow(row.id, "type", v)}>
                          <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-foreground">
                            <SelectItem value="url">External URL</SelectItem>
                            <SelectItem value="local">Local</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-foreground text-sm font-medium">Quality</Label>
                        <Select value={row.quality} onValueChange={(v) => updateQualityRow(row.id, "quality", v)}>
                          <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border text-foreground">
                            <SelectItem value="144p">144p</SelectItem>
                            <SelectItem value="240p">240p</SelectItem>
                            <SelectItem value="360p">360p</SelectItem>
                            <SelectItem value="480p">480p</SelectItem>
                            <SelectItem value="720p">720p</SelectItem>
                            <SelectItem value="1080p">1080p</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-foreground text-sm font-medium">Video File / URL</Label>
                          {row.type === "local" ? (
                            <div onClick={() => { setCurrentQualityRowId(row.id); setQualityPickerOpen(true); }}
                              className="border-2 border-dashed border-border rounded-lg h-10 flex items-center justify-center cursor-pointer hover:border-primary/40 bg-muted/20 transition-colors">
                              {row.filePath ? (
                                <span className="text-sm text-foreground truncate px-3">{row.filePath}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">Click to select</span>
                              )}
                            </div>
                          ) : (
                            <Input placeholder="https://..." value={row.url}
                              onChange={(e) => updateQualityRow(row.id, "url", e.target.value)}
                              className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm" />
                          )}
                        </div>
                        {qualityRows.length > 1 && (
                          <button type="button" onClick={() => removeQualityRow(row.id)}
                            className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/15 text-primary hover:bg-primary/80/30 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Button type="button" onClick={addQualityRow}
                      className="bg-primary hover:bg-primary/90 text-white h-9 gap-2 rounded-lg px-4 text-sm font-semibold">
                      <Plus className="h-4 w-4" /> Add Quality
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========== SUBTITLE INFO =========== */}
        {activeTab === "Subtitle Info" && (
          <div className="p-6 space-y-5">
            <SH title="Subtitle Languages" />
            <div className="rounded-xl border border-border bg-muted/10 p-5">
              <ChipInput
                label="Subtitle Languages"
                chips={subtitleLanguages}
                onRemove={(v) => setSubtitleLanguages((p) => p.filter((x) => x !== v))}
                inputValue={subtitleLangInput}
                onInputChange={setSubtitleLangInput}
                onKeyDown={makeChipHandler(setSubtitleLanguages, setSubtitleLangInput, subtitleLangInput)}
                placeholder="e.g. English, Korean, Chinese..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                These are the subtitle languages available. Upload subtitle files in the episode form.
              </p>
            </div>
          </div>
        )}

        {/* =========== SEO SETTINGS =========== */}
        {activeTab === "SEO Settings" && (
          <div className="p-6 space-y-5">
            <SH title="SEO Settings" />
            <div className="rounded-xl border border-border bg-muted/10 p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm font-medium">SEO Image</Label>
                  <div onClick={() => setSeoImagePickerOpen(true)}
                    className="border-2 border-dashed border-border rounded-xl h-40 flex items-center justify-center cursor-pointer hover:border-primary/40 bg-card transition-colors overflow-hidden">
                    {seoImage.preview ? (
                      <img src={seoImage.preview} alt="SEO" className="h-full w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-zinc-700" />
                    )}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm font-medium">URL Slug</Label>
                    <Input
                      placeholder="e.g. my-drama-title"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-foreground text-sm font-medium">Meta Title</Label>
                      <span className="text-xs text-muted-foreground">{metaTitle.length}/100</span>
                    </div>
                    <Input
                      placeholder="Enter meta title"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value.slice(0, 100))}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">Tags / Keywords</Label>
                <div
                  className="min-h-[42px] bg-muted border border-border rounded-lg px-3 py-2 flex flex-wrap gap-1.5 cursor-text"
                  onClick={() => document.getElementById("tag-input-drama")?.focus()}
                >
                  {tags.map((kw) => (
                    <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/20 text-red-300 text-xs font-medium">
                      {kw}
                      <button type="button" onClick={(e) => { e.stopPropagation(); setTags((p) => p.filter((k) => k !== kw)); }}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    id="tag-input-drama"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={makeChipHandler(setTags, setTagInput, tagInput)}
                    placeholder={tags.length === 0 ? "Type and press Enter" : ""}
                    className="flex-1 min-w-[140px] bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-foreground text-sm font-medium">Meta Description</Label>
                  <span className="text-xs text-muted-foreground">{metaDescription.length}/200</span>
                </div>
                <Textarea
                  placeholder="Enter meta description"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value.slice(0, 200))}
                  rows={4}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-white h-11 px-10 rounded-lg font-semibold text-sm"
        >
          {isSaving ? "Saving..." : isEdit ? "Update Short Drama" : "Create Short Drama"}
        </Button>
      </div>

      {/* Media Pickers */}
      <MediaPicker open={thumbnailPickerOpen} onClose={() => setThumbnailPickerOpen(false)}
        onSelect={(m) => setThumbnail({ filePath: m.filePath, preview: m.url })} source="drama" accept="image/*" />
      <MediaPicker open={bannerPickerOpen} onClose={() => setBannerPickerOpen(false)}
        onSelect={(m) => setBanner({ filePath: m.filePath, preview: m.url })} source="drama" accept="image/*" />
      <MediaPicker open={trailerPickerOpen} onClose={() => setTrailerPickerOpen(false)}
        onSelect={(m) => setTrailerFilePath(m.filePath)} source="drama" accept="video/*" />
      <MediaPicker open={videoPickerOpen} onClose={() => setVideoPickerOpen(false)}
        onSelect={(m) => setVideoFilePath(m.filePath)} source="drama" accept="video/*" />
      <MediaPicker
        open={qualityPickerOpen}
        onClose={() => { setQualityPickerOpen(false); setCurrentQualityRowId(null); }}
        onSelect={(m) => {
          if (currentQualityRowId) updateQualityRow(currentQualityRowId, "filePath", m.filePath);
        }}
        source="drama" accept="video/*"
      />
      <MediaPicker open={seoImagePickerOpen} onClose={() => setSeoImagePickerOpen(false)}
        onSelect={(m) => setSeoImage({ filePath: m.filePath, preview: m.url })} source="drama" accept="image/*" />
    </div>
  );
}
