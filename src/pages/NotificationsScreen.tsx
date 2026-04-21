import { ChevronLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MobileLayout from "@/components/MobileLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<string, string> = {
  like: "❤️", comment: "💬", follow: "👥", forum_reply: "🔔", mention: "📢",
};

const NotificationsScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!data || data.length === 0) return [];
      const actorIds = Array.from(new Set(data.map((n: any) => n.from_user_id).filter(Boolean)));
      let actorMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      if (actorIds.length > 0) {
        const { data: actors } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", actorIds);
        actorMap = Object.fromEntries((actors || []).map((a: any) => [a.id, { full_name: a.full_name, avatar_url: a.avatar_url }]));
      }
      return data.map((n: any) => ({ ...n, actor: n.from_user_id ? actorMap[n.from_user_id] : null }));
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <MobileLayout>
      <div className="min-h-screen">
        <header className="sticky top-14 bg-card/80 backdrop-blur-lg z-30 px-5 py-3.5 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-[10px] bg-surface-alt flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" strokeWidth={1.8} />
            </button>
            <h1 className="text-xl font-heading font-bold">Notifications</h1>
          </div>
          <Button variant="ghost" size="sm" className="text-primary text-xs font-body" onClick={() => markAllRead.mutate()}>
            <Check className="w-3 h-3 mr-1" strokeWidth={1.8} /> Mark all read
          </Button>
        </header>

        {isLoading ? (
          <div className="px-4 space-y-2 mt-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted/30 rounded-[16px] animate-pulse" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🔔</span>
            <h3 className="font-heading font-bold text-lg">No notifications</h3>
            <p className="text-sm text-muted-foreground mt-1 font-body">You're all caught up!</p>
          </div>
        ) : (
          <div className="px-4 space-y-1 mt-2">
            {notifications.map((n: any) => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-[16px] transition-colors ${!n.is_read ? "bg-primary-light" : ""}`}>
                <span className="text-xl mt-0.5">{typeIcons[n.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-body ${!n.is_read ? "font-bold" : "text-muted-foreground"}`}>
                    {n.title || n.body || `${n.actor?.full_name || "Someone"} ${n.type === "like" ? "liked your post" : n.type === "comment" ? "commented on your post" : n.type === "follow" ? "started following you" : "interacted"}`}
                  </p>
                  {n.title && n.body && <p className="text-xs text-muted-foreground mt-0.5 font-body">{n.body}</p>}
                  <p className="text-xs text-text-hint mt-0.5 font-body">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default NotificationsScreen;
