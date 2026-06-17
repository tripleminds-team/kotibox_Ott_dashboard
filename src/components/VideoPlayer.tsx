
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, X, Smartphone, Monitor,
  RotateCcw, RotateCw, ChevronRight,
} from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  defaultOrientation?: "landscape" | "portrait";
}

function formatTime(sec: number): string {
  if (!isFinite(sec)) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function VideoPlayer({
  src,
  poster,
  title,
  subtitle,
  onClose,
  defaultOrientation = "landscape",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const seekRef = useRef<HTMLInputElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">(defaultOrientation);
  const [showSkipAnim, setShowSkipAnim] = useState<"left" | "right" | null>(null);

  const resetHideTimer = useCallback(() => {
    clearTimeout(hideTimer.current);
    setShowControls(true);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
    resetHideTimer();
  }, [resetHideTimer]);

  const skip = useCallback((sec: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + sec));
    setShowSkipAnim(sec > 0 ? "right" : "left");
    setTimeout(() => setShowSkipAnim(null), 700);
    resetHideTimer();
  }, [resetHideTimer]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "f": toggleFullscreen(); break;
        case "m": toggleMute(); break;
        case "ArrowRight": skip(10); break;
        case "ArrowLeft": skip(-10); break;
        case "ArrowUp": e.preventDefault(); changeVolume(Math.min(1, volume + 0.1)); break;
        case "ArrowDown": e.preventDefault(); changeVolume(Math.max(0, volume - 0.1)); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, skip, volume]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const changeVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    if (val === 0) { v.muted = true; setMuted(true); }
    else { v.muted = false; setMuted(false); }
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const val = parseFloat(e.target.value);
    v.currentTime = (val / 100) * duration;
    setProgress(val);
    resetHideTimer();
  };

  const changeSpeed = (s: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeed(s);
    setShowSettings(false);
  };

  const aspectRatio = orientation === "landscape" ? "16/9" : "9/16";
  const maxWidth = orientation === "landscape" ? "min(100vw, 960px)" : "min(100vw, 360px)";

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        ref={containerRef}
        className="relative bg-black overflow-hidden shadow-2xl"
        style={{ width: maxWidth, aspectRatio, maxHeight: "100vh" }}
        onMouseMove={resetHideTimer}
        onClick={(e) => { if (e.currentTarget === e.target) togglePlay(); }}
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-contain"
          onLoadedMetadata={() => {
            setDuration(videoRef.current?.duration || 0);
            setLoading(false);
          }}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (!v) return;
            setCurrentTime(v.currentTime);
            setProgress(duration ? (v.currentTime / duration) * 100 : 0);
          }}
          onWaiting={() => setLoading(true)}
          onCanPlay={() => setLoading(false)}
          onEnded={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={togglePlay}
        />

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full border-4 border-white/20 border-t-white animate-spin" />
          </div>
        )}

        {/* Skip Animation */}
        {showSkipAnim && (
          <div className={`absolute inset-y-0 flex items-center justify-center pointer-events-none ${showSkipAnim === "right" ? "right-12 left-auto" : "left-12 right-auto"}`}>
            <div className="flex flex-col items-center gap-1 animate-fade-out">
              <div className="flex">
                {showSkipAnim === "right"
                  ? [0,1,2].map(i => <ChevronRight key={i} className={`w-8 h-8 text-white ${i === 2 ? "opacity-100" : i === 1 ? "opacity-60" : "opacity-30"}`} />)
                  : [2,1,0].map(i => <ChevronRight key={i} className={`w-8 h-8 text-white rotate-180 ${i === 0 ? "opacity-100" : i === 1 ? "opacity-60" : "opacity-30"}`} />)
                }
              </div>
              <span className="text-white text-xs font-medium">{showSkipAnim === "right" ? "+10s" : "-10s"}</span>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div
          className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${showControls || !playing ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 25%, transparent 65%, rgba(0,0,0,0.9) 100%)" }}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 pt-4">
            <div className="flex-1 min-w-0">
              {title && <p className="text-white font-bold text-base truncate drop-shadow">{title}</p>}
              {subtitle && <p className="text-white/70 text-xs truncate">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors ml-3 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Play Button */}
          <div className="flex items-center justify-center gap-10 pointer-events-none select-none">
            <button
              className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
              onClick={(e) => { e.stopPropagation(); skip(-10); }}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              className="pointer-events-auto w-16 h-16 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-black transition-all active:scale-90 shadow-2xl"
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            >
              {playing ? <Pause className="w-7 h-7 fill-black" /> : <Play className="w-7 h-7 fill-black ml-1" />}
            </button>
            <button
              className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
              onClick={(e) => { e.stopPropagation(); skip(10); }}
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="px-4 pb-4 space-y-2">
            {/* Seek Bar */}
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-xs font-mono w-12 flex-shrink-0 text-right">{formatTime(currentTime)}</span>
              <div className="relative flex-1 h-1 group/seek">
                <input
                  ref={seekRef}
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={handleSeekChange}
                  className="w-full h-1 appearance-none cursor-pointer rounded-full bg-transparent"
                  style={{
                    background: `linear-gradient(to right, #E50914 0%, #E50914 ${progress}%, rgba(255,255,255,0.3) ${progress}%, rgba(255,255,255,0.3) 100%)`
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <span className="text-white/80 text-xs font-mono w-12 flex-shrink-0">{formatTime(duration)}</span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  className="text-white hover:text-white/80 transition-colors"
                >
                  {playing ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); skip(-10); }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); skip(10); }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2 group/vol" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={toggleMute}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={(e) => changeVolume(parseFloat(e.target.value))}
                    className="w-16 h-1 hidden sm:block appearance-none cursor-pointer rounded-full"
                    style={{
                      background: `linear-gradient(to right, white 0%, white ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) 100%)`
                    }}
                  />
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2 relative" onClick={(e) => e.stopPropagation()}>
                {/* Orientation Toggle */}
                <button
                  onClick={() => setOrientation(o => o === "landscape" ? "portrait" : "landscape")}
                  className="text-white/80 hover:text-white transition-colors p-1"
                  title={orientation === "landscape" ? "Switch to Portrait" : "Switch to Landscape"}
                >
                  {orientation === "landscape" ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                </button>

                {/* Speed */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-white/80 hover:text-white transition-colors p-1 text-xs font-bold"
                  >
                    {speed}x
                  </button>
                  {showSettings && (
                    <div className="absolute bottom-8 right-0 bg-zinc-900/95 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl min-w-[120px]">
                      <p className="text-zinc-500 text-[10px] uppercase tracking-widest px-3 pt-2 pb-1 font-semibold">Speed</p>
                      {SPEEDS.map((s) => (
                        <button
                          key={s}
                          onClick={() => changeSpeed(s)}
                          className={`w-full px-4 py-2 text-sm text-left transition-colors hover:bg-white/10 ${speed === s ? "text-red-400 font-bold" : "text-white"}`}
                        >
                          {s === 1 ? "Normal" : `${s}x`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { document.pictureInPictureElement ? document.exitPictureInPicture() : videoRef.current?.requestPictureInPicture?.().catch(() => {}); }}
                  className="text-white/80 hover:text-white transition-colors p-1 hidden sm:block"
                  title="Picture in Picture"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="text-white/80 hover:text-white transition-colors p-1"
                >
                  {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orientation label */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${orientation === "portrait" ? "bg-purple-600/80 text-white" : "bg-blue-600/80 text-white"}`}>
            {orientation === "portrait" ? "Portrait 9:16" : "Landscape 16:9"}
          </span>
        </div>
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          transition: transform 0.1s;
        }
        input[type=range]:hover::-webkit-slider-thumb { transform: scale(1.3); }
        input[type=range]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
        }
        @keyframes fade-out { 0%{opacity:1;transform:scale(1)} 80%{opacity:1;transform:scale(1.1)} 100%{opacity:0;transform:scale(0.9)} }
        .animate-fade-out { animation: fade-out 0.7s ease forwards; }
      `}</style>
    </div>
  );
}
