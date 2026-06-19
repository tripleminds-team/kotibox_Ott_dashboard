import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, X, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useGetContentList, useGetSeasonList,
  useGetEpisodeById, useCreateEpisode, useUpdateEpisode,
} from "@/lib/api-client";
import MediaPicker from "@/components/MediaPicker";

type Tab = "Episode Details" | "Basic Info" | "Subtitle Info";
const TABS: Tab[] = ["Episode Details", "Basic Info", "Subtitle Info"];

type SubtitleRow = { _id: string; language: string; url: string };

export default function EpisodeForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState<Tab>("Episode Details");

  // Episode Details
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailPickerOpen, setThumbnailPickerOpen] = useState(false);
  const [showId, setShowId] = useState("");
  const [seasonNumber, setSeasonNumber] = useState("1");
  const [episodeNumber, setEpisodeNumber] = useState("1");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");

  // Basic Info
  const [airDate, setAirDate] = useState("");
  const [downloadAllowed, setDownloadAllowed] = useState(false);
  const [audioLanguages, setAudioLanguages] = useState("");

  // Subtitle Info
  const [subtitles, setSubtitles] = useState<SubtitleRow[]>([]);

  // API
  const { data: showsData, isLoading: loadingShows } = useGetContentList({ contentType: "series", limit: 200 });
  const { data: seasonsData } = useGetSeasonList(showId ? { contentId: showId } : {});
  const { data: existingEpisode, isLoading: loadingEpisode } = useGetEpisodeById(isEdit ? id : "");
  const createMutation = useCreateEpisode();
  const updateMutation = useUpdateEpisode();

  const tvShows: any[] = showsData?.data || [];
  const availableSeasons: any[] = seasonsData?.data || [];

  useEffect(() => {
    if (isEdit && existingEpisode) {
      const e = existingEpisode;
      setShowId(e.contentId?._id || e.contentId || "");
      setSeasonNumber(String(e.season || 1));
      setEpisodeNumber(String(e.episode || 1));
      setName(e.title || "");
      setDescription(e.description || "");
      setThumbnailUrl(e.thumbnail || "");
      setVideoUrl(e.sourceVideoUrl || e.hlsUrl || "");
      setTrailerUrl(e.trailerUrl || "");
      setIsFree(e.isFree || false);
      setIsLocked(e.isLocked !== false);
      setAirDate(e.airDate ? new Date(e.airDate).toISOString().split("T")[0] : "");
      setDownloadAllowed(e.downloadAllowed || false);
      setAudioLanguages((e.audioLanguages || []).join(", "));
      setSubtitles(
        (e.subtitleLanguages || []).map((lang: string, i: number) => ({
          _id: String(i),
          language: lang,
          url: "",
        }))
      );
    }
  }, [isEdit, existingEpisode]);

  const addSubtitle = () =>
    setSubtitles((p) => [...p, { _id: Date.now().toString(), language: "", url: "" }]);
  const removeSubtitle = (sid: string) =>
    setSubtitles((p) => p.filter((s) => s._id !== sid));
  const updateSubtitle = (sid: string, field: keyof SubtitleRow, val: string) =>
    setSubtitles((p) => p.map((s) => (s._id === sid ? { ...s, [field]: val } : s)));

  const handleSave = async () => {
    if (!showId) {
      toast({ title: "Please select a TV Show", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "Episode title is required", variant: "destructive" });
      return;
    }

    const payload: any = {
      contentId: showId,
      season: parseInt(seasonNumber) || 1,
      episode: parseInt(episodeNumber) || 1,
      title: name,
      description: description || undefined,
      thumbnail: thumbnailUrl || undefined,
      sourceVideoUrl: videoUrl || undefined,
      trailerUrl: trailerUrl || undefined,
      isFree,
      isLocked: !isFree && isLocked,
      airDate: airDate ? new Date(airDate) : undefined,
      downloadAllowed,
      audioLanguages: audioLanguages.split(",").map((l) => l.trim()).filter(Boolean),
      subtitleLanguages: subtitles.map((s) => s.language).filter(Boolean),
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      queryClient.invalidateQueries({ queryKey: ["episode-list"] });
      queryClient.invalidateQueries({ queryKey: ["season-list"] });
      toast({ title: isEdit ? "Episode updated!" : "Episode created!" });
      setLocation("/episodes");
    } catch (error: any) {
      toast({ title: "Save failed", description: error?.message, variant: "destructive" });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isEdit && loadingEpisode) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => setLocation("/dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
        <span>/</span>
        <span className="text-foreground font-medium">{isEdit ? "Edit Episode" : "New Episode"}</span>
      </div>

      <button onClick={() => setLocation("/episodes")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
        «&nbsp;Back
      </button>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
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

      <div className="rounded-xl border border-border bg-card">

        {/* ===== EPISODE DETAILS TAB ===== */}
        {activeTab === "Episode Details" && (
          <div className="p-6 space-y-6">
            <p className="text-base font-semibold text-foreground">Episode Details</p>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label className="text-foreground text-sm font-medium">Episode Thumbnail</Label>
              {thumbnailUrl && (
                <div className="group relative inline-block">
                  <img src={thumbnailUrl} alt="Thumbnail" className="h-28 w-44 rounded-lg object-cover border border-border" />
                  <button
                    onClick={() => setThumbnailUrl("")}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => setThumbnailPickerOpen(true)} className="gap-2">
                {thumbnailUrl ? "Change Thumbnail" : "Pick from Library"}
              </Button>
              <MediaPicker
                open={thumbnailPickerOpen}
                onClose={() => setThumbnailPickerOpen(false)}
                onSelect={(media) => { setThumbnailUrl(media.filePath || media.url); setThumbnailPickerOpen(false); }}
                source="tv-show"
                accept="image/*"
              />
            </div>

            {/* Show, Season, Episode */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">
                  TV Show <span className="text-primary">*</span>
                </Label>
                <Select value={showId} onValueChange={setShowId} disabled={loadingShows}>
                  <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                    <SelectValue placeholder={loadingShows ? "Loading…" : "Select TV Show"} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    {tvShows.length === 0
                      ? <SelectItem value="_none" disabled>No TV shows found</SelectItem>
                      : tvShows.map((s) => <SelectItem key={s._id} value={s._id}>{s.title}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">
                  Season <span className="text-primary">*</span>
                </Label>
                <Select value={seasonNumber} onValueChange={setSeasonNumber}>
                  <SelectTrigger className="bg-muted border-border text-foreground h-10 rounded-lg text-sm">
                    <SelectValue placeholder="Season" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-foreground">
                    {availableSeasons.length > 0
                      ? availableSeasons.map((s: any) => (
                          <SelectItem key={s.seasonId} value={String(s.season)}>Season {s.season}</SelectItem>
                        ))
                      : [1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>Season {n}</SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">
                  Episode Number <span className="text-primary">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(e.target.value)}
                  className="bg-muted border-border text-foreground h-10 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm font-medium">
                Episode Title <span className="text-primary">*</span>
              </Label>
              <Input
                placeholder="e.g. The Beginning"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-foreground text-sm font-medium">Description</Label>
                <button className="text-xs text-primary hover:text-red-300 flex items-center gap-1.5 transition-colors">
                  <Sparkles className="h-3.5 w-3.5" /> Generate with AI
                </button>
              </div>
              <Textarea
                placeholder="Episode description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg text-sm resize-none"
              />
            </div>

            {/* Video URL */}
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm font-medium">Video URL / HLS URL</Label>
              <Input
                placeholder="https://cdn.example.com/video.m3u8"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
              />
            </div>

            {/* Trailer URL */}
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm font-medium">Trailer URL</Label>
              <Input
                placeholder="https://..."
                value={trailerUrl}
                onChange={(e) => setTrailerUrl(e.target.value)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
              />
            </div>

            {/* Access */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div>
                  <p className="text-sm font-medium text-foreground">Free Episode</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Watchable without subscription</p>
                </div>
                <Switch checked={isFree} onCheckedChange={(v) => { setIsFree(v); if (v) setIsLocked(false); }} className="data-[state=checked]:bg-primary" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                <div>
                  <p className="text-sm font-medium text-foreground">Locked</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Requires subscription to unlock</p>
                </div>
                <Switch checked={isLocked && !isFree} onCheckedChange={setIsLocked} disabled={isFree} className="data-[state=checked]:bg-primary" />
              </div>
            </div>
          </div>
        )}

        {/* ===== BASIC INFO TAB ===== */}
        {activeTab === "Basic Info" && (
          <div className="p-6 space-y-6">
            <p className="text-base font-semibold text-foreground">Basic Info</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">Air Date</Label>
                <Input
                  type="date"
                  value={airDate}
                  onChange={(e) => setAirDate(e.target.value)}
                  className="bg-muted border-border text-foreground h-10 rounded-lg text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm font-medium">Audio Languages</Label>
                <Input
                  placeholder="English, Hindi"
                  value={audioLanguages}
                  onChange={(e) => setAudioLanguages(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div>
                <p className="text-sm font-medium text-foreground">Allow Download</p>
                <p className="text-xs text-muted-foreground mt-0.5">Users can download this episode</p>
              </div>
              <Switch checked={downloadAllowed} onCheckedChange={setDownloadAllowed} className="data-[state=checked]:bg-primary" />
            </div>
          </div>
        )}

        {/* ===== SUBTITLE INFO TAB ===== */}
        {activeTab === "Subtitle Info" && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-foreground">Subtitle Languages</p>
              <Button type="button" onClick={addSubtitle} className="bg-primary hover:bg-primary/90 text-white h-9 gap-2 rounded-lg px-4 text-sm font-semibold">
                <Plus className="h-4 w-4" /> Add Subtitle
              </Button>
            </div>

            {subtitles.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border bg-muted/10 py-12 flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground">No subtitles added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subtitles.map((sub) => (
                  <div key={sub._id} className="rounded-xl border border-border bg-muted/10 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div className="space-y-1.5">
                        <Label className="text-foreground text-sm font-medium">Language</Label>
                        <Input
                          placeholder="e.g. English"
                          value={sub.language}
                          onChange={(e) => updateSubtitle(sub._id, "language", e.target.value)}
                          className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-foreground text-sm font-medium">Subtitle URL</Label>
                          <Input
                            placeholder="https://..."
                            value={sub.url}
                            onChange={(e) => updateSubtitle(sub._id, "url", e.target.value)}
                            className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-10 rounded-lg text-sm"
                          />
                        </div>
                        <button
                          type="button" onClick={() => removeSubtitle(sub._id)}
                          className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/15 text-primary hover:bg-primary/80/30 shrink-0"
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

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setLocation("/episodes")} className="border-border">Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-white h-11 px-10 rounded-lg font-semibold text-sm gap-2"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSaving ? "Saving…" : isEdit ? "Update Episode" : "Create Episode"}
        </Button>
      </div>
    </div>
  );
}
