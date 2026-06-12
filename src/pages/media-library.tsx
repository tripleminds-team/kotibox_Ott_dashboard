import { useState, useMemo } from "react";
import { Folder, Trash2, Search, ChevronLeft, Upload, ImageIcon, Loader2, Filter } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetMediaFolders, useGetMediaFilesByFolder, useUploadMediaFiles, useDeleteMediaFile, useDeleteMediaFolder, useGetAllMediaFiles, getImageUrl } from "@/lib/api-client";

export default function MediaLibraryPage() {
  const { toast } = useToast();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'folders' | 'all'>('folders');
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [duplicateFiles, setDuplicateFiles] = useState<{ existing: any; new: File }[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  // Fetch data
  const foldersQuery = useGetMediaFolders();
  const filesQuery = useGetMediaFilesByFolder(selectedFolder || "");
  const allFilesQuery = useGetAllMediaFiles({
    page: 1,
    limit: 100,
    source: sourceFilter || undefined,
    fileType: fileTypeFilter || undefined,
    search: searchQuery || undefined,
  });

  // Mutations
  const uploadFilesMutation = useUploadMediaFiles();
  const deleteFileMutation = useDeleteMediaFile();
  const deleteFolderMutation = useDeleteMediaFolder();

  const folders = foldersQuery.data?.data || [];
  const allFiles = allFilesQuery.data?.data || [];
  
  const currentFiles = useMemo(() => {
    if (viewMode === 'all') {
      return allFiles;
    }
    if (!selectedFolder) return [];
    const folderFiles = filesQuery.data?.data || [];
    if (!searchQuery.trim()) return folderFiles;
    return folderFiles.filter((f: any) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [viewMode, selectedFolder, filesQuery.data, allFiles, searchQuery]);

  const getFolderCount = (folderId: string) => {
    const folder = folders.find((f: any) => f._id === folderId);
    return folder?.count || 0;
  };

  const handleFolderClick = (folderId: string) => {
    setSelectedFolder(folderId);
    setViewMode('folders');
    setSearchQuery("");
  };

  const handleBack = () => {
    setSelectedFolder(null);
    setViewMode('folders');
    setSearchQuery("");
  };

  const handleViewModeChange = (mode: 'folders' | 'all') => {
    setViewMode(mode);
    setSelectedFolder(null);
    setSearchQuery("");
    setSourceFilter("");
    setFileTypeFilter("");
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === 'file') {
        await deleteFileMutation.mutateAsync(confirmDelete.id);
      } else {
        await deleteFolderMutation.mutateAsync(confirmDelete.id);
        setSelectedFolder(null);
      }
      toast({ title: `${confirmDelete.type.charAt(0).toUpperCase() + confirmDelete.type.slice(1)} deleted successfully!` });
    } catch (error: any) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedFolder) return;
    
    const selectedFiles = Array.from(files);
    const folderFiles = filesQuery.data?.data || [];
    const duplicates: { existing: any; new: File }[] = [];
    const uniqueFiles: File[] = [];

    // Check each file for duplicates
    selectedFiles.forEach((newFile) => {
      const existing = folderFiles.find(f => f.name === newFile.name);
      if (existing) {
        duplicates.push({ existing, new: newFile });
      } else {
        uniqueFiles.push(newFile);
      }
    });

    if (duplicates.length > 0) {
      setDuplicateFiles(duplicates);
      setPendingFiles(uniqueFiles);
      setDuplicateDialogOpen(true);
    } else {
      // No duplicates, just upload
      await uploadSelectedFiles(selectedFiles);
    }
    
    // Reset the input
    event.target.value = '';
  };

  const uploadSelectedFiles = async (files: File[]) => {
    if (!selectedFolder) return;
    try {
      await uploadFilesMutation.mutateAsync({
        folderId: selectedFolder,
        files: files
      });
      toast({ title: "Files uploaded successfully!" });
    } catch (error: any) {
      toast({ title: "Error uploading files", description: error.message, variant: "destructive" });
    }
  };

  const handleDuplicateConfirm = async () => {
    // Upload all pending files and duplicate files
    const allFiles = [...pendingFiles, ...duplicateFiles.map(d => d.new)];
    await uploadSelectedFiles(allFiles);
    setDuplicateDialogOpen(false);
    setDuplicateFiles([]);
    setPendingFiles([]);
  };

  const handleDuplicateCancel = () => {
    // Upload only unique files
    if (pendingFiles.length > 0) {
      uploadSelectedFiles(pendingFiles);
    } else {
      toast({ title: "No files to upload", variant: "default" });
    }
    setDuplicateDialogOpen(false);
    setDuplicateFiles([]);
    setPendingFiles([]);
  };

  const isLoading = foldersQuery.isLoading || filesQuery.isLoading || allFilesQuery.isLoading ||
                     uploadFilesMutation.isPending || deleteFileMutation.isPending ||
                     deleteFolderMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground mt-1">
            {selectedFolder
              ? `${folders.find((f: any) => f._id === selectedFolder)?.name} — ${currentFiles.length} files`
              : viewMode === 'all'
              ? `All Media — ${currentFiles.length} files`
              : `${folders.length} folders`}
          </p>
        </div>
        {selectedFolder ? (
          <div className="flex gap-2">
            <Button
              className="bg-gradient-to-r from-red-700 to-red-500 hover:from-red-800 hover:to-red-600"
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <Upload className="h-4 w-4" />
                Upload File
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete({
                id: selectedFolder,
                name: folders.find((f: any) => f._id === selectedFolder)?.name || "",
                type: 'folder'
              })}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Folder
            </Button>
          </div>
        ) : null}
      </div>

      {/* Tab-style heading like reference */}
      <div className="border-b border-border flex gap-6">
        <button
          onClick={() => handleViewModeChange('folders')}
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            viewMode === 'folders'
              ? 'text-red-500 border-red-500'
              : 'text-muted-foreground border-transparent hover:text-foreground'
          }`}
        >
          Folders
        </button>
        <button
          onClick={() => handleViewModeChange('all')}
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            viewMode === 'all'
              ? 'text-red-500 border-red-500'
              : 'text-muted-foreground border-transparent hover:text-foreground'
          }`}
        >
          All Media
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-red-500" />
        </div>
      )}

      {/* ── FOLDER VIEW ── */}
      {!selectedFolder && !isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {folders.map((folder: any) => (
            <button
              key={folder._id}
              onClick={() => handleFolderClick(folder._id)}
              className="group flex flex-col items-center justify-center gap-3 p-6 bg-card border border-border rounded-xl hover:border-red-500/50 hover:bg-muted transition-all duration-200 cursor-pointer"
            >
              <div className="relative">
                <Folder className="h-12 w-12 text-red-500 fill-red-500/20 group-hover:fill-red-500/40 transition-all duration-200" />
              </div>
              <span className="text-sm font-medium text-gray-200 group-hover:text-foreground text-center leading-tight">
                {folder.name}
              </span>
              <span className="text-xs text-gray-500">{folder.count} files</span>
            </button>
          ))}
        </div>
      )}

      {/* ── IMAGE VIEW ── */}
      {(selectedFolder || viewMode === 'all') && !isLoading && (
        <div className="space-y-5">
          {/* Top bar: heading + search + back */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-bold text-foreground">
              {selectedFolder
                ? folders.find((f: any) => f._id === selectedFolder)?.name
                : 'All Media'}
            </h2>
            <div className="flex items-center gap-3">
              {viewMode === 'all' && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-56 bg-card border-border text-foreground placeholder:text-gray-500 focus:border-red-500 h-9 rounded-lg"
                    />
                  </div>
                  <Select value={sourceFilter || "all"} onValueChange={(value) => setSourceFilter(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-40 bg-card border-border text-foreground h-9 rounded-lg">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground">
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="media-library">Media Library</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem value="genre">Genre</SelectItem>
                      <SelectItem value="actor">Actor</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="language">Language</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={fileTypeFilter || "all"} onValueChange={(value) => setFileTypeFilter(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-40 bg-card border-border text-foreground h-9 rounded-lg">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
              {selectedFolder && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-56 bg-card border-border text-foreground placeholder:text-gray-500 focus:border-red-500 h-9 rounded-lg"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                    className="border-border text-foreground hover:bg-muted hover:text-foreground h-9 gap-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Image Grid */}
          {currentFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
              <ImageIcon className="h-12 w-12 opacity-30" />
              <p className="text-sm">
                {searchQuery || sourceFilter || fileTypeFilter
                  ? "No files matching your filters"
                  : selectedFolder
                  ? "No files in this folder"
                  : "No media files found"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {currentFiles.map((file: any) => (
                <div key={file._id} className="group flex flex-col gap-2">
                  {/* Image/video card */}
                  <div className="relative rounded-lg overflow-hidden bg-muted border border-border aspect-[4/3] hover:border-red-500/50 transition-all duration-200">
                    {file.fileType?.startsWith('video') ? (
                      <video
                        src={getImageUrl(file.filePath || file.url)}
                        className="w-full h-full object-contain bg-gray-800"
                        controls
                      />
                    ) : (
                      <img
                        src={getImageUrl(file.filePath || file.url)}
                        alt={file.name}
                        className="w-full h-full object-contain bg-gray-800"
                        loading="lazy"
                      />
                    )}
                    {/* Delete button on hover */}
                    <button
                      onClick={() => setConfirmDelete({ id: file._id, name: file.name, type: 'file' })}
                      disabled={deleteFileMutation.isPending}
                      className="absolute top-1.5 right-1.5 h-7 w-7 rounded-md bg-red-600 hover:bg-red-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-foreground" />
                    </button>
                    {/* Dark overlay on hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none" />
                  </div>
                  {/* Filename + size + source */}
                  <div className="px-0.5">
                    <p
                      className="text-xs text-foreground truncate font-medium leading-tight"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-600">{file.size}</p>
                      {file.source && (
                        <span className="text-xs text-gray-500 capitalize bg-muted px-1.5 py-0.5 rounded">
                          {file.source}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <AlertDialogContent className="bg-card border border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete {confirmDelete?.type}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-200">"{confirmDelete?.name}"</span>?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-muted hover:text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-foreground border-0"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate File Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">File Already Exists</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              The following file(s) already exist in this folder:
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2 my-4">
            {duplicateFiles.map(({ existing, new: newFile }, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {existing.fileType?.startsWith('video') ? (
                  <video
                    src={getImageUrl(existing.filePath || existing.url)}
                    className="h-12 w-12 rounded object-contain bg-gray-800"
                  />
                ) : (
                  <img
                    src={getImageUrl(existing.filePath || existing.url)}
                    alt={existing.name}
                    className="h-12 w-12 rounded object-contain bg-gray-800"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{existing.name}</p>
                  <p className="text-xs text-gray-500">
                    Existing: {existing.fileType} | New: {newFile.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDuplicateCancel}
            >
              Skip Duplicates
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDuplicateConfirm}
            >
              Upload Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
