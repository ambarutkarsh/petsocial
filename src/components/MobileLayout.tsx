import { ReactNode } from "react";
import TopBar from "./TopBar";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  /** Hide the sticky TopBar (used by fullscreen viewers, post detail, etc.). */
  hideTopBar?: boolean;
}

/**
 * Mobile-first 430px container that mounts the persistent sticky TopBar
 * above the page content. Pages still render their own BottomNav, so the
 * full app shell (TopBar + page + BottomNav) appears on every screen.
 */
const MobileLayout = ({ children, className = "", hideTopBar = false }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-muted/30 flex justify-center">
      <div className={`paw-container ${className}`}>
        {!hideTopBar && <TopBar />}
        {children}
      </div>
    </div>
  );
};

export default MobileLayout;
