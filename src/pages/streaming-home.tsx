
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Play, Pause, Search, ChevronLeft, ChevronRight, X, Download, History,
  ChevronDown, User, Star, Plus, Info, ExternalLink, Film, Tv,
  TrendingUp, Flame, Sparkles, Smartphone, Maximize, Lock, Crown, Bell,
} from "lucide-react";
import {
  movies, tvShows, heroContent, trendingNow, newReleases, topRated,
  actionMovies, dramaShows, allGenres, type ContentItem,
  DEMO_VIDEO_1, DEMO_VIDEO_2, DEMO_VIDEO_3, DEMO_VIDEO_4, DEMO_VIDEO_5,
} from "@/data/movies";
import ShortDramaPlayer from "@/components/ShortDramaPlayer";
import { shortDramas, featuredDramas, newDramas, type ShortDrama } from "@/data/short-dramas";

type Tab = "home" | "movies" | "tvshows" | "drama" | "new";

const HOTSTAR_BLUE = "#1a77ff";

/* ─── IMDb BADGE ─── */
function ImdbBadge({ rating }: { rating: string }) {
  return (
    <span className="flex items-center gap-1 bg-amber-400/15 border border-amber-400/40 text-amber-400 text-[11px] font-bold px-2 py-0.5 rounded">
      <Star className="w-2.5 h-2.5 fill-amber-400" />
      {rating}
    </span>
  );
}

/* ─── PREMIUM / FREE BADGE ─── */
function PremiumBadge() {
  return (
    <span className="flex items-center gap-1 bg-[#f5a623] text-black text-[9px] font-black px-2 py-[2px] rounded-sm uppercase tracking-wide">
      <Crown className="w-2.5 h-2.5" /> Premium
    </span>
  );
}

function FreeBadge() {
  return (
    <span className="flex items-center gap-1 bg-[#00c2a8] text-black text-[9px] font-black px-2 py-[2px] rounded-sm uppercase tracking-wide">
      Free
    </span>
  );
}

/* ─── CONTENT BADGE ─── */
function ContentBadge({ badge }: { badge: ContentItem["badge"] }) {
  if (!badge) return null;
  const map: Record<string, string> = {
    NEW: "bg-emerald-500 text-white",
    TOP: "bg-[#f5a623] text-black",
    HOT: "bg-orange-500 text-white",
    TRENDING: "bg-[#1a77ff] text-white",
    EXCLUSIVE: "bg-purple-600 text-white",
  };
  return (
    <span className={`absolute top-2 left-2 z-10 px-1.5 py-[2px] text-[9px] font-black rounded-sm uppercase tracking-wider ${map[badge]}`}>
      {badge}
    </span>
  );
}

