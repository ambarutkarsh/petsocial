import { useChatbot } from "@/contexts/ChatbotContext";
import { useLocation } from "react-router-dom";
import launcherIcon from "@/assets/chatbot-launcher.png";

/**
 * Floating chatbot launcher. Fixed bottom-right, opens the existing Chatbot
 * via ChatbotContext. Hides itself when the chatbot is open and on routes
 * where a floating CTA would interfere (admin, auth, fullscreen viewers).
 */
const HIDDEN_PREFIXES = ["/admin", "/auth", "/reset-password", "/onboarding", "/vet"];

const ChatbotLauncher = () => {
  const { open, openChat } = useChatbot();
  const location = useLocation();

  if (open) return null;
  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <button
      type="button"
      onClick={() => openChat()}
      aria-label="Open chatbot"
      title="Open chatbot"
      className="fixed z-[1100] w-12 h-12 rounded-full bg-card shadow-petosauras-md ring-1 ring-border flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/40"
      style={{
        // Align horizontally with the MyPet column (rightmost of 5 in 480px shell)
        right: "max(16px, calc(50vw - 240px + 24px))",
        bottom: "calc(env(safe-area-inset-bottom) + 72px)",
      }}
    >
      <img
        src={launcherIcon}
        alt=""
        width={48}
        height={48}
        loading="lazy"
        className="w-11 h-11 object-contain"
      />
    </button>
  );
};

export default ChatbotLauncher;
