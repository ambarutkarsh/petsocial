import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MobileLayout from "./MobileLayout";
import BottomNav from "./BottomNav";
import CreateSheet from "./CreateSheet";

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
      <div className="pb-24 min-h-screen">
        <header className="px-4 pt-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/hub")}
            aria-label="Back to Hub"
            className="w-9 h-9 rounded-[12px] bg-card border border-border shadow-petosauras flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.8} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-[20px] leading-tight flex items-center gap-2">
              {emoji && <span>{emoji}</span>}
              <span className="truncate">{title}</span>
            </h1>
            {subtitle && <p className="text-xs text-muted-foreground font-body truncate">{subtitle}</p>}
          </div>
        </header>

        <div className="px-4 mt-4">{children}</div>
      </div>

      <BottomNav onPostClick={() => setShowCreate(true)} />
      <CreateSheet open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

export default HubSubLayout;
