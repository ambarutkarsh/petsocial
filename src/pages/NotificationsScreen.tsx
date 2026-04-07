import { ArrowLeft, Check } from "lucide-react";
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
        .select("*, profiles!notifications_actor_id_fkey(full_name, avatar_url)")
        .eq("recipient_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return data || [];
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ is_read: true }).eq("recipient_id", user!.id).eq("is_read", false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <MobileLayout>
      <div className="min-h-screen">
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg z-40 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-heading font-bold">Notifications</h1>
          </div>
          <Button variant="ghost" size="sm" className="text-primary text-xs" onClick={() => markAllRead.mutate()}>
            <Check className="w-3 h-3 mr-1" /> Mark all read
          </Button>
        </header>

        {isLoading ? (
          <div className="px-4 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🔔</span>
            <h3 className="font-heading font-bold text-lg">No notifications</h3>
            <p className="text-sm text-text-muted mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="px-4 space-y-1">
            {notifications.map((n: any) => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${!n.is_read ? "bg-primary/5" : ""}`}>
                <span className="text-xl mt-0.5">{typeIcons[n.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? "font-semibold" : "text-text-mid"}`}>
                    {n.message || `${n.profiles?.full_name || "Someone"} ${n.type === "like" ? "liked your post" : n.type === "comment" ? "commented on your post" : n.type === "follow" ? "started following you" : "interacted"}`}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
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
