import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  ChevronLeft, ChevronRight, Heart, Star, Share2, Lock,
  Play, Pause, Volume2, VolumeX, Volume1, Maximize, Minimize,
  SkipForward, Home, Loader2, X, CreditCard, Crown,
} from "lucide-react";
import { PublicHeader, PublicFooter } from "./streaming-home";
import Hls from "hls.js";
import { useGetSubscriptionPlans, useCreateSubscription, useGetWebDetail, getImageUrl, useGetPublicAds } from "@/lib/api-client";

/* ─── AD OVERLAY ─── */
function AdOverlay({ ad, onSkip }: { ad: any; onSkip: () => void }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => setCountdown((c) => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; }), 1000);
    return () => clearInterval(timer);
  }, []);

  const adSrc = ad.urlType === "URL" ? ad.mediaUrl : getImageUrl(ad.mediaUrl);

  return (
    <div className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center">
      {ad.adType === "Video" ? (
        <video src={adSrc} className="w-full h-full object-contain" autoPlay onEnded={onSkip} playsInline />
      ) : ad.adType === "Image" ? (
        <a href={ad.redirectUrl || "#"} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center">
          <img src={adSrc} alt={ad.adName} className="max-w-full max-h-full object-contain" />
        </a>
      ) : (
        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: ad.mediaUrl }} />
      )}
      <div className="absolute bottom-4 right-4 flex items-center gap-3">
        <span className="text-zinc-400 text-xs bg-black/60 px-2 py-1 rounded">Advertisement</span>
        {countdown > 0 ? (
          <span className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg font-bold border border-zinc-700">Skip in {countdown}s</span>
        ) : (
          <button onClick={onSkip} className="bg-white/90 hover:bg-white text-black text-xs font-black px-3 py-1.5 rounded-lg transition-colors">Skip Ad ›</button>
        )}
      </div>
    </div>
  );
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

