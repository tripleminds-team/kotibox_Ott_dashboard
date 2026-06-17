
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, Lock, X, Crown, Star, Volume2, VolumeX } from "lucide-react";
import type { ShortDrama, Episode } from "@/data/short-dramas";

function getRanges(totalEpisodes: number): { label: string; start: number; end: number }[] {
  const ranges: { label: string; start: number; end: number }[] = [];
  for (let i = 0; i <= totalEpisodes; i += 50) {
    const end = Math.min(i + 49, totalEpisodes);
    ranges.push({ label: `${i} - ${end}`, start: i, end });
  }
  return ranges;
}

export default function ShortDramaPlayer({
  drama,
  onClose,
}: {
  drama: ShortDrama;
  onClose: () => void;
}) {
  const firstFreeEp = drama.episodes.find((e) => e.number === 1) ?? drama.episodes[0];
  const [currentEp, setCurrentEp] = useState<Episode>(firstFreeEp);
  const [rangeStart, setRangeStart] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockedEpNum, setLockedEpNum] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const ranges = getRanges(drama.totalEpisodes);

  // Episodes visible in current range tab (Trailer counted as 0)
  const displayedEpisodes = drama.episodes.filter((ep) => {
    const n = ep.number === "Trailer" ? 0 : (ep.number as number);
    return n >= rangeStart && n <= rangeStart + 49;
  });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    setPlaying(false);
  }, [currentEp]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleEpClick = (ep: Episode) => {
    if (ep.locked) {
      setLockedEpNum(ep.number as number);
      setShowLockModal(true);
      return;
    }
    setCurrentEp(ep);
    // Switch range tab if needed
    const n = ep.number === "Trailer" ? 0 : (ep.number as number);
    const correctRange = Math.floor(n / 50) * 50;
    if (correctRange !== rangeStart) setRangeStart(correctRange);
  };

  const epNum = (ep: Episode) => ep.number === "Trailer" ? 0 : (ep.number as number);
  const isActive = (ep: Episode) => ep.number === currentEp.number;

  const badgeMap: Record<string, string> = {
    NEW: "bg-emerald-500 text-white",
    HOT: "bg-orange-500 text-white",
    TRENDING: "bg-blue-500 text-white",
    EXCLUSIVE: "bg-purple-600 text-white",
  };

  return (
    <div className="fixed inset-0 z-[500] bg-[#0d0d0d] flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-3 sm:px-5 py-2.5 border-b border-zinc-800/80 bg-[#0d0d0d] flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Drama info */}
        <div className="flex-1 min-w-0 flex items-center gap-2.5">
          <img
            src={drama.poster}
            alt=""
            className="w-8 h-8 rounded-md object-cover flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-sm truncate">{drama.title}</h2>
              {drama.badge && (
                <span className={`hidden sm:inline text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase flex-shrink-0 ${badgeMap[drama.badge]}`}>
                  {drama.badge}
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-[11px] mt-0.5">
              {currentEp.number === "Trailer" ? "Trailer" : `EP ${currentEp.number}`} · {currentEp.duration} · {drama.language}
            </p>
          </div>
        </div>

        {/* Rating */}
        <div className="hidden sm:flex items-center gap-1 text-amber-400 flex-shrink-0">
          <Star className="w-3 h-3 fill-amber-400" />
          <span className="text-xs font-bold">{drama.rating}</span>
        </div>

        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Main: video + episodes ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Portrait video player */}
        <div
          className="flex-shrink-0 flex items-center justify-center bg-black"
          style={{ width: "clamp(150px, 38vw, 340px)", padding: "12px" }}
        >
          <div
            className="relative bg-zinc-900 rounded-2xl overflow-hidden w-full cursor-pointer shadow-2xl shadow-black/60"
            style={{ aspectRatio: "9/16" }}
            onClick={togglePlay}
          >
            <video
              ref={videoRef}
              src={currentEp.videoUrl}
              poster={drama.poster}
              className="w-full h-full object-cover"
              playsInline
              loop
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />

            {/* Play/pause overlay */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                playing ? "opacity-0 hover:opacity-100" : "opacity-100"
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-black/55 backdrop-blur-sm border border-white/25 flex items-center justify-center shadow-xl">
                {playing
                  ? <Pause className="w-6 h-6 text-white fill-white" />
                  : <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                }
              </div>
            </div>

            {/* Top: portrait badge + mute */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
              <span className="text-[9px] bg-purple-600/90 text-white px-2 py-0.5 rounded-full font-black backdrop-blur-sm">
                Portrait 9:16
              </span>
              <button
                className="pointer-events-auto w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors"
                onClick={toggleMute}
              >
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Bottom: episode label */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none">
              <p className="text-white text-xs font-black">
                {currentEp.number === "Trailer" ? "Trailer" : `EP ${currentEp.number}`}
              </p>
              <p className="text-zinc-400 text-[10px] mt-0.5 truncate">{currentEp.title}</p>
            </div>

            {/* Playing indicator dot */}
            {playing && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-red-600/85 text-white text-[9px] font-black px-2 py-[3px] rounded-full pointer-events-none backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </div>
            )}
          </div>
        </div>

        {/* ── Episode selector panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden border-l border-zinc-800/60 bg-[#111]">

          {/* Range tabs row */}
          <div className="flex items-center px-3 sm:px-4 py-2 border-b border-zinc-800/60 flex-shrink-0 gap-1 overflow-x-auto" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
            {ranges.map((r) => (
              <button
                key={r.label}
                onClick={() => setRangeStart(r.start)}
                className={`px-3 py-1.5 text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 border-b-2 ${
                  rangeStart === r.start
                    ? "text-white border-red-600"
                    : "text-zinc-500 border-transparent hover:text-zinc-300"
                }`}
              >
                {r.label}
              </button>
            ))}
            <div className="flex-1 min-w-2" />
            <button className="text-zinc-500 hover:text-white text-xs flex items-center gap-0.5 transition-colors flex-shrink-0">
              All Episodes <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Episode grid */}
          <div
            className="flex-1 overflow-y-auto p-3 sm:p-4"
            style={{ scrollbarWidth: "none" } as React.CSSProperties}
          >
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
              {displayedEpisodes.map((ep) => {
                const active = isActive(ep);
                return (
                  <button
                    key={String(ep.number)}
                    onClick={() => handleEpClick(ep)}
                    className={`relative flex items-center justify-center rounded-lg font-bold transition-all border select-none ${
                      active
                        ? "bg-zinc-600 border-zinc-400 text-white shadow-md"
                        : ep.locked
                          ? "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-700 cursor-pointer"
                          : "bg-zinc-800/80 border-zinc-700/50 text-zinc-300 hover:bg-zinc-700 hover:text-white hover:border-zinc-500 cursor-pointer"
                    }`}
                    style={{ aspectRatio: "1", fontSize: ep.number === "Trailer" ? "9px" : "clamp(10px, 1.5vw, 13px)" }}
                  >
                    {ep.number === "Trailer" ? (
                      <span className="font-black leading-none text-center px-0.5">Trailer</span>
                    ) : (
                      ep.number
                    )}

                    {/* Lock badge */}
                    {ep.locked && (
                      <span className="absolute top-0.5 right-0.5 w-[14px] h-[14px] bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Lock className="w-[7px] h-[7px] text-white" />
                      </span>
                    )}

                    {/* Currently playing bar */}
                    {active && (
                      <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-4 h-[3px] bg-red-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Description card */}
            <div className="mt-4 p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] text-zinc-500">Now Playing</span>
                <span className="text-[11px] text-white font-bold">
                  {currentEp.number === "Trailer" ? "Trailer" : `Episode ${currentEp.number}`}
                </span>
                <span className="text-[11px] text-zinc-600">· {currentEp.duration}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">{drama.description}</p>
              <div className="flex items-center gap-2 mt-2">
                {drama.genres.map((g) => (
                  <span key={g} className="text-[9px] bg-zinc-700/60 text-zinc-400 px-1.5 py-0.5 rounded-sm">{g}</span>
                ))}
              </div>
            </div>

            {/* Free / lock divider */}
            <div className="flex items-center gap-2 mt-3 px-1">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-zinc-600 text-[10px] flex-shrink-0 text-center leading-snug">
                EP 1–{drama.freeEpisodes} FREE · Subscribe to unlock all {drama.totalEpisodes} episodes
              </span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Lock/Subscribe modal ── */}
      {showLockModal && (
        <div className="absolute inset-0 z-20 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowLockModal(false)}
          />
          <div className="relative z-10 bg-zinc-900 border border-zinc-700/80 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-[360px] mx-auto p-6 shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-white font-black text-xl text-center mb-1">Premium Episode</h3>
            <p className="text-zinc-400 text-sm text-center mb-1">
              Episode {lockedEpNum} is locked
            </p>
            <p className="text-zinc-500 text-xs text-center mb-6">
              Subscribe to unlock all {drama.totalEpisodes} episodes of
              <br /><span className="text-white font-semibold">"{drama.title}"</span>
            </p>
            <button className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-xl text-sm mb-2.5 shadow-lg shadow-amber-500/25 transition-all active:scale-95">
              Subscribe Now — Unlock All
            </button>
            <button
              onClick={() => setShowLockModal(false)}
              className="w-full py-2.5 text-zinc-500 hover:text-white text-sm transition-colors rounded-xl hover:bg-white/5"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
