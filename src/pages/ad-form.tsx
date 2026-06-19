import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ChevronLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCreateAd, useUpdateAd, useGetAds, useGetContentList } from "@/lib/api-client";
import MediaPicker from "@/components/MediaPicker";

export default function AdForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id && id !== "new";
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: adsData, isLoading: isAdsLoading } = useGetAds();
  const createMutation = useCreateAd();
  const updateMutation = useUpdateAd();

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    adName: "",
    adType: "Video",
    urlType: "Local",
    mediaUrl: "",
    placement: "Player",
    redirectUrl: "",
    targetContentType: "Movie",
    targetCategories: [] as string[],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    status: "active"
  });

  // Load existing data if editing
  useEffect(() => {
    if (isEdit && adsData?.data) {
      const existingAd = adsData.data.find((a: any) => a._id === id);
      if (existingAd) {
        setFormData({
          adName: existingAd.adName || "",
          adType: existingAd.adType || "Video",
          urlType: existingAd.urlType || "Local",
          mediaUrl: existingAd.mediaUrl || "",
          placement: existingAd.placement || "Player",
          redirectUrl: existingAd.redirectUrl || "",
          targetContentType: existingAd.targetContentType || "Movie",
          targetCategories: existingAd.targetCategories?.length ? existingAd.targetCategories : [],
          startDate: existingAd.startDate ? new Date(existingAd.startDate).toISOString().split('T')[0] : "",
          endDate: existingAd.endDate ? new Date(existingAd.endDate).toISOString().split('T')[0] : "",
          status: existingAd.status || "active",
        });
      }
    }
  }, [isEdit, adsData, id]);

  // Dynamic Content Query for the Dropdown
  const apiFetchType = formData.targetContentType === 'TV Shows' ? 'TV Show' 
                     : formData.targetContentType === 'Short Dramas' ? 'Short Drama'
                     : formData.targetContentType === 'Movie' ? 'Movie'
                     : undefined;

  const { data: contentData } = useGetContentList({ 
    limit: 100, 
    type: apiFetchType 
  });
  
  const contentOptions = contentData?.data || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // If target content type changes, optionally clear the old mismatched tags
    if (name === 'targetContentType' && value !== formData.targetContentType) {
      setFormData({ ...formData, [name]: value, targetCategories: [] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleToggleStatus = (checked: boolean) => {
    setFormData({ ...formData, status: checked ? "active" : "inactive" });
  };

  const handleSave = async () => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id, data: formData });
        toast({ title: "Ad updated successfully!" });
      } else {
        await createMutation.mutateAsync(formData);
        toast({ title: "Ad created successfully!" });
      }
      setLocation("/ads");
    } catch (e: any) {
      toast({ title: "Failed to save ad", description: e.message, variant: "destructive" });
    }
  };

  if (isAdsLoading && isEdit) {
    return <div className="p-6 text-zinc-400">Loading ad details...</div>;
  }

  return (
    <div className="text-foreground bg-[#0f1115] min-h-screen p-6 -m-6 pb-20">
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <span>Dashboard</span>
        <span>/</span>
        <span className="text-white font-medium">{isEdit ? "Edit Custom Ads" : "Add Custom Ad"}</span>
      </div>

      <button 
        onClick={() => setLocation("/ads")}
        className="flex items-center text-primary hover:text-primary/80 font-medium mb-8"
      >
        <ChevronLeft className="h-5 w-5 mr-1" />
        Back
      </button>

      <div className="bg-[#1a1d24] border border-zinc-800 rounded-xl p-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1 */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Ad Name <span className="text-primary">*</span>
              </label>
              <Input 
                name="adName"
                value={formData.adName}
                onChange={handleChange}
                placeholder="e.g. BigSale" 
                className="bg-[#0f1115] border-zinc-800 text-white" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">Media Preview</label>
              <div className="aspect-video bg-[#0f1115] border border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden relative mb-2">
                {formData.mediaUrl ? (
                  formData.adType === 'Video' ? (
                    <video src={formData.mediaUrl} controls className="w-full h-full object-contain bg-black" />
                  ) : formData.adType === 'Image' ? (
                    <img src={formData.mediaUrl} alt="Preview" className="w-full h-full object-contain bg-black" />
                  ) : (
                    <div className="text-zinc-500 text-xs text-center p-4 break-all">
                      <span className="block text-white font-bold mb-1">Custom / Google Ad Payload</span>
                      {formData.mediaUrl.length > 80 ? formData.mediaUrl.substring(0, 80) + "..." : formData.mediaUrl}
                    </div>
                  )
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-orange-500 opacity-50" />
                )}
              </div>
              <Button 
                variant="outline" 
                className="w-full bg-[#0f1115] border-zinc-800 text-zinc-300 hover:bg-[#252830] justify-between"
                onClick={() => setIsMediaPickerOpen(true)}
              >
                <span>Choose File to Upload</span>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Target Content Type <span className="text-primary">*</span>
              </label>
              <select 
                name="targetContentType"
                value={formData.targetContentType}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md bg-[#0f1115] border border-zinc-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700"
              >
                <option value="Movie">Movie</option>
                <option value="Short Dramas">Short Dramas</option>
                <option value="TV Shows">TV Shows</option>
                <option value="Live TV">Live TV</option>
                <option value="All">All</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                End Date <span className="text-primary">*</span>
              </label>
              <Input 
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="bg-[#0f1115] border-zinc-800 text-white [color-scheme:dark]" 
              />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Ad Type <span className="text-primary">*</span>
              </label>
              <select 
                name="adType"
                value={formData.adType}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md bg-[#0f1115] border border-zinc-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700 mb-2"
              >
                <option value="Video">Video</option>
                <option value="Image">Image</option>
                <option value="Custom">Custom / Google</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Placement <span className="text-primary">*</span>
              </label>
              <select 
                name="placement"
                value={formData.placement}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md bg-[#0f1115] border border-zinc-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700"
              >
                <option value="Player">Player</option>
                <option value="Home Page">Home Page</option>
                <option value="Banner">Banner</option>
              </select>
            </div>

            <div className="flex flex-col h-full justify-start">
              <label className="block text-sm font-medium text-white mb-2">
                Target Categories <span className="text-primary">*</span>
              </label>
              
              <div className="bg-[#0f1115] border border-zinc-800 rounded-md p-2 min-h-[140px] flex flex-col gap-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.targetCategories.map((cat, i) => (
                    <div key={i} className="flex items-center bg-primary text-white text-xs px-2 py-1 rounded">
                      <span 
                        className="cursor-pointer mr-1 hover:text-black font-bold"
                        onClick={() => setFormData({
                          ...formData,
                          targetCategories: formData.targetCategories.filter((_, index) => index !== i)
                        })}
                      >×</span> {cat}
                    </div>
                  ))}
                  {formData.targetCategories.length === 0 && (
                    <span className="text-zinc-600 text-xs italic">No targets selected (will target all by default)</span>
                  )}
                </div>
                
                <select
                  className="bg-[#1a1d24] border border-zinc-700 rounded-md text-white h-9 mt-auto text-xs px-2 outline-none focus:border-primary cursor-pointer"
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !formData.targetCategories.includes(val)) {
                      setFormData({
                        ...formData,
                        targetCategories: [...formData.targetCategories, val]
                      });
                    }
                  }}
                >
                  <option value="" disabled>Select {formData.targetContentType} to target...</option>
                  {contentOptions.map((item: any) => (
                    <option key={item._id} value={item.title || item.name}>
                      {item.title || item.name}
                    </option>
                  ))}
                  <option value="Global Application">Target All Categories</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Status</label>
              <div className="flex items-center justify-between bg-[#0f1115] border border-zinc-800 rounded-md p-3 h-10">
                <span className="text-sm text-zinc-300">{formData.status === 'active' ? 'Active' : 'Inactive'}</span>
                <Switch 
                  checked={formData.status === "active"} 
                  onCheckedChange={handleToggleStatus} 
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                URL Type <span className="text-primary">*</span>
              </label>
              <select 
                name="urlType"
                value={formData.urlType}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md bg-[#0f1115] border border-zinc-800 text-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-700"
              >
                <option value="Local">Local</option>
                <option value="URL">URL</option>
              </select>
            </div>

            {formData.urlType === 'URL' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Media URL / Code</label>
                <Input 
                  name="mediaUrl"
                  value={formData.mediaUrl}
                  onChange={handleChange}
                  placeholder={formData.adType === 'Custom' ? "Paste Google Script here..." : "https://..."}
                  className="bg-[#0f1115] border-zinc-800 text-white" 
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-2">Redirect URL</label>
              <Input 
                name="redirectUrl"
                value={formData.redirectUrl}
                onChange={handleChange}
                placeholder="https://example.com/..." 
                className="bg-[#0f1115] border-zinc-800 text-white" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Start Date <span className="text-primary">*</span>
              </label>
              <Input 
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="bg-[#0f1115] border-zinc-800 text-white [color-scheme:dark]" 
              />
            </div>
          </div>

        </div>

        <div className="flex justify-end mt-12 border-t border-zinc-800 pt-6">
          <Button 
            onClick={handleSave} 
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-white px-8"
          >
            Save
          </Button>
        </div>
      </div>

      <MediaPicker 
        open={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(media) => setFormData({ ...formData, mediaUrl: media.url })}
        source="Ads"
      />
    </div>
  );
}
