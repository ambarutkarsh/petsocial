import { CloseIcon, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { maskName } from "@/lib/maskName";
import { Loader2, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { ShareIcon } from "@/components/icons/PetosauraIcons";

interface Props {
  postId: string;
  open: boolean;
  onClose: () => void;
}

const CommentSheet = ({ postId, open, onClose }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const isGuest = !user;

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["post-comments", postId],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from("post_comments")
        .select("*, profiles:public_profiles!post_comments_user_id_fkey(full_name, avatar_url, username)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true })
        .limit(20);
      return data || [];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!user || !content.trim()) return;
      setSending(true);
      await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
      });
    },
    onSuccess: () => {
      setContent("");
      setSending(false);
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    },
    onError: () => setSending(false),
  });

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 2000 }}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-card rounded-t-[28px] animate-slide-up shadow-2xl" style={{ height: "75vh" }}>
        <div className="flex flex-col h-full">
          <div className="px-6 pt-4 pb-3 border-b border-border">
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
            <div className="flex items-center justify-between">
              <h3 className="text-base font-heading font-bold">Comments</h3>
              <button onClick={onClose} className="text-text-hint"><CloseIcon className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-3xl">💬</span>
                <p className="text-sm text-muted-foreground mt-2 font-body">No comments yet. Be the first!</p>
              </div>
            ) : (
              comments.map((c: any) => (
                <div key={c.id} className="flex gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-xs font-heading font-bold text-primary-foreground shrink-0">
                    {getInitials(c.profiles?.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-heading font-bold">
                        {isGuest ? maskName(c.profiles?.full_name) : (c.profiles?.full_name || "User")}
                      </span>
                      <span className="text-[11px] text-text-hint font-body">
                        · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm font-body text-foreground mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-border bg-card" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
            {isGuest ? (
              <button
                onClick={() => { onClose(); navigate("/auth"); }}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-full bg-primary-light text-primary"
              >
                <span className="text-sm font-body font-semibold">Login to join the conversation</span>
                <span className="text-sm font-body font-bold">Sign in →</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-xs font-heading font-bold text-primary shrink-0">
                  {getInitials(user?.user_metadata?.full_name || null)}
                </div>
                <div className="flex-1 relative">
                  <input
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, 500))}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && content.trim() && sendMutation.mutate()}
                    placeholder="Add a comment..."
                    className="w-full h-10 bg-surface-alt rounded-full px-4 pr-12 text-sm font-body outline-none border border-border focus:border-primary transition-colors"
                  />
                  {content.trim() && (
                    <button
                      onClick={() => sendMutation.mutate()}
                      disabled={sending}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-primary flex items-center justify-center"
                    >
                      <ShareIcon className="w-3.5 h-3.5 text-primary-foreground" />
                    </button>
                  )}
                </div>
              </div>
            )}
            {!isGuest && content.length > 400 && (
              <p className="text-[11px] text-text-hint text-right mt-1 font-body">{content.length}/500</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentSheet;
