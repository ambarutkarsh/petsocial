import { useEffect, useRef, useState } from "react";
import { useChatbot } from "@/contexts/ChatbotContext";
import { useLocation } from "react-router-dom";
import launcherIcon from "@/assets/chatbot-launcher.png";

const HIDDEN_PREFIXES = ["/admin", "/auth", "/reset-password", "/onboarding", "/vet"];
const IDLE_MS = 20000;
const ANIM_MS = 3500;

const ChatbotLauncher = () => {
  const { open, openChat } = useChatbot();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);
  const [idleNudge, setIdleNudge] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  // Track user activity to reset idle timer
  useEffect(() => {
    const reset = () => {
      lastActivityRef.current = Date.now();
    };
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, reset));
  }, []);

  // Idle nudge animation every 20s of inactivity
  useEffect(() => {
    if (open) return;
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= IDLE_MS) {
        setIdleNudge(true);
        setTimeout(() => setIdleNudge(false), ANIM_MS);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [open]);

  if (open) return null;
  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  const showTip = hovered || idleNudge;

  return (
    <div
      className="fixed z-[1100] flex items-center gap-2"
      style={{
        right: "max(16px, calc(50vw - 240px + 24px))",
        bottom: "calc(env(safe-area-inset-bottom) + 72px)",
      }}
    >
      {showTip && (
        <span className="whitespace-nowrap rounded-full bg-foreground text-background text-xs font-body font-semibold px-3 py-1.5 shadow-petosauras-md animate-in fade-in slide-in-from-right-2">
          Ask Petosauras Anything
        </span>
      )}
      <button
        type="button"
        onClick={() => openChat()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Ask Petosauras Anything"
        title="Ask Petosauras Anything"
        className="w-12 h-12 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus:outline-none"
      >
        <img
          src={launcherIcon}
          alt=""
          width={48}
          height={48}
          loading="lazy"
          className={`w-12 h-12 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)] origin-bottom ${
            idleNudge ? "animate-petosauras-wave" : ""
          }`}
        />
      </button>
    </div>
  );
};

export default ChatbotLauncher;
