import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Loader2, AlertCircle, ChevronLeft, Clock } from "lucide-react";
import { useGetPageBySlug } from "@/lib/api-client";
import { PublicHeader, PublicFooter } from "@/pages/streaming-home";

export default function PublicPagePage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [plansModalOpen, setPlansModalOpen] = useState(false);

  const { data, isLoading, error } = useGetPageBySlug(slug || "");

  const page = data?.page || data?.data || (data && !data.data && !data.page ? data : null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch {}
  }, []);

  useEffect(() => {
    if (page) {
      document.title = page.metaTitle || `${page.title} | Triple Minds`;
      
      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', page.metaDescription || `Read ${page.title} on Triple Minds.`);

      // Update OpenGraph / Twitter meta tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', page.metaTitle || page.title);

      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', page.metaDescription || `Read ${page.title} on Triple Minds.`);

      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (twitterTitle) twitterTitle.setAttribute('content', page.metaTitle || page.title);

      const twitterDesc = document.querySelector('meta[name="twitter:description"]');
      if (twitterDesc) twitterDesc.setAttribute('content', page.metaDescription || `Read ${page.title} on Triple Minds.`);
    }
  }, [page]);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    setUser(null);
    setLocation("/");
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#030306] text-white font-sans selection:bg-primary/30">
      {/* Ambient background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(229,9,20,0.05),transparent_50%)] pointer-events-none" />

      <PublicHeader
        activeTab="home"
        setActiveTab={(tab) => {
          if (tab === "tvshows") setLocation("/tv-shows-browse");
          else setLocation("/");
        }}
        onSignIn={() => setLocation("/login")}
        onSignOut={handleSignOut}
        user={user}
        onSubscribeClick={() => setPlansModalOpen(true)}
      />

      <main className="pt-28 pb-24 min-h-[70vh] relative">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-40">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-zinc-500 text-sm font-medium">Loading page...</p>
            </div>
          </div>
        )}

        {/* Not found */}
        {!isLoading && (error || !page) && (
          <div className="max-w-2xl mx-auto px-6 py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-9 w-9 text-zinc-600" />
            </div>
            <h1 className="text-2xl font-black text-white mb-3 tracking-tight">Page Not Found</h1>
            <p className="text-zinc-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              The page you're looking for doesn't exist or hasn't been published yet.
              Check back later or explore other content.
            </p>
            <button
              onClick={() => setLocation("/")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-primary/30"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Home
            </button>
          </div>
        )}

        {/* Page content */}
        {!isLoading && page && (
          <div className="max-w-3xl mx-auto px-6 sm:px-10">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-8">
              <button
                onClick={() => setLocation("/")}
                className="hover:text-white transition-colors"
              >
                Home
              </button>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-400">{page.title}</span>
            </nav>

            {/* Page header */}
            <header className="mb-10 pb-8 border-b border-zinc-900">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4 leading-tight">
                {page.title}
              </h1>
              {(page.updatedAt || page.createdAt) && (
                <div className="flex items-center gap-2 text-zinc-600 text-xs font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Last updated: {formatDate(page.updatedAt || page.createdAt)}</span>
                </div>
              )}
            </header>

            {/* HTML content */}
            <div
              className="
                text-zinc-300 text-sm sm:text-base leading-relaxed
                [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-white [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:leading-tight
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-3 [&_h2]:mt-8
                [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-zinc-200 [&_h3]:mb-2 [&_h3]:mt-6
                [&_p]:text-zinc-400 [&_p]:leading-relaxed [&_p]:mb-4
                [&_a]:text-primary [&_a]:font-semibold hover:[&_a]:underline
                [&_strong]:text-white [&_strong]:font-semibold
                [&_em]:text-zinc-300 [&_em]:italic
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1.5
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1.5
                [&_li]:text-zinc-400 [&_li]:leading-relaxed
                [&_li_strong]:text-zinc-200
                [&_hr]:border-zinc-800 [&_hr]:my-8
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-5 [&_blockquote]:my-6 [&_blockquote]:text-zinc-400 [&_blockquote]:italic
                [&_code]:text-primary [&_code]:bg-zinc-900 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
                [&_pre]:bg-zinc-900 [&_pre]:border [&_pre]:border-zinc-800 [&_pre]:rounded-xl [&_pre]:p-5 [&_pre]:my-6 [&_pre]:overflow-x-auto
                [&_img]:rounded-xl [&_img]:border [&_img]:border-zinc-800 [&_img]:my-6 [&_img]:max-w-full
                [&_table]:w-full [&_table]:border-collapse [&_table]:my-6
                [&_th]:border [&_th]:border-zinc-800 [&_th]:bg-zinc-900 [&_th]:text-white [&_th]:p-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-sm
                [&_td]:border [&_td]:border-zinc-800 [&_td]:p-3 [&_td]:text-zinc-400 [&_td]:text-sm
              "
              dangerouslySetInnerHTML={{ __html: page.content || "" }}
            />

            {/* Back button at bottom */}
            <div className="mt-16 pt-8 border-t border-zinc-900 flex items-center justify-between">
              <button
                onClick={() => setLocation("/")}
                className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-bold transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back to Home
              </button>
              <div className="flex items-center gap-4 text-xs text-zinc-700 font-medium">
                <button onClick={() => setLocation("/page/privacy-policy")} className="hover:text-zinc-400 transition-colors">Privacy Policy</button>
                <button onClick={() => setLocation("/page/terms-and-conditions")} className="hover:text-zinc-400 transition-colors">Terms</button>
                <button onClick={() => setLocation("/page/contact")} className="hover:text-zinc-400 transition-colors">Contact</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
