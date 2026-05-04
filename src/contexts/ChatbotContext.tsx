import { createContext, useContext, useState, ReactNode } from "react";

interface ChatbotContextValue {
  open: boolean;
  openChat: (initialPrompt?: string) => void;
  closeChat: () => void;
  initialPrompt: string | null;
  consumeInitialPrompt: () => string | null;
}

const ChatbotContext = createContext<ChatbotContextValue | null>(null);

export const ChatbotProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);

  return (
    <ChatbotContext.Provider
      value={{
        open,
        initialPrompt,
        openChat: (p) => {
          setInitialPrompt(p ?? null);
          setOpen(true);
        },
        closeChat: () => setOpen(false),
        consumeInitialPrompt: () => {
          const p = initialPrompt;
          setInitialPrompt(null);
          return p;
        },
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => {
  const ctx = useContext(ChatbotContext);
  if (!ctx) throw new Error("useChatbot must be used within ChatbotProvider");
  return ctx;
};
