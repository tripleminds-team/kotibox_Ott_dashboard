import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Play, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { loginClient, registerClient, getImageUrl } from "@/lib/api-client";
import { useSettings } from "@/contexts/SettingsContext";
import { useTheme } from "next-themes";

export default function PublicAuthPage() {
  const [location, setLocation] = useLocation();
  const isLogin = location === "/login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { settings } = useSettings();
  const { resolvedTheme } = useTheme();

  const getLogoUrl = () => {
    if (resolvedTheme === "dark" && settings.darkLogoUrl) return getImageUrl(settings.darkLogoUrl);
    if (resolvedTheme === "light" && settings.lightLogoUrl) return getImageUrl(settings.lightLogoUrl);
    return settings.logoUrl ? getImageUrl(settings.logoUrl) : "";
  };
  const logoUrl = getLogoUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const res = await loginClient({ email, password });
        localStorage.setItem("accessToken", res.accessToken);
        localStorage.setItem("user", JSON.stringify({ id: res.userId, name: res.name || email.split("@")[0], subscriptionPlan: res.subscriptionPlan || 'free', subscriptionStatus: res.subscriptionStatus || 'inactive' }));
        setLocation("/");
        window.location.reload();
      } else {
        const res = await registerClient({ email, password, name });
        localStorage.setItem("accessToken", res.accessToken);
        localStorage.setItem("user", JSON.stringify({ id: res.userId, name: res.name || name, subscriptionPlan: res.subscriptionPlan || 'free', subscriptionStatus: res.subscriptionStatus || 'inactive' }));
        setLocation("/");
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030306] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-primary/30">
      {/* Background Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(229,9,20,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />

      {/* Back button */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-all bg-white/5 border border-zinc-900 hover:border-zinc-800 px-4 py-2.5 rounded-xl z-20">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </Link>

      <div className="w-full max-w-[500px] bg-[#0c0c14]/90 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl p-8 sm:p-10 relative z-10 hover:border-red-950/40 hover:shadow-red-950/10 transition-all duration-300">
        
        {/* Branding header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-6 group">
            {logoUrl ? (
              <img src={logoUrl} alt={settings.platformName || "StreamIT"} className="h-10 w-auto object-contain group-hover:scale-105 transition-transform" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/50 group-hover:scale-105 transition-transform">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
                <span className="text-white font-black text-2xl tracking-tight font-sans">{settings.platformName || "StreamIT"}</span>
              </>
            )}
          </Link>
          <h2 className="text-white font-black text-2xl tracking-tight mb-2">
            {isLogin ? "Welcome Back" : "Create Your Account"}
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium">
            {isLogin ? "Enjoy unlimited access to premium OTT content." : "Join us and start streaming the best movies and shows."}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-primary/10 border border-primary/20 rounded-2xl text-primary text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-zinc-950 border border-zinc-900 text-white placeholder:text-zinc-650 px-4 py-3.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          )}

          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full bg-zinc-950 border border-zinc-900 text-white placeholder:text-zinc-655 px-4 py-3.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-zinc-950 border border-zinc-900 text-white placeholder:text-zinc-655 px-4 py-3.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full mt-3 py-3.5 bg-primary hover:bg-primary/90 text-white font-extrabold rounded-xl transition-all text-xs flex justify-center items-center h-[46px] shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Log In" : "Register Now")}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-900/60 text-center">
          <p className="text-zinc-550 text-xs font-medium">
            {isLogin ? "New to the platform?" : "Already have an account?"}{" "}
            <Link
              href={isLogin ? "/register" : "/login"}
              className="text-primary hover:underline font-bold transition-all ml-1"
            >
              {isLogin ? "Sign Up Free" : "Log In"}
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
