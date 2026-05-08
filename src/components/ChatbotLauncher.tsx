import { useState } from "react";
import { useChatbot } from "@/contexts/ChatbotContext";
import { useLocation } from "react-router-dom";
import launcherIcon from "@/assets/chatbot-launcher.png";

const HIDDEN_PREFIXES = ["/admin", "/auth", "/reset-password", "/onboarding", "/vet"];

const ChatbotLauncher = () => {
  const { open, openChat } = useChatbot();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);

  if (open) return null;
  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <div
      className="fixed z-[1100] flex items-center gap-2"
      style={{
        right: "max(16px, calc(50vw - 240px + 24px))",
        bottom: "calc(env(safe-area-inset-bottom) + 72px)",
      }}
    >
      {hovered && (
        <span className="hidden sm:inline-block whitespace-nowrap rounded-full bg-foreground text-background text-xs font-body font-semibold px-3 py-1.5 shadow-petosauras-md animate-in fade-in slide-in-from-right-2">
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
          className="w-12 h-12 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
        />
      </button>
    </div>
  );
};

export default ChatbotLauncher;
