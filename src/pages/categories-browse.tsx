import { useState } from "react";
import { Link, useParams } from "wouter";
import { Play, ChevronRight, ChevronDown, Eye, Heart } from "lucide-react";
import { PublicHeader, PublicFooter } from "./streaming-home";

const TABS = ["Actors", "Actresses", "Identities", "Story Beats"] as const;
type TabKey = (typeof TABS)[number];

interface MovieItem {
  id: number;
  title: string;
  desc: string;
  views: string;
  likes: string;
  thumbnail: string;
  badge?: string;
}

const CATEGORY_DATA: Record<TabKey, { tags: string[]; movies: MovieItem[] }> = {
  Actors: {
    tags: [
      "Cameron Saffle", "Thomas William King", "Roman Chsherbakov", "Ian Schutzman",
      "J.J. Michaels", "Aaron Oberst", "Adam Daniel", "James Oblak", "David James",
      "Samuel O Morgan", "Tim Stein", "Griffin Blazi", "Ben Armstrong", "Tristan Rewald",
      "Andrew Fultz", "Harrison Harber", "Samuel Irwin Hill", "Justin Daniel Price",
      "Ali Badalov", "Carter Sirianni", "Evan Adams", "Adam Huss", "Evan Wick",
    ],
    movies: [
      {
        id: 1, title: "Son in Law's Revenge",
        desc: "After being mistreated by his wife's family for years, Leo discovers that he is the heir to a vast fortune. Now it's time — for revenge!",
        views: "14.6M", likes: "161.5K", badge: "Original",
        thumbnail: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 2, title: "The CEO's Contract Wife",
        desc: "Jasper Tate needed a wife urgently, while Chloe Adams needed money urgently. Seeking help from the same source leads the two needy people together.",
        views: "117.3M", likes: "1.1M", badge: "Original",
        thumbnail: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 3, title: "Do Me Over",
        desc: "Sarah Loren is a widow with a teenage son. Ethan Cole is a big shot CEO who wants to acquire her company. He is arrogant, brilliant, and unnecessarily good looking.",
        views: "89.2M", likes: "678K", badge: "Original",
        thumbnail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 4, title: "The Boss Affair",
        desc: "Lucy Harris and Luke Walker had an affair, but that was before she found out who her boss really was. The truth changes everything.",
        views: "56.7M", likes: "432K",
        thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 5, title: "The Dark CEO",
        desc: "A ruthless billionaire. A woman who refuses to bow. When two worlds collide, only one heart survives.",
        views: "67.3M", likes: "723K", badge: "Original",
        thumbnail: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 6, title: "Alpha's Claim",
        desc: "The most feared Alpha claims the one woman who refuses to be owned. A battle of will and want begins.",
        views: "91.2M", likes: "1.2M",
        thumbnail: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=240&h=340&fit=crop&q=80",
      },
    ],
  },
  Actresses: {
    tags: [
      "Jennifer Mills", "Sofia Rodriguez", "Emma Chen", "Lily Thompson", "Grace Williams",
      "Mia Johnson", "Aria Davis", "Chloe Brown", "Zoe Martinez", "Isabella Wilson",
      "Olivia Taylor", "Ava Anderson", "Sophia Thomas", "Charlotte Jackson", "Amelia White",
      "Harper Lee", "Evelyn Harris", "Abigail Martin",
    ],
    movies: [
      {
        id: 7, title: "Her Secret Billionaire",
        desc: "A young woman discovers her new boss is the man she vowed to hate forever. Secrets unravel one meeting at a time.",
        views: "23.4M", likes: "345K", badge: "Original",
        thumbnail: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 8, title: "Forbidden Love",
        desc: "Two hearts torn between duty and desire in a world where their love is considered impossible by everyone around them.",
        views: "45.8M", likes: "512K",
        thumbnail: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 9, title: "The Alpha's Omega",
        desc: "She never believed in mates until destiny placed her in the arms of the most powerful Alpha in the region.",
        views: "78.1M", likes: "891K", badge: "Original",
        thumbnail: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 10, title: "Royal Deception",
        desc: "A commoner must pretend to be royalty, but falls for the real prince along the way. Love was never part of the plan.",
        views: "34.6M", likes: "267K",
        thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 11, title: "Broken Vows",
        desc: "She thought she was marrying the love of her life. She didn't know he was already promised to another.",
        views: "52.3M", likes: "489K", badge: "Original",
        thumbnail: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 12, title: "The Midnight Heir",
        desc: "By day she's a struggling artist. By night, she's heir to an empire she never knew existed.",
        views: "41.9M", likes: "367K",
        thumbnail: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=240&h=340&fit=crop&q=80",
      },
    ],
  },
  Identities: {
    tags: [
      "Billionaire", "CEO", "Alpha", "Werewolf", "Royalty", "Secret Heir",
      "Mafia Boss", "Bad Boy", "Sweet Girl", "Omega", "Prince", "Princess",
      "Villain", "Hacker", "Vampire", "Shifter", "Doctor", "Soldier",
    ],
    movies: [
      {
        id: 13, title: "Heir to Everything",
        desc: "He was raised in poverty, not knowing he was heir to a billion-dollar empire. The truth changes who he is.",
        views: "44.5M", likes: "389K", badge: "Original",
        thumbnail: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 14, title: "Mafia's Obsession",
        desc: "She stumbled into the wrong world. Now the most dangerous man alive won't let her leave. Ever.",
        views: "103.7M", likes: "1.5M", badge: "Original",
        thumbnail: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 15, title: "The Vampire King",
        desc: "Immortality was his curse until she walked in. Now he'd burn the world down just to keep her close.",
        views: "86.4M", likes: "1.0M",
        thumbnail: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 16, title: "Bad Boy Redeemed",
        desc: "Everyone gave up on him. She refused to. Sometimes love is the only thing that can save a broken soul.",
        views: "59.1M", likes: "641K", badge: "Original",
        thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 17, title: "Doctor's Secret",
        desc: "He's her doctor, she's his patient. The rules are clear. Their hearts didn't get the memo.",
        views: "37.8M", likes: "312K",
        thumbnail: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 18, title: "The Royal Soldier",
        desc: "He guards her with his life. She rules with her heart. In war, love is the greatest weapon.",
        views: "48.2M", likes: "427K", badge: "Original",
        thumbnail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&h=340&fit=crop&q=80",
      },
    ],
  },
  "Story Beats": {
    tags: [
      "Revenge", "Forbidden Love", "Enemies to Lovers", "Fake Dating", "Second Chance",
      "Arranged Marriage", "Hidden Identity", "Kidnapping", "Betrayal", "Redemption",
      "Found Family", "Love Triangle", "One Night Stand", "Forced Proximity",
      "Boss & Employee", "Age Gap", "Slow Burn",
    ],
    movies: [
      {
        id: 19, title: "Fake Bride, Real Love",
        desc: "They agreed to fake their engagement. Nobody warned them about falling for real. Some games are impossible to win.",
        views: "55.9M", likes: "634K", badge: "Original",
        thumbnail: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 20, title: "Enemy's Kiss",
        desc: "Their families have been rivals for decades. One stolen kiss changes everything neither of them expected.",
        views: "38.4M", likes: "441K",
        thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 21, title: "Second Chance Romance",
        desc: "She left without a word. Ten years later, he's her new boss and the wounds are just as fresh.",
        views: "72.6M", likes: "867K", badge: "Original",
        thumbnail: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 22, title: "The Arranged Marriage",
        desc: "Their parents arranged it. Their hearts complicated it. Neither expected to fall, but here they are.",
        views: "81.3M", likes: "945K",
        thumbnail: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 23, title: "Slow Burn Billionaire",
        desc: "She worked for him for two years. He noticed her on day one. Patience is its own kind of desire.",
        views: "64.7M", likes: "758K", badge: "Original",
        thumbnail: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=240&h=340&fit=crop&q=80",
      },
      {
        id: 24, title: "Betrayal & Beyond",
        desc: "He was her best friend, her first love, and the man who broke her. Can trust be rebuilt from ash?",
        views: "43.5M", likes: "398K",
        thumbnail: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240&h=340&fit=crop&q=80",
      },
    ],
  },
};

