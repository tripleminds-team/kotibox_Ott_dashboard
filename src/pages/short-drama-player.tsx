import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX,
  Maximize, Minimize, X, Loader2, Crown, Lock, Heart, Check,
  ChevronUp, ChevronDown, SkipForward, Download
} from "lucide-react";
import Hls from "hls.js";
import { useGetWebDetail, getImageUrl, useGetWishlist, useToggleWishlist, useGetPublicAds, useGetWebSubscriptionPlans, useCreateSubscription, useGetAppProfile, useRequestDownload } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import SubscriptionPlansModal from "@/components/SubscriptionPlansModal";

type Tab = "home" | "movies" | "tvshows" | "drama" | "new";

function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function ShortDramaPlayer() {
  const { id, epNum } = useParams<{ id: string; epNum: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const [user, setUser] = useState<any>(null);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const requestDownloadMutation = useRequestDownload();
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [showEpList, setShowEpList] = useState(false);

  const epNumInt = parseInt(epNum || "1", 10);
  const [currentEpNum, setCurrentEpNum] = useState(epNumInt);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const isSubscribed = user?.subscriptionStatus === "active" && user?.subscriptionPlan !== "free";

  const { data: detailData, isLoading } = useGetWebDetail(id || "");
  const show = (detailData as any)?.content || detailData;
  const apiEpisodes: any[] = (detailData as any)?.episodes || [];

  const currentEpisode = currentEpNum === 0 ? null : (apiEpisodes[currentEpNum - 1] || apiEpisodes[0]);
  const totalEps = apiEpisodes.length;
  const freeEps = apiEpisodes.filter((e: any) => e.isFree).length;

  const { data: wishlistData } = useGetWishlist({ limit: 100 });
  const wishlistItems: any[] = (wishlistData as any)?.items || [];
  const inWatchlist = wishlistItems.some((w: any) => w.id === id || w.contentId === id);
  const toggleWishlistMutation = useToggleWishlist();

  const isLocked = currentEpisode && currentEpisode.isLocked && !currentEpisode.isFree && !isSubscribed;
  const videoSrc = isLocked ? "" : (currentEpisode?.hlsUrl || currentEpisode?.videoUrl || (currentEpNum === 0 ? (show?.trailerUrl || show?.hlsUrl || "") : ""));
  const poster = getImageUrl(currentEpisode?.thumbnail || show?.posterImage || show?.thumbnail || "");

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // HLS player
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let hls: Hls | null = null;
    setLoading(true);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);

    if (!videoSrc) { 
      v.src = "";
      setLoading(false); 
      return; 
    }

    if (videoSrc.includes(".m3u8") && Hls.isSupported()) {
      hls = new Hls({ startLevel: -1 });
      hls.loadSource(videoSrc);
      hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        v.play().catch(() => {});
        setPlaying(true);
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setLoading(false);
      });
    } else {
      v.src = videoSrc;
      v.load();
      const onCanPlay = () => {
        setLoading(false);
        v.play().catch(() => {});
        setPlaying(true);
        v.removeEventListener("canplay", onCanPlay);
      };
      v.addEventListener("canplay", onCanPlay);
    }

    return () => {
      if (hls) hls.destroy();
      v.pause();
    };
  }, [videoSrc]);

  // Controls auto-hide
  const revealControls = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    setControlsVisible(true);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3500);
  }, []);

  useEffect(() => () => clearTimeout(hideTimerRef.current), []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
    revealControls();
  }, [revealControls]);

  const handleVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    v.muted = val === 0;
    setMuted(val === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setMuted(next);
  };

  const goToEpisode = (n: number) => {
    if (n < 1 || n > totalEps) return;
    const ep = apiEpisodes[n - 1];
    if (ep?.isLocked && !ep?.isFree && !isSubscribed) {
      setPlansModalOpen(true);
      return;
    }
    setCurrentEpNum(n);
    setLocation(`/drama/${id}/episode/${n}`, { replace: true });
  };

  const seekPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const VolumeIcon = muted || volume === 0 ? VolumeX : Volume2;

  const handleDownloadEpisode = async () => {
    if (!user) { toast({ title: "Please sign in to download", variant: "destructive" }); return; }
    if (!currentEpisode) return;
    setDownloading(true);
    try {
      await requestDownloadMutation.mutateAsync({
        contentId: id!,
        contentType: "drama",
        episodeId: currentEpisode._id || currentEpisode.id,
      });
      toast({ title: "Episode added to downloads" });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[200]">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center overflow-hidden">
      {/* Back / close button — top left */}
      {!isExpanded && (
        <button
          onClick={() => setLocation("/")}
          className="absolute top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 border border-white/10 text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Left side: Show info (desktop only, when not expanded) */}
      {!isExpanded && (
        <div className="hidden xl:flex flex-col gap-5 mr-8 w-64 flex-shrink-0">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Short Drama</span>
            </div>
            <h2 className="text-white font-bold text-xl leading-tight">{show?.title || "Drama"}</h2>
            {show?.description && (
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed line-clamp-4">{show.description}</p>
            )}
          </div>
          <div className="text-zinc-500 text-xs">
            <p>{totalEps} Episodes · {freeEps} Free</p>
          </div>
          <button
            onClick={() => {
              if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
              toggleWishlistMutation.mutate(
                { contentId: id!, contentType: "drama" },
                {
                  onSuccess: (data: any) => toast({ title: data?.isWishlisted ? "Added to wishlist" : "Removed from wishlist" }),
                  onError: () => toast({ title: "Failed to update wishlist", variant: "destructive" }),
                }
              );
            }}
            disabled={toggleWishlistMutation.isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${inWatchlist ? "bg-rose-600/20 border-rose-600/50 text-rose-400" : "bg-zinc-900/60 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"}`}
          >
            <Heart className={`w-4 h-4 ${inWatchlist ? "fill-rose-400" : ""}`} />
            {inWatchlist ? "In Wishlist" : "Add to Wishlist"}
          </button>
        </div>
      )}

      {/* 9:16 Player Container */}
      <div
        ref={containerRef}
        className={`relative bg-black overflow-hidden select-none transition-all duration-300 ${isExpanded ? "rounded-none" : "rounded-2xl shadow-2xl"}`}
        style={
          isExpanded
            ? { width: `min(${(9 / 16) * 100}vh, 100vw)`, height: "100vh" }
            : { width: "min(380px, 90vw)", aspectRatio: "9/16", maxHeight: "calc(100vh - 40px)" }
        }
        onMouseMove={revealControls}
        onTouchStart={revealControls}
      >
        {/* Video */}
        <video
          ref={videoRef}
          poster={poster}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          onClick={togglePlay}
          onTimeUpdate={() => { const v = videoRef.current; if (v) setCurrentTime(v.currentTime); }}
          onDurationChange={() => { const v = videoRef.current; if (v && isFinite(v.duration)) setDuration(v.duration); }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => goToEpisode(currentEpNum + 1)}
        />

        {/* Locked Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-20">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Lock className="w-7 h-7 text-amber-400" />
            </div>
            <div className="text-center px-6">
              <p className="text-white font-bold text-base mb-1">Premium Episode</p>
              <p className="text-zinc-400 text-xs">Subscribe to unlock all episodes</p>
            </div>
            <button
              onClick={() => setPlansModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-all"
            >
              <Crown className="w-4 h-4" /> Subscribe
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && !isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {/* Controls Overlay */}
        <div className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${controlsVisible || !playing ? "opacity-100" : "opacity-0"} pointer-events-none`}>
          {/* Top bar */}
          <div className="bg-gradient-to-b from-black/70 to-transparent p-4 pointer-events-auto">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{show?.title}</p>
                {currentEpisode && (
                  <p className="text-zinc-300 text-xs mt-0.5 truncate">
                    EP {currentEpNum}: {currentEpisode.title || `Episode ${currentEpNum}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button onClick={toggleMute} className="text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                  <VolumeIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                >
                  {isExpanded ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
                {isExpanded && (
                  <button
                    onClick={() => setLocation("/")}
                    className="text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Center: play/pause icon — pointer-events only on the button itself */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {!playing && !loading && (
              <button
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl pointer-events-auto"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                aria-label="Play"
              >
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </button>
            )}
          </div>

          {/* Bottom bar */}
          <div className="bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-auto">
            {/* Seek bar */}
            <div className="relative h-1 bg-white/20 rounded-full mb-3 cursor-pointer group/seek" onClick={(e) => e.stopPropagation()}>
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${seekPct}%` }} />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500 border-2 border-white opacity-0 group-hover/seek:opacity-100 transition-opacity"
                style={{ left: `calc(${seekPct}% - 6px)` }}
              />
              <input
                type="range" min={0} max={100} step={0.1} value={seekPct}
                onChange={(e) => {
                  const v = videoRef.current;
                  if (v && duration) v.currentTime = (parseFloat(e.target.value) / 100) * duration;
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Bottom controls row */}
            <div className="flex items-center justify-between text-white text-xs">
              <span className="font-mono text-zinc-300">{fmtTime(currentTime)} / {fmtTime(duration)}</span>
              <div className="flex items-center gap-3">
                {currentEpNum > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); goToEpisode(currentEpNum - 1); }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-bold text-[11px]"
                  >
                    <ChevronLeft className="w-3 h-3" /> Prev
                  </button>
                )}
                <span className="font-bold text-zinc-300">{currentEpNum}/{totalEps}</span>
                {currentEpNum < totalEps && (
                  <button
                    onClick={(e) => { e.stopPropagation(); goToEpisode(currentEpNum + 1); }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-bold text-[11px]"
                  >
                    Next <ChevronRight className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownloadEpisode(); }}
                  disabled={downloading}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-emerald-600/80 rounded-lg transition-colors font-bold text-[11px] disabled:opacity-50"
                >
                  {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  {downloading ? "..." : "Save"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
                    toggleWishlistMutation.mutate(
                      { contentId: id!, contentType: "drama" },
                      {
                        onSuccess: (data: any) => toast({ title: data?.isWishlisted ? "Added to wishlist" : "Removed from wishlist" }),
                        onError: () => toast({ title: "Failed to update wishlist", variant: "destructive" }),
                      }
                    );
                  }}
                  disabled={toggleWishlistMutation.isPending}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors font-bold text-[11px] disabled:opacity-50 ${inWatchlist ? "bg-rose-600/30 text-rose-400" : "bg-white/10 hover:bg-white/20"}`}
                >
                  <Heart className={`w-3 h-3 ${inWatchlist ? "fill-rose-400" : ""}`} />
                  {inWatchlist ? "Saved" : "Wishlist"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowEpList(!showEpList); }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-bold text-[11px]"
                >
                  Episodes <ChevronUp className={`w-3 h-3 transition-transform ${showEpList ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Episode List Panel (slides up from bottom) */}
        {showEpList && (
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#0a0a14]/98 backdrop-blur-md border-t border-white/10 z-30 max-h-[60%] overflow-y-auto"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#0a0a14]/98 flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-white font-bold text-sm">Episodes ({totalEps})</span>
              <button onClick={() => setShowEpList(false)} className="text-zinc-400 hover:text-white">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              {apiEpisodes.map((ep: any, i: number) => {
                const n = ep.episode || i + 1;
                const locked = ep.isLocked && !ep.isFree && !isSubscribed;
                const isCurrent = n === currentEpNum;
                return (
                  <button
                    key={ep._id || ep.id || i}
                    onClick={() => { goToEpisode(n); setShowEpList(false); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${isCurrent ? "bg-red-600/20 border border-red-600/30" : "hover:bg-white/5"}`}
                  >
                    <div className="w-12 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800" style={{ aspectRatio: "9/16" }}>
                      {ep.thumbnail && <img src={getImageUrl(ep.thumbnail)} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] font-bold ${isCurrent ? "text-red-400" : "text-zinc-500"}`}>EP {n}</span>
                        {ep.isFree && <span className="text-[9px] font-bold px-1 py-0.5 bg-emerald-600/20 text-emerald-400 rounded">FREE</span>}
                        {locked && <Lock className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />}
                      </div>
                      <p className={`text-xs font-semibold truncate ${isCurrent ? "text-red-400" : "text-white"}`}>{ep.title || `Episode ${n}`}</p>
                    </div>
                    {isCurrent && <SkipForward className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right side: Episode list (desktop, when not expanded) */}
      {!isExpanded && (
        <div className="hidden xl:flex flex-col gap-3 ml-8 w-64 flex-shrink-0 max-h-[85vh] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" } as React.CSSProperties}>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider sticky top-0 bg-black/50 py-2">Episodes</p>
          {apiEpisodes.map((ep: any, i: number) => {
            const n = ep.episode || i + 1;
            const locked = ep.isLocked && !ep.isFree && !isSubscribed;
            const isCurrent = n === currentEpNum;
            return (
              <button
                key={ep._id || ep.id || i}
                onClick={() => goToEpisode(n)}
                className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${isCurrent ? "bg-red-600/20 border border-red-600/30" : "hover:bg-white/5"}`}
              >
                <div className="w-10 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800" style={{ aspectRatio: "9/16" }}>
                  {ep.thumbnail && <img src={getImageUrl(ep.thumbnail)} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={`text-[10px] font-bold ${isCurrent ? "text-red-400" : "text-zinc-500"}`}>EP {n}</span>
                    {ep.isFree && <span className="text-[9px] font-bold px-1 py-0.5 bg-emerald-600/20 text-emerald-400 rounded">FREE</span>}
                    {locked && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                  </div>
                  <p className={`text-xs font-semibold truncate ${isCurrent ? "text-red-400" : "text-white"}`}>{ep.title || `Episode ${n}`}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <SubscriptionPlansModal isOpen={plansModalOpen} onClose={() => setPlansModalOpen(false)} />
    </div>
  );
}
