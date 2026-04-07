import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileLayout from "@/components/MobileLayout";
import RegistrationFlow from "@/components/RegistrationFlow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";

const petEmojis = ["🐕", "🐈", "🐠", "🦜", "🐇"];
const features = ["📸 Share moments", "💬 Discuss & help", "🏥 Track health", "📚 Pet knowledge"];

const AuthScreen = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/feed", { replace: true });
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    navigate("/feed");
  };

  if (showRegistration) {
    return <RegistrationFlow onComplete={() => navigate("/feed")} />;
  }

  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <div className="absolute top-[-80px] left-[-60px] w-[220px] h-[220px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-[40px] right-[-80px] w-[200px] h-[200px] rounded-full bg-secondary/15 blur-3xl" />
        <div className="absolute bottom-[200px] left-[50%] w-[180px] h-[180px] rounded-full bg-accent/10 blur-3xl" />

        <div className="flex-1 flex flex-col items-center justify-center pt-16 pb-6 px-6 relative z-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-paw-lg">
            <span className="text-4xl">🐾</span>
          </div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">
            <span className="text-primary">Paw</span>
            <span className="text-foreground">Social</span>
          </h1>
          <p className="text-text-mid mt-2 text-center">A home for every pet & pet lover 🐾</p>
          <div className="flex gap-3 mt-6">
            {petEmojis.map((emoji, i) => (
              <div key={i} className="w-12 h-12 rounded-full bg-card shadow-paw flex items-center justify-center text-xl animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                {emoji}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-6 justify-center">
            {features.map((f) => (
              <span key={f} className="text-xs font-medium bg-card shadow-paw px-3 py-1.5 rounded-full text-text-mid">{f}</span>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-t-[28px] shadow-paw-lg px-6 pt-8 pb-8 relative z-10 animate-slide-up">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0 px-4 font-body" />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0 px-4 font-body" />
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </Button>
          </form>
          <p className="text-center text-sm text-text-mid mt-4">
            New here?{" "}
            <button onClick={() => setShowRegistration(true)} className="text-primary font-semibold hover:underline">
              Create account
            </button>
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default AuthScreen;
