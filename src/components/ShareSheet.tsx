import { toast } from "sonner";
import { Copy } from "lucide-react";
import { CloseIcon, CommentIcon, ShareIcon } from "@/components/icons/PetosauraIcons";

interface Props {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  text?: string;
}

const ShareSheet = ({ open, onClose, url, title = "Petosauras", text = "Check this out on Petosauras 🐾" }: Props) => {
  if (!open) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const options = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      bg: "bg-[#25D366]",
      icon: <CommentIcon className="w-6 h-6 text-white" />,
      onClick: () => window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, "_blank"),
    },
    {
      key: "twitter",
      label: "X / Twitter",
      bg: "bg-foreground",
      icon: <span className="text-primary-foreground font-bold text-lg">𝕏</span>,
      onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, "_blank"),
    },
    {
      key: "facebook",
      label: "Facebook",
      bg: "bg-[#1877F2]",
      icon: <span className="text-white font-bold text-lg">f</span>,
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank"),
    },
    {
      key: "telegram",
      label: "Telegram",
      bg: "bg-[#0088CC]",
      icon: <ShareIcon className="w-6 h-6 text-white" />,
      onClick: () => window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, "_blank"),
    },
    {
      key: "native",
      label: "More",
      bg: "bg-primary",
      icon: <ShareIcon className="w-6 h-6 text-primary-foreground" />,
      onClick: async () => {
        if ((navigator as any).share) {
          try {
            await (navigator as any).share({ title, text, url });
          } catch {
            /* user cancelled */
          }
        } else {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied! 📋");
        }
      },
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied! 📋");
      onClose();
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <div className="fixed inset-0 flex items-end justify-center" style={{ zIndex: 2000 }}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-[480px] bg-card rounded-t-[28px] animate-slide-up shadow-2xl"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        <div className="px-6 pt-4 pb-3 border-b border-border">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-heading font-bold">Share</h3>
            <button onClick={onClose} aria-label="Close" className="text-text-hint">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-4 py-5">
          <div className="grid grid-cols-4 gap-3">
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  opt.onClick();
                  if (opt.key !== "native") onClose();
                }}
                className="flex flex-col items-center gap-1.5"
              >
                <div className={`w-12 h-12 rounded-full ${opt.bg} flex items-center justify-center shadow-sm`}>
                  {opt.icon}
                </div>
                <span className="text-[11px] font-body text-foreground">{opt.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={copyLink}
            className="mt-5 w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-alt border border-border"
          >
            <Copy className="w-5 h-5 text-foreground" />
            <span className="text-sm font-body text-foreground truncate flex-1 text-left">{url}</span>
            <span className="text-xs font-heading font-bold text-primary">Copy</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareSheet;
