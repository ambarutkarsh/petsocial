import { ReactNode } from "react";
import TopBar from "./TopBar";

interface MainLayoutProps {
  children: ReactNode;
  /** Hide the sticky top bar (rare — e.g. fullscreen viewers). */
  hideTopBar?: boolean;
}

/**
 * App shell that injects the persistent sticky TopBar above the page.
 * Existing pages still render their own MobileLayout + BottomNav, so we
 * don't add another container/nav here — that would double-wrap.
 *
 * The TopBar is `position: sticky` and lives inside the page's scroll
 * container, so it stays at the top of every screen including sub-pages.
 */
const MainLayout = ({ children, hideTopBar = false }: MainLayoutProps) => {
  if (hideTopBar) return <>{children}</>;

  return (
    <div className="min-h-screen bg-muted/30 flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-background relative flex flex-col">
        <TopBar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;
