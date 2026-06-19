
import { useState, useRef, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import {
  Play, Pause, Plus, Share2, Heart, Star, Calendar, Globe, Clock,
  ChevronLeft, Crown, Tv, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Check, ChevronRight, RotateCcw, RotateCw, Loader2
} from "lucide-react";
import { useGetWebDetail, useGetPublicAds, getImageUrl, useGetWishlist, useToggleWishlist } from "@/lib/api-client";
import { PublicHeader, PublicFooter } from "@/pages/streaming-home";
import SubscriptionPlansModal from "@/components/SubscriptionPlansModal";
import Hls from "hls.js";

/* ─── AD OVERLAY ─── */
function AdOverlay({ ad, onSkip }: { ad: any; onSkip: () => void }) {
  const [countdown, setCountdown] = useState(5);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const adSrc = ad.urlType === "URL" ? ad.mediaUrl : getImageUrl(ad.mediaUrl);

  return (
    <div className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center">
      {ad.adType === "Video" ? (
        <video
          ref={videoRef}
          src={adSrc}
          className="w-full h-full object-contain"
          autoPlay
          muted={false}
          onEnded={onSkip}
          playsInline
        />
      ) : ad.adType === "Image" ? (
        <a href={ad.redirectUrl || "#"} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center">
          <img src={adSrc} alt={ad.adName} className="max-w-full max-h-full object-contain" />
        </a>
      ) : (
        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: ad.mediaUrl }} />
      )}
      <div className="absolute bottom-4 right-4 flex items-center gap-3">
        <span className="text-zinc-400 text-xs">Advertisement</span>
        {countdown > 0 ? (
          <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg font-bold border border-zinc-700">
            Skip in {countdown}s
          </span>
        ) : (
          <button
            onClick={onSkip}
            className="bg-white/90 hover:bg-white text-black text-xs font-black px-3 py-1.5 rounded-lg transition-colors"
          >
            Skip Ad ›
          </button>
        )}
      </div>
    </div>
  );
}

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ─────────────────────────────────────────────
   FULL-WIDTH VIDEO PLAYER  (top of page)
───────────────────────────────────────────── */
interface TopPlayerProps {
  id?: string;
  title?: string;
  src: string;
  poster?: string;
  onSkipTrailer?: () => void;
}

