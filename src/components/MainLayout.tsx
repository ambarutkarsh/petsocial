import { ReactNode } from "react";
import TopBar from "./TopBar";

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
  if (hideTopBar) return <>{children}</>;
  return (
    <div className="min-h-screen flex justify-center" style={{ background: "#EFEFEF" }}>
      <div className="app-root">
        <TopBar />
        <div style={{ paddingTop: 56 }}>{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;
