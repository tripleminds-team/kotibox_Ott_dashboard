import { useState, useMemo } from "react";
import { Folder, Trash2, Search, ChevronLeft, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FolderItem = {
  name: string;
  count: number;
};

type MediaFile = {
  id: string;
  name: string;
  url: string;
  size: string;
  folder: string;
};

const FOLDERS: FolderItem[] = [
  { name: "Ads", count: 12 },
  { name: "Banner", count: 24 },
  { name: "Cast & Crew", count: 45 },
  { name: "Constant", count: 8 },
  { name: "Genres", count: 15 },
  { name: "Logos", count: 20 },
  { name: "Short Drama", count: 18 },
  { name: "Users", count: 89 },
  { name: "Video", count: 35 },
];

// Dummy media files per folder
const DUMMY_FILES: Record<string, MediaFile[]> = {
  Banner: [
    { id: "1", name: "broken-wings-mobile.jpg", url: "https://picsum.photos/seed/bwm/300/200", size: "245 KB", folder: "Banner" },
    { id: "2", name: "broken-wings-web-banner.jpg", url: "https://picsum.photos/seed/bww/300/200", size: "512 KB", folder: "Banner" },
    { id: "3", name: "glass-room-banner.jpg", url: "https://picsum.photos/seed/grb/300/200", size: "389 KB", folder: "Banner" },
    { id: "4", name: "glass-room-mobile.jpg", url: "https://picsum.photos/seed/grm/300/200", size: "198 KB", folder: "Banner" },
    { id: "5", name: "love-in-seoul-banner.png", url: "https://picsum.photos/seed/lisb/300/200", size: "620 KB", folder: "Banner" },
    { id: "6", name: "love-in-seoul-mobile.jpg", url: "https://picsum.photos/seed/lism/300/200", size: "312 KB", folder: "Banner" },
    { id: "7", name: "shadow-blade-banner.jpg", url: "https://picsum.photos/seed/sbb/300/200", size: "445 KB", folder: "Banner" },
    { id: "8", name: "shadow-blade-mobile.jpg", url: "https://picsum.photos/seed/sbm/300/200", size: "230 KB", folder: "Banner" },
    { id: "9", name: "neon-city-banner.jpg", url: "https://picsum.photos/seed/ncb/300/200", size: "580 KB", folder: "Banner" },
    { id: "10", name: "neon-city-mobile.png", url: "https://picsum.photos/seed/ncm/300/200", size: "310 KB", folder: "Banner" },
    { id: "11", name: "dark-hunter-banner.jpg", url: "https://picsum.photos/seed/dhb/300/200", size: "490 KB", folder: "Banner" },
    { id: "12", name: "dark-hunter-mobile.jpg", url: "https://picsum.photos/seed/dhm/300/200", size: "275 KB", folder: "Banner" },
  ],
  Ads: [
    { id: "27", name: "premium-ad-banner.jpg", url: "https://picsum.photos/seed/ad1/300/200", size: "125 KB", folder: "Ads" },
    { id: "28", name: "subscription-promo.png", url: "https://picsum.photos/seed/ad2/300/200", size: "210 KB", folder: "Ads" },
    { id: "29", name: "movie-ad-720p.jpg", url: "https://picsum.photos/seed/ad3/300/200", size: "180 KB", folder: "Ads" },
    { id: "30", name: "side-banner-ad.jpg", url: "https://picsum.photos/seed/ad4/300/200", size: "95 KB", folder: "Ads" },
    { id: "31", name: "footer-ad-banner.png", url: "https://picsum.photos/seed/ad5/300/200", size: "143 KB", folder: "Ads" },
  ],
  Genres: [
    { id: "32", name: "action-genre-cover.jpg", url: "https://picsum.photos/seed/gen1/300/200", size: "220 KB", folder: "Genres" },
    { id: "33", name: "comedy-genre-banner.png", url: "https://picsum.photos/seed/gen2/300/200", size: "195 KB", folder: "Genres" },
    { id: "34", name: "drama-genre-thumb.jpg", url: "https://picsum.photos/seed/gen3/300/200", size: "240 KB", folder: "Genres" },
    { id: "35", name: "horror-genre-cover.jpg", url: "https://picsum.photos/seed/gen4/300/200", size: "310 KB", folder: "Genres" },
    { id: "36", name: "romance-genre.png", url: "https://picsum.photos/seed/gen5/300/200", size: "175 KB", folder: "Genres" },
    { id: "37", name: "thriller-genre-banner.jpg", url: "https://picsum.photos/seed/gen6/300/200", size: "265 KB", folder: "Genres" },
  ],
  Logos: [
    { id: "38", name: "streamvault-logo-dark.png", url: "https://picsum.photos/seed/lg1/300/200", size: "45 KB", folder: "Logos" },
    { id: "39", name: "streamvault-logo-light.png", url: "https://picsum.photos/seed/lg2/300/200", size: "42 KB", folder: "Logos" },
    { id: "40", name: "streamvault-icon.svg", url: "https://picsum.photos/seed/lg3/300/200", size: "12 KB", folder: "Logos" },
    { id: "41", name: "app-icon-1024.png", url: "https://picsum.photos/seed/lg4/300/200", size: "380 KB", folder: "Logos" },
    { id: "42", name: "favicon-32x32.png", url: "https://picsum.photos/seed/lg5/300/200", size: "8 KB", folder: "Logos" },
  ],
  "Cast & Crew": [
    { id: "47", name: "actor-profile-001.jpg", url: "https://picsum.photos/seed/cc1/300/200", size: "156 KB", folder: "Cast & Crew" },
    { id: "48", name: "actress-profile-002.jpg", url: "https://picsum.photos/seed/cc2/300/200", size: "178 KB", folder: "Cast & Crew" },
    { id: "49", name: "director-photo.jpg", url: "https://picsum.photos/seed/cc3/300/200", size: "142 KB", folder: "Cast & Crew" },
    { id: "50", name: "producer-headshot.png", url: "https://picsum.photos/seed/cc4/300/200", size: "210 KB", folder: "Cast & Crew" },
    { id: "51", name: "crew-behind-scenes.jpg", url: "https://picsum.photos/seed/cc5/300/200", size: "520 KB", folder: "Cast & Crew" },
  ],
  Users: [
    { id: "52", name: "default-avatar.png", url: "https://picsum.photos/seed/usr1/300/200", size: "32 KB", folder: "Users" },
    { id: "53", name: "user-avatar-001.jpg", url: "https://picsum.photos/seed/usr2/300/200", size: "89 KB", folder: "Users" },
    { id: "54", name: "user-avatar-002.jpg", url: "https://picsum.photos/seed/usr3/300/200", size: "76 KB", folder: "Users" },
    { id: "55", name: "premium-badge.png", url: "https://picsum.photos/seed/usr4/300/200", size: "15 KB", folder: "Users" },
  ],
  "Short Drama": [
    { id: "60", name: "short-drama-thumb-01.jpg", url: "https://picsum.photos/seed/sd1/300/200", size: "230 KB", folder: "Short Drama" },
    { id: "61", name: "short-drama-banner-02.jpg", url: "https://picsum.photos/seed/sd2/300/200", size: "380 KB", folder: "Short Drama" },
    { id: "62", name: "episode-cover-03.png", url: "https://picsum.photos/seed/sd3/300/200", size: "290 KB", folder: "Short Drama" },
    { id: "63", name: "drama-poster-04.jpg", url: "https://picsum.photos/seed/sd4/300/200", size: "415 KB", folder: "Short Drama" },
  ],
  Constant: [
    { id: "64", name: "placeholder-image.jpg", url: "https://picsum.photos/seed/con1/300/200", size: "55 KB", folder: "Constant" },
    { id: "65", name: "no-image-available.png", url: "https://picsum.photos/seed/con2/300/200", size: "28 KB", folder: "Constant" },
    { id: "66", name: "loading-skeleton.gif", url: "https://picsum.photos/seed/con3/300/200", size: "120 KB", folder: "Constant" },
    { id: "67", name: "error-image.png", url: "https://picsum.photos/seed/con4/300/200", size: "18 KB", folder: "Constant" },
  ],
  Video: [
    { id: "68", name: "promo-thumbnail-hd.jpg", url: "https://picsum.photos/seed/vid1/300/200", size: "480 KB", folder: "Video" },
    { id: "69", name: "trailer-cover-4k.png", url: "https://picsum.photos/seed/vid2/300/200", size: "920 KB", folder: "Video" },
    { id: "70", name: "episode-thumb-001.jpg", url: "https://picsum.photos/seed/vid3/300/200", size: "310 KB", folder: "Video" },
    { id: "71", name: "episode-thumb-002.jpg", url: "https://picsum.photos/seed/vid4/300/200", size: "295 KB", folder: "Video" },
    { id: "72", name: "highlight-clip.jpg", url: "https://picsum.photos/seed/vid5/300/200", size: "370 KB", folder: "Video" },
  ],
};

export default function MediaLibraryPage() {
  const { toast } = useToast();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<Record<string, MediaFile[]>>(DUMMY_FILES);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const currentFiles = useMemo(() => {
    if (!selectedFolder) return [];
    const folderFiles = files[selectedFolder] || [];
    if (!searchQuery.trim()) return folderFiles;
    return folderFiles.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedFolder, files, searchQuery]);

  const handleFolderClick = (folderName: string) => {
    setSelectedFolder(folderName);
    setSearchQuery("");
  };

  const handleBack = () => {
    setSelectedFolder(null);
    setSearchQuery("");
  };

  const handleDeleteConfirm = () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setDeletingId(id);
    setConfirmDelete(null);
    setTimeout(() => {
      setFiles((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((folder) => {
          updated[folder] = updated[folder].filter((f) => f.id !== id);
        });
        return updated;
      });
      setDeletingId(null);
      toast({ title: "File deleted successfully!" });
    }, 400);
  };

  const getFolderCount = (folderName: string) => {
    return files[folderName]?.length ?? FOLDERS.find((f) => f.name === folderName)?.count ?? 0;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground mt-1">
            {selectedFolder ? `${selectedFolder} — ${currentFiles.length} files` : `${FOLDERS.length} folders`}
          </p>
        </div>
        {!selectedFolder && (
          <Button className="bg-gradient-to-r from-red-700 to-red-500 hover:from-red-800 hover:to-red-600">
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        )}
      </div>

      {/* Tab-style heading like reference */}
      <div className="border-b border-zinc-700">
        <span className="inline-block pb-2 text-red-500 font-semibold border-b-2 border-red-500 text-sm">
          View Library
        </span>
      </div>

      {/* ── FOLDER VIEW ── */}
      {!selectedFolder && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {FOLDERS.map((folder) => (
            <button
              key={folder.name}
              onClick={() => handleFolderClick(folder.name)}
              className="group flex flex-col items-center justify-center gap-3 p-6 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-red-500/50 hover:bg-zinc-800 transition-all duration-200 cursor-pointer"
            >
              <div className="relative">
                <Folder className="h-12 w-12 text-red-500 fill-red-500/20 group-hover:fill-red-500/40 transition-all duration-200" />
              </div>
              <span className="text-sm font-medium text-gray-200 group-hover:text-white text-center leading-tight">
                {folder.name}
              </span>
              <span className="text-xs text-gray-500">{getFolderCount(folder.name)} files</span>
            </button>
          ))}
        </div>
      )}

      {/* ── IMAGE VIEW ── */}
      {selectedFolder && (
        <div className="space-y-5">
          {/* Top bar: heading + search + back */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-bold text-white">{selectedFolder}</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-56 bg-zinc-900 border-zinc-700 text-white placeholder:text-gray-500 focus:border-red-500 h-9 rounded-lg"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="border-zinc-700 text-gray-300 hover:bg-zinc-800 hover:text-white h-9 gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>

          {/* Image Grid */}
          {currentFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
              <ImageIcon className="h-12 w-12 opacity-30" />
              <p className="text-sm">
                {searchQuery ? `No files matching "${searchQuery}"` : "No files in this folder"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {currentFiles.map((file) => (
                <div key={file.id} className="group flex flex-col gap-2">
                  {/* Image card */}
                  <div className="relative rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 aspect-[4/3] hover:border-red-500/50 transition-all duration-200">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Delete button on hover */}
                    <button
                      onClick={() => setConfirmDelete({ id: file.id, name: file.name })}
                      disabled={deletingId === file.id}
                      className="absolute top-1.5 right-1.5 h-7 w-7 rounded-md bg-red-600 hover:bg-red-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white" />
                    </button>
                    {/* Dark overlay on hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" />
                  </div>
                  {/* Filename + size */}
                  <div className="px-0.5">
                    <p
                      className="text-xs text-gray-300 truncate font-medium leading-tight"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{file.size}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete File</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-200">"{confirmDelete?.name}"</span>?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-600 text-gray-300 hover:bg-zinc-700 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
