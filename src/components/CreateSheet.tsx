import PostUploadModal from "./PostUploadModal";
import AlertForm from "./AlertForm";
import { trackEvent } from "@/lib/analytics";
import { useState } from "react";
import { Image as ImageIcon, Video, Radio, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = null | "post" | "reel";

const CreateSheet = ({ open, onClose }: Props) => {
  const [uploadMode, setUploadMode] = useState<Mode>(null);
  const [showAlert, setShowAlert] = useState(false);

  if (!open && !uploadMode && !showAlert) return null;

  const options = [
    {
      key: "post",
      icon: ImageIcon,
      title: "Post",
      desc: "Share a photo",
      onClick: () => {
        trackEvent("create_post_photo");
        onClose();
        setUploadMode("post");
      },
    },
    {
      key: "reel",
      icon: Video,
      title: "Reel",
      desc: "Share a video",
      onClick: () => {
        trackEvent("create_post_reel");
        onClose();
        setUploadMode("reel");
      },
    },
    {
      key: "live",
      icon: Radio,
      title: "Go Live",
      desc: "Coming Soon",
      badge: "SOON",
      onClick: () => {
        trackEvent("create_go_live_tap");
        toast("Go Live is coming soon! 🎬");
      },
    },
    {
      key: "alert",
      icon: AlertTriangle,
      title: "Alert",
      desc: "Lost / Found / SOS",
      isAlert: true,
      onClick: () => {
        trackEvent("create_alert");
        onClose();
        setShowAlert(true);
      },
    },
  ];

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
          <div className="relative w-full max-w-[430px] bg-card rounded-t-[28px] p-6 animate-slide-up">
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-bold" style={{ color: "#1E1B2E" }}>Create</h2>
              <button onClick={onClose} className="text-text-hint hover:text-foreground">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {options.map((opt) => {
                const Icon = opt.icon;
                const disabled = opt.badge === "SOON";
                const iconBg = opt.isAlert ? "#FFE8E8" : "#EDE5FF";
                const iconColor = opt.isAlert ? "#FF6B6B" : "#7B5EA7";
                const borderColor = opt.isAlert ? "#FFE8E8" : "#E8E5F0";
                return (
                  <button
                    key={opt.key}
                    onClick={opt.onClick}
                    className="relative flex flex-col items-center gap-2 p-[18px_14px] rounded-[18px] bg-card transition-all duration-200 hover:-translate-y-[2px] active:scale-[0.97]"
                    style={{
                      border: `1.5px solid ${borderColor}`,
                      opacity: disabled ? 0.6 : 1,
                      cursor: disabled ? "not-allowed" : "pointer",
                    }}
                  >
                    {opt.badge && (
                      <span
                        className="absolute font-body font-bold uppercase"
                        style={{
                          top: 8,
                          right: 8,
                          background: "#FFF5E0",
                          color: "#996600",
                          fontSize: 9,
                          padding: "2px 6px",
                          borderRadius: 50,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {opt.badge}
                      </span>
                    )}
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: iconBg,
                      }}
                    >
                      <Icon size={22} strokeWidth={1.5} color={iconColor} />
                    </div>
                    <h3 className="font-heading font-bold text-[13px]" style={{ color: "#1E1B2E" }}>{opt.title}</h3>
                    <p className="text-[11px] font-body" style={{ color: "#9B96B0" }}>{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <PostUploadModal
        open={uploadMode !== null}
        onClose={() => setUploadMode(null)}
        defaultCategory="reel"
        acceptVideo={uploadMode === "reel"}
      />
      <AlertForm open={showAlert} onClose={() => setShowAlert(false)} />
    </>
  );
};

export default CreateSheet;
