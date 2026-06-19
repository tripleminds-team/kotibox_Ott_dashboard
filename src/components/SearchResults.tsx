import { useState } from 'react';
import { Search, Loader2, Film, Tv, Smartphone, Play } from 'lucide-react';
import { useGetWebBrowse, getImageUrl } from '@/lib/api-client';

interface SearchResultsProps {
  query: string;
  type?: 'movie' | 'show' | 'drama';
  onItemClick?: (item: any) => void;
}

export default function SearchResults({ query, type = 'movie', onItemClick }: SearchResultsProps) {
  const [activeType, setActiveType] = useState<'movie' | 'show' | 'drama'>(type);

  const { data: browseData, isLoading } = useGetWebBrowse({
    type: activeType,
    search: query.trim() || undefined,
    limit: 24,
  }, !!query.trim());

  const items: any[] = browseData?.items || [];

  const tabs = [
    { key: 'movie' as const, label: 'Movies', icon: <Film className="w-3.5 h-3.5" /> },
    { key: 'show' as const, label: 'TV Shows', icon: <Tv className="w-3.5 h-3.5" /> },
    { key: 'drama' as const, label: 'Short Drama', icon: <Smartphone className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-full">
      {/* Type filter */}
      <div className="flex items-center gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveType(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeType === t.key
                ? 'bg-primary text-white'
                : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {!query.trim() && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <Search className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-sm font-medium">Start typing to search titles...</p>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && query.trim() && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <Search className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-sm font-medium">No results found for "{query}"</p>
          <p className="text-xs text-zinc-600 mt-1">Try a different keyword or check spelling.</p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {items.map((item: any) => (
            <button
              key={item.id || item._id}
              onClick={() => onItemClick?.(item)}
              className="group relative text-left cursor-pointer"
            >
              <div
                className="relative overflow-hidden rounded-xl bg-zinc-900 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl"
                style={{ aspectRatio: item.type === 'drama' || item.totalEpisodes ? '9/16' : '16/9' }}
              >
                <img
                  src={item.poster ? getImageUrl(item.poster) : (item.backdrop ? getImageUrl(item.backdrop) : '')}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.style.backgroundColor = '#111'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