/* ─── FEATURED CARD (16:9 Landscape — Hotstar style) ─── */
function FeaturedCard({
  item,
  onPlay,
  size = "md",
}: {
  item: ContentItem;
  onPlay: (item: ContentItem) => void;
  size?: "sm" | "md" | "lg";
}) {
  const widths = {
    sm: "w-[220px] sm:w-[260px]",
    md: "w-[260px] sm:w-[300px] lg:w-[320px]",
    lg: "w-[300px] sm:w-[360px] lg:w-[400px]",
  };

  const isPremium = item.badge === "TOP" || item.badge === "EXCLUSIVE";

  return (
    <div className={`group relative flex-shrink-0 ${widths[size]} cursor-pointer`} onClick={() => onPlay(item)}>
      <div
        className="relative overflow-hidden rounded-lg bg-[#1a1a2e] transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_8px_32px_rgba(26,119,255,0.3)] group-hover:ring-2 group-hover:ring-[#1a77ff]/60"
        style={{ aspectRatio: "16/9" }}
      >
        <img
          src={item.backdrop}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:brightness-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=640&h=360&fit=crop&q=80&sig=${item.id}`;
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Premium / Free badge — top left */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {isPremium ? <PremiumBadge /> : <FreeBadge />}
        </div>

        {/* Age rating — top right */}
        {item.ageRating && (
          <span className="absolute top-2.5 right-2.5 z-10 px-1.5 py-[2px] text-[9px] font-bold border border-white/40 text-white/80 rounded-sm bg-black/40">
            {item.ageRating}
          </span>
        )}

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-bold text-[13px] leading-tight line-clamp-1">{item.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-zinc-400 text-[11px]">{item.year}</span>
            <span className="text-zinc-600 text-[10px]">·</span>
            <span className="flex items-center gap-0.5 text-amber-400 text-[11px]">
              <Star className="w-2 h-2 fill-amber-400" />{item.imdbRating}
            </span>
            {item.type === "show" && item.seasons && (
              <>
                <span className="text-zinc-600 text-[10px]">·</span>
                <span className="text-zinc-400 text-[11px]">{item.seasons}S</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PORTRAIT CONTENT CARD (2:3) ─── */
function ContentCard({
  item,
  onPlay,
  size = "md",
}: {
  item: ContentItem;
  onPlay: (item: ContentItem) => void;
  size?: "sm" | "md" | "lg";
}) {
  const widths = { sm: "w-[130px] sm:w-[150px]", md: "w-[150px] sm:w-[170px] lg:w-[190px]", lg: "w-[180px] sm:w-[210px] lg:w-[230px]" };

  return (
    <div className={`group relative flex-shrink-0 ${widths[size]} cursor-pointer`}>
      <div
        className="relative overflow-hidden rounded-lg bg-[#1a1a2e] transition-all duration-300 group-hover:ring-2 group-hover:ring-[#1a77ff]/70 group-hover:shadow-[0_8px_32px_rgba(26,119,255,0.25)] group-hover:scale-[1.03]"
        style={{ aspectRatio: "2/3" }}
      >
        <img
          src={item.poster}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:brightness-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop&q=80&sig=${item.id}`;
          }}
        />
        <ContentBadge badge={item.badge} />

        {item.ageRating && (
          <span className="absolute top-2 right-2 z-10 px-1 py-[1px] text-[8px] font-bold border border-white/50 text-white/80 rounded-sm bg-black/40">
            {item.ageRating}
          </span>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-x-0 bottom-0 p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <div className="flex gap-1.5">
            <button
              onClick={() => onPlay(item)}
              className="flex items-center justify-center gap-1 flex-1 py-2 bg-white hover:bg-zinc-100 text-black text-[11px] font-black rounded-sm transition-colors"
            >
              <Play className="w-3 h-3 fill-black" /> Play
            </button>
            <a
              href={`https://www.imdb.com/title/${item.imdbId}/`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center w-8 bg-zinc-800/90 hover:bg-amber-500/20 border border-zinc-700 hover:border-amber-500/50 rounded-sm transition-all"
            >
              <ExternalLink className="w-3 h-3 text-amber-400" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-1.5 px-0.5">
        <p className="text-white text-[12px] sm:text-[13px] font-semibold leading-tight line-clamp-1">{item.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-zinc-500 text-[11px]">{item.year}</span>
          <span className="flex items-center gap-0.5 text-amber-400 text-[11px] font-medium">
            <Star className="w-2.5 h-2.5 fill-amber-400" />{item.imdbRating}
          </span>
          {item.type === "show" && item.seasons && (
            <span className="text-zinc-600 text-[10px]">{item.seasons}S</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── SECTION HEADER ─── */
function SectionHeader({ title, icon, count }: { title: string; icon?: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center gap-3 mb-4 px-4 sm:px-8 lg:px-12">
      <div className="w-1 h-6 bg-[#1a77ff] rounded-full flex-shrink-0" />
      {icon && <span className="text-[#1a77ff]">{icon}</span>}
      <h2 className="text-white font-black text-lg sm:text-xl tracking-tight">{title}</h2>
      {count !== undefined && (
        <span className="text-zinc-600 text-sm">{count} titles</span>
      )}
      <div className="flex-1" />
      <button className="text-zinc-500 hover:text-[#1a77ff] text-xs transition-colors flex items-center gap-0.5 group/link">
        See all <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}

/* ─── FEATURED ROW (Landscape 16:9) ─── */
function FeaturedRow({
  title,
  icon,
  items,
  onPlay,
  size = "md",
}: {
  title: string;
  icon?: React.ReactNode;
  items: ContentItem[];
  onPlay: (item: ContentItem) => void;
  size?: "sm" | "md" | "lg";
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === "left" ? -960 : 960, behavior: "smooth" });
  };

  return (
    <div className="mb-10">
      <SectionHeader title={title} icon={icon} count={items.length} />
      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-black/80 border border-zinc-700/60 text-white opacity-0 group-hover/row:opacity-100 hover:bg-[#1a77ff] hover:border-[#1a77ff] transition-all shadow-xl"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-black/80 border border-zinc-700/60 text-white opacity-0 group-hover/row:opacity-100 hover:bg-[#1a77ff] hover:border-[#1a77ff] transition-all shadow-xl"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto px-4 sm:px-8 lg:px-12 pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {items.map((item) => (
            <FeaturedCard key={item.id} item={item} onPlay={onPlay} size={size} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── PORTRAIT CONTENT ROW ─── */
function ContentRow({
  title,
  icon,
  items,
  onPlay,
  size = "md",
}: {
  title: string;
  icon?: React.ReactNode;
  items: ContentItem[];
  onPlay: (item: ContentItem) => void;
  size?: "sm" | "md" | "lg";
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === "left" ? -720 : 720, behavior: "smooth" });
  };

  return (
    <div className="mb-10">
      <SectionHeader title={title} icon={icon} count={items.length} />
      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className="hidden lg:flex absolute left-2 top-[38%] -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-black/80 border border-zinc-700/60 text-white opacity-0 group-hover/row:opacity-100 hover:bg-[#1a77ff] hover:border-[#1a77ff] transition-all shadow-xl"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="hidden lg:flex absolute right-2 top-[38%] -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-black/80 border border-zinc-700/60 text-white opacity-0 group-hover/row:opacity-100 hover:bg-[#1a77ff] hover:border-[#1a77ff] transition-all shadow-xl"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto px-4 sm:px-8 lg:px-12 pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {items.map((item) => (
            <ContentCard key={item.id} item={item} onPlay={onPlay} size={size} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── HERO (Hotstar-style) ─── */
function Hero({ onPlay }: { onPlay: (item: ContentItem) => void }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  const go = (index: number) => {
    setFading(true);
    setTimeout(() => { setCurrent(index); setFading(false); }, 350);
  };

  useEffect(() => {
    const timer = setInterval(() => go((current + 1) % heroContent.length), 7000);
    return () => clearInterval(timer);
  }, [current]);

  const item = heroContent[current];
  const isPremium = item.badge === "TOP" || item.badge === "EXCLUSIVE";

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "88vh", minHeight: 520 }}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
        style={{ backgroundImage: `url(${item.backdrop})`, backgroundSize: "cover", backgroundPosition: "center 20%" }}
      />

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c14]/95 via-[#0c0c14]/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-[#0c0c14] to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#0c0c14]/80 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-16 left-0 px-6 sm:px-10 lg:px-14 max-w-3xl w-full">
        <div className={`transition-all duration-500 ${fading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>

          {/* Type + Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {isPremium ? <PremiumBadge /> : <FreeBadge />}
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${item.type === "movie" ? "bg-[#1a77ff]/20 text-[#1a77ff] border border-[#1a77ff]/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"}`}>
              {item.type === "movie" ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
              {item.type === "movie" ? "Movie" : "TV Show"}
            </span>
            {item.genres.slice(0, 2).map((g) => (
              <span key={g} className="text-zinc-400 text-xs bg-zinc-800/60 border border-zinc-700/40 px-2.5 py-1 rounded-full">{g}</span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-black text-white leading-none mb-3 tracking-tight drop-shadow-2xl">
            {item.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <ImdbBadge rating={item.imdbRating} />
            {item.ageRating && (
              <span className="text-zinc-400 text-xs border border-zinc-600 px-1.5 py-0.5 rounded bg-black/30">{item.ageRating}</span>
            )}
            <span className="text-zinc-400 text-xs">{item.duration}</span>
            <span className="text-zinc-400 text-xs">{item.year}</span>
            {item.language && <span className="text-zinc-500 text-xs">{item.language}</span>}
          </div>

          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-7 max-w-lg line-clamp-3">
            {item.description}
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => onPlay(item)}
              className="flex items-center gap-2.5 px-8 py-3.5 bg-white hover:bg-zinc-100 text-black font-black rounded text-sm tracking-wide transition-all active:scale-95 shadow-xl"
            >
              <Play className="w-4 h-4 fill-black" />
              {isPremium ? "Watch Now" : "Watch Free"}
            </button>
            {isPremium && (
              <button className="flex items-center gap-2.5 px-6 py-3.5 bg-[#1a77ff] hover:bg-[#1565d8] text-white font-bold rounded text-sm tracking-wide transition-all active:scale-95 shadow-xl shadow-blue-900/30">
                <Crown className="w-4 h-4" /> Subscribe
              </button>
            )}
            <button className="flex items-center gap-2.5 px-5 py-3.5 bg-zinc-800/80 hover:bg-zinc-700 text-white border border-zinc-700/60 font-bold rounded text-sm tracking-wide transition-all backdrop-blur-sm">
              <Plus className="w-4 h-4" /> Watchlist
            </button>
          </div>
        </div>
      </div>

      {/* Slide Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {heroContent.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`transition-all duration-300 rounded-full ${i === current ? "w-8 h-[6px] bg-[#1a77ff]" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`}
          />
        ))}
      </div>

      {/* Arrow Controls */}
      {[
        { dir: "left", action: () => go((current - 1 + heroContent.length) % heroContent.length) },
        { dir: "right", action: () => go((current + 1) % heroContent.length) },
      ].map(({ dir, action }) => (
        <button
          key={dir}
          onClick={action}
          className={`absolute ${dir === "left" ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/15 hover:border-white/40 transition-all`}
        >
          {dir === "left" ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
        </button>
      ))}
    </div>
  );
}

/* ─── GENRE FILTER ─── */
function GenreFilter({ active, onChange }: { active: string; onChange: (g: string) => void }) {
  return (
    <div
      className="flex gap-2 overflow-x-auto px-4 sm:px-8 lg:px-12 pb-2 mb-6"
      style={{ scrollbarWidth: "none" } as React.CSSProperties}
    >
      {allGenres.map((g) => (
        <button
          key={g}
          onClick={() => onChange(g)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
            active === g
              ? "bg-[#1a77ff] border-[#1a77ff] text-white"
              : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  );
}

/* ─── SUBSCRIBE BANNER ─── */
function SubscribeBanner() {
  return (
    <div className="mx-4 sm:mx-8 lg:mx-12 mb-10 rounded-2xl overflow-hidden relative">
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f2044 50%, #091830 100%)" }}
      />
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "url(https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=60)", backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/95 via-[#0a1628]/70 to-transparent" />

      <div className="relative z-10 px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-[#1a77ff] flex items-center justify-center">
              <Crown className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[#1a77ff] font-black text-sm uppercase tracking-wider">Premium Plan</span>
          </div>
          <h3 className="text-white font-black text-xl sm:text-2xl mb-1">Unlock All Premium Content</h3>
          <p className="text-zinc-400 text-sm">4K Ultra HD · No Ads · Download & Watch · 5 Screens</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-zinc-500 text-xs line-through">₹999/mo</p>
            <p className="text-white font-black text-xl">₹299<span className="text-zinc-400 text-sm font-normal">/mo</span></p>
          </div>
          <button className="px-6 py-3 bg-[#1a77ff] hover:bg-[#1565d8] text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-blue-900/40 whitespace-nowrap">
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MOVIES GRID TAB ─── */
function MoviesTab({ onPlay }: { onPlay: (item: ContentItem) => void }) {
  const [activeGenre, setActiveGenre] = useState("All");
  const filtered = activeGenre === "All" ? movies : movies.filter(m => m.genres.includes(activeGenre));

  return (
    <div className="pt-6">
      <div className="px-4 sm:px-8 lg:px-12 mb-6">
        <h2 className="text-white font-black text-2xl">Movies</h2>
        <p className="text-zinc-500 text-sm mt-1">{filtered.length} movies available</p>
      </div>
      <GenreFilter active={activeGenre} onChange={setActiveGenre} />
      <div className="px-4 sm:px-8 lg:px-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map((item) => (
          <ContentCard key={item.id} item={item} onPlay={onPlay} />
        ))}
      </div>
    </div>
  );
}

/* ─── TV SHOWS GRID TAB ─── */
function TVShowsTab({ onPlay }: { onPlay: (item: ContentItem) => void }) {
  const [activeGenre, setActiveGenre] = useState("All");
  const filtered = activeGenre === "All" ? tvShows : tvShows.filter(s => s.genres.includes(activeGenre));

  return (
    <div className="pt-6">
      <div className="px-4 sm:px-8 lg:px-12 mb-6">
        <h2 className="text-white font-black text-2xl">TV Shows</h2>
        <p className="text-zinc-500 text-sm mt-1">{filtered.length} shows available</p>
      </div>
      <GenreFilter active={activeGenre} onChange={setActiveGenre} />
      <div className="px-4 sm:px-8 lg:px-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map((item) => (
          <ContentCard key={item.id} item={item} onPlay={onPlay} />
        ))}
      </div>
    </div>
  );
}

/* ─── NEW & HOT TAB ─── */
function NewHotTab({ onPlay }: { onPlay: (item: ContentItem) => void }) {
  return (
    <div className="pt-6">
      <div className="px-4 sm:px-8 lg:px-12 mb-8">
        <h2 className="text-white font-black text-2xl">New &amp; Hot</h2>
        <p className="text-zinc-500 text-sm mt-1">Latest releases &amp; trending now</p>
      </div>
      <FeaturedRow title="New Releases" icon={<Sparkles className="w-4 h-4" />} items={newReleases} onPlay={onPlay} size="lg" />
      <FeaturedRow title="Trending This Week" icon={<TrendingUp className="w-4 h-4" />} items={trendingNow} onPlay={onPlay} />
    </div>
  );
}

/* ─── VERTICAL PLAYER SECTION ─── */
const SHORTS = [
  { title: "Big Buck Bunny", url: DEMO_VIDEO_1, label: "Animation · 9 min" },
  { title: "Elephant's Dream", url: DEMO_VIDEO_2, label: "Sci-Fi · 10 min" },
  { title: "Tears of Steel", url: DEMO_VIDEO_3, label: "Action · 12 min" },
  { title: "Sintel", url: DEMO_VIDEO_4, label: "Fantasy · 14 min" },
  { title: "Subaru Outback", url: DEMO_VIDEO_5, label: "Adventure · 6 min" },
];

function VerticalPlayerSection({ onPlayFull }: { onPlayFull: (item: ContentItem) => void }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    if (playing) v.play().catch(() => {});
    else setPlaying(false);
  }, [activeIdx]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const clip = SHORTS[activeIdx];

  return (
    <div className="mb-12">
      <SectionHeader title="Shorts & Reels" icon={<Smartphone className="w-4 h-4" />} />
      <div className="px-4 sm:px-8 lg:px-12 flex gap-5 items-start overflow-x-auto" style={{ scrollbarWidth: "none" } as React.CSSProperties}>

        {/* Inline portrait video player */}
        <div
          className="relative flex-shrink-0 bg-black rounded-2xl overflow-hidden group cursor-pointer shadow-2xl shadow-blue-900/20 ring-1 ring-[#1a77ff]/20"
          style={{ aspectRatio: "9/16", width: "min(200px, 44vw)" }}
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src={clip.url}
            poster={heroContent[activeIdx]?.poster}
            className="w-full h-full object-cover"
            loop
            playsInline
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />

          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/30">
              {playing
                ? <Pause className="w-6 h-6 text-white fill-white" />
                : <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              }
            </div>
          </div>

          <div className="absolute top-2.5 left-2.5 pointer-events-none">
            <span className="bg-[#1a77ff]/80 text-white text-[9px] font-black px-2 py-0.5 rounded-full backdrop-blur-sm">Portrait 9:16</span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onPlayFull(heroContent[activeIdx] || heroContent[0]); }}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 border border-white/20 transition-all"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none">
            <p className="text-white text-xs font-bold leading-tight">{clip.title}</p>
            <p className="text-[#1a77ff] text-[10px] mt-0.5">{clip.label}</p>
          </div>

          {playing && (
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1a77ff]/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> PLAYING
            </div>
          )}
        </div>

        {/* Clip selector list */}
        <div className="flex flex-col gap-2 flex-shrink-0 w-[200px] sm:w-[240px]">
          {SHORTS.map((s, i) => (
            <button
              key={i}
              onClick={() => { setActiveIdx(i); setPlaying(false); }}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all text-left border ${activeIdx === i ? "bg-white/8 border-[#1a77ff]/40 shadow-[0_0_12px_rgba(26,119,255,0.15)]" : "border-transparent hover:bg-white/5"}`}
            >
              <div className="relative flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800" style={{ aspectRatio: "9/16", width: 36 }}>
                <img
                  src={heroContent[i]?.poster}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=80&h=140&fit=crop&sig=${i}`; }}
                />
                {activeIdx === i && playing && (
                  <div className="absolute inset-0 bg-[#1a77ff]/40 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-semibold truncate ${activeIdx === i ? "text-white" : "text-zinc-400"}`}>{s.title}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{s.label}</p>
              </div>
              {activeIdx === i && <div className="w-[3px] h-5 bg-[#1a77ff] rounded-full flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── HOME TAB ─── */
function HomeTab({
  onPlay,
  onSelectDrama,
}: {
  onPlay: (item: ContentItem) => void;
  onSelectDrama: (d: ShortDrama) => void;
}) {
  return (
    <div className="pt-8">
      {/* Landscape featured rows at top (Hotstar style) */}
      <FeaturedRow title="Trending Now" icon={<TrendingUp className="w-4 h-4" />} items={trendingNow} onPlay={onPlay} />
      <FeaturedRow title="New Releases" icon={<Sparkles className="w-4 h-4" />} items={newReleases} onPlay={onPlay} />

      {/* Subscribe Banner */}
      <SubscribeBanner />

      {/* Portrait rows */}
      <ContentRow title="Top Rated Movies" icon={<Star className="w-4 h-4" />} items={topRated} onPlay={onPlay} size="lg" />

      {/* Short Drama Row */}
      <ShortDramaRow title="Short Drama — Hot Now" icon={<Smartphone className="w-4 h-4" />} items={featuredDramas} onSelect={onSelectDrama} />

      {/* More landscape rows */}
      <FeaturedRow title="Popular TV Shows" icon={<Tv className="w-4 h-4" />} items={tvShows.slice(0, 10)} onPlay={onPlay} />

      {/* Vertical shorts player */}
      <VerticalPlayerSection onPlayFull={onPlay} />

      {/* Another short drama row */}
      <ShortDramaRow title="New Short Drama" icon={<Crown className="w-4 h-4" />} items={newDramas} onSelect={onSelectDrama} />

      {/* More landscape rows */}
      <FeaturedRow title="Action & Adventure" icon={<Flame className="w-4 h-4" />} items={actionMovies} onPlay={onPlay} />
      <FeaturedRow title="Drama Series" icon={<Film className="w-4 h-4" />} items={dramaShows} onPlay={onPlay} />
    </div>
  );
}

/* ─── SHORT DRAMA CARD ─── */
const DRAMA_BADGE: Record<string, string> = {
  NEW: "bg-emerald-500 text-white",
  HOT: "bg-orange-500 text-white",
  TRENDING: "bg-[#1a77ff] text-white",
  EXCLUSIVE: "bg-purple-600 text-white",
};

function ShortDramaCard({ drama, onClick }: { drama: ShortDrama; onClick: () => void }) {
  return (
    <div
      className="group relative flex-shrink-0 cursor-pointer"
      style={{ width: "clamp(130px, 18vw, 175px)" }}
      onClick={onClick}
    >
      <div
        className="relative overflow-hidden rounded-xl bg-[#1a1a2e] transition-all duration-300 group-hover:ring-2 group-hover:ring-purple-500/70 group-hover:shadow-[0_8px_32px_rgba(168,85,247,0.25)] group-hover:scale-[1.03]"
        style={{ aspectRatio: "9/16" }}
      >
        <img
          src={drama.poster}
          alt={drama.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:brightness-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=533&fit=crop&sig=${drama.id}`;
          }}
        />

        {drama.badge && (
          <span className={`absolute top-2 left-2 z-10 text-[9px] font-black px-1.5 py-[2px] rounded-sm uppercase tracking-wider ${DRAMA_BADGE[drama.badge]}`}>
            {drama.badge}
          </span>
        )}

        <span className="absolute top-2 right-2 z-10 text-[9px] font-bold px-1.5 py-[2px] rounded-sm bg-emerald-600/90 text-white">
          {drama.freeEpisodes} FREE
        </span>

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-x-0 bottom-0 p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <button className="w-full py-2 bg-white hover:bg-zinc-100 text-black text-[11px] font-black rounded-lg flex items-center justify-center gap-1 transition-colors">
            <Play className="w-3 h-3 fill-black" /> Watch Now
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-800">
          <div
            className="h-full bg-purple-500"
            style={{ width: `${(drama.freeEpisodes / drama.totalEpisodes) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-1.5 px-0.5">
        <p className="text-white text-[12px] font-semibold leading-tight line-clamp-1">{drama.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-0.5 text-amber-400 text-[11px] font-medium">
            <Star className="w-2.5 h-2.5 fill-amber-400" />{drama.rating}
          </span>
          <span className="text-zinc-500 text-[11px]">{drama.totalEpisodes} EPs</span>
          <span className="text-zinc-600 text-[10px]">{drama.language}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── SHORT DRAMA ROW ─── */
function ShortDramaRow({
  title,
  icon,
  items,
  onSelect,
}: {
  title: string;
  icon?: React.ReactNode;
  items: ShortDrama[];
  onSelect: (d: ShortDrama) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === "left" ? -600 : 600, behavior: "smooth" });
  };

  return (
    <div className="mb-10">
      <SectionHeader title={title} icon={icon} count={items.length} />
      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className="hidden lg:flex absolute left-2 top-[40%] -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-black/80 border border-zinc-700/60 text-white opacity-0 group-hover/row:opacity-100 hover:bg-purple-700 hover:border-purple-600 transition-all shadow-xl"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="hidden lg:flex absolute right-2 top-[40%] -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-black/80 border border-zinc-700/60 text-white opacity-0 group-hover/row:opacity-100 hover:bg-purple-700 hover:border-purple-600 transition-all shadow-xl"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto px-4 sm:px-8 lg:px-12 pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {items.map((d) => (
            <ShortDramaCard key={d.id} drama={d} onClick={() => onSelect(d)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SHORT DRAMA TAB ─── */
function ShortDramaTab({ onSelect }: { onSelect: (d: ShortDrama) => void }) {
  return (
    <div className="pt-6">
      <div className="px-4 sm:px-8 lg:px-12 mb-8">
        <h2 className="text-white font-black text-2xl">Short Drama</h2>
        <p className="text-zinc-500 text-sm mt-1">{shortDramas.length} series · Portrait 9:16 · Episode-based</p>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-10">
        {shortDramas.map((d) => (
          <ShortDramaCard key={d.id} drama={d} onClick={() => onSelect(d)} />
        ))}
      </div>

      <div className="px-4 sm:px-8 lg:px-12 mb-8">
        <div className="bg-[#0f1a2e]/80 border border-[#1a77ff]/20 rounded-2xl p-5 flex flex-wrap gap-6">
          {[
            { icon: <Smartphone className="w-5 h-5 text-[#1a77ff]" />, label: "Portrait 9:16", desc: "Optimized for mobile viewing" },
            { icon: <Play className="w-5 h-5 text-emerald-400" />, label: "First Episodes Free", desc: "Start watching without subscription" },
            { icon: <Lock className="w-5 h-5 text-amber-400" />, label: "Premium Episodes", desc: "Subscribe to unlock all episodes" },
            { icon: <Crown className="w-5 h-5 text-yellow-400" />, label: "VIP Access", desc: "Unlimited streaming for subscribers" },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 min-w-[160px]">
              <div className="w-9 h-9 rounded-xl bg-zinc-800/80 flex items-center justify-center flex-shrink-0">{icon}</div>
              <div>
                <p className="text-white text-sm font-semibold">{label}</p>
                <p className="text-zinc-600 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── USER DROPDOWN ─── */
function UserDropdown({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="absolute top-[calc(100%+8px)] right-0 w-[260px] bg-[#0f1520]/98 border border-[#1a77ff]/20 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden z-50 backdrop-blur-xl">
      <div className="p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-zinc-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-none mb-1">Guest</p>
          <p className="text-zinc-500 text-[11px]">Sign in for full access</p>
        </div>
        <button
          onClick={onSignIn}
          className="px-3 py-1.5 border border-[#1a77ff] text-[#1a77ff] hover:bg-[#1a77ff] hover:text-white text-xs font-semibold rounded-lg transition-all flex-shrink-0"
        >
          Log in
        </button>
      </div>
      <div className="mx-4 h-px bg-zinc-800" />
      <div className="flex items-stretch px-4 py-4">
        {[{ emoji: "🪙", val: "0", label: "Coins" }, { emoji: "🎁", val: "0", label: "Bonus" }].map((itm, i) => (
          <>
            {i > 0 && <div key="div" className="w-px bg-zinc-800 my-1" />}
            <div key={itm.label} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-base">{itm.emoji}</span>
              <span className="text-white font-bold text-base">{itm.val}</span>
              <span className="text-zinc-500 text-xs">{itm.label}</span>
            </div>
          </>
        ))}
      </div>
      <div className="px-4 pb-4">
        <button className="w-full py-2.5 bg-[#1a77ff] hover:bg-[#1565d8] text-white font-bold rounded-xl transition-colors text-sm">
          Subscribe Now
        </button>
      </div>
    </div>
  );
}

/* ─── SIGN IN MODAL ─── */
function SignInModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[500px] bg-[#0f1520] rounded-2xl overflow-hidden shadow-2xl flex max-h-[92vh]">
        <div className="hidden sm:block w-[170px] flex-shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-4">
            {movies.slice(0, 8).map((m) => (
              <img key={m.id} src={m.poster} alt="" className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=120&h=180&fit=crop"; }} />
            ))}
          </div>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-[#1a77ff] flex items-center justify-center shadow-2xl">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
            <span className="text-white font-black text-sm tracking-tight">StreamIT</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all z-10">
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-white font-bold text-xl mb-5 pr-6">Sign in to StreamIT</h2>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[
              { label: "Google", icon: <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> },
              { label: "Facebook", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
            ].map(({ label, icon }) => (
              <button key={label} className="flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-white text-sm font-medium transition-all">
                {icon} {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-500 text-sm">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address"
            className="w-full bg-zinc-800 border border-zinc-700 focus:border-[#1a77ff] text-white placeholder:text-zinc-500 px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors mb-3" />
          <button className="w-full py-3 bg-[#1a77ff] hover:bg-[#1565d8] text-white font-bold rounded-xl transition-colors text-sm mb-4">Continue</button>
          <p className="text-zinc-600 text-[11px] text-center leading-relaxed mt-auto">
            By continuing, I agree to the{" "}
            <a href="#" className="text-zinc-400 hover:text-white underline underline-offset-2">Terms</a> &amp;{" "}
            <a href="#" className="text-zinc-400 hover:text-white underline underline-offset-2">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── HEADER ─── */
const NAV_TABS: { label: string; tab: Tab; icon: React.ReactNode }[] = [
  { label: "Home", tab: "home", icon: null },
  { label: "Movies", tab: "movies", icon: <Film className="w-3.5 h-3.5" /> },
  { label: "TV Shows", tab: "tvshows", icon: <Tv className="w-3.5 h-3.5" /> },
  { label: "Short Drama", tab: "drama", icon: <Smartphone className="w-3.5 h-3.5" /> },
  { label: "New & Hot", tab: "new", icon: <Flame className="w-3.5 h-3.5" /> },
];

export function PublicHeader({ activeTab = "home", setActiveTab = () => {} }: { activeTab?: Tab; setActiveTab?: (t: Tab) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setUserDropdownOpen(false);
    };
    if (userDropdownOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [userDropdownOpen]);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#0c0c14]/97 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.8)]" : "bg-gradient-to-b from-[#0c0c14]/90 via-[#0c0c14]/40 to-transparent"}`}>
        <div className="px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="flex items-center justify-between h-[60px] lg:h-[68px]">

            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-6 lg:gap-8">
              <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
                <div className="w-8 h-8 rounded-lg bg-[#1a77ff] flex items-center justify-center shadow-lg shadow-blue-900/50 group-hover:scale-105 transition-transform">
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                </div>
                <span className="text-white font-black text-xl tracking-tight hidden sm:block">StreamIT</span>
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                {NAV_TABS.map(({ label, tab, icon }) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative flex items-center gap-1.5 px-3.5 py-2 text-[13.5px] font-medium rounded-lg transition-all duration-200 ${activeTab === tab ? "text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
                  >
                    {icon}
                    {label}
                    {activeTab === tab && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-[#1a77ff] rounded-full" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Search */}
              <div className="relative flex items-center">
                <div className={`flex items-center overflow-hidden transition-all duration-300 rounded-full border ${searchOpen ? "w-44 sm:w-52 bg-black/80 border-zinc-600" : "w-9 h-9 border-transparent"}`}>
                  {searchOpen && <Search className="absolute left-3 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />}
                  {searchOpen ? (
                    <input autoFocus placeholder="Search titles..." className="w-full bg-transparent text-white text-sm pl-8 pr-7 py-2 focus:outline-none placeholder:text-zinc-600" onBlur={() => setSearchOpen(false)} />
                  ) : (
                    <button onClick={() => setSearchOpen(true)} className="w-9 h-9 flex items-center justify-center text-zinc-300 hover:text-white transition-colors rounded-full hover:bg-white/10">
                      <Search className="w-[18px] h-[18px]" />
                    </button>
                  )}
                  {searchOpen && <button onMouseDown={() => setSearchOpen(false)} className="absolute right-2.5 text-zinc-500 hover:text-white"><X className="w-3 h-3" /></button>}
                </div>
              </div>

              <button className="hidden sm:flex w-9 h-9 items-center justify-center text-zinc-300 hover:text-white rounded-full hover:bg-white/10 transition-all">
                <Bell className="w-[17px] h-[17px]" />
              </button>

              <div className="hidden sm:block w-px h-5 bg-zinc-700/60 mx-0.5" />

              {/* Subscribe button — prominent Hotstar style */}
              <button className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[#1a77ff] hover:bg-[#1565d8] text-white font-bold rounded-lg text-[13px] transition-all shadow-md shadow-blue-900/30">
                <Crown className="w-3.5 h-3.5" />
                Subscribe
              </button>

              <div className="relative" ref={avatarRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-full hover:bg-white/10 transition-all ml-1"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1a77ff] to-blue-800 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <ChevronDown className={`w-3 h-3 text-zinc-400 hidden sm:block transition-transform duration-200 ${userDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {userDropdownOpen && <UserDropdown onSignIn={() => { setUserDropdownOpen(false); setSignInModalOpen(true); }} />}
              </div>

              <button className="lg:hidden ml-0.5 w-9 h-9 flex items-center justify-center text-zinc-300 hover:text-white rounded-full hover:bg-white/10 transition-all" onClick={() => setMobileOpen(!mobileOpen)}>
                <div className="flex flex-col gap-[5px] w-5">
                  <span className={`block h-[1.5px] bg-current rounded-full transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[6.5px]" : ""}`} />
                  <span className={`block h-[1.5px] bg-current rounded-full transition-all duration-300 ${mobileOpen ? "opacity-0 scale-x-0" : ""}`} />
                  <span className={`block h-[1.5px] bg-current rounded-full transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="bg-[#0c0c14]/97 backdrop-blur-xl border-t border-white/5 px-4 py-4">
            {NAV_TABS.map(({ label, tab, icon }) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all mb-0.5 ${activeTab === tab ? "bg-[#1a77ff]/15 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
              >
                {activeTab === tab && <span className="w-1.5 h-1.5 rounded-full bg-[#1a77ff] flex-shrink-0" />}
                {icon}
                {label}
              </button>
            ))}
            <button className="w-full mt-2 py-3 bg-[#1a77ff] hover:bg-[#1565d8] text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
              <Crown className="w-4 h-4" /> Subscribe Now
            </button>
          </div>
        </div>
      </header>

      {signInModalOpen && <SignInModal onClose={() => setSignInModalOpen(false)} />}
    </>
  );
}

/* ─── FOOTER ─── */
export function PublicFooter() {
  const socialLinks = [
    { label: "Facebook", d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
    { label: "YouTube", d: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
    { label: "Instagram", d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2z" },
  ];

  return (
    <footer className="bg-[#070710] border-t border-white/5 mt-4 pt-12 pb-8">
      <div className="px-6 sm:px-10 lg:px-14">
        <div className="flex flex-col lg:flex-row gap-12 justify-between mb-10">
          <div className="lg:w-52">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#1a77ff] flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
              <span className="text-white font-black text-2xl tracking-tight">StreamIT</span>
            </div>
            <p className="text-zinc-600 text-xs leading-relaxed mb-5">Your premium OTT destination for movies, TV shows, &amp; exclusive content.</p>
            <div className="flex items-center gap-2">
              {socialLinks.map((s) => (
                <a key={s.label} href="#" aria-label={s.label} className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-500 transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-14">
            {[
              { title: "Browse", items: ["Movies", "TV Shows", "New & Hot", "Trending"] },
              { title: "Company", items: ["About Us", "Careers", "Press", "Contact"] },
              { title: "Support", items: ["Help Center", "FAQ", "Privacy", "Terms"] },
            ].map(({ title, items }) => (
              <div key={title}>
                <h4 className="text-white font-semibold text-xs mb-4 uppercase tracking-widest">{title}</h4>
                <ul className="space-y-3">
                  {items.map((l) => <li key={l}><a href="#" className="text-zinc-600 hover:text-white text-sm transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-zinc-700 text-xs">© 2026 StreamIT. All Rights Reserved.</p>
          <p className="text-zinc-700 text-xs">Data sourced from IMDb · Powered by TMDB</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── MAIN PAGE ─── */
export default function StreamingHomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [playingDrama, setPlayingDrama] = useState<ShortDrama | null>(null);
  const [, setLocation] = useLocation();

  const handlePlay = (item: ContentItem) => setLocation(`/movie/${item.id}`);

  return (
    <div className="min-h-screen text-white" style={{ background: "#0c0c14" }}>
      <PublicHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <main>
        {(activeTab === "home" || activeTab === "new") && (
          <Hero onPlay={handlePlay} />
        )}

        {activeTab === "home" && (
          <HomeTab onPlay={handlePlay} onSelectDrama={setPlayingDrama} />
        )}
        {activeTab === "movies" && (
          <div className="pt-24">
            <MoviesTab onPlay={handlePlay} />
          </div>
        )}
        {activeTab === "tvshows" && (
          <div className="pt-24">
            <TVShowsTab onPlay={handlePlay} />
          </div>
        )}
        {activeTab === "drama" && (
          <div className="pt-24">
            <ShortDramaTab onSelect={setPlayingDrama} />
          </div>
        )}
        {activeTab === "new" && <NewHotTab onPlay={handlePlay} />}
      </main>

      <PublicFooter />

      {/* Short Drama Player — portrait + episode grid (intact) */}
      {playingDrama && (
        <ShortDramaPlayer
          drama={playingDrama}
          onClose={() => setPlayingDrama(null)}
        />
      )}

      <style>{`
        html { scroll-behavior: smooth; }
        * { scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
        body { background: #0c0c14; }
      `}</style>
    </div>
  );
}
