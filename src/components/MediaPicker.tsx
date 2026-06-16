import { useState, useRef } from "react";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useGetAllMediaFiles, uploadMediaFiles, getMediaFolders, createMediaFolder } from "@/lib/api-client";
import { getImageUrl } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: { url: string; filePath: string; name: string }) => void;
  source: string; // e.g., 'banner', 'category', 'genre', etc.
  accept?: string; // e.g., 'image/*', 'video/*', 'image/*,video/*'
}

export default function MediaPicker({ open, onClose, onSelect, source, accept = "image/*,video/*" }: MediaPickerProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<'library' | 'upload'>('library');
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine file type filter based on accept prop
  const getFileTypeFilter = () => {
    if (accept.includes('image/*') && !accept.includes('video/*')) {
      return 'image';
    } else if (accept.includes('video/*') && !accept.includes('image/*')) {
      return 'video';
    }
    return undefined; // Show all
  };

  const fileType = getFileTypeFilter();

  const { data: allMediaData, isLoading: mediaLoading, refetch: refetchMedia } = useGetAllMediaFiles({
    page: 1,
    limit: 50,
    search: searchQuery || undefined,
    fileType: fileType,
    source: source,
  });

  const allMedia = allMediaData?.data || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const url = URL.createObjectURL(file);
    setPreview(url);

    setSelectedMedia({
      name: file.name,
      file: file,
      isLocal: true,
    });
  };

  const handleChooseFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleConfirm = async () => {
    if (mode === 'library' && selectedMedia) {
      onSelect({
        url: selectedMedia.url,
        filePath: selectedMedia.filePath,
        name: selectedMedia.name,
      });
    } else if (mode === 'upload' && selectedMedia?.file) {
      setUploading(true);
      try {
        // Check if folder with source name exists, if not create it
        const folders = await getMediaFolders();
        let folderId = folders?.data?.find((f: any) => f.name.toLowerCase() === source.toLowerCase())?._id;

        if (!folderId) {
          // Create folder with source name
          const newFolder = await createMediaFolder(source);
          folderId = newFolder?.data?._id;
        }

        if (!folderId) {
          throw new Error('Failed to create or find folder');
        }

        // Upload to the folder with source tracking
        const result = await uploadMediaFiles(folderId, [selectedMedia.file], source);

        console.log('Upload result:', result);

        // Refresh media library
        await refetchMedia();

        toast({ title: "File uploaded successfully!" });

        // Get the uploaded file from the response
        const uploadedFile = result?.data?.[0];
        if (uploadedFile) {
          onSelect({
            url: uploadedFile.url,
            filePath: uploadedFile.filePath,
            name: uploadedFile.name,
          });
        } else {
          // Fallback to preview URL
          onSelect({
            url: preview || '',
            filePath: '',
            name: selectedMedia.name,
          });
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      } finally {
        setUploading(false);
      }
    }
    handleClose();
  };

  const handleClose = () => {
    setMode('library');
    setSelectedMedia(null);
    setPreview(null);
    setSearchQuery("");
    onClose();
  };

  const filteredMedia = allMedia.filter((media: any) =>
    media.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'library' ? 'default' : 'outline'}
            onClick={() => setMode('library')}
            className={mode === 'library' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Media Library
          </Button>
          <Button
            variant={mode === 'upload' ? 'default' : 'outline'}
            onClick={() => setMode('upload')}
            className={mode === 'upload' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            <Upload className="h-4 w-4 mr-2" />
            Local Upload
          </Button>
        </div>

        {/* Library Mode */}
        {mode === 'library' && (
          <div className="space-y-4">
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full bg-card border-border text-foreground placeholder:text-gray-500 focus:border-red-500 h-9 rounded-lg px-3"
              />
            </div>
            {mediaLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4">
                <ImageIcon className="h-12 w-12 opacity-30" />
                <p className="text-sm">
                  {searchQuery ? "No media files found" : "No media files in library"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
                {filteredMedia.map((media: any) => (
                  <div
                    key={media._id}
                    onClick={() => setSelectedMedia(media)}
                    className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedMedia?._id === media._id
                        ? 'border-red-500'
                        : 'border-border hover:border-red-500/50'
                    }`}
                  >
                    {media.fileType?.startsWith('video') ? (
                      <video
                        src={getImageUrl(media.filePath || media.url)}
                        className="w-full h-24 object-contain bg-gray-800"
                      />
                    ) : (
                      <img
                        src={getImageUrl(media.filePath || media.url)}
                        alt={media.name}
                        className="w-full h-24 object-contain bg-gray-800"
                        loading="lazy"
                      />
                    )}
                    {selectedMedia?._id === media._id && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <div className="bg-red-600 rounded-full p-1">
                          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload Mode */}
        {mode === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-red-500/50 transition-colors">
              {preview ? (
                <div className="space-y-4">
                  {selectedMedia?.file?.type?.startsWith('video') ? (
                    <video src={preview} className="max-h-48 mx-auto rounded" controls />
                  ) : (
                    <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded" />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreview(null);
                      setSelectedMedia(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Click to upload or drag and drop
                  </p>
                  <Button variant="outline" size="sm" onClick={handleChooseFileClick}>
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              This file will be uploaded and added to the Media Library with source: <strong>{source}</strong>
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedMedia || uploading}
            className="bg-red-600 hover:bg-red-700"
          >
            {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
