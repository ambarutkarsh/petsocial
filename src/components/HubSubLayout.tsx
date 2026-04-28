import { ReactNode, useState } from "react";

import { useNavigate } from "react-router-dom";

import MobileLayout from "./MobileLayout";
import BottomNav from "./BottomNav";
import CreateSheet from "./CreateSheet";
import PageWrapper from "./PageWrapper";

interface Props {
  title: string;
  subtitle?: string;
  emoji?: string;
  children: ReactNode;
}

const HubSubLayout = ({ title, subtitle, emoji, children }: Props) => {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <MobileLayout>
      <PageWrapper>
        <header className="flex items-center gap-3">
          <button
            onClick={() => navigate("/hub")}
            aria-label="Back to Hub"
            className="w-9 h-9 rounded-[12px] bg-card border border-border shadow-petosauras flex items-center justify-center hover:bg-muted transition-colors"
          >
            <BackIcon className="w-5 h-5" strokeWidth={1.8} />
          </button>
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
      <CreateSheet open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

export default HubSubLayout;
