import { ReactNode, useState } from "react";

import MobileLayout from "./MobileLayout";
import BottomNav from "./BottomNav";
import PostUploadModal from "./PostUploadModal";
import PageWrapper from "./PageWrapper";
import BackButton from "./BackButton";

interface Props {
  title: string;
  subtitle?: string;
  emoji?: string;
  children: ReactNode;
}

const HubSubLayout = ({ title, subtitle, emoji, children }: Props) => {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <MobileLayout>
      <PageWrapper>
        <header className="flex items-center gap-3">
          <BackButton fallback="/hub" />
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-[20px] leading-tight flex items-center gap-2">
              {emoji && <span>{emoji}</span>}
              <span className="truncate">{title}</span>
            </h1>
            {subtitle && <p className="text-xs text-muted-foreground font-body truncate">{subtitle}</p>}
          </div>
        </header>

        <div className="mt-4">{children}</div>
      </PageWrapper>

      <BottomNav onPostClick={() => setShowCreate(true)} />
      <PostUploadModal open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

export default HubSubLayout;
