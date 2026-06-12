import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  ChevronLeft, ChevronRight, Heart, Star, Share2, Lock,
  Play, Pause, Volume2, VolumeX, Volume1, Maximize, Minimize,
  SkipForward, Home, Loader2, X, CreditCard,
} from "lucide-react";
import { PublicHeader, PublicFooter } from "./streaming-home";

/* ─────────────────────────────────────────────────────────────
   DEMO VIDEO URL
   API integration ke baad: getEpisodeVideo() mein API call add karo
   ───────────────────────────────────────────────────────────── */
const DEMO_VIDEO_URL = "https://cdn.pixabay.com/video/2023/11/19/189692-886572510_large.mp4";

/**
 * API-ready function — abhi demo URL return karta hai.
 * API integrate karne pe sirf yahan replace karo:
 *   const res = await fetch(`/api/shows/${showTitle}/episodes/${epNum}`);
 *   return res.json().videoUrl;
 */
function getEpisodeVideo(_showTitle: string, _epNum: number): string {
  return DEMO_VIDEO_URL;
}

/* ─── POSTERS ───────────────────────────────────────────────── */
const POSTERS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1510771463146-e89e6e86560e?w=600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1496440737103-cd596325d314?w=600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1474978528675-4a50a8716a53?w=600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=900&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=900&fit=crop&q=80",
];

/* ─── DATA HELPERS ──────────────────────────────────────────── */
const TAG_MAP: Record<string, string[]> = {
  Romance:  ["Independent Woman", "Strong-Willed", "Hidden Identity", "Love After Marriage", "Business", "Enemies to Lovers"],
  Drama:    ["Family Secrets", "Betrayal", "Second Chances", "Social Class", "Forbidden Love", "Job Seeker"],
  Thriller: ["Dark Past", "Power Struggle", "Dangerous Man", "Hidden Truth", "Obsession", "Escape"],
  Action:   ["Crime World", "Undercover Agent", "Dark Syndicate", "Loyalty", "Power", "Dangerous"],
  Mystery:  ["Cold Case", "Hidden Identity", "Psychological", "Unreliable Narrator", "Twist Ending", "Suspense"],
  Suspense: ["Hidden Enemy", "Cat & Mouse", "High Stakes", "Danger", "Psychological Thriller", "Tension"],
};

const DESCS = [
  "She never expected to fall for him — but fate had other plans. Now caught between loyalty and love, she must choose before it's too late.",
  "A ruthless billionaire with a dark past. A woman who refuses to be silenced. When their worlds collide, nothing will ever be the same.",
  "He came back for revenge, but found love instead. Now every choice he makes ripples out in ways he never saw coming.",
  "Married by contract, bound by fate. What started as a cold arrangement slowly becomes the most passionate story of their lives.",
  "Harrison had deliberately gone to prison to gather the evidence he needed to take back everything that's owed to him. Nothing will stop him now.",
  "She was just his personal secretary. He was her entire world — until the truth finally came out and everything fell apart in an instant.",
  "Two strangers, one dangerous secret. When she stumbles into his world, there's no going back for either of them.",
  "He never wanted a wife. She never wanted a captor. But when destiny writes their story, even the coldest hearts can slowly melt.",
];

