import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import TopBar from "./TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";

interface MainLayoutProps {
  children: ReactNode;
  /** Hide the fixed top bar (rare — e.g. fullscreen viewers). */
  hideTopBar?: boolean;
}

/**
 * Alias of MobileLayout — kept for backward-compat with routes that import
 * `MainLayout`. Renders the 480px app shell with the fixed TopBar and
 * reserves 56px top padding so content never sits under the bar.
 */
const MainLayout = ({ children, hideTopBar = false }: MainLayoutProps) => {
  const { user } = useAuth();
  // Admin must never see the consumer app shell.
  if (user && isAdminEmail(user.email)) {
    return <Navigate to="/admin" replace />;
  }
  if (hideTopBar) return <>{children}</>;
  return (
    <div className="min-h-screen flex justify-center" style={{ background: "#EFEFEF" }}>
      <div className="app-root">
        <TopBar />
        <div style={{ paddingTop: "calc(56px + env(safe-area-inset-top, 0px))" }}>{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;
