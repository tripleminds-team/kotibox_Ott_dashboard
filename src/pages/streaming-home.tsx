import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Play, Search, ChevronLeft, ChevronRight, X, Download, History, ChevronDown, User, Loader2 } from "lucide-react";
import { useGetHomePage } from "@/lib/api-client";

/* ─── BADGE COLORS ─── */
function Badge({ text }: { text: string }) {
  const colors: Record<string, string> = {
    NEW: "bg-[#E50914] text-white",
    HOT: "bg-orange-500 text-white",
    EXCLUSIVE: "bg-amber-500 text-black",
  };
  return (
    <span className={`absolute top-2 left-2 z-10 px-1.5 py-[2px] text-[9px] font-black rounded-sm uppercase tracking-wider ${colors[text] ?? "bg-zinc-700 text-white"}`}>
      {text}
    </span>
  );
}

/* ─── SHOW CARD ─── */
function ShowCard({ show }: { show: any }) {
  return (
    <Link
      href={`/show/${encodeURIComponent(show.title)}/episode/1`}
      className="group relative flex-shrink-0 w-[150px] sm:w-[170px] lg:w-[188px] cursor-pointer block"
      style={{ textDecoration: "none" }}
    >
      <div
        className="relative overflow-hidden bg-zinc-900 transition-all duration-300 group-hover:ring-[1.5px] group-hover:ring-[#E50914]/60 group-hover:shadow-[0_6px_28px_rgba(229,9,20,0.18)]"
        style={{ aspectRatio: "2/3", borderRadius: "4px" }}
      >
        <img
          src={show.thumbnail}
          alt={show.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 group-hover:brightness-110"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=450&fit=crop&q=80";
          }}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 flex flex-col justify-end p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#E50914] text-white text-[11px] font-bold rounded-sm">
            <Play className="w-3 h-3 fill-white" /> Play
          </button>
        </div>

        {show.badge && <Badge text={show.badge} />}
        {show.featured && <Badge text="FEATURED" />}
        {show.trending && <Badge text="TRENDING" />}
        {show.isNewContent && <Badge text="NEW" />}
      </div>

      <div className="mt-2 px-0.5">
        <p className="text-white text-xs sm:text-[13px] font-semibold leading-tight line-clamp-2 group-hover:text-zinc-200 transition-colors">
          {show.title}
        </p>
        {show.episodeCount !== undefined && show.episodeCount > 0 ? (
          <p className="text-[#E50914] text-[11px] mt-0.5 font-medium">EP.1 / EP.{show.episodeCount}</p>
        ) : (
          show.duration && <p className="text-zinc-500 text-[11px] mt-0.5">{Math.round(show.duration / 60)} min</p>
        )}
      </div>
    </Link>
  );
}

/* ─── SECTION TITLE ─── */
function SectionTitle({ title, emoji }: { title: string; emoji: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 px-4 sm:px-8 lg:px-12">
      <div className="w-[3px] h-6 bg-[#E50914] rounded-full flex-shrink-0" />
      <h2 className="text-white font-black text-xl sm:text-2xl tracking-tight leading-none">{title}</h2>
      <span className="text-lg leading-none">{emoji}</span>
      <div className="flex-1" />
      <a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors flex items-center gap-0.5 group/link">
        View all
        <ChevronRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
      </a>
    </div>
  );
}

