import { ReactNode } from "react";
import TopBar from "./TopBar";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  /** Hide the fixed TopBar (used by fullscreen viewers, post detail, etc.). */
  hideTopBar?: boolean;
}

/**
 * Mobile-first 480px shell.
 *
 * - Outer wrapper paints the off-canvas grey background.
 * - `.app-root` is the real 480px column containing the fixed TopBar
 *   (and BottomNav, mounted by individual pages).
 * - Pages should render their content inside <PageWrapper> so the 56px
 *   top offset and 72px bottom offset are reserved automatically.
 */
const MobileLayout = ({ children, className = "", hideTopBar = false }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen flex justify-center" style={{ background: "#EFEFEF" }}>
      <div className={`app-root ${className}`}>
        {!hideTopBar && <TopBar />}
        {children}
      </div>
    </div>
  );
};

export default MobileLayout;
