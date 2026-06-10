import { useState, useMemo } from "react";
import { Folder, Trash2, Search, ChevronLeft, Upload, ImageIcon, Plus, Loader2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import { useGetMediaFolders, useGetMediaFilesByFolder, useUploadMediaFiles, useDeleteMediaFile, useCreateMediaFolder, useDeleteMediaFolder } from "@/lib/api-client";

export default function MediaLibraryPage() {
  const { toast } = useToast();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Fetch data
  const foldersQuery = useGetMediaFolders();
  const filesQuery = useGetMediaFilesByFolder(selectedFolder || "");

  // Mutations
  const uploadFilesMutation = useUploadMediaFiles();
  const deleteFileMutation = useDeleteMediaFile();
  const createFolderMutation = useCreateMediaFolder();
  const deleteFolderMutation = useDeleteMediaFolder();

  const folders = foldersQuery.data?.data || [];
  
  const currentFiles = useMemo(() => {
    if (!selectedFolder) return [];
    const folderFiles = filesQuery.data?.data || [];
    if (!searchQuery.trim()) return folderFiles;
    return folderFiles.filter((f: any) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [selectedFolder, filesQuery.data, searchQuery]);

  const getFolderCount = (folderId: string) => {
    const folder = folders.find((f: any) => f._id === folderId);
    return folder?.count || 0;
  };

  const handleFolderClick = (folderId: string) => {
    setSelectedFolder(folderId);
    setSearchQuery("");
  };

  const handleBack = () => {
    setSelectedFolder(null);
    setSearchQuery("");
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolderMutation.mutateAsync(newFolderName);
      setNewFolderName("");
      setCreateFolderDialogOpen(false);
      toast({ title: "Folder created successfully!" });
    } catch (error: any) {
      toast({ title: "Error creating folder", description: error.message, variant: "destructive" });
    }
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

    try {
      await uploadFilesMutation.mutateAsync({
        folderId: selectedFolder,
        files: Array.from(files)
      });
      toast({ title: "Files uploaded successfully!" });
    } catch (error: any) {
      toast({ title: "Error uploading files", description: error.message, variant: "destructive" });
    }
  };

  const isLoading = foldersQuery.isLoading || filesQuery.isLoading ||
                     uploadFilesMutation.isPending || deleteFileMutation.isPending ||
                     createFolderMutation.isPending || deleteFolderMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground mt-1">
            {selectedFolder 
              ? `${folders.find((f: any) => f._id === selectedFolder)?.name} — ${currentFiles.length} files`
              : `${folders.length} folders`}
          </p>
        </div>
        {!selectedFolder ? (
          <Button 
            className="bg-gradient-to-r from-red-700 to-red-500 hover:from-red-800 hover:to-red-600"
            onClick={() => setCreateFolderDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Folder
          </Button>
        ) : (
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
        )}
      </div>

      {/* Tab-style heading like reference */}
      <div className="border-b border-border">
        <span className="inline-block pb-2 text-red-500 font-semibold border-b-2 border-red-500 text-sm">
          View Library
        </span>
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
      {selectedFolder && !isLoading && (
        <div className="space-y-5">
          {/* Top bar: heading + search + back */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-bold text-foreground">
              {folders.find((f: any) => f._id === selectedFolder)?.name}
            </h2>
            <div className="flex items-center gap-3">
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
              {currentFiles.map((file: any) => (
                <div key={file._id} className="group flex flex-col gap-2">
                  {/* Image/video card */}
                  <div className="relative rounded-lg overflow-hidden bg-muted border border-border aspect-[4/3] hover:border-red-500/50 transition-all duration-200">
                    {file.fileType.startsWith('video') ? (
                      <video
                        src={file.url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
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
                  {/* Filename + size */}
                  <div className="px-0.5">
                    <p
                      className="text-xs text-foreground truncate font-medium leading-tight"
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

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent className="bg-card border border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Folder</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="mt-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreateFolder();
              }
            }}
          />
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setCreateFolderDialogOpen(false);
                setNewFolderName("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
            >
              {createFolderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
