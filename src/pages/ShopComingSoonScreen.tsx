import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const categories = [
  { emoji: "🥩", label: "Fresh Food" },
  { emoji: "📦", label: "Packaged Food" },
  { emoji: "🧸", label: "Toys" },
  { emoji: "👗", label: "Accessories" },
  { emoji: "💊", label: "Supplements" },
  { emoji: "🍖", label: "Treats" },
  { emoji: "✂️", label: "Grooming Supply" },
];

interface ShopComingSoonScreenProps {
  embedded?: boolean;
}

const ShopComingSoonScreen = ({ embedded = false }: ShopComingSoonScreenProps) => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [submitting, setSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const handleNotify = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("waitlist").insert({
      email,
      feature: "shop",
      user_id: user?.id || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't add you. Try again.");
      return;
    }
    toast.success("You're on the list! 🛍️");
    setEmail("");
  };

  const content = (
    <div className={embedded ? "" : "pb-24"}>
      <section className="bg-gradient-to-br from-primary to-[#7B5EA7] px-6 py-12 text-center text-primary-foreground rounded-b-[24px]">
        <h1 className="font-heading font-black text-[36px] leading-tight">COMING SOON 🛍️</h1>
        <p className="text-[16px] font-body mt-2 text-primary-foreground/85">Your one-stop pet shop</p>
      </section>

      <section className="px-4 mt-6">
        <div className="grid grid-cols-3 gap-3">
          {categories.map((c) => (
            <div key={c.label} className="bg-card rounded-[22px] p-4 flex flex-col items-center text-center shadow-petosauras">
              <span className="text-[32px]">{c.emoji}</span>
              <p className="text-[12px] font-body font-bold mt-2 leading-tight">{c.label}</p>
              <span className="mt-2 text-[9px] font-body font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFF5E0", color: "#996600" }}>
                Coming Soon
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 mt-8">
        <div className="bg-card rounded-[22px] p-5 shadow-petosauras">
          <h2 className="font-heading font-bold text-[18px]">Be the first to shop when we launch</h2>
          <div className="flex gap-2 mt-3">
            <Input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" />
            <Button onClick={handleNotify} disabled={submitting}>Notify Me</Button>
          </div>
        </div>
      </section>

      <section className="px-4 mt-8">
        <h2 className="font-heading font-bold text-[18px]">Pet Shops Near You 📍</h2>
        <p className="text-sm text-muted-foreground font-body mt-1">Nearby shops will appear here once your location is detected.</p>
      </section>
    </div>
  );

  if (embedded) return content;

  return (
    <MobileLayout>
      {content}
      <BottomNav onPostClick={() => setShowCreate(true)} />
      <PostUploadModal open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

export default ShopComingSoonScreen;
