import MobileLayout from "@/components/MobileLayout";
import SEO from "@/components/SEO";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft } from "lucide-react";
import { CommentIcon, HeartIcon } from "@/components/icons/PetosauraIcons";

const PostDetailScreen = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post-detail", postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, profiles:public_profiles!posts_user_id_fkey(full_name, username, avatar_url)")
        .eq("id", postId!)
        .single();
      return data;
    },
  });

  const getMediaUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return supabase.storage.from("posts").getPublicUrl(path).data.publicUrl;
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <span className="text-4xl animate-pulse">🦕</span>
        </div>
      </MobileLayout>
    );
  }

  if (!post) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
          <span className="text-5xl mb-4">🦕</span>
          <h2 className="text-xl font-heading font-bold">Post not found</h2>
          <button onClick={() => navigate("/feed")} className="text-primary font-bold mt-4">Go to Feed</button>
        </div>
      </MobileLayout>
    );
  }

  const mediaUrl = getMediaUrl(post.media_url);
  const profile = post.profiles as any;

  return (
    <MobileLayout>
      <div className="min-h-screen">
        <header className="sticky top-14 bg-card/80 backdrop-blur-lg z-30 px-4 py-3 flex items-center gap-3 border-b border-border">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-[10px] bg-surface-alt flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <h1 className="text-base font-heading font-bold">Post</h1>
        </header>

        <div className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-sm font-heading font-extrabold text-primary-foreground">
            {getInitials(profile?.full_name)}
          </div>
          <div>
            <p className="text-sm font-heading font-bold">{profile?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground font-body">@{profile?.username || "user"}</p>
          </div>
        </div>

        <img src={mediaUrl} alt={post.caption || ""} className="w-full aspect-square object-cover" />

        <div className="p-4">
          <div className="flex items-center gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-sm font-body">
              <HeartIcon className="w-5 h-5" strokeWidth={1.8} /> {post.like_count || 0}
            </span>
            <span className="flex items-center gap-1.5 text-sm font-body">
              <CommentIcon className="w-5 h-5" strokeWidth={1.8} /> {post.comment_count || 0}
            </span>
          </div>
          {post.caption && (
            <p className="text-sm font-body">
              <span className="font-heading font-bold">@{profile?.username || "user"}</span>{" "}
              {post.caption}
            </p>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <button onClick={() => navigate("/feed")} className="w-full h-11 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm">
            Open in Petosauras
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default PostDetailScreen;
