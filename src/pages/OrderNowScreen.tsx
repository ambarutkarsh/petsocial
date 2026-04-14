import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileLayout from "@/components/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const previews = [
  { emoji: "🍖", title: "Premium Pet Food", desc: "Curated brands delivered to your door" },
  { emoji: "🧸", title: "Toys & Accessories", desc: "Everything to keep your pet happy" },
  { emoji: "💊", title: "Health Supplies", desc: "Supplements, grooming and more" },
];

const OrderNowScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.from("waitlist").insert({ email, user_id: user?.id || null, feature: "order_now" });
    setLoading(false);
    if (error) { toast.error("Something went wrong"); return; }
    setSubmitted(true);
    toast.success("You're on the list!");
  };

  return (
    <MobileLayout>
      <div className="pb-20 px-4">
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg z-40 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/health")}><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-heading font-bold text-lg">Order Now</h1>
        </header>

        <div className="text-center py-10">
          <span className="text-7xl block mb-4">🛍️</span>
          <h2 className="font-heading text-2xl font-bold">Something exciting is coming</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            Shop for your pet's food, toys, health supplies and accessories — all in one place. Launching soon!
          </p>
        </div>

        {submitted ? (
          <p className="text-center text-sm text-secondary font-semibold py-4">✅ You're on the list! We'll notify you.</p>
        ) : (
          <div className="max-w-xs mx-auto space-y-3">
            <p className="text-sm font-semibold text-center">Get notified when we launch</p>
            <Input placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            <Button className="w-full" onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Notify Me"}
            </Button>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <h3 className="font-heading font-semibold text-sm">What's coming</h3>
          {previews.map((p) => (
            <div key={p.title} className="rounded-xl bg-card p-4 border border-border/50" style={{ borderLeft: "4px solid hsl(var(--primary))" }}>
              <p className="font-semibold text-sm">{p.emoji} {p.title}</p>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};

export default OrderNowScreen;
