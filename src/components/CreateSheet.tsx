import PostUploadModal from "./PostUploadModal";
import AlertForm from "./AlertForm";
import { trackEvent } from "@/lib/analytics";
import { Radio, useState } from "react";
import { Camera } from "lucide-react";
import { CloseIcon, PlayIcon, SOSIcon } from "@/components/icons/PetosauraIcons";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CreateSheet = ({ open, onClose }: Props) => {
  const [showUpload, setShowUpload] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  if (!open && !showUpload && !showAlert) return null;

  const options = [
    {
      icon: Camera,
      title: "Upload Photo",
      desc: "Share a pet moment",
      color: "from-primary to-[#243660]",
      onClick: () => {
        trackEvent("create_upload_photo");
        onClose();
        setShowUpload(true);
      },
    },
    {
      icon: Video,
      title: "Post Reel",
      desc: "Share a short video",
      color: "from-secondary to-[#FFA577]",
      onClick: () => {
        trackEvent("create_post_reel");
        onClose();
        setShowUpload(true);
      },
    },
    {
      icon: Radio,
      title: "Go Live",
      desc: "Stream to followers",
      color: "from-accent to-[#7BCFC4]",
      badge: "Soon",
      onClick: () => {
        trackEvent("create_go_live_tap");
      },
    },
    {
      icon: Siren,
      title: "Alert",
      desc: "Lost or found pet",
      color: "from-[#FF6B6B] to-[#FF9999]",
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
              <h2 className="text-xl font-heading font-bold">Create</h2>
              <button onClick={onClose} className="text-text-hint hover:text-foreground">
                <CloseIcon className="w-5 h-5" strokeWidth={1.8} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {options.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.title}
                    onClick={opt.onClick}
                    disabled={!!opt.badge}
                    className="relative text-left rounded-[22px] bg-card border border-border p-4 shadow-petosauras transition-all duration-200 hover:shadow-petosauras-md hover:-translate-y-[2px] active:scale-[0.97] disabled:opacity-60"
                  >
                    {opt.badge && (
                      <span className="absolute top-2 right-2 text-[9px] font-body font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {opt.badge}
                      </span>
                    )}
                    <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${opt.color} flex items-center justify-center mb-2 shadow-petosauras`}>
                      <Icon className="w-6 h-6 text-primary-foreground" strokeWidth={1.8} />
                    </div>
                    <h3 className="font-heading font-bold text-base">{opt.title}</h3>
                    <p className="text-[12px] text-muted-foreground font-body mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <PostUploadModal open={showUpload} onClose={() => setShowUpload(false)} />
      <AlertForm open={showAlert} onClose={() => setShowAlert(false)} />
    </>
  );
};

export default CreateSheet;
