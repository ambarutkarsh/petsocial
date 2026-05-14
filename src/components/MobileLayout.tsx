import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import TopBar from "./TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";

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
 * - The inner content area automatically reserves 56px top offset so
 *   page content is never overlapped by the fixed TopBar.
 */
const MobileLayout = ({ children, className = "", hideTopBar = false }: MobileLayoutProps) => {
  const { user } = useAuth();
  // Admin must never see the consumer app shell (top bar, stories, feed, bottom nav).
  if (user && isAdminEmail(user.email)) {
    return <Navigate to="/admin" replace />;
  }
  return (
    <div className="min-h-screen flex justify-center" style={{ background: "#EFEFEF" }}>
      <div className={`app-root ${className}`}>
        {!hideTopBar && <TopBar />}
        <main style={{ paddingTop: hideTopBar ? 0 : "calc(56px + env(safe-area-inset-top, 0px))" }}>{children}</main>
      </div>
    </div>
  );
};

export default MobileLayout;
