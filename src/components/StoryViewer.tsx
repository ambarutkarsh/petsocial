import { useState, useEffect, useCallback } from "react";
import { X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Story {
  id: string;
  media_url: string;
  media_type: string | null;
  caption: string | null;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
  pets?: { name: string | null; avatar_emoji: string | null } | null;
}

interface Props {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

const STORY_DURATION = 7000;

const StoryViewer = ({ stories, initialIndex = 0, onClose }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const story = stories[currentIndex];

  const getMediaUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return supabase.storage.from("stories").getPublicUrl(path).data.publicUrl;
  };

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + (100 / (STORY_DURATION / 50));
      });
    }, 50);
    return () => clearInterval(interval);
  }, [currentIndex, goNext]);

  // Mark as viewed
  useEffect(() => {
    if (user && story && story.user_id !== user.id) {
      supabase.from("story_views").insert({ story_id: story.id, viewer_id: user.id }).then(() => {});
    }
  }, [story?.id, user]);

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) goPrev();
    else goNext();
  };

  const handleDelete = async () => {
    if (!story) return;
    await supabase.from("stories").delete().eq("id", story.id);
    toast.success("Story deleted");
    queryClient.invalidateQueries({ queryKey: ["stories"] });
    if (stories.length <= 1) onClose();
    else goNext();
  };

  if (!story) return null;

  const isOwn = user?.id === story.user_id;

  return (
    <div className="fixed inset-0 z-[60] bg-foreground flex items-center justify-center">
      <div className="w-full max-w-[430px] h-full relative" onClick={handleTap}>
        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-primary-foreground/30 overflow-hidden">
              <div
                className="h-full bg-primary-foreground rounded-full transition-[width] duration-[50ms] linear"
                style={{
                  width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="absolute top-6 left-3 right-3 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm font-bold text-primary-foreground">
              {story.pets?.avatar_emoji || "🐾"}
            </div>
            <div>
              <p className="text-sm font-heading font-bold text-primary-foreground drop-shadow">
                {story.profiles?.full_name || "User"}
              </p>
              <p className="text-[11px] text-primary-foreground/70 font-body">
                {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwn && (
              <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="w-8 h-8 rounded-full bg-foreground/30 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-primary-foreground" />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-8 h-8 rounded-full bg-foreground/30 flex items-center justify-center">
              <X className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Media */}
        <img src={getMediaUrl(story.media_url)} alt="" className="w-full h-full object-cover" />

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-8 left-4 right-4 z-20">
            <p className="text-primary-foreground text-center text-lg font-heading font-bold drop-shadow-lg">{story.caption}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
