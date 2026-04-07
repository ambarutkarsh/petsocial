import { useState } from "react";
import { X, Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PostUploadModal = ({ open, onClose }: Props) => {
  const [caption, setCaption] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [validationStatus, setValidationStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  if (!open) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setValidationStatus("checking");
      setTimeout(() => setValidationStatus("valid"), 1500);
    }
  };

  const addHashtag = () => {
    const tag = hashtagInput.startsWith("#") ? hashtagInput : `#${hashtagInput}`;
    if (tag.length > 1 && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-card rounded-t-[28px] p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-bold">Share a Moment</h2>
          <button onClick={onClose} className="text-text-muted hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!imagePreview ? (
          <label className="border-2 border-dashed border-primary/30 rounded-2xl p-12 flex flex-col items-center gap-3 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
            <Upload className="w-10 h-10 text-primary" />
            <span className="text-sm font-medium text-primary">Tap to upload photo</span>
            <span className="text-xs text-text-muted">JPG, PNG or video</span>
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
          </label>
        ) : (
          <div className="space-y-3">
            <img src={imagePreview} alt="Preview" className="w-full aspect-square object-cover rounded-2xl" />
            <div className="flex items-center gap-2 text-sm">
              {validationStatus === "checking" && (
                <><Loader2 className="w-4 h-4 animate-spin text-accent" /><span className="text-text-mid">Checking for pet content…</span></>
              )}
              {validationStatus === "valid" && (
                <><CheckCircle className="w-4 h-4 text-secondary" /><span className="text-secondary font-medium">Pet detected!</span></>
              )}
              {validationStatus === "invalid" && (
                <><XCircle className="w-4 h-4 text-destructive" /><span className="text-destructive font-medium">No pet found — please upload a pet photo</span></>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3 mt-4">
          <textarea
            placeholder="What's the story?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full h-20 rounded-xl bg-muted/50 border-0 px-4 py-3 text-sm font-body resize-none focus:ring-2 focus:ring-primary/30 outline-none"
          />
          <div className="flex gap-2">
            <Input
              placeholder="#hashtag"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
              className="h-10 rounded-xl bg-muted/50 border-0 flex-1"
            />
            <Button variant="pill" size="sm" onClick={addHashtag}>Add</Button>
          </div>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag) => (
                <span key={tag} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <Button disabled={validationStatus !== "valid"} className="w-full" size="lg">
            Post to PawSocial 🐾
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostUploadModal;
