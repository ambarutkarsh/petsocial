import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useChatbot } from "@/contexts/ChatbotContext";
import launcherIcon from "@/assets/chatbot-launcher.png";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const QUICK_CHIPS = [
  "Pet Care",
  "Food",
  "Vaccination",
  "Grooming",
  "Behaviour",
  "Emergency",
  "Aquarium Care",
  "Bird Care",
  "Reptile Care",
  "New Pet Parent",
  "How to use Petosauras",
  "My Pet Records",
  "Book Vet",
  "Budget Calculator",
];

const FALLBACK = "Oops, I do not know the answer to that. I am still learning.";

const STARTER_BY_CHIP: Record<string, string> = {
  "Pet Care": "Give me general pet care tips.",
  Food: "What should I feed my pet?",
  Vaccination: "What vaccines does my pet need?",
  Grooming: "How do I groom my pet at home?",
  Behaviour: "How do I improve my pet's behaviour?",
  Emergency: "When should I contact a vet urgently?",
  "Aquarium Care": "How do I care for my aquarium fish?",
  "Bird Care": "How do I care for a pet bird?",
  "Reptile Care": "How do I care for a pet reptile?",
  "New Pet Parent": "I'm a new pet parent — where do I start?",
  "How to use Petosauras": "How do I use Petosauras?",
  "My Pet Records": "How do I upload my pet's records?",
  "Book Vet": "How do I book a vet?",
  "Budget Calculator": "How do I use the Budget Calculator?",
};

const Chatbot = () => {
  const { open, closeChat, consumeInitialPrompt } = useChatbot();
  const { user } = useAuth();
  const location = useLocation();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hi, I'm your Petosauras Assistant. I can help with pet care and guide you around Petosauras. Pick a quick topic below or ask me anything.",
        },
      ]);
    }
  }, [open]);

  // Initial prompt from openChat(prompt)
  useEffect(() => {
    if (!open) return;
    const p = consumeInitialPrompt();
    if (p) {
      setInput(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string, topic?: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pet-chat", {
        body: {
          message: trimmed,
          topic: topic || null,
          userId: user?.id || null,
          featureContext: location.pathname,
          history: messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .slice(-6),
        },
      });
      const answer =
        !error && data && typeof (data as any).answer === "string" && (data as any).answer.trim()
          ? (data as any).answer.trim()
          : FALLBACK;
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: FALLBACK }]);
    } finally {
      setLoading(false);
    }
  };

  const handleChip = (chip: string) => {
    const starter = STARTER_BY_CHIP[chip] || chip;
    sendMessage(starter, chip);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-stretch sm:justify-end">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={closeChat}
      />
      <div
        className="relative w-full sm:w-[420px] sm:max-w-[420px] bg-card sm:h-full rounded-t-[28px] sm:rounded-none flex flex-col shadow-petosauras-md"
        style={{ height: "85dvh", maxHeight: "85dvh" }}
      >
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="w-10 h-10 flex items-center justify-center">
            <img
              src={launcherIcon}
              alt="Petosauras Assistant"
              className="w-10 h-10 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm">Petosauras Assistant</p>
            <p className="text-[11px] text-muted-foreground font-body truncate">
              Ask me about pet care or Petosauras features
            </p>
          </div>
          <button
            onClick={closeChat}
            aria-label="Close chatbot"
            className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-line leading-snug ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-3.5 py-2 text-sm bg-muted text-muted-foreground italic">
                Petosauras Assistant is thinking…
              </div>
            </div>
          )}

          {messages.length <= 1 && !loading && (
            <div className="pt-2">
              <p className="text-[11px] uppercase tracking-wide font-body font-bold text-muted-foreground mb-2">
                Quick topics
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleChip(chip)}
                    className="text-[11px] font-body font-bold px-2.5 py-1.5 rounded-full bg-primary-light text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="border-t border-border p-3 flex items-end gap-2"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask about pet care or Petosauras…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm font-body outline-none focus:border-primary max-h-24"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
