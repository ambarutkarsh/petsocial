import { useState } from "react";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const StoryCreator = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [posting, setPosting] = useState(false);

  const { data: primaryPet } = useQuery({
    queryKey: ["primary-pet-story", user?.id],
    enabled: !!user && open,
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("id").eq("owner_id", user!.id).eq("is_primary", true).limit(1);
      return data?.[0] || null;
    },
  });

  if (!open) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handlePost = async () => {
    if (!file || !user) return;
    setPosting(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("stories").upload(path, file);
    if (uploadError) {
      toast.error("Upload failed");
      setPosting(false);
      return;
    }

    const { error } = await supabase.from("stories").insert({
      user_id: user.id,
      media_url: path,
      media_type: file.type.startsWith("video") ? "video" : "image",
      caption: caption || null,
      pet_id: primaryPet?.id || null,
    });

    setPosting(false);
    if (error) {
      toast.error("Failed to post story");
      return;
    }

    toast.success("Story posted! 🦕");
    queryClient.invalidateQueries({ queryKey: ["stories"] });
    setFile(null);
    setPreview(null);
    setCaption("");
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setCaption("");
    setShowCaptionInput(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-foreground flex items-center justify-center">
      <div className="w-full max-w-[430px] h-full relative flex flex-col bg-card">
        {!preview ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
            <button onClick={handleReset} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-heading font-bold">Add to Story</h2>
            <label className="border-2 border-dashed border-primary/30 rounded-[22px] p-12 flex flex-col items-center gap-3 bg-primary-light cursor-pointer w-full">
              <Upload className="w-10 h-10 text-primary" />
              <span className="text-sm font-heading font-bold text-primary">Select photo or video</span>
              <span className="text-xs text-muted-foreground font-body">JPG, PNG or MP4 (max 15s)</span>
              <input type="file" accept="image/*,video/mp4" className="hidden" onChange={handleFileSelect} />
            </label>
          </div>
        ) : (
          <div className="flex-1 relative">
            <button onClick={handleReset} className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-foreground/30 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-primary-foreground" />
            </button>
            <button
              onClick={() => setShowCaptionInput(!showCaptionInput)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-foreground/30 flex items-center justify-center text-primary-foreground text-sm font-bold"
            >
              Aa
            </button>

            <img src={preview} alt="" className="w-full h-full object-cover" />

            {showCaptionInput && (
              <div className="absolute inset-x-0 bottom-24 px-6 z-20">
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full bg-foreground/40 backdrop-blur-sm text-primary-foreground text-center text-lg font-heading rounded-full px-4 py-3 outline-none placeholder:text-primary-foreground/60"
                  maxLength={100}
                  autoFocus
                />
              </div>
            )}

            {caption && !showCaptionInput && (
              <div className="absolute inset-x-0 bottom-24 px-6 z-20">
                <p className="text-primary-foreground text-center text-lg font-heading font-bold drop-shadow-lg">{caption}</p>
              </div>
            )}

            <div className="absolute bottom-4 inset-x-0 px-6 z-20">
              <Button onClick={handlePost} disabled={posting} className="w-full" size="lg">
                {posting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Posting...</> : "Add to Story 🦕"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryCreator;
