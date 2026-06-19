import { useState, useEffect, useRef } from "react";
import { useSearch, useLocation, useParams } from "wouter";
import {
  Play, Search, X, Loader2, Film, Tv, Smartphone, Star, Crown, Flame,
  SlidersHorizontal, ChevronLeft, ChevronRight, TrendingUp, Sparkles,
} from "lucide-react";
import { PublicHeader, PublicFooter } from "./streaming-home";
import { useGetWebBrowse, useGetGenres, getImageUrl } from "@/lib/api-client";
import SubscriptionPlansModal from "@/components/SubscriptionPlansModal";

type ContentType = "movie" | "show" | "drama";

const CONTENT_TYPES: { key: ContentType; label: string; icon: React.ReactNode }[] = [
  { key: "movie", label: "Movies", icon: <Film className="w-4 h-4" /> },
  { key: "show", label: "TV Shows", icon: <Tv className="w-4 h-4" /> },
  { key: "drama", label: "Short Drama", icon: <Smartphone className="w-4 h-4" /> },
];

function ContentCard({ item, onClick }: { item: any; onClick: () => void }) {
  const isPremium = item.badge === "TOP" || item.badge === "EXCLUSIVE";
  const isDrama = item.type === "drama" || (item.seasons === undefined && item.totalEpisodes !== undefined);

  if (isDrama) {
    return (
      <div
        className="group relative flex-shrink-0 cursor-pointer"
        onClick={onClick}
      >
        <div
          className="relative overflow-hidden rounded-xl bg-zinc-900 transition-all duration-300 group-hover:ring-2 group-hover:ring-purple-500/70 group-hover:scale-[1.03] max-h-[400px] mx-auto w-full max-w-[220px]"
          style={{ aspectRatio: "9/16" }}
        >
          <img
            src={item.poster ? getImageUrl(item.poster) : ''}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.style.backgroundColor = '#111'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          {item.badge && (
            <span className="absolute top-1.5 left-1.5 text-[9px] font-black px-1.5 py-[2px] rounded-sm uppercase bg-primary text-white">{item.badge}</span>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="text-white text-[11px] font-bold leading-tight line-clamp-2">{item.title}</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex-shrink-0 cursor-pointer" onClick={onClick}>
      <div
        className="relative overflow-hidden rounded-xl bg-zinc-900 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_12px_32px_rgba(229,9,20,0.25)] group-hover:ring-1 group-hover:ring-primary/40"
        style={{ aspectRatio: "16/9" }}
      >
        <img
          src={item.backdrop ? getImageUrl(item.backdrop) : (item.poster ? getImageUrl(item.poster) : '')}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.style.backgroundColor = '#111'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030306] via-[#030306]/30 to-transparent" />
        {isPremium ? (
          <span className="absolute top-2 left-2 flex items-center gap-1 bg-[#f5a623] text-black text-[9px] font-black px-2 py-[2px] rounded-sm uppercase">
            <Crown className="w-2.5 h-2.5" /> Premium
          </span>
        ) : item.badge ? (
          <span className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-[2px] rounded-sm uppercase bg-primary text-white">{item.badge}</span>
        ) : null}
        {item.imdbRating && (
          <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-bold bg-amber-400/90 text-black px-1.5 py-[2px] rounded">
            <Star className="w-2.5 h-2.5 fill-black" />{item.imdbRating}
          </span>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/50">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-bold text-sm leading-tight truncate">{item.title}</p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
            {item.year && <span>{item.year}</span>}
            {item.duration && <><span>·</span><span>{item.duration}</span></>}
            {item.seasons && <><span>·</span><span className="text-white bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.seasons}S</span></>}
          </div>
        </div>
      </div>
    </div>
  );
}

const TAB_TO_TYPE: Record<string, ContentType> = {
  drama: "drama",
  show: "show",
  tvshows: "show",
  movie: "movie",
  movies: "movie",
  new: "movie",
  trending: "movie",
  "top-rated": "movie",
  action: "movie",
};

export default function CategoriesBrowsePage() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const params = useParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<"home" | "movies" | "tvshows" | "drama" | "new">("home");
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const initialQ = new URLSearchParams(searchString).get("q") || "";
  const [searchInput, setSearchInput] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);

  const initialType: ContentType = (params as any)?.tab ? (TAB_TO_TYPE[(params as any).tab] || "movie") : "movie";
  const [contentType, setContentType] = useState<ContentType>(initialType);
  const [activeGenre, setActiveGenre] = useState("All");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) try { setUser(JSON.parse(stored)); } catch {}
  }, []);

  // Sync search query from URL
  useEffect(() => {
    const q = new URLSearchParams(searchString).get("q") || "";
    setSearchInput(q);
    setDebouncedQ(q);
    setPage(1);
  }, [searchString]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(val);
      setLocation(`/browse?q=${encodeURIComponent(val)}`, { replace: true });
    }, 350);
  };

  const { data: genresData } = useGetGenres({ limit: 50 });
  const genres: string[] = ["All", ...((genresData?.data || []).map((g: any) => g.name))];

  const browseOptions = {
    type: debouncedQ ? contentType : contentType,
    genre: activeGenre,
    page,
    search: debouncedQ || undefined,
    limit: 24,
  };

  const { data: browseData, isLoading, isFetching } = useGetWebBrowse(browseOptions);
  const items: any[] = browseData?.items || [];
  const pagination = browseData?.pagination;

  const handlePlay = (item: any) => {
    const isDrama = item.contentType === "drama";
    if (isDrama) setLocation(`/show/${item.id || item._id}/episode/1`);
    else setLocation(`/movie/${item.id || item._id}`);
  };

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    setUser(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#030306] text-white">
      <PublicHeader
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === "tvshows") setLocation("/tv-shows-browse");
          else { setActiveTab(tab); setLocation("/"); }
        }}
        onSignIn={() => setLocation("/login")}
        onSignOut={handleSignOut}
        user={user}
        onSubscribeClick={() => setPlansModalOpen(true)}
      />

      <div className="pt-20 pb-20 min-h-screen">
        {/* Search Hero */}
        <div className="px-4 sm:px-8 lg:px-14 pt-8 pb-6">
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                ref={inputRef}
                autoFocus={!!initialQ}
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search movies, TV shows, short dramas..."
                className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary/30 text-white text-base placeholder:text-zinc-500 pl-12 pr-12 py-3.5 rounded-2xl transition-all outline-none"
              />
              {searchInput && (
                <button
                  onClick={() => { handleSearchChange(""); inputRef.current?.focus(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Type Tabs */}
        <div className="px-4 sm:px-8 lg:px-14 mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            {CONTENT_TYPES.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => { setContentType(key); setActiveGenre("All"); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  contentType === key
                    ? "bg-primary border-primary text-white shadow-lg shadow-red-900/30"
                    : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
                }`}
              >
                {icon} {label}
              </button>
            ))}

            <div className="flex-1" />

            {debouncedQ && (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span>Results for</span>
                <span className="text-white font-bold">"{debouncedQ}"</span>
                <span>· {pagination?.total ?? 0} found</span>
              </div>
            )}
          </div>
        </div>

        {/* Genre Filter (hide during search) */}
        {!debouncedQ && (
          <div
            className="flex gap-2 overflow-x-auto px-4 sm:px-8 lg:px-14 pb-2 mb-6"
            style={{ scrollbarWidth: "none" } as React.CSSProperties}
          >
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => { setActiveGenre(g); setPage(1); }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  activeGenre === g
                    ? "bg-primary border-primary text-white"
                    : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Results Header */}
        <div className="px-4 sm:px-8 lg:px-14 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!debouncedQ && (
              <>
                {activeGenre === "All" ? (
                  <span className="flex items-center gap-1.5 text-white font-bold text-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    {CONTENT_TYPES.find(t => t.key === contentType)?.label}
                  </span>
                ) : (
                  <span className="text-white font-bold text-lg">{activeGenre}</span>
                )}
                {pagination?.total !== undefined && (
                  <span className="text-zinc-500 text-sm">{pagination.total} titles</span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="px-4 sm:px-8 lg:px-14">
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Search className="w-12 h-12 text-zinc-700 mb-4" />
              <p className="text-white font-bold text-xl mb-2">
                {debouncedQ ? `No results for "${debouncedQ}"` : "No content found"}
              </p>
              <p className="text-zinc-500 text-sm">
                {debouncedQ ? "Try different keywords or change the content type" : "Try a different genre or category"}
              </p>
              {debouncedQ && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="mt-6 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div
              className={`grid gap-3 sm:gap-4 ${
                contentType === "drama"
                  ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              }`}
            >
              {items.map((item: any) => (
                <ContentCard key={item.id || item._id} item={item} onClick={() => handlePlay(item)} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10 px-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-10 h-10 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let p = i + 1;
                if (pagination.totalPages > 5) {
                  const half = Math.floor(5 / 2);
                  p = Math.max(1, Math.min(page - half + i, pagination.totalPages - 4 + i));
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                      page === p
                        ? "bg-primary text-white border border-primary"
                        : "border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="w-10 h-10 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <PublicFooter />

      <SubscriptionPlansModal
        isOpen={plansModalOpen}
        onClose={() => setPlansModalOpen(false)}
      />

      <style>{`
        * { scrollbar-width: none; }
        *::-webkit-scrollbar { display: none; }
        body { background: #030306; }
      `}</style>
    </div>
  );
}
