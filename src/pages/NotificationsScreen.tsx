import { ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MobileLayout from "@/components/MobileLayout";

const mockNotifications = [
  { id: "1", icon: "❤️", message: "Raj P. liked your post", time: "2m ago", read: false },
  { id: "2", icon: "💬", message: "Priya M. commented: \"So cute! 🥰\"", time: "15m ago", read: false },
  { id: "3", icon: "👥", message: "Amit S. started following you", time: "1h ago", read: false },
  { id: "4", icon: "🔔", message: "New reply on your forum post: \"Best diet plan...\"", time: "3h ago", read: true },
  { id: "5", icon: "❤️", message: "Neha K. liked your post", time: "5h ago", read: true },
  { id: "6", icon: "💬", message: "Raj P. replied to your comment", time: "1d ago", read: true },
];

const NotificationsScreen = () => {
  const navigate = useNavigate();

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
          <Button variant="ghost" size="sm" className="text-primary text-xs">
            <Check className="w-3 h-3 mr-1" /> Mark all read
          </Button>
        </header>

        <div className="px-4 space-y-1">
          {mockNotifications.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${!n.read ? "bg-primary/5" : ""}`}>
              <span className="text-xl mt-0.5">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.read ? "font-semibold" : "text-text-mid"}`}>{n.message}</p>
                <p className="text-xs text-text-muted mt-0.5">{n.time}</p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};

export default NotificationsScreen;