function fmtTime(s: number): string {
  if (!isFinite(s) || isNaN(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

/* ─────────────────────────────────────────────────────────────
   VIDEO PLAYER COMPONENT
   Props:
     videoSrc   — episode video URL (from getEpisodeVideo)
     thumbnail  — poster image shown before play
     autoPlay   — true when navigating from one episode to another
     onNext     — called when user clicks SkipForward / video ends
   ───────────────────────────────────────────────────────────── */
function VideoPlayer({
  videoSrc,
  thumbnail,
  autoPlay = false,
  onNext,
}: {
  videoSrc: string;
  thumbnail: string;
  autoPlay?: boolean;
  onNext?: () => void;
}) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const hideTimerRef  = useRef<ReturnType<typeof setTimeout>>();
  const playingRef    = useRef(false);

  const [playing,        setPlaying]        = useState(false);
  const [currentTime,    setCurrentTime]    = useState(0);
  const [duration,       setDuration]       = useState(0);
  const [volume,         setVolume]         = useState(0.8);
  const [muted,          setMuted]          = useState(false);
  const [buffered,       setBuffered]       = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [loading,        setLoading]        = useState(true);

  /* auto-hide controls */
  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    if (playingRef.current) {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  /* play / pause */
  const togglePlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { await v.play().catch(() => {}); }
    else          { v.pause(); }
    revealControls();
  }, [revealControls]);

  /* seek */
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const t = Number(e.target.value);
    v.currentTime = t;
    setCurrentTime(t);
    revealControls();
  };

  /* volume */
  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = Number(e.target.value);
    v.volume = val;
    v.muted  = val === 0;
    setVolume(val);
    setMuted(val === 0);
    revealControls();
  };

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted || v.volume === 0) {
      v.muted = false;
      if (v.volume === 0) { v.volume = 0.8; setVolume(0.8); }
      setMuted(false);
    } else {
      v.muted = true;
      setMuted(true);
    }
    revealControls();
  }, [revealControls]);

  /* fullscreen */
  const toggleFullscreen = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    if (!document.fullscreenElement) {
      c.requestFullscreen?.()
        .then(() => {
          (screen.orientation as any)?.lock?.('portrait').catch(() => {});
        })
        .catch(() => {});
    } else {
      document.exitFullscreen?.()
        .then(() => {
          (screen.orientation as any)?.unlock?.();
        })
        .catch(() => {});
    }
  }, []);

  /* video element events */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => {
      setPlaying(true);
      playingRef.current = true;
      scheduleHide();
    };
    const onPause = () => {
      setPlaying(false);
      playingRef.current = false;
      clearTimeout(hideTimerRef.current);
      setControlsVisible(true);
    };
    const onEnded = () => {
      setPlaying(false);
      playingRef.current = false;
      clearTimeout(hideTimerRef.current);
      setControlsVisible(true);
      onNext?.();
    };
    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onDuration   = () => { if (isFinite(v.duration)) setDuration(v.duration); };
    const onProgress   = () => {
      if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
    };
    const onWaiting    = () => setLoading(true);
    const onCanPlay    = () => setLoading(false);

    v.addEventListener("play",           onPlay);
    v.addEventListener("pause",          onPause);
    v.addEventListener("ended",          onEnded);
    v.addEventListener("timeupdate",     onTimeUpdate);
    v.addEventListener("durationchange", onDuration);
    v.addEventListener("loadedmetadata", onDuration);
    v.addEventListener("progress",       onProgress);
    v.addEventListener("waiting",        onWaiting);
    v.addEventListener("canplay",        onCanPlay);
    v.addEventListener("playing",        onCanPlay);

    return () => {
      v.removeEventListener("play",           onPlay);
      v.removeEventListener("pause",          onPause);
      v.removeEventListener("ended",          onEnded);
      v.removeEventListener("timeupdate",     onTimeUpdate);
      v.removeEventListener("durationchange", onDuration);
      v.removeEventListener("loadedmetadata", onDuration);
      v.removeEventListener("progress",       onProgress);
      v.removeEventListener("waiting",        onWaiting);
      v.removeEventListener("canplay",        onCanPlay);
      v.removeEventListener("playing",        onCanPlay);
    };
  }, [scheduleHide, onNext]);

  // Load source with HLS support if needed
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoSrc) return;

    let hls: Hls | null = null;
    const isM3u8 = videoSrc.includes('.m3u8');

    setLoading(true);
    if (isM3u8 && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        if (autoPlay) {
          v.play().catch(() => {});
          setPlaying(true);
        }
      });
    } else {
      v.src = videoSrc;
      v.load();
      if (autoPlay) {
        v.play().catch(() => {});
        setPlaying(true);
      }
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [videoSrc, autoPlay]);

  /* set initial volume */
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.volume = volume;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* fullscreen change */
  useEffect(() => {
    const onChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) (screen.orientation as any)?.unlock?.();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const v = videoRef.current;
      if (!v) return;
      switch (e.code) {
        case "Space":
          e.preventDefault(); togglePlay(); break;
        case "ArrowLeft":
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 10);
          setCurrentTime(v.currentTime); revealControls(); break;
        case "ArrowRight":
          e.preventDefault();
          v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
          setCurrentTime(v.currentTime); revealControls(); break;
        case "ArrowUp":
          e.preventDefault();
          v.volume = Math.min(1, parseFloat((v.volume + 0.1).toFixed(2)));
          v.muted = false; setVolume(v.volume); setMuted(false); revealControls(); break;
        case "ArrowDown":
          e.preventDefault();
          v.volume = Math.max(0, parseFloat((v.volume - 0.1).toFixed(2)));
          setVolume(v.volume); setMuted(v.volume === 0); revealControls(); break;
        case "KeyM": toggleMute(); break;
        case "KeyF": toggleFullscreen(); break;
        case "KeyN": onNext?.(); break;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [togglePlay, toggleMute, toggleFullscreen, revealControls, onNext]);

  useEffect(() => () => clearTimeout(hideTimerRef.current), []);

  /* derived */
  const seekPct    = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufPct     = duration > 0 ? (buffered   / duration) * 100 : 0;
  const displayVol = muted ? 0 : volume;
  const VolumeIcon = displayVol === 0 ? VolumeX : displayVol < 0.5 ? Volume1 : Volume2;
  const FsIcon     = isFullscreen ? Minimize : Maximize;
  const ctrlShow   = controlsVisible || !playing;

  return (
    <div
      ref={containerRef}
      className="relative bg-black overflow-hidden w-full h-full select-none"
      onMouseMove={revealControls}
      onMouseLeave={() => {
        if (playingRef.current) {
          clearTimeout(hideTimerRef.current);
          setControlsVisible(false);
        }
      }}
      onTouchStart={revealControls}
    >
      {/* Real video element */}
      <video
        ref={videoRef}
        poster={thumbnail}
        className="absolute inset-0 w-full h-full object-cover"
        preload="metadata"
        playsInline
        onClick={togglePlay}
        style={{ outline: "none" }}
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none z-10" />

      {/* R watermark */}
      <div className="absolute top-3 left-3 w-9 h-9 bg-[#E50914] rounded-lg flex items-center justify-center text-white font-black text-lg z-20 shadow-lg pointer-events-none">
        R
      </div>

      {/* Buffering spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* Center play/pause */}
      {!loading && (
        <button
          onClick={togglePlay}
          className={`absolute inset-0 flex items-center justify-center z-20 transition-opacity duration-300 ${
            ctrlShow ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="w-[68px] h-[68px] rounded-full bg-black/55 border-2 border-white/65 flex items-center justify-center hover:scale-110 hover:bg-black/75 transition-all duration-200">
            {playing
              ? <Pause className="w-7 h-7 text-white fill-white" />
              : <Play  className="w-7 h-7 text-white fill-white ml-1" />
            }
          </div>
        </button>
      )}

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${
          ctrlShow ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Seek bar */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative h-5 flex items-center group/seek cursor-pointer">
            <div className="absolute inset-x-0 h-[3px] bg-white/20 rounded-full pointer-events-none" />
            <div className="absolute h-[3px] bg-white/35 rounded-full pointer-events-none" style={{ width: `${bufPct}%` }} />
            <div className="absolute h-[3px] bg-[#E50914] rounded-full pointer-events-none" style={{ width: `${seekPct}%` }} />
            <div
              className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none -translate-x-1/2"
              style={{ left: `${seekPct}%` }}
            />
            <input
              type="range" min={0} max={duration || 100} step={0.1} value={currentTime}
              onChange={handleSeek} onMouseDown={revealControls}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>
        </div>

        {/* Controls row */}
        <div className="px-2 pb-2.5 flex items-center gap-1">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-zinc-200 p-1 flex-shrink-0">
            {playing
              ? <Pause      className="w-[18px] h-[18px] fill-white" />
              : <Play       className="w-[18px] h-[18px] fill-white ml-px" />
            }
          </button>

          {/* Next episode */}
          <button
            onClick={onNext}
            className="text-white hover:text-white/70 p-1 flex-shrink-0 transition-colors"
            title="Next Episode (N)"
          >
            <SkipForward className="w-[15px] h-[15px]" />
          </button>

          {/* Timestamp */}
          <span className="text-white text-[11px] flex-1 tabular-nums select-none px-1 truncate min-w-0">
            {fmtTime(currentTime)} / {fmtTime(duration)}
          </span>

          {/* Quality */}
          <span className="text-white text-[10px] bg-zinc-800/90 px-1.5 py-px rounded-sm font-bold select-none flex-shrink-0">
            1080P
          </span>

          {/* Volume */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={toggleMute} className="text-white hover:text-zinc-200 p-1" title="Mute (M)">
              <VolumeIcon className="w-[15px] h-[15px]" />
            </button>
            <div className="relative w-14 h-4 flex items-center flex-shrink-0">
              <div className="absolute inset-x-0 h-[3px] bg-white/25 rounded-full pointer-events-none" />
              <div className="absolute h-[3px] bg-[#E50914] rounded-full pointer-events-none transition-all duration-75" style={{ width: `${displayVol * 100}%` }} />
              <div className="absolute w-2.5 h-2.5 bg-white rounded-full shadow pointer-events-none -translate-x-1/2" style={{ left: `${displayVol * 100}%` }} />
              <input
                type="range" min={0} max={1} step={0.02} value={displayVol}
                onChange={handleVolume}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title={`Volume: ${Math.round(displayVol * 100)}%`}
              />
            </div>
          </div>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white hover:text-zinc-200 p-1 flex-shrink-0" title="Fullscreen (F)">
            <FsIcon className="w-[15px] h-[15px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── EPISODE GRID ─────────────────────────────────────────── */
function EpisodeGrid({
  total, freeCount, currentEp, onSelect, onLocked,
}: {
  total: number; freeCount: number; currentEp: number;
  onSelect: (ep: number) => void;
  onLocked?: (ep: number) => void;
}) {
  const tabs: Array<{ label: string; start: number; end: number }> = [];
  for (let s = 0; s < total; s += 50) {
    tabs.push({ label: `${s} - ${Math.min(s + 49, total)}`, start: s, end: Math.min(s + 49, total) });
  }

  const defaultTab = currentEp <= 0 ? 0 : Math.floor((currentEp - 1) / 50);
  const [activeTab, setActiveTab] = useState(Math.min(defaultTab, tabs.length - 1));
  const tab = tabs[activeTab] ?? tabs[0];

  if (!tab) return null;

  const cells: Array<{ n: number; isTrailer: boolean }> = [];
  if (tab.start === 0) cells.push({ n: 0, isTrailer: true });
  for (let i = Math.max(1, tab.start); i <= tab.end; i++) cells.push({ n: i, isTrailer: false });

  return (
    <div>
      <div className="flex items-center gap-0 mb-3 border-b border-zinc-800">
        {tabs.map((t, i) => (
          <button
            key={t.label} onClick={() => setActiveTab(i)}
            className={[
              "text-xs sm:text-sm font-semibold px-3 py-2.5 border-b-2 -mb-px transition-colors whitespace-nowrap",
              activeTab === i ? "text-[#E50914] border-[#E50914]" : "text-zinc-500 border-transparent hover:text-zinc-300",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button className="flex items-center gap-0.5 text-zinc-500 hover:text-white text-[11px] px-2 transition-colors whitespace-nowrap">
          All Episodes <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div
        className="grid gap-1.5 max-h-[320px] overflow-y-auto pb-2"
        style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))", scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" } as React.CSSProperties}
      >
        {cells.map(({ n, isTrailer }) => {
          const isLocked = !isTrailer && n > freeCount;
          const isActive = n === currentEp;
          return (
            <button
              key={n}
              onClick={() => isLocked ? onLocked?.(n) : onSelect(n)}
              title={isLocked ? "Unlock to watch" : isTrailer ? "Watch Trailer" : `Episode ${n}`}
              className={[
                "relative h-11 flex items-center justify-center text-xs font-bold rounded-sm transition-all select-none",
                isActive  ? "bg-[#E50914] text-white shadow-[0_0_12px_rgba(229,9,20,0.4)]"
                : isLocked ? "bg-zinc-900 text-zinc-600 cursor-pointer hover:bg-zinc-800"
                           : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white",
              ].join(" ")}
            >
              {isTrailer ? <span className="text-[9px] font-black leading-tight text-center px-0.5">Trailer</span> : n}

              {isLocked && (
                <span className="absolute top-0.5 right-0.5 w-[14px] h-[14px] bg-[#E50914] rounded-full flex items-center justify-center">
                  <Lock className="w-[7px] h-[7px] text-white" strokeWidth={3} />
                </span>
              )}

              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-[2px] items-end">
                  {[4, 6, 4].map((h, i) => (
                    <span key={i} className="w-[3px] bg-white/80 rounded-full" style={{ height: `${h}px` }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LOCK / PAYWALL POPUP
   ───────────────────────────────────────────────────────────── */

function LockPopup({ episodeNum, onClose, onSubscribed }: { episodeNum: number; onClose: () => void; onSubscribed: () => void }) {
  const { data: plansData, isLoading: loadingPlans } = useGetSubscriptionPlans();
  const createSubMutation = useCreateSubscription();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (e) {}
  }, []);

  const plans = plansData?.data || [];

  const handleSubscribe = async (plan: any) => {
    if (!user) {
      alert("Please login first to subscribe.");
      window.location.href = "/login";
      return;
    }
    try {
      await createSubMutation.mutateAsync({
        userId: user.id || user._id,
        planId: plan.id || plan._id,
        startDate: new Date(),
        price: plan.price || plan.totalPrice,
        totalAmount: plan.totalPrice || plan.price,
        paymentMethod: 'Credit Card',
        status: 'active'
      });

      const updatedUser = {
        ...user,
        subscriptionPlan: plan.name,
        subscriptionStatus: 'active'
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      alert(`Successfully subscribed to ${plan.name}! Content unlocked.`);
      onSubscribed();
      onClose();
    } catch (err: any) {
      alert("Subscription failed: " + err.message);
    }
  };

  /* prevent body scroll while open */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative z-10 bg-[#111111] w-full sm:max-w-[500px] sm:mx-4 rounded-t-2xl sm:rounded-2xl overflow-hidden border border-zinc-800 animate-in slide-in-from-bottom duration-300"
        style={{ maxHeight: "90vh", overflowY: "auto" } as React.CSSProperties}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 sticky top-0 bg-[#111111] z-10">
          <span className="text-white font-extrabold text-sm flex items-center gap-1.5">
            <Crown className="w-4 h-4 text-amber-500 fill-amber-500" /> Choose Subscription Plan
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-zinc-450 text-xs text-center leading-relaxed">
            Episode {episodeNum} is locked. Subscribe to one of our premium plans to unlock the entire library!
          </p>

          {loadingPlans ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan: any) => {
                if (plan.name === "free") return null;
                return (
                  <div
                    key={plan.id}
                    className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:border-amber-500/50 hover:bg-zinc-900/80 transition-all flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-amber-400 font-bold text-sm uppercase tracking-wide">{plan.name}</h4>
                        <p className="text-zinc-500 text-[11px] mt-0.5">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-black text-lg">₹{plan.totalPrice || plan.price}</span>
                        <span className="text-zinc-400 text-[10px] block">/ {plan.duration || 'month'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400">
                      <span>Valid: <strong className="text-white">{plan.durationValue} {plan.duration}</strong></span>
                      {plan.discount > 0 && <span className="text-amber-400 font-bold">{plan.discount}% off</span>}
                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={createSubMutation.isPending}
                        className="px-4 py-1.5 bg-primary hover:bg-primary/90 disabled:bg-zinc-800 text-white font-bold rounded-lg transition-colors text-xs"
                      >
                        {createSubMutation.isPending ? "Connecting..." : "Subscribe"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────── */
export default function EpisodeDetailPage() {
  const params = useParams<{ showTitle: string; epNum: string }>();
  const [, navigate] = useLocation();

  const [user, setUser] = useState<any>(null);
  const [adDismissed, setAdDismissed] = useState(false);
  const [playerStarted, setPlayerStarted] = useState(false);

  const { data: adsData } = useGetPublicAds({ placement: "Player" });
  const activeAds: any[] = adsData?.data || [];
  const currentAd = !adDismissed && playerStarted && activeAds.length > 0 ? activeAds[0] : null;

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (e) {}
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    setUser(null);
    window.location.reload();
  };

  // params.showTitle is the content ID (drama's _id / id from DB)
  const contentId = params.showTitle || "";

  const { data: detailData, isLoading } = useGetWebDetail(contentId);
  const showData = (detailData as any)?.content || detailData;
  const apiEpisodes: any[] = (detailData as any)?.episodes || [];

  const title = showData?.title || "Drama";

  const totalEps = apiEpisodes.length;
  const freeEps = apiEpisodes.filter((e: any) => e.isFree === true).length || Math.min(2, totalEps);

  const thumbUrl = showData
    ? getImageUrl(showData.bannerImage || showData.thumbnail || showData.poster || "")
    : "";

  const detail = {
    genre: Array.isArray(showData?.genres) ? showData.genres.join(" · ") : "Drama",
    tags: Array.isArray(showData?.genres) ? showData.genres as string[] : [] as string[],
    description: showData?.description || "",
    likes: showData?.views || 0,
    favorites: 0,
    totalEpisodes: totalEps,
    freeEpisodes: freeEps,
    thumbnail: thumbUrl,
    rating: showData?.imdbRating ? String(showData.imdbRating) : "8.5",
  };

  const handleSubscribed = useCallback(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (e) {}
  }, []);

  const [currentEp, setCurrentEp]       = useState(() => parseInt(params.epNum || "1", 10));
  const [autoPlay,  setAutoPlay]        = useState(false);
  const [liked,     setLiked]           = useState(false);
  const [starred,   setStarred]         = useState(false);
  const [expanded,  setExpanded]        = useState(false);
  const [lockPopupOpen, setLockPopupOpen] = useState(false);
  const [lockedEpNum,   setLockedEpNum]   = useState(0);

  const isSubscribed = user?.subscriptionStatus === 'active' && user?.subscriptionPlan !== 'free';

  const goToEpisode = useCallback((ep: number) => {
    if (ep < 0 || ep > detail.totalEpisodes) return;
    if (!isSubscribed && ep > detail.freeEpisodes && ep !== 0) {
      setLockedEpNum(ep);
      setLockPopupOpen(true);
      return;
    }
    setCurrentEp(ep);
    setAutoPlay(true);
    navigate(`/show/${contentId}/episode/${ep}`);
  }, [contentId, detail.totalEpisodes, detail.freeEpisodes, navigate, isSubscribed]);

  const handleNext = useCallback(() => {
    const next = currentEp + 1;
    if (next <= detail.totalEpisodes) {
      goToEpisode(next);
    }
  }, [currentEp, detail.totalEpisodes, goToEpisode]);

  const handleLocked = useCallback((ep: number) => {
    setLockedEpNum(ep);
    setLockPopupOpen(true);
  }, []);

  const epLabel   = currentEp === 0 ? "Trailer" : `Episode ${currentEp}`;
  const epTitle   = currentEp === 0 ? `Trailer - ${title}` : `Episode ${currentEp} - ${title}`;
  const plotTitle = currentEp === 0 ? "About Trailer" : `Plot of Episode ${currentEp}`;

  const videoSrc = (() => {
    if (currentEp === 0) return showData?.trailerUrl || "";
    const ep = apiEpisodes.find(
      (e: any) => e.episode === currentEp || e.episodeNumber === currentEp || e.number === currentEp
    );
    // Fall back to content-level hlsUrl when episode record doesn't exist yet
    return ep?.videoUrl || ep?.hlsUrl || (currentEp === 1 ? (showData?.hlsUrl || showData?.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4") : "");
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#E50914] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <PublicHeader
        activeTab="drama"
        setActiveTab={(tab) => {
          if (tab === "home") navigate("/");
          else if (tab === "tvshows") navigate("/tv-shows-browse");
          else navigate(`/browse/${tab}`);
        }}
        onSignIn={() => navigate("/login")}
        onSignOut={handleSignOut}
        user={user}
      />

      <main className="pt-[68px] pb-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">

            {/* LEFT: back btn + portrait player */}
            <div className="flex items-start gap-3 lg:sticky lg:top-[80px] w-full lg:w-auto flex-shrink-0">
              <button
                onClick={() => window.history.back()}
                className="mt-2 flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500 transition-colors shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Portrait video wrapper — key changes on episode change → remount */}
              <div
                key={`${title}-ep-${currentEp}`}
                className="relative overflow-hidden rounded-sm shadow-2xl w-full lg:w-auto"
                style={{ height: "min(calc(100vh - 110px), 720px)", aspectRatio: "9 / 16" }}
                onClick={() => !playerStarted && setPlayerStarted(true)}
              >
                <VideoPlayer
                  videoSrc={videoSrc}
                  thumbnail={detail.thumbnail}
                  autoPlay={autoPlay}
                  onNext={() => { setAdDismissed(false); setPlayerStarted(false); handleNext(); }}
                />
                {currentAd && <AdOverlay ad={currentAd} onSkip={() => setAdDismissed(true)} />}
              </div>
            </div>

            {/* RIGHT: info + episodes */}
            <div
              className="flex-1 min-w-0 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" } as React.CSSProperties}
            >
              {/* Breadcrumb */}
              <nav className="flex items-center flex-wrap gap-1 text-xs text-zinc-500 mb-3 select-none">
                <button onClick={() => navigate("/")} className="flex items-center gap-1 hover:text-white transition-colors">
                  <Home className="w-3.5 h-3.5" /> Home
                </button>
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
                <button onClick={() => window.history.back()} className="hover:text-white transition-colors truncate max-w-[180px]">
                  {title}
                </button>
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
                <span className="text-zinc-400">{epLabel}</span>
              </nav>

              {/* Title */}
              <h1 className="text-white font-bold text-lg sm:text-xl lg:text-[22px] leading-snug mb-4">
                {epTitle}
              </h1>

              {/* Plot */}
              <div className="mb-5">
                <h2 className="text-white font-semibold text-[15px] mb-2">{plotTitle}</h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {expanded ? detail.description : `${detail.description.slice(0, 130)}...`}
                  {" "}
                  <button
                    onClick={() => setExpanded(e => !e)}
                    className="text-[#E50914] hover:text-primary font-semibold transition-colors"
                  >
                    {expanded ? "Less" : "More"}
                  </button>
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {detail.tags.map(tag => (
                  <button key={tag} className="px-3 py-1.5 text-xs rounded-full border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all">
                    {tag}
                  </button>
                ))}
              </div>

              <div className="border-t border-zinc-800 mb-4" />

              {/* Like / Star / Share */}
              <div className="flex items-center mb-5">
                <button
                  onClick={() => setLiked(l => !l)}
                  className={`flex flex-col items-center gap-1 px-6 sm:px-8 py-2 transition-colors ${liked ? "text-[#E50914]" : "text-zinc-400 hover:text-white"}`}
                >
                  <Heart className={`w-6 h-6 ${liked ? "fill-[#E50914]" : ""}`} />
                  <span className="text-xs font-medium tabular-nums">{fmtCount(detail.likes + (liked ? 1 : 0))}</span>
                </button>

                <button
                  onClick={() => setStarred(s => !s)}
                  className={`flex flex-col items-center gap-1 px-6 sm:px-8 py-2 transition-colors ${starred ? "text-amber-400" : "text-zinc-400 hover:text-white"}`}
                >
                  <Star className={`w-6 h-6 ${starred ? "fill-amber-400" : ""}`} />
                  <span className="text-xs font-medium tabular-nums">{fmtCount(detail.favorites + (starred ? 1 : 0))}</span>
                </button>

                <button className="flex flex-col items-center gap-1 px-6 sm:px-8 py-2 text-zinc-400 hover:text-white transition-colors">
                  <Share2 className="w-6 h-6" />
                  <span className="text-xs font-medium">Share</span>
                </button>
              </div>

              <div className="border-t border-zinc-800 mb-4" />

              {/* Episode grid */}
              <EpisodeGrid
                total={detail.totalEpisodes}
                freeCount={isSubscribed ? detail.totalEpisodes : detail.freeEpisodes}
                currentEp={currentEp}
                onSelect={goToEpisode}
                onLocked={handleLocked}
              />
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />

      {lockPopupOpen && (
        <LockPopup
          episodeNum={lockedEpNum}
          onClose={() => setLockPopupOpen(false)}
          onSubscribed={handleSubscribed}
        />
      )}
    </div>
  );
}
