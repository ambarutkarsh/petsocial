import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { awardCoins } from "@/lib/coins";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { CloseIcon, UploadIcon, VerifiedIcon } from "@/components/icons/PetosauraIcons";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PostUploadModal = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [validationStatus, setValidationStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [category, setCategory] = useState<string>("");
  const [posting, setPosting] = useState(false);

  const CATEGORIES = [
    { key: "reel", label: "🎬 Reel" },
    { key: "moment", label: "📸 Moment" },
    { key: "adopt", label: "🏠 Adopt" },
    { key: "lost", label: "🆘 Lost" },
    { key: "found", label: "✅ Found" },
    { key: "tips", label: "💡 Tips" },
    { key: "fun", label: "🎉 Fun" },
  ];

  const { data: myPets = [] } = useQuery({
    queryKey: ["my-pets", user?.id],
    enabled: !!user && open,
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("id, name, avatar_emoji").eq("owner_id", user!.id);
      return data || [];
    },
  });

  if (!open) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setValidationStatus("checking");

      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = dataUrl.split(",")[1];
        const { data, error } = await supabase.functions.invoke("validate-pet", {
          body: { type: "photo", imageBase64: base64, mimeType: file.type },
        });
        if (error) {
          setValidationStatus("valid"); // fail open on network error
          return;
        }
        if (data?.result === "YES") {
          setValidationStatus("valid");
        } else {
          setValidationStatus("invalid");
        }
      } catch {
        setValidationStatus("valid"); // fail open
      }
    }
  };

  const addHashtag = () => {
    const tag = hashtagInput.startsWith("#") ? hashtagInput : `#${hashtagInput}`;
    if (tag.length > 1 && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput("");
    }
  };

  const handlePost = async () => {
    if (!selectedFile || !user) return;
    setPosting(true);

    const ext = selectedFile.name.split(".").pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("posts").upload(path, selectedFile);
    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setPosting(false);
      return;
    }

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      media_url: path,
      media_type: selectedFile.type.startsWith("video") ? "video" : "image",
      caption,
      hashtags: hashtags.map((h) => h.replace(/^#/, "")),
      pet_id: selectedPetId || null,
      ai_validated: false,
      post_category: category || "reel",
    } as any);

    setPosting(false);
    if (error) {
      toast.error("Post failed: " + error.message);
      return;
    }

    toast.success("Posted to Petosauras! 🦕");
    awardCoins("post_created");
    queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    setCaption("");
    setHashtags([]);
    setImagePreview(null);
    setSelectedFile(null);
    setValidationStatus("idle");
    setSelectedPetId("");
    setCategory("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-card rounded-t-[28px] p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-bold">Share a Moment</h2>
          <button onClick={onClose} className="text-text-hint hover:text-foreground"><CloseIcon className="w-5 h-5" strokeWidth={1.8} /></button>
        </div>

        {!imagePreview ? (
          <label className="border-2 border-dashed border-primary/30 rounded-[22px] p-12 flex flex-col items-center gap-3 bg-primary-light cursor-pointer hover:bg-primary/10 transition-colors">
            <UploadIcon className="w-10 h-10 text-primary" strokeWidth={1.8} />
            <span className="text-sm font-heading font-bold text-primary">Tap to upload photo</span>
            <span className="text-xs text-muted-foreground font-body">JPG, PNG or video</span>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
          </label>
        ) : (
          <div className="space-y-3">
            <img src={imagePreview} alt="Preview" className="w-full aspect-square object-cover rounded-[22px]" />
            <div className="flex items-center gap-2 text-sm font-body">
              {validationStatus === "checking" && <><Loader2 className="w-4 h-4 animate-spin text-accent" /><span className="text-muted-foreground">Checking for pet content…</span></>}
              {validationStatus === "valid" && <><VerifiedIcon className="w-4 h-4 text-success" strokeWidth={1.8} /><span className="text-success font-bold">Pet detected!</span></>}
              {validationStatus === "invalid" && <><CloseIcon className="w-4 h-4 text-destructive" strokeWidth={1.8} /><span className="text-destructive font-bold">No pet found — please upload a pet photo</span></>}
            </div>
          </div>
        )}

        <div className="space-y-3 mt-4">
          <textarea placeholder="What's the story?" value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full h-20 rounded-[16px] bg-surface-alt border-[1.5px] border-border px-[18px] py-3 text-[15px] font-body resize-none focus:border-primary focus:bg-card focus:shadow-[0_0_0_4px_rgba(123, 94, 167,0.1)] outline-none transition-all duration-200" />
          {myPets.length > 0 && (
            <select value={selectedPetId} onChange={(e) => setSelectedPetId(e.target.value)} className="w-full h-12 rounded-[16px] bg-surface-alt border-[1.5px] border-border px-[18px] text-[15px] font-body text-foreground">
              <option value="">Which pet is in this photo?</option>
              {myPets.map((p: any) => <option key={p.id} value={p.id}>{p.avatar_emoji} {p.name}</option>)}
            </select>
          )}
          <div>
            <p className="text-xs font-body font-semibold text-muted-foreground mb-1.5">Category <span className="text-destructive">*</span></p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`text-[12px] font-body font-bold px-3 py-1.5 rounded-full transition-all ${
                    category === c.key
                      ? "bg-primary text-primary-foreground shadow-petosauras"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Input placeholder="#hashtag" value={hashtagInput} onChange={(e) => setHashtagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())} className="flex-1" />
            <Button variant="outline" size="sm" onClick={addHashtag}>Add</Button>
          </div>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag) => (
                <span key={tag} className="text-xs bg-primary-light text-primary-dark px-2.5 py-1 rounded-full font-body font-bold">{tag}</span>
              ))}
            </div>
          )}
          <Button disabled={validationStatus !== "valid" || !category || posting} className="w-full" size="lg" onClick={handlePost}>
            {posting ? "Posting…" : !category ? "Select a category" : "Post to Petosauras 🦕"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostUploadModal;
