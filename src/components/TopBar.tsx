import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useNavigate } from "react-router-dom";

import { Bell, Bot, Sun, Moon, User as UserIcon, Settings as SettingsLucide, LogOut, AlertCircle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useChatbot } from "@/contexts/ChatbotContext";
import UserAvatar from "@/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// LOGO LOCKED — Do not change without explicit user instruction
import logo from "@/assets/petosauras-icon.png";

const TopBar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { openChat } = useChatbot();
  const { theme, toggleTheme } = useTheme();

  // Unread notifications count, polled every 60s
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      return count || 0;
    },
  });

  return (
    <>
      <header
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full bg-card border-b border-border"
        style={{ maxWidth: 480, height: 56, zIndex: 1000, borderBottomWidth: 0.5 }}
      >
        <div className="h-14 px-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/feeds")}
            aria-label="Petosauras home"
            className="flex items-center"
          >
            <img src={logo} alt="Petosauras" className="h-8 w-auto" />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-all duration-300"
            >
              {theme === "dark" ? (
                <Sun size={20} strokeWidth={1.5} className="transition-transform duration-300" />
              ) : (
                <Moon size={20} strokeWidth={1.5} className="transition-transform duration-300" />
              )}
            </button>
            <button
              onClick={() => openChat()}
              aria-label="Petosauras Assistant"
              className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            >
              <Bot size={20} strokeWidth={1.5} />
            </button>
            {user && (
              <button
                onClick={() => navigate("/notifications")}
                aria-label="Notifications"
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <Bell size={20} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            )}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="Account menu" className="ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <UserAvatar
                      name={profile?.full_name}
                      avatarUrl={profile?.avatar_url}
                      size={36}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer gap-2">
                    <UserIcon className="w-4 h-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer gap-2">
                    <SettingsLucide className="w-4 h-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/sos")} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                    <AlertCircle className="w-4 h-4" /> SOS
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                style={{
                  background: "#7B5EA7",
                  color: "white",
                  border: "none",
                  borderRadius: 50,
                  padding: "7px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginLeft: 4,
                }}
                className="font-body"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

    </>
  );
};

export default TopBar;

