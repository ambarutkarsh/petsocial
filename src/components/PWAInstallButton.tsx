import { useState } from "react";
import { Download, Check } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const PWAInstallButton = () => {
  const { canPrompt, installed, isIOS, promptInstall } = usePWAInstall();
  const [showHelp, setShowHelp] = useState(false);

  // Hide PWA install CTA inside native (Capacitor) app
  const isNativeApp =
    typeof window !== "undefined" &&
    (((window as any).Capacitor && (window as any).Capacitor.isNativePlatform?.()) ||
      !!(window as any).Capacitor?.getPlatform);
  if (isNativeApp) return null;

  if (installed) return null;

  const handleClick = async () => {
    if (canPrompt) {
      await promptInstall();
    } else {
      setShowHelp(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        aria-label="Install Petosauras app"
        title="Install Petosauras app"
        className="pwa-install-cta w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
      >
        <Download size={20} strokeWidth={1.5} />
      </button>

      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Install Petosauras</DialogTitle>
            <DialogDescription className="font-body text-sm">
              Save Petosauras to your home screen for a faster, app-like experience.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm font-body">
            {isIOS ? (
              <div className="rounded-lg bg-muted p-3">
                <p className="font-bold mb-1">On iOS Safari:</p>
                <p>Tap the <span className="font-semibold">Share</span> icon, then <span className="font-semibold">Add to Home Screen</span>.</p>
              </div>
            ) : (
              <div className="rounded-lg bg-muted p-3">
                <p className="font-bold mb-1">On Chrome / Android:</p>
                <p>Open the browser <span className="font-semibold">menu</span> and select <span className="font-semibold">Install app</span> or <span className="font-semibold">Add to Home screen</span>.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PWAInstallButton;