function urlToTab(slug: string): TabKey {
  return TABS.find((t) => t.toLowerCase().replace(/ /g, "-") === slug) ?? "Actors";
}

function MovieCard({ movie }: { movie: MovieItem }) {
  return (
    <Link
      href={`/show/${encodeURIComponent(movie.title)}/episode/1`}
      className="flex gap-3 sm:gap-4 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer"
      style={{ textDecoration: "none" }}
    >
      {/* Poster */}
      <div className="relative flex-shrink-0 w-[110px] sm:w-[130px]">
        <img
          src={movie.thumbnail}
          alt={movie.title}
          className="w-full h-full object-cover"
          style={{ aspectRatio: "2/3", minHeight: "165px" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&h=340&fit=crop&q=80";
          }}
        />
        {movie.badge && (
          <span className="absolute top-2 left-0 bg-[#E50914] text-white text-[9px] font-black px-2 py-0.5 uppercase tracking-wider">
            {movie.badge}
          </span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between py-3 pr-3 sm:pr-4 flex-1 min-w-0">
        <div>
          <h3 className="text-white font-bold text-sm sm:text-[15px] leading-snug mb-2 line-clamp-2 group-hover:text-[#E50914] transition-colors">
            {movie.title}
          </h3>
          <p className="text-zinc-500 text-xs sm:text-[13px] leading-relaxed line-clamp-3">
            {movie.desc}
          </p>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-zinc-600 text-xs">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {movie.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" /> {movie.likes}
            </span>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-600 group-hover:border-[#E50914] group-hover:bg-[#E50914]/10 text-zinc-300 group-hover:text-white text-xs font-semibold rounded-lg transition-all duration-200">
            <Play className="w-3 h-3 fill-current" /> Play
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CategoriesBrowsePage() {
  const params = useParams<{ tab: string }>();
  const activeTab = urlToTab(params.tab ?? "actors");
  const data = CATEGORY_DATA[activeTab];

  const [showAllTags, setShowAllTags] = useState(false);
  const visibleTags = showAllTags ? data.tags : data.tags.slice(0, 14);

  return (
    <div className="min-h-screen bg-black">
      <PublicHeader />

      <div className="pt-[70px]">
        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border-b border-zinc-800/60 px-4 sm:px-8 lg:px-14 py-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(229,9,20,0.08),transparent_60%)]" />
          <div className="relative">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-4">
              <Link href="/" className="hover:text-zinc-400 transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-zinc-400">Categories</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white font-medium">{activeTab}</span>
            </div>
            <h1 className="text-white text-2xl sm:text-3xl font-black tracking-tight">
              Browse by{" "}
              <span className="text-[#E50914]">{activeTab}</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1.5">
              Discover shows featuring your favourite {activeTab.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-zinc-950 border-b border-zinc-800/60 sticky top-[70px] z-30">
          <div className="px-4 sm:px-8 lg:px-14">
            <div className="flex items-center overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {TABS.map((tab) => (
                <Link
                  key={tab}
                  href={`/browse/${tab.toLowerCase().replace(/ /g, "-")}`}
                  className={`relative flex-shrink-0 px-4 sm:px-5 py-4 text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                    tab === activeTab
                      ? "text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab}
                  {tab === activeTab && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#E50914] rounded-full" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Tags Section */}
        <div className="px-4 sm:px-8 lg:px-14 py-6 border-b border-zinc-900">
          <div className="flex flex-wrap gap-2 items-center">
            {visibleTags.map((tag) => (
              <button
                key={tag}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 hover:text-white text-xs sm:text-sm rounded-lg transition-all duration-150 font-medium"
              >
                {tag}
              </button>
            ))}
            {data.tags.length > 14 && (
              <button
                onClick={() => setShowAllTags(!showAllTags)}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white text-xs rounded-lg transition-all duration-150"
              >
                {showAllTags ? "Less" : `+${data.tags.length - 14} more`}
                <ChevronDown className={`w-3 h-3 transition-transform ${showAllTags ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
        </div>

        {/* Movies Grid */}
        <div className="px-4 sm:px-8 lg:px-14 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-[3px] h-5 bg-[#E50914] rounded-full flex-shrink-0" />
            <h2 className="text-white font-black text-lg sm:text-xl tracking-tight">
              Movies of All {activeTab}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {data.movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {/* Load More */}
          <div className="flex justify-center mt-10">
            <button className="flex items-center gap-2 px-8 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white text-sm font-medium rounded-xl transition-all duration-200 hover:bg-white/5">
              Load More
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
