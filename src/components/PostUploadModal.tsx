import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { awardCoins } from "@/lib/coins";
import { useState } from "react";
import { Loader2, X, Upload, CheckCircle2, MapPin } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultCategory?: string;
  acceptVideo?: boolean;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: "reel", label: "🎬 Reel" },
  { key: "adopt", label: "🐾 Adopt" },
  { key: "walker", label: "🚶 Walker" },
  { key: "competition", label: "🏆 Competition" },
  { key: "pet_club", label: "🐶 Pet Club" },
  { key: "find_mates", label: "💕 Find Mates" },
];

const PostUploadModal = ({ open, onClose, defaultCategory = "reel", acceptVideo = true }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [validationStatus, setValidationStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [category, setCategory] = useState<string>(defaultCategory);
  const [posting, setPosting] = useState(false);
  const [postLocation, setPostLocation] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);

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
    if (!file) return;

    // Enforce 30s max for videos (matches feed playback cap).
    if (file.type.startsWith("video")) {
      const ok = await new Promise<boolean>((resolve) => {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () => {
          URL.revokeObjectURL(v.src);
          if (v.duration > 30.5) {
            toast.error("Videos must be 30 seconds or shorter");
            resolve(false);
          } else {
            resolve(true);
          }
        };
        v.onerror = () => resolve(true); // don't block on metadata read failure
        v.src = URL.createObjectURL(file);
      });
      if (!ok) {
        e.target.value = "";
        return;
      }
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setValidationStatus("valid");
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a = data.address || {};
          const suburb = a.suburb || a.neighbourhood || a.locality || "";
          const city = a.city || a.town || a.village || "";
          const state = a.state || "";
          const locationString = [suburb, city, state].filter(Boolean).join(", ");
          setPostLocation(locationString || "Unknown location");
        } catch {
          toast.error("Couldn't detect location");
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
        toast.error("Location access denied. Enter manually.");
      }
    );
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
    const { error: uploadError } = await supabase.storage.from("posts").upload(path, selectedFile, {
      contentType: selectedFile.type,
      upsert: false,
    });
    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setPosting(false);
      return;
    }

    const { data: pub } = supabase.storage.from("posts").getPublicUrl(path);

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      media_url: pub.publicUrl,
      media_type: selectedFile.type.startsWith("video") ? "video" : "image",
      caption,
      hashtags: hashtags.map((h) => h.replace(/^#/, "")),
      pet_id: selectedPetId || null,
      ai_validated: false,
      post_category: category || "reel",
      location: postLocation || null,
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
    setCategory(defaultCategory);
    setPostLocation("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-card rounded-t-[28px] p-6 pb-28 animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-bold">Share a Moment</h2>
          <button onClick={onClose} className="text-text-hint hover:text-foreground"><X size={20} strokeWidth={1.5} /></button>
        </div>

        {!imagePreview ? (
          <label className="border-2 border-dashed border-primary/30 rounded-[22px] p-12 flex flex-col items-center gap-3 bg-primary-light cursor-pointer hover:bg-primary/10 transition-colors">
            <Upload size={40} strokeWidth={1.5} className="text-primary" />
            <span className="text-sm font-heading font-bold text-primary">Tap to upload {acceptVideo ? "media" : "photo"}</span>
            <span className="text-xs text-muted-foreground font-body">{acceptVideo ? "JPG, PNG or video" : "JPG or PNG"}</span>
            <input type="file" accept={acceptVideo ? "image/*,video/*" : "image/*"} className="hidden" onChange={handleFileSelect} />
          </label>
        ) : (
          <div className="space-y-3">
            {selectedFile?.type.startsWith("video") ? (
              <video src={imagePreview} controls className="w-full aspect-[9/16] object-cover rounded-[22px] bg-black" />
            ) : (
              <img src={imagePreview} alt="Preview" className="w-full aspect-[9/16] object-cover rounded-[22px]" />
            )}
            <div className="flex items-center gap-2 text-sm font-body">
              {validationStatus === "checking" && <><Loader2 className="w-4 h-4 animate-spin text-accent" /><span className="text-muted-foreground">Checking for pet content…</span></>}
              {validationStatus === "valid" && <><CheckCircle2 size={16} strokeWidth={1.5} className="text-success" /><span className="text-success font-bold">Pet detected!</span></>}
              {validationStatus === "invalid" && <><X size={16} strokeWidth={1.5} className="text-destructive" /><span className="text-destructive font-bold">No pet found — please upload a pet photo</span></>}
            </div>
          </div>
        )}

        <div className="space-y-3 mt-4">
          <textarea placeholder="What's the story?" value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full h-20 rounded-[16px] bg-surface-alt border-[1.5px] border-border px-[18px] py-3 text-[15px] font-body resize-none focus:border-primary focus:bg-card outline-none transition-all duration-200" />

          {/* Location row */}
          <div className="rounded-[16px] bg-surface-alt border-[1.5px] border-border px-[14px] py-2.5 flex items-center gap-2">
            <MapPin size={14} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              value={postLocation}
              onChange={(e) => setPostLocation(e.target.value)}
              placeholder="Add location..."
              className="flex-1 bg-transparent outline-none text-[14px] font-body"
            />
            <button
              type="button"
              onClick={detectLocation}
              disabled={detectingLocation}
              className="text-[12px] font-body font-bold text-primary hover:underline disabled:opacity-60"
            >
              {detectingLocation ? "…" : "Detect"}
            </button>
          </div>
          {postLocation && (
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 text-[12px] bg-primary-light text-primary-dark px-2.5 py-1 rounded-full font-body font-bold">
                <MapPin size={11} strokeWidth={1.5} />
                {postLocation}
                <button onClick={() => setPostLocation("")} className="ml-1 opacity-70 hover:opacity-100">×</button>
              </span>
            </div>
          )}

          {myPets.length > 0 && (
            <select value={selectedPetId} onChange={(e) => setSelectedPetId(e.target.value)} className="w-full h-12 rounded-[16px] bg-surface-alt border-[1.5px] border-border px-[18px] text-[15px] font-body text-foreground">
              <option value="">Which pet is in this photo?</option>
              {myPets.map((p: any) => <option key={p.id} value={p.id}>{p.avatar_emoji} {p.name}</option>)}
            </select>
          )}

          <div>
            <p className="text-xs font-body font-semibold text-muted-foreground mb-1.5">Tag as (optional)</p>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`shrink-0 text-[12px] font-body font-bold px-3 py-1.5 rounded-full transition-all border ${
                    category === c.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border"
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
          <Button disabled={validationStatus !== "valid" || posting} className="w-full" size="lg" onClick={handlePost}>
            {posting ? "Posting…" : "Post to Petosauras 🦕"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostUploadModal;