function hashStr(s: string): number {
  return Math.abs(s.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
}

function buildShowDetail(title: string) {
  const h = hashStr(title);
  const genres = ["Romance", "Drama", "Thriller", "Action", "Mystery", "Suspense"] as const;
  const genre = genres[h % genres.length];
  return {
    genre,
    tags: TAG_MAP[genre],
    description: DESCS[h % DESCS.length],
    likes: 1000 + (h % 8500),
    favorites: 12000 + (h % 130000),
    totalEpisodes: [49, 60, 80, 117, 50, 72][h % 6],
    freeEpisodes: 11,
    thumbnail: POSTERS[h % POSTERS.length],
  };
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
  const [loading,        setLoading]        = useState(false);

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

  /* auto-play when episode changes (user clicked next/episode grid) */
  useEffect(() => {
    if (autoPlay) {
      videoRef.current?.play().catch(() => {});
    }
  // runs once on mount — autoPlay is stable per key-remount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        src={videoSrc}
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
const COIN_PACKS = [
  { coins: 1150, bonus: "+15%", immediate: 1000, free: 150,  price: "$9.99"  },
  { coins: 550,  bonus: "+10%", immediate: 500,  free: 50,   price: "$4.99"  },
  { coins: 100,  bonus: null,   immediate: 100,  free: null, price: "$0.99"  },
  { coins: 3000, bonus: "+50%", immediate: 2000, free: 1000, price: "$19.99" },
  { coins: 5250, bonus: "+75%", immediate: 3000, free: 2250, price: "$29.99" },
  { coins: 10000,bonus: "+100%",immediate: 5000, free: 5000, price: "$49.99" },
];

function LockPopup({ episodeNum, onClose }: { episodeNum: number; onClose: () => void }) {
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
        className="relative z-10 bg-[#111111] w-full sm:max-w-[680px] sm:mx-4 rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ maxHeight: "90vh", overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#3f3f46 transparent" } as React.CSSProperties}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 sticky top-0 bg-[#111111] z-10">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-lg leading-none">🪙</span>
              <span className="text-zinc-400 text-[13px]">Price:</span>
              <span className="text-white font-bold">9</span>
            </span>
            <div className="w-px h-4 bg-zinc-700" />
            <span className="flex items-center gap-1.5">
              <span className="text-lg leading-none">🪙</span>
              <span className="text-zinc-400 text-[13px]">Balance:</span>
              <span className="text-white font-bold">0</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* VIP plans */}
          <div>
            <h3 className="text-white font-bold text-[15px] leading-tight">VIP Unlock all series for free</h3>
            <p className="text-zinc-500 text-xs mt-0.5 mb-3">Auto renew. Cancel anytime.</p>
            <div className="grid grid-cols-2 gap-3">
              {(["Weekly VIP", "Yearly VIP"] as const).map((plan) => (
                <button
                  key={plan}
                  className="text-left bg-gradient-to-br from-[#2a1f00] to-[#1c1400] border border-amber-700/50 hover:border-amber-500/80 rounded-xl p-4 transition-all"
                >
                  <p className="text-amber-300 font-semibold text-sm mb-1">{plan}</p>
                  <p className="text-white font-black text-[26px] leading-none mb-1">
                    {plan === "Weekly VIP" ? "$5.99" : "$99.99"}
                  </p>
                  <p className="text-zinc-500 text-[11px] mb-3">Auto-renew. Cancel anytime.</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[12px] text-zinc-300">
                      <span className="w-4 h-4 rounded-full border border-amber-500/60 flex items-center justify-center flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      </span>
                      Unlimited Viewing
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-zinc-300">
                      <span className="w-4 h-4 rounded-sm border border-amber-500/60 flex items-center justify-center flex-shrink-0 text-amber-400 text-[8px] font-black">
                        HD
                      </span>
                      1080p High Quality
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Coin packs */}
          <div>
            <h3 className="text-white font-bold text-[15px] mb-3">Top up coins</h3>
            <div className="grid grid-cols-2 gap-2">
              {COIN_PACKS.map((pack) => (
                <button
                  key={pack.coins}
                  className="relative bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl p-3 text-left transition-all"
                >
                  {pack.bonus && (
                    <span className="absolute -top-2 right-2 bg-[#E50914] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full z-10">
                      {pack.bonus}
                    </span>
                  )}
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-base leading-none">🪙</span>
                    <span className="text-white font-black text-base">{pack.coins.toLocaleString()}</span>
                  </div>
                  <p className="text-zinc-500 text-[11px] leading-snug">
                    Immediately: {pack.immediate.toLocaleString()}
                  </p>
                  {pack.free != null && (
                    <p className="text-zinc-500 text-[11px]">Free: {pack.free.toLocaleString()}</p>
                  )}
                  <p className="text-white font-bold text-sm mt-1.5">{pack.price}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-center mt-3">
              <button className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm transition-colors">
                More Plan <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Payment methods */}
          <div className="pb-safe-area-inset-bottom">
            <h3 className="text-white font-bold text-[15px] mb-3">Payment Methods</h3>
            <div className="grid grid-cols-3 gap-2">
              <button className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl py-3 px-2 text-[13px] text-white font-semibold transition-colors flex items-center justify-center gap-1.5">
                <CreditCard className="w-4 h-4" /> Quick Pay
              </button>
              <button className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl py-3 px-2 text-[13px] text-white font-semibold transition-colors flex items-center justify-center gap-1">
                <span className="font-black text-[#4285F4]">G</span>
                <span className="font-black text-[#EA4335]">o</span>
                <span className="font-black text-[#FBBC05]">o</span>
                <span className="font-black text-[#4285F4]">g</span>
                <span className="text-zinc-300 font-normal ml-0.5">Pay</span>
              </button>
              <button className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl py-3 px-2 text-[13px] font-black text-[#009cde] transition-colors">
                Pay<span className="text-[#003087]">Pal</span>
              </button>
            </div>
          </div>
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

  const title     = decodeURIComponent(params.showTitle || "Unknown Show");
  const detail    = buildShowDetail(title);

  const [currentEp, setCurrentEp]       = useState(() => parseInt(params.epNum || "1", 10));
  // autoPlay = true when user manually navigated (not initial page load)
  const [autoPlay,  setAutoPlay]        = useState(false);
  const [liked,     setLiked]           = useState(false);
  const [starred,   setStarred]         = useState(false);
  const [expanded,  setExpanded]        = useState(false);
  const [lockPopupOpen, setLockPopupOpen] = useState(false);
  const [lockedEpNum,   setLockedEpNum]   = useState(0);

  /* navigate to a specific episode */
  const goToEpisode = useCallback((ep: number) => {
    if (ep < 0 || ep > detail.totalEpisodes) return;
    if (ep > detail.freeEpisodes && ep !== 0) return; // locked
    setCurrentEp(ep);
    setAutoPlay(true);
    navigate(`/show/${encodeURIComponent(title)}/episode/${ep}`);
  }, [title, detail.totalEpisodes, detail.freeEpisodes, navigate]);

  /* next episode */
  const handleNext = useCallback(() => {
    const next = currentEp + 1;
    if (next <= detail.freeEpisodes) {
      goToEpisode(next);
    } else if (next <= detail.totalEpisodes) {
      setLockedEpNum(next);
      setLockPopupOpen(true);
    }
  }, [currentEp, detail.freeEpisodes, detail.totalEpisodes, goToEpisode]);

  /* locked episode clicked in grid */
  const handleLocked = useCallback((ep: number) => {
    setLockedEpNum(ep);
    setLockPopupOpen(true);
  }, []);

  const epLabel  = currentEp === 0 ? "Trailer" : `Episode ${currentEp}`;
  const epTitle  = currentEp === 0 ? `Trailer - ${title}` : `Episode ${currentEp} - ${title} Full Movie`;
  const plotTitle = currentEp === 0 ? "About Trailer" : `Plot of Episode ${currentEp}`;

  /*
   * key={`${title}-ep-${currentEp}`} forces VideoPlayer to fully remount
   * when the episode changes, resetting all player state and loading new video.
   * When API is integrated: getEpisodeVideo() will return the real video URL per episode.
   */
  const videoSrc = getEpisodeVideo(title, currentEp);

  return (
    <div className="min-h-screen bg-black">
      <PublicHeader />

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
                className="overflow-hidden rounded-sm shadow-2xl w-full lg:w-auto"
                style={{ height: "min(calc(100vh - 110px), 720px)", aspectRatio: "9 / 16" }}
              >
                <VideoPlayer
                  videoSrc={videoSrc}
                  thumbnail={detail.thumbnail}
                  autoPlay={autoPlay}
                  onNext={handleNext}
                />
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
                <button onClick={() => navigate("/")} className="hover:text-white transition-colors truncate max-w-[180px]">
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
                    className="text-[#E50914] hover:text-red-400 font-semibold transition-colors"
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
                freeCount={detail.freeEpisodes}
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
        />
      )}
    </div>
  );
}