/* ─── CONTENT ROW ─── */
function ContentRow({ title, emoji, shows }: { title: string; emoji?: string; shows: any[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === "left" ? -680 : 680, behavior: "smooth" });
  };

  return (
    <div className="mb-10">
      {emoji ? (
        <SectionTitle title={title} emoji={emoji} />
      ) : (
        <div className="flex items-center gap-3 mb-5 px-4 sm:px-8 lg:px-12">
          <div className="w-[3px] h-6 bg-[#E50914] rounded-full flex-shrink-0" />
          <h2 className="text-white font-black text-xl sm:text-2xl tracking-tight leading-none">{title}</h2>
          <div className="flex-1" />
          <a href="#" className="text-zinc-500 hover:text-white text-sm transition-colors flex items-center gap-0.5 group/link">
            View all
            <ChevronRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
          </a>
        </div>
      )}
      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className="hidden lg:flex absolute left-2 top-[38%] -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-zinc-900/90 border border-zinc-700 text-white opacity-0 group-hover/row:opacity-100 hover:bg-[#E50914] hover:border-[#E50914] transition-all shadow-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="hidden lg:flex absolute right-2 top-[38%] -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-zinc-900/90 border border-zinc-700 text-white opacity-0 group-hover/row:opacity-100 hover:bg-[#E50914] hover:border-[#E50914] transition-all shadow-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto px-4 sm:px-8 lg:px-12 pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── HERO ─── */
function Hero({ banners }: { banners: any[] }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  const go = (index: number) => {
    setFading(true);
    setTimeout(() => { setCurrent(index); setFading(false); }, 380);
  };

  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => go((current + 1) % banners.length), 7000);
      return () => clearInterval(timer);
    }
  }, [current, banners.length]);

  const banner = banners[current];

  if (!banner) return null;

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "88vh", minHeight: 520 }}>
      {/* BG Image */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}
        style={{ backgroundImage: `url(${banner.imageUrl || banner.thumbnail})`, backgroundSize: "cover", backgroundPosition: "center top" }}
      />
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/10" />
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-16 left-0 px-6 sm:px-10 lg:px-14 max-w-3xl">
        <div className={`transition-all duration-500 ${fading ? "opacity-0 translate-y-5" : "opacity-100 translate-y-0"}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[#E50914] text-xs font-bold uppercase tracking-widest">{banner.type?.toUpperCase() || "FEATURED"}</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-[70px] font-black text-white leading-none mb-2 tracking-tight drop-shadow-2xl">
            {banner.title}
          </h1>
          <div className="w-12 h-[2px] bg-[#E50914] mb-4" />
          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-7 max-w-lg line-clamp-2">
            {banner.description || banner.subtitle || ""}
          </p>
          <button className="flex items-center gap-2.5 px-9 py-3.5 bg-white hover:bg-zinc-100 text-black font-black rounded-sm text-sm tracking-wide transition-all active:scale-95 shadow-2xl">
            <Play className="w-4 h-4 fill-black" /> {banner.ctaText || "PLAY"}
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`transition-all duration-300 rounded-full ${i === current ? "w-8 h-[10px] bg-white" : "w-[10px] h-[10px] bg-white/30 hover:bg-white/60"}`}
          />
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={() => go((current - 1 + banners.length) % banners.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/15 hover:border-white/40 transition-all"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={() => go((current + 1) % banners.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/15 hover:border-white/40 transition-all"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}

/* ─── USER DROPDOWN ─── */
function UserDropdown({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="absolute top-[calc(100%+8px)] right-0 w-[265px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
      {/* Guest Info */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-zinc-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-none mb-1">Guest</p>
          <p className="text-zinc-500 text-[11px]">UID 897477548</p>
        </div>
        <button
          onClick={onSignIn}
          className="px-3 py-1.5 border border-[#E50914] text-[#E50914] hover:bg-[#E50914] hover:text-white text-xs font-semibold rounded-lg transition-all flex-shrink-0"
        >
          Log in
        </button>
      </div>

      <div className="mx-4 h-px bg-zinc-800" />

      {/* Coins & Bonus */}
      <div className="flex items-stretch px-4 py-4">
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-base leading-none">🪙</span>
          <span className="text-white font-bold text-base leading-none">0</span>
          <span className="text-zinc-500 text-xs">Coins</span>
        </div>
        <div className="w-px bg-zinc-800 my-1" />
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-base leading-none">🎁</span>
          <span className="text-white font-bold text-base leading-none">0</span>
          <span className="text-zinc-500 text-xs">Bonus</span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button className="w-full py-2.5 bg-[#E50914] hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-sm">
          Top Up
        </button>
      </div>
    </div>
  );
}

/* ─── SIGN IN MODAL ─── */
const COLLAGE_IMGS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=180&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=180&fit=crop&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=120&h=180&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=180&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=180&fit=crop&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=120&h=180&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=180&fit=crop&q=80",
  "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=120&h=180&fit=crop&q=80",
];

function SignInModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[560px] bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl flex max-h-[92vh]">

        {/* Left: Poster Collage */}
        <div className="hidden sm:block w-[185px] flex-shrink-0 relative overflow-hidden">
          {/* 2-col image grid fills full height */}
          <div className="absolute inset-0 grid grid-cols-2">
            {COLLAGE_IMGS.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="w-full h-full object-cover"
                style={{ minHeight: 0 }}
              />
            ))}
          </div>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-zinc-900/50" />
          {/* Logo centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 pointer-events-none">
            <div className="w-14 h-14 rounded-2xl bg-[#E50914] flex items-center justify-center shadow-2xl shadow-red-900/60">
              <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain" />
            </div>
            <span className="text-white font-black text-base tracking-tight drop-shadow-lg">StreamIT</span>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex-1 flex flex-col p-6 sm:p-7 overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <h2 className="text-white font-bold text-xl mb-6 pr-6">Sign in to StreamIT</h2>

          {/* Social Buttons 2x2 */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {/* Google */}
            <button className="flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 hover:border-zinc-600 rounded-xl text-white text-sm font-medium transition-all">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            {/* Facebook */}
            <button className="flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 hover:border-zinc-600 rounded-xl text-white text-sm font-medium transition-all">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
            {/* Apple */}
            <button className="flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 hover:border-zinc-600 rounded-xl text-white text-sm font-medium transition-all">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="white">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              Apple
            </button>
            {/* TikTok */}
            <button className="flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 hover:border-zinc-600 rounded-xl text-white text-sm font-medium transition-all">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="white">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.61a8.18 8.18 0 004.78 1.52V6.68a4.84 4.84 0 01-1.01.01z"/>
              </svg>
              TikTok
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-zinc-700/70" />
            <span className="text-zinc-500 text-sm">or</span>
            <div className="flex-1 h-px bg-zinc-700/70" />
          </div>

          {/* Email */}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full bg-zinc-800 border border-zinc-700 focus:border-zinc-500 text-white placeholder:text-zinc-500 px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors mb-3"
          />

          <button className="w-full py-3 bg-[#c0202a] hover:bg-[#a81820] text-white font-bold rounded-xl transition-colors text-sm mb-4">
            Continue
          </button>

          <p className="text-zinc-600 text-[11px] text-center leading-relaxed mt-auto">
            By continuing, I agree to the{" "}
            <a href="#" className="text-zinc-400 hover:text-white underline underline-offset-2">Service Agreement</a>
            {" "}and{" "}
            <a href="#" className="text-zinc-400 hover:text-white underline underline-offset-2">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── HEADER ─── */
const navLinks = [
  { label: "Home", submenu: null },
  { label: "Categories", submenu: ["Actors", "Actresses", "Identities", "Story Beats"] },
  { label: "Genres", submenu: null },
  { label: "New & Hot", submenu: null },
];

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Home");
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [mobileSubOpen, setMobileSubOpen] = useState<string | null>(null);
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
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [userDropdownOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-black/95 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.6)]"
            : "bg-gradient-to-b from-black/75 via-black/30 to-transparent"
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-10 xl:px-14">
          <div className="flex items-center justify-between h-[60px] lg:h-[70px]">

            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-6 lg:gap-8">
              {/* Logo */}
              <Link href="/" className="flex items-center flex-shrink-0 group">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-9 lg:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                />
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden lg:flex items-center gap-1">
                {navLinks.map(({ label, submenu }) => (
                  <div
                    key={label}
                    className="relative"
                    onMouseEnter={() => submenu && setHoveredNav(label)}
                    onMouseLeave={() => setHoveredNav(null)}
                  >
                    <button
                      onClick={() => setActiveNav(label)}
                      className={`relative flex items-center gap-1 px-3.5 py-2 text-[13.5px] font-medium rounded-lg transition-all duration-200 ${
                        activeNav === label
                          ? "text-white"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {label}
                      {submenu && (
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${hoveredNav === label ? "rotate-180" : ""}`} />
                      )}
                      {activeNav === label && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-[#E50914] rounded-full" />
                      )}
                    </button>

                    {/* Dropdown */}
                    {submenu && hoveredNav === label && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-44 bg-zinc-900/98 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                        <div className="py-1">
                          {submenu.map((item) => (
                            <Link
                              key={item}
                              href={`/browse/${item.toLowerCase().replace(/ /g, "-")}`}
                              className="flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/6 transition-all duration-150 group"
                              onClick={() => { setHoveredNav(null); setActiveNav("Categories"); }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-[#E50914] transition-colors flex-shrink-0" />
                              {item}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5">

              {/* Search */}
              <div className="relative flex items-center">
                <div
                  className={`flex items-center overflow-hidden transition-all duration-300 rounded-full border ${
                    searchOpen
                      ? "w-44 sm:w-56 bg-black/80 border-zinc-600 backdrop-blur-sm"
                      : "w-9 h-9 border-transparent"
                  }`}
                >
                  {searchOpen && (
                    <Search className="absolute left-3 w-3.5 h-3.5 text-zinc-400 pointer-events-none flex-shrink-0" />
                  )}
                  {searchOpen ? (
                    <input
                      autoFocus
                      placeholder="Titles, genres..."
                      className="w-full bg-transparent text-white text-sm pl-8 pr-7 py-2 focus:outline-none placeholder:text-zinc-600"
                      onBlur={() => setSearchOpen(false)}
                    />
                  ) : (
                    <button
                      onClick={() => setSearchOpen(true)}
                      className="w-9 h-9 flex items-center justify-center text-zinc-300 hover:text-white transition-colors rounded-full hover:bg-white/10"
                    >
                      <Search className="w-[18px] h-[18px]" />
                    </button>
                  )}
                  {searchOpen && (
                    <button
                      onMouseDown={() => setSearchOpen(false)}
                      className="absolute right-2.5 text-zinc-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Download */}
              <button className="hidden sm:flex w-9 h-9 items-center justify-center text-zinc-300 hover:text-white rounded-full hover:bg-white/10 transition-all duration-200 group relative">
                <Download className="w-[18px] h-[18px]" />
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] text-zinc-300 bg-black/80 px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Download
                </span>
              </button>

              {/* History */}
              <button className="hidden sm:flex w-9 h-9 items-center justify-center text-zinc-300 hover:text-white rounded-full hover:bg-white/10 transition-all duration-200 group relative">
                <History className="w-[18px] h-[18px]" />
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] text-zinc-300 bg-black/80 px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  History
                </span>
              </button>

              {/* Divider */}
              <div className="hidden sm:block w-px h-5 bg-zinc-700 mx-0.5" />

              {/* User Avatar + Dropdown */}
              <div className="relative" ref={avatarRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/10 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center flex-shrink-0 group-hover:border-zinc-400 transition-colors">
                    <User className="w-4 h-4 text-zinc-300" />
                  </div>
                  <ChevronDown className={`w-3 h-3 text-zinc-400 group-hover:text-white hidden sm:block transition-all duration-200 ${userDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {userDropdownOpen && (
                  <UserDropdown
                    onSignIn={() => { setUserDropdownOpen(false); setSignInModalOpen(true); }}
                  />
                )}
              </div>

              {/* Mobile Hamburger */}
              <button
                className="lg:hidden ml-0.5 w-9 h-9 flex items-center justify-center text-zinc-300 hover:text-white rounded-full hover:bg-white/10 transition-all"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <div className="flex flex-col gap-[5px] w-5">
                  <span className={`block h-[1.5px] bg-current rounded-full transition-all duration-300 origin-center ${mobileOpen ? "rotate-45 translate-y-[6.5px]" : ""}`} />
                  <span className={`block h-[1.5px] bg-current rounded-full transition-all duration-300 ${mobileOpen ? "opacity-0 scale-x-0" : ""}`} />
                  <span className={`block h-[1.5px] bg-current rounded-full transition-all duration-300 origin-center ${mobileOpen ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-black/95 backdrop-blur-xl border-t border-white/5 px-4 pt-3 pb-5">
            {/* Mobile Nav Links */}
            <div className="space-y-0.5 mb-4">
              {navLinks.map(({ label, submenu }) => (
                <div key={label}>
                  <button
                    onClick={() => {
                      if (submenu) {
                        setMobileSubOpen(mobileSubOpen === label ? null : label);
                      } else {
                        setActiveNav(label);
                        setMobileOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                      activeNav === label
                        ? "bg-white/10 text-white"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {activeNav === label && <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] flex-shrink-0" />}
                    <span className="flex-1 text-left">{label}</span>
                    {submenu && (
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileSubOpen === label ? "rotate-180" : ""}`} />
                    )}
                  </button>
                  {/* Mobile Submenu */}
                  {submenu && mobileSubOpen === label && (
                    <div className="ml-4 mt-0.5 space-y-0.5 pl-3 border-l border-zinc-800">
                      {submenu.map((item) => (
                        <Link
                          key={item}
                          href={`/browse/${item.toLowerCase().replace(/ /g, "-")}`}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                          onClick={() => { setActiveNav("Categories"); setMobileOpen(false); setMobileSubOpen(null); }}
                        >
                          <span className="w-1 h-1 rounded-full bg-zinc-600 flex-shrink-0" />
                          {item}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Mobile Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm">
                <Download className="w-4 h-4" /> Download
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm">
                <History className="w-4 h-4" /> History
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sign In Modal */}
      {signInModalOpen && (
        <SignInModal onClose={() => setSignInModalOpen(false)} />
      )}
    </>
  );
}

/* ─── QR CODE ─── */
function QRCode() {
  const p = [
    1,1,1,1,1,1,1,0,1,0,0,0,1,0,1,1,1,1,1,1,1,
    1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1,
    1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1,
    1,0,1,1,1,0,1,0,0,1,1,0,0,0,1,0,1,1,1,0,1,
    1,0,1,1,1,0,1,0,1,1,0,0,1,0,1,0,1,1,1,0,1,
    1,0,0,0,0,0,1,0,0,0,1,1,0,0,1,0,0,0,0,0,1,
    1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,
    0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0,
    1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,
    0,1,0,0,1,0,0,0,1,1,0,0,1,0,0,1,0,0,1,0,0,
    1,1,0,1,0,1,1,1,1,0,1,1,0,1,1,1,0,1,0,1,1,
    0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0,0,1,0,
    1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,
    1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,
    1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1,0,1,
    1,0,0,0,0,0,1,0,0,1,1,0,0,0,1,0,0,0,0,0,1,
    1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,
  ];
  return (
    <div className="w-[100px] h-[82px] bg-white p-1.5 rounded-sm">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(21, 1fr)", gap: "0.5px" }} className="w-full h-full">
        {p.map((cell, i) => <div key={i} style={{ background: cell ? "#000" : "#fff" }} />)}
      </div>
    </div>
  );
}

/* ─── FOOTER ─── */
export const socialIcons = [
  { label: "Facebook", path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
  { label: "YouTube", path: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.47A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
  { label: "Instagram", path: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2z" },
];

export function PublicFooter() {
  return (
    <footer className="bg-[#050505] border-t border-white/5 mt-6 pt-12 pb-8">
      <div className="px-6 sm:px-10 lg:px-14">
        <div className="flex flex-col lg:flex-row gap-12 justify-between mb-10">

          {/* Brand */}
          <div className="lg:w-56">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#E50914] flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
              <span className="text-white font-black text-2xl tracking-tight">StreamIT</span>
            </div>
            <p className="text-zinc-600 text-xs leading-relaxed mb-5">
              Your premium destination for short dramas, romance &amp; thrillers.
            </p>
            <div className="flex items-center gap-2.5">
              {socialIcons.map((icon) => (
                <a
                  key={icon.label}
                  href="#"
                  aria-label={icon.label}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-500 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={icon.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-14">
            <div>
              <h4 className="text-white font-semibold text-xs mb-4 uppercase tracking-widest">About</h4>
              <ul className="space-y-3">
                {["Terms of Service", "Privacy Policy", "Contact Us"].map((l) => (
                  <li key={l}><a href="#" className="text-zinc-600 hover:text-white text-sm transition-colors">{l}</a></li>
                ))}
                <li><p className="text-zinc-700 text-xs mt-1">Service: Mon–Sun, 12am–8am ET</p></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-xs mb-4 uppercase tracking-widest">Support</h4>
              <ul className="space-y-3">
                {["Feedback", "Media & PR", "Help Center", "FAQ"].map((l) => (
                  <li key={l}><a href="#" className="text-zinc-600 hover:text-white text-sm transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Download */}
          <div className="flex flex-col items-start lg:items-center gap-3">
            <h4 className="text-white font-semibold text-xs uppercase tracking-widest">Download</h4>
            <QRCode />
            <div className="text-center">
              <p className="text-white text-xs font-bold">Unlock Episodes Free</p>
              <p className="text-zinc-600 text-[11px]">Only in App</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-zinc-700 text-xs">© 2026 StreamIT · Built by Triple Minds. All Rights Reserved.</p>
          <div className="flex items-center gap-5">
            {["Privacy", "Terms", "Cookies"].map((l) => (
              <a key={l} href="#" className="text-zinc-700 hover:text-zinc-400 text-xs transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── MAIN PAGE ─── */
export default function StreamingHomePage() {
  const [activeTab, setActiveTab] = useState<'drama' | 'movie'>('drama');
  const { data, isLoading, error } = useGetHomePage({ platform: "web", tab: activeTab });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-red-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl">Error loading home page</p>
          <p className="text-gray-500">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const banners = data?.data?.banners || [];
  const sections = data?.data?.sections || [];

  return (
    <div className="min-h-screen bg-black">
      <PublicHeader />
      <main className="pt-20">
        {/* Tab selector */}
        <div className="flex justify-center gap-8 mb-8 px-4">
          <button
            onClick={() => setActiveTab('drama')}
            className={`text-xl font-bold transition-all ${activeTab === 'drama' ? 'text-white border-b-2 border-pink-500' : 'text-zinc-500'}`}
          >
            Drama
          </button>
          <button
            onClick={() => setActiveTab('movie')}
            className={`text-xl font-bold transition-all ${activeTab === 'movie' ? 'text-white border-b-2 border-pink-500' : 'text-zinc-500'}`}
          >
            Movies
          </button>
        </div>

        {banners.length > 0 && (
          <Hero banners={banners} />
        )}
        <div className="pt-8 pb-2">
          {/* Main sections */}
          {sections.map((section: any, index: number) => (
            <ContentRow 
              key={section.key || index} 
              title={section.title} 
              emoji={section.emoji} 
              shows={section.shows} 
            />
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
