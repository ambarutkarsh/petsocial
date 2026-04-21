import { ReactNode } from "react";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

interface MainLayoutProps {
  children: ReactNode;
  /** Hide the sticky top bar (rare — e.g. fullscreen viewers). */
  hideTopBar?: boolean;
  /** Hide the sticky bottom nav (rare — e.g. fullscreen viewers). */
  hideBottomNav?: boolean;
  /** Override FAB behavior (otherwise opens default Create sheet). */
  onCreateClick?: () => void;
}

const MainLayout = ({
  children,
  hideTopBar = false,
  hideBottomNav = false,
  onCreateClick,
}: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-muted/30 flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-background relative flex flex-col">
        {!hideTopBar && <TopBar />}
        <main className={`flex-1 ${!hideBottomNav ? "pb-20" : ""}`}>
          {children}
        </main>
        {!hideBottomNav && <BottomNav onPostClick={onCreateClick} />}
      </div>
    </div>
  );
};

export default MainLayout;
