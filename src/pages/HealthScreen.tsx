import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import { ChevronRight } from "lucide-react";

const healthCards = [
  { emoji: "🏥", title: "Vet Near Me", desc: "Find clinics and hospitals nearby", path: "/health/vet-near-me" },
  { emoji: "📋", title: "Pet DigiLocker", desc: "Health records, vaccines & growth", path: "/health/digilocker" },
  { emoji: "💰", title: "Budget Calculator", desc: "Plan your pet care costs", path: "/health/budget" },
  { emoji: "🛍️", title: "Order Now", desc: "Food, supplies and accessories", path: "/health/order" },
];

const HealthScreen = () => {
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);

  return (
    <MobileLayout>
      <div className="pb-20 px-4">
        <header className="pt-6 pb-4 flex items-center gap-3">
          <img src="/petosauras-logo.png" alt="Petosauras" style={{ height: 36, objectFit: "contain" }} />
          <div>
            <h1 className="font-heading text-2xl font-bold">Pet Health</h1>
            <p className="text-sm text-muted-foreground mt-1 font-body">Everything your pet needs, in one place</p>
          </div>
        </header>
        <div className="grid grid-cols-2 gap-3">
          {healthCards.map((c, idx) => (
            <button
              key={c.path}
              onClick={() => navigate(c.path)}
              className="text-left rounded-[22px] bg-card border border-border p-[18px] shadow-petosauras active:scale-[0.97] transition-all duration-250 hover:shadow-petosauras-md hover:-translate-y-[2px] animate-fade-up"
              style={{ borderLeft: "4px solid hsl(var(--primary))", animationDelay: `${idx * 60}ms` }}
            >
              <div className="w-12 h-12 rounded-[14px] bg-primary-light flex items-center justify-center mb-2">
                <span className="text-[28px] leading-none">{c.emoji}</span>
              </div>
              <h3 className="font-heading font-bold text-base">{c.title}</h3>
              <p className="text-[13px] text-muted-foreground mt-0.5 font-body">{c.desc}</p>
              <ChevronRight className="w-4 h-4 text-primary mt-2" strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </div>
      <BottomNav onPostClick={() => setShowUpload(true)} />
      <PostUploadModal open={showUpload} onClose={() => setShowUpload(false)} />
    </MobileLayout>
  );
};

export default HealthScreen;