const getContinueWatching = () => {
  try {
    const data = JSON.parse(localStorage.getItem("continue_watching") || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

function TopPlayer({ id, title, src, poster, onSkipTrailer }: TopPlayerProps) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer  = useRef<ReturnType<typeof setTimeout>>();

  const [playing,      setPlaying]      = useState(false);
  const [muted,        setMuted]        = useState(true);
  const [volume,       setVolume]       = useState(0.8);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [showCtrl,     setShowCtrl]     = useState(true);
  const [fullscreen,   setFullscreen]   = useState(false);
  const [buffered,     setBuffered]     = useState(0);
  const [skipAnim,     setSkipAnim]     = useState<"left"|"right"|null>(null);

  const resetHide = useCallback(() => {
    clearTimeout(hideTimer.current);
    setShowCtrl(true);
    hideTimer.current = setTimeout(() => setShowCtrl(false), 3000);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // Save continue watching progress
  useEffect(() => {
    if (!id || !title || !poster || !duration) return;
    if (currentTime > 5 && currentTime < duration - 5) {
      const cw = getContinueWatching();
      const idx = cw.findIndex((i: any) => i.id === id);
      const item = { id, title, poster, progress: (currentTime / duration) * 100, timestamp: Date.now() };
      if (idx >= 0) cw[idx] = item;
      else cw.unshift(item);
      localStorage.setItem("continue_watching", JSON.stringify(cw.sort((a: any, b: any) => b.timestamp - a.timestamp).slice(0, 10)));
    }
  }, [currentTime, duration, id, title, poster]);

  // auto-play muted on mount
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;

    let hls: Hls | null = null;
    const isM3u8 = src.includes('.m3u8');

    if (isM3u8 && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        v.muted = true;
        v.play().catch(() => {});
      });
    } else {
      v.src = src;
      v.load();
      v.muted = true;
      v.play().catch(() => {});
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const handleForcePlay = () => {
      const v = videoRef.current;
      const el = containerRef.current;
      if (!v || !el) return;
      v.muted = false;
      setMuted(false);
      v.volume = 1;
      setVolume(1);
      v.currentTime = 0;
      v.play().catch(() => {});
      if (!document.fullscreenElement) {
        el.requestFullscreen().catch(() => {});
      }
    };
    window.addEventListener('force-play-fullscreen', handleForcePlay);
    return () => window.removeEventListener('force-play-fullscreen', handleForcePlay);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
    resetHide();
  }, [resetHide]);

  const skip = useCallback((sec: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec));
    setSkipAnim(sec > 0 ? "right" : "left");
    setTimeout(() => setSkipAnim(null), 600);
    resetHide();
  }, [resetHide]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setMuted(next);
  };

  const handleVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    v.muted = val === 0;
    setMuted(val === 0);
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) await el.requestFullscreen().catch(() => {});
    else await document.exitFullscreen().catch(() => {});
  };

  const pct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black overflow-hidden cursor-pointer select-none"
      style={{ aspectRatio: "16/9", maxHeight: "80vh" }}
      onMouseMove={resetHide}
      onMouseEnter={() => { setShowCtrl(true); clearTimeout(hideTimer.current); }}
      onMouseLeave={() => { if (playing) { hideTimer.current = setTimeout(() => setShowCtrl(false), 800); } }}
      onClick={togglePlay}
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-cover"
        muted={muted}
        playsInline
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onLoadedMetadata={() => {
          setDuration(videoRef.current?.duration || 0);
          setLoading(false);
        }}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v) return;
          setCurrentTime(v.currentTime);
          if (v.buffered.length)
            setBuffered((v.buffered.end(v.buffered.length - 1) / (v.duration || 1)) * 100);
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-primary animate-spin" />
        </div>
      )}

      {/* Skip flash */}
      {skipAnim && (
        <div
          className={`absolute inset-y-0 flex items-center justify-center pointer-events-none
            ${skipAnim === "right" ? "left-auto right-[15%]" : "left-[15%] right-auto"}`}
        >
          <div className="flex flex-col items-center gap-1 animate-skip-pop">
            <div className="flex">
              {skipAnim === "right"
                ? [0,1,2].map(i => <ChevronRight key={i} className={`w-9 h-9 text-white ${i===2?"opacity-100":i===1?"opacity-55":"opacity-20"}`} />)
                : [2,1,0].map(i => <ChevronRight key={i} className={`w-9 h-9 text-white rotate-180 ${i===0?"opacity-100":i===1?"opacity-55":"opacity-20"}`} />)}
            </div>
            <span className="text-white text-xs font-bold">{skipAnim === "right" ? "+10s" : "-10s"}</span>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300
          ${showCtrl || !playing ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 28%, transparent 58%, rgba(0,0,0,0.85) 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP bar — empty space for header */}
        <div className="h-16" />

        {/* CENTER controls */}
        <div className="flex items-center justify-center gap-10 pointer-events-auto">
          {/* Skip back */}
          <button
            className="flex flex-col items-center gap-1 group/sb"
            onClick={(e) => { e.stopPropagation(); skip(-10); }}
          >
            <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm border border-white/25 flex items-center justify-center group-hover/sb:bg-white/20 transition-all active:scale-90">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <span className="text-white/70 text-[11px] font-semibold">10s</span>
          </button>

          {/* Play/Pause */}
          <button
            className="w-[78px] h-[78px] rounded-full bg-white flex items-center justify-center shadow-2xl shadow-black/60 hover:bg-white/90 transition-all active:scale-95"
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          >
            {playing
              ? <Pause className="w-8 h-8 fill-black text-black" />
              : <Play  className="w-8 h-8 fill-black text-black ml-1" />}
          </button>

          {/* Skip forward */}
          <button
            className="flex flex-col items-center gap-1 group/sf"
            onClick={(e) => { e.stopPropagation(); skip(10); }}
          >
            <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm border border-white/25 flex items-center justify-center group-hover/sf:bg-white/20 transition-all active:scale-90">
              <RotateCw className="w-6 h-6 text-white" />
            </div>
            <span className="text-white/70 text-[11px] font-semibold">10s</span>
          </button>
        </div>

        {/* BOTTOM controls */}
        <div className="px-5 pb-4 space-y-2.5 pointer-events-auto">
          {/* Seek bar */}
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-[11px] font-mono w-11 text-right tabular-nums flex-shrink-0">
              {fmt(currentTime)}
            </span>
            <div className="relative flex-1 h-1 group/seek cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <div className="absolute inset-0 rounded-full bg-white/25" />
              <div className="absolute inset-y-0 left-0 rounded-full bg-white/40 transition-all" style={{ width: `${buffered}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${pct}%`, background: "#e50914" }} />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `calc(${pct}% - 7px)` }}
              />
              <input
                type="range" min={0} max={100} step={0.1}
                value={pct}
                onChange={(e) => {
                  const v = videoRef.current;
                  if (!v || !duration) return;
                  const val = parseFloat(e.target.value);
                  v.currentTime = (val / 100) * duration;
                  resetHide();
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-white/60 text-[11px] font-mono w-11 tabular-nums flex-shrink-0">
              {fmt(duration)}
            </span>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <button className="text-white hover:text-white/80 transition-colors" onClick={togglePlay}>
                {playing ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
              </button>
              <button className="text-white/70 hover:text-white transition-colors" onClick={() => skip(-10)}>
                <SkipBack className="w-4 h-4 fill-current" />
              </button>
              <button className="text-white/70 hover:text-white transition-colors" onClick={() => skip(10)}>
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button className="text-white/70 hover:text-white transition-colors" onClick={toggleMute}>
                  {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <div className="relative w-20 h-1 hidden sm:block cursor-pointer group/vol">
                  <div className="absolute inset-0 rounded-full bg-white/25" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-white transition-all"
                    style={{ width: `${(muted ? 0 : volume) * 100}%` }}
                  />
                  <input
                    type="range" min={0} max={1} step={0.05}
                    value={muted ? 0 : volume}
                    onChange={(e) => handleVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2.5">
              {onSkipTrailer && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSkipTrailer(); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black text-white transition-all active:scale-95 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #e50914 0%, #b00610 100%)" }}
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip Trailer
                </button>
              )}
              <button className="text-white/70 hover:text-white transition-colors" onClick={toggleFullscreen}>
                {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes skip-pop {
          0%   { opacity:1; transform:scale(1); }
          60%  { opacity:1; transform:scale(1.15); }
          100% { opacity:0; transform:scale(0.85); }
        }
        .animate-skip-pop { animation: skip-pop 0.6s ease forwards; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:0; height:0; }
        input[type=range]::-moz-range-thumb    { width:0; height:0; border:none; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PORTRAIT CARD
───────────────────────────────────────────── */
function PortraitCard({ item, onClick }: { item: any; onClick: () => void }) {
  return (
    <div
      className="group relative flex-shrink-0 w-[140px] sm:w-[158px] cursor-pointer"
      onClick={onClick}
    >
      <div
        className="relative overflow-hidden rounded-xl bg-[#1a1a2e] transition-all duration-300 group-hover:ring-2 group-hover:ring-primary/60 group-hover:scale-[1.04] group-hover:shadow-[0_10px_30px_rgba(26,119,255,0.2)]"
        style={{ aspectRatio: "2/3" }}
      >
        <img
          src={item.poster} alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = `https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop&q=80&sig=${item.id}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-x-0 bottom-0 p-2.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button className="w-full py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5">
            <Play className="w-2.5 h-2.5 fill-white" /> Play
          </button>
        </div>
        {item.badge && (
          <span className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-black leading-none">
            {item.badge}
          </span>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-white text-[12px] font-semibold leading-tight line-clamp-1">{item.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-zinc-500 text-[11px]">{item.year}</span>
          <span className="flex items-center gap-0.5 text-amber-400 text-[11px] font-bold">
            <Star className="w-2 h-2 fill-amber-400" />{item.imdbRating}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LANDSCAPE CARD
───────────────────────────────────────────── */
function LandscapeCard({ item, onClick }: { item: any; onClick: () => void }) {
  return (
    <div
      className="group relative flex-shrink-0 w-[230px] sm:w-[270px] cursor-pointer"
      onClick={onClick}
    >
      <div
        className="relative overflow-hidden rounded-xl bg-[#1a1a2e] transition-all duration-300 group-hover:ring-2 group-hover:ring-primary/60 group-hover:scale-[1.03] group-hover:shadow-[0_10px_30px_rgba(26,119,255,0.2)]"
        style={{ aspectRatio: "16/9" }}
      >
        <img
          src={item.backdrop} alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-bold text-[12px] line-clamp-1">{item.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-zinc-400 text-[11px]">{item.year}</span>
            <span className="text-zinc-500 text-[10px]">•</span>
            <span className="text-zinc-400 text-[11px]">{item.duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function MovieDetailPage() {
  const [, params]    = useRoute("/movie/:id");
  const [, setLocation] = useLocation();
  const id = (params as any)?.id;

  const [user, setUser] = useState<any>(null);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [adDismissed, setAdDismissed] = useState(false);
  const [playerStarted, setPlayerStarted] = useState(false);

  const { data: adsData } = useGetPublicAds({ placement: "Player" });
  const activeAds: any[] = adsData?.data || [];
  const currentAd = !adDismissed && playerStarted && activeAds.length > 0 ? activeAds[0] : null;

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        else setUser(null);
      } catch (e) {}
    };
    loadUser();
    window.addEventListener("user-updated", loadUser);
    return () => window.removeEventListener("user-updated", loadUser);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    setUser(null);
    window.location.reload();
  };

  const { data: detailData, isLoading } = useGetWebDetail(id || "");
  const item = detailData;
  const related = detailData?.related || [];
  const similarContent = detailData?.related || [];
  const episodes: any[] = detailData?.episodes || [];

  const [currentVideoSrc, setCurrentVideoSrc] = useState<string | null>(null);
  const [selectedEpIndex, setSelectedEpIndex] = useState(0);

  const [liked,       setLiked]       = useState(false);

  // Wishlist — real API
  const { data: wishlistData } = useGetWishlist({ limit: 100 });
  const wishlistItems: any[] = wishlistData?.items || [];
  const inWatchlist = wishlistItems.some((w: any) => w.id === id || w.contentId === id);
  const toggleWishlistMutation = useToggleWishlist();

  // For TV shows, default to first episode video when episodes load
  useEffect(() => {
    if (episodes.length > 0 && !item?.hlsUrl && !item?.videoUrl) {
      const firstEp = episodes[0];
      setCurrentVideoSrc(firstEp.videoUrl || firstEp.hlsUrl || null);
    }
  }, [episodes, item?.hlsUrl, item?.videoUrl]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center" style={{ background: "#0c0c14" }}>
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) { setLocation("/"); return null; }

  const isPremium = item.badge === "TOP" || item.badge === "EXCLUSIVE";

  const getPlanLevel = (plan?: string) => {
    switch (plan?.toLowerCase()) {
      case "premium": return 3;
      case "standard": return 2;
      case "basic": return 1;
      default: return 0;
    }
  };

  const userPlan = user?.subscriptionStatus === "active" ? user.subscriptionPlan : "free";
  const planRequired = item?.planRequired || "free";
  const isLocked = getPlanLevel(userPlan) < getPlanLevel(planRequired);

  return (
    <div className="min-h-screen text-white" style={{ background: "#0c0c14" }}>
      <PublicHeader
        activeTab={item.type === "movie" ? "movies" : "tvshows"}
        setActiveTab={(tab) => {
          if (tab === "home") setLocation("/");
          else if (tab === "tvshows") setLocation("/tv-shows-browse");
          else setLocation(`/browse/${tab}`);
        }}
        onSignIn={() => setLocation("/login")}
        onSignOut={handleSignOut}
        user={user}
      />

      {/* ══════════════════════════════════════════
          1. FULL-WIDTH VIDEO PLAYER  (top of page)
      ══════════════════════════════════════════ */}
      <div className="w-full" style={{ paddingTop: "64px" }}>
        {isLocked ? (
          <div 
            className="relative w-full bg-black flex flex-col items-center justify-center p-6 border-b border-zinc-800/80" 
            style={{ 
              aspectRatio: "16/9", 
              maxHeight: "80vh", 
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.98)), url(${item.backdrop || item.poster})`, 
              backgroundSize: "cover", 
              backgroundPosition: "center" 
            }}
          >
            <div className="max-w-md w-full bg-[#111118]/80 backdrop-blur-md border border-zinc-800 p-8 rounded-2xl text-center shadow-[0_0_30px_rgba(229,9,20,0.15)] animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30 shadow-[0_0_20px_rgba(229,9,20,0.1)]">
                <Crown className="w-8 h-8 text-amber-500 fill-amber-500 animate-pulse" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-2 uppercase tracking-wide">Premium Content</h2>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                This movie requires a <span className="text-amber-400 font-extrabold uppercase">{planRequired}</span> subscription plan or higher to watch.
              </p>
              <button
                onClick={() => setPlansModalOpen(true)}
                className="w-full py-3.5 px-6 font-black rounded-xl text-sm tracking-wide transition-all active:scale-95 text-white"
                style={{ background: "linear-gradient(135deg, #e50914 0%, #b9090b 100%)", boxShadow: "0 8px 24px rgba(229,9,20,0.3)" }}
              >
                Unlock Content Now
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <TopPlayer
              id={item.id}
              title={item.title}
              src={
                currentVideoSrc ??
                item.hlsUrl ??
                item.videoUrl ??
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              }
              poster={item.backdrop || item.poster}
              onSkipTrailer={() => document.getElementById("info")?.scrollIntoView({ behavior: "smooth" })}
            />
            {currentAd && <AdOverlay ad={currentAd} onSkip={() => setAdDismissed(true)} />}
            {!playerStarted && (
              <div
                className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer bg-black/20"
                onClick={() => setPlayerStarted(true)}
              />
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          2. MOVIE INFO  (directly below player)
      ══════════════════════════════════════════ */}
      <div id="info" className="px-6 sm:px-10 lg:px-16 pt-7 pb-10">

        {/* Back + Genre row */}
        <div className="flex items-start justify-between mb-3 gap-4">
          <div className="flex flex-wrap items-center gap-x-0 gap-y-1">
            {item.genres.map((g, i) => (
              <span key={g} className="text-zinc-400 text-sm font-medium">
                {g}{i < item.genres.length - 1 && <span className="mx-2 text-zinc-600">•</span>}
              </span>
            ))}
          </div>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm font-semibold flex-shrink-0 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-3 tracking-tight">
          {item.title}
        </h1>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {item.imdbRating && (
            <span className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/35 text-amber-400 text-xs font-black px-2.5 py-1 rounded-md">
              <Star className="w-3 h-3 fill-amber-400" /> IMDb {item.imdbRating}
            </span>
          )}
          {item.ageRating && (
            <span className="text-xs font-bold px-2.5 py-1 rounded border border-white/20 text-white/60">
              {item.ageRating}
            </span>
          )}
          <span className="text-xs font-bold px-2.5 py-1 rounded border border-white/20 text-white/60">
            {item.year}
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded border border-white/20 text-white/60">
            {item.duration}
          </span>
          {item.language && (
            <span className="text-xs font-bold px-2.5 py-1 rounded border border-white/20 text-white/60 uppercase">
              {item.language}
            </span>
          )}
          {isPremium && (
            <span className="flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-md bg-amber-500 text-black">
              <Crown className="w-3 h-3" /> Premium
            </span>
          )}
          {item.type === "show" && item.seasons && (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md border border-primary/40 text-primary" style={{ background: "rgba(26,119,255,0.12)" }}>
              <Tv className="w-3 h-3" />
              {item.seasons}S · {item.episodes}E
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-zinc-300 text-sm sm:text-[15px] leading-relaxed mb-6 max-w-3xl">
          {item.description}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-5 mb-7 text-sm border-t border-b border-white/[0.07] py-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Calendar className="w-4 h-4 text-zinc-600" /> {item.year}
          </div>
          {item.language && (
            <div className="flex items-center gap-2 text-zinc-400">
              <Globe className="w-4 h-4 text-zinc-600" /> {item.language}
            </div>
          )}
          <div className="flex items-center gap-2 text-zinc-400">
            <Clock className="w-4 h-4 text-zinc-600" /> {item.duration}
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-amber-400 font-bold">{item.imdbRating}</span>
            <span className="text-zinc-600">/10 IMDb</span>
          </div>
          {item.type === "show" && item.seasons && (
            <div className="flex items-center gap-2 text-zinc-400">
              <Tv className="w-4 h-4 text-zinc-600" />
              {item.seasons} Seasons · {item.episodes} Episodes
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Watch Now — scrolls back to player and plays fullscreen */}
          <button
            onClick={() => {
              if (isLocked) {
                setPlansModalOpen(true);
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
                window.dispatchEvent(new Event('force-play-fullscreen'));
              }
            }}
            className="flex items-center gap-2.5 px-8 py-3.5 font-black rounded-xl text-sm tracking-wide transition-all active:scale-95 shadow-lg text-white"
            style={{ background: "linear-gradient(135deg, #e50914 0%, #b9090b 100%)", boxShadow: "0 8px 24px rgba(229,9,20,0.3)" }}
          >
            {isLocked ? <Crown className="w-4 h-4 text-amber-500 fill-amber-500" /> : <Play className="w-4 h-4 fill-white" />}
            {isLocked ? "Unlock Now" : "Watch Now"}
          </button>

          <button
            onClick={() => {
              if (!user) { setLocation("/login"); return; }
              const contentType = item.contentType === 'drama' ? 'drama' : item.contentType === 'series' ? 'show' : 'movie';
              toggleWishlistMutation.mutate({ contentId: id!, contentType });
            }}
            disabled={toggleWishlistMutation.isPending}
            className={`flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 disabled:opacity-70 ${
              inWatchlist
                ? "bg-primary/20 border-primary text-primary"
                : "bg-white/8 border-white/20 text-white hover:bg-white/12 hover:border-white/35"
            }`}
          >
            {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {inWatchlist ? "In Watchlist" : "Watchlist"}
          </button>

          <button
            onClick={() => setLiked(!liked)}
            className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all active:scale-95 ${
              liked
                ? "bg-rose-500/20 border-rose-500 text-rose-400"
                : "bg-white/8 border-white/20 text-white hover:border-white/35"
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? "fill-rose-400" : ""}`} />
          </button>

          <button className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-white/20 bg-white/8 text-white hover:border-white/35 transition-all active:scale-95">
            <Share2 className="w-4 h-4" />
          </button>

          <button className="hidden sm:flex ml-2 items-center gap-2 px-5 py-3 bg-zinc-800/70 hover:bg-zinc-700/70 border border-zinc-700 text-white font-semibold rounded-xl text-sm transition-all">
            <Star className="w-4 h-4 text-amber-400" />
            Rate this
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          EPISODES (Only for TV Shows / Dramas)
      ══════════════════════════════════════════ */}
      {item.type === "show" && episodes.length > 0 && (
        <div className="pb-10">
          <div className="flex items-center gap-3 mb-5 px-6 sm:px-10 lg:px-16">
            <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: "#e50914" }} />
            <h2 className="text-white font-black text-lg sm:text-xl tracking-tight">Episodes</h2>
          </div>
          <div className="px-6 sm:px-10 lg:px-16 space-y-4">
            {episodes.map((ep: any, index: number) => (
              <div
                key={ep.id}
                className={`flex items-start gap-4 p-4 rounded-xl transition-colors border cursor-pointer ${selectedEpIndex === index ? 'bg-[#e50914]/10 border-[#e50914]/30' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
                onClick={() => {
                  setCurrentVideoSrc(ep.videoUrl || ep.hlsUrl || null);
                  setSelectedEpIndex(index);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <div className="w-32 sm:w-40 aspect-video rounded-lg overflow-hidden flex-shrink-0 relative">
                  <img src={ep.thumbnail ? getImageUrl(ep.thumbnail) : ''} alt={ep.title} className="w-full h-full object-cover bg-zinc-800" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 fill-white text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-1">
                    {index + 1}. {ep.title}
                  </h3>
                  <p className="text-zinc-400 text-sm mb-2">{ep.duration}</p>
                  <p className="text-zinc-500 text-sm line-clamp-2">{ep.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          3. MORE LIKE THIS
      ══════════════════════════════════════════ */}
      {related.length > 0 && (
        <div className="pb-10">
          <div className="flex items-center gap-3 mb-5 px-6 sm:px-10 lg:px-16">
            <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: "#e50914" }} />
            <h2 className="text-white font-black text-lg sm:text-xl tracking-tight">More Like This</h2>
            <div className="flex-1" />
            <button className="text-zinc-500 hover:text-primary text-xs transition-colors flex items-center gap-0.5 font-semibold">
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div
            className="flex gap-4 overflow-x-auto px-6 sm:px-10 lg:px-16 pb-2"
            style={{ scrollbarWidth: "none" } as React.CSSProperties}
          >
            {related.map((r) => (
              <PortraitCard key={r.id} item={r} onClick={() => setLocation(`/movie/${r.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          4. YOU MAY ALSO LIKE
      ══════════════════════════════════════════ */}
      <div className="pb-12">
        <div className="flex items-center gap-3 mb-5 px-6 sm:px-10 lg:px-16">
          <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: "#e50914" }} />
          <h2 className="text-white font-black text-lg sm:text-xl tracking-tight">You May Also Like</h2>
          <div className="flex-1" />
          <button className="text-zinc-500 hover:text-primary text-xs transition-colors flex items-center gap-0.5 font-semibold">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div
          className="flex gap-4 overflow-x-auto px-6 sm:px-10 lg:px-16 pb-2"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}
        >
          {similarContent.map((c) => (
            <LandscapeCard key={c.id} item={c} onClick={() => setLocation(`/movie/${c.id}`)} />
          ))}
        </div>
      </div>

      <PublicFooter />

      <SubscriptionPlansModal 
        isOpen={plansModalOpen} 
        onClose={() => setPlansModalOpen(false)} 
      />

      <style>{`
        body { background: #0c0c14 !important; }
        * { scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
