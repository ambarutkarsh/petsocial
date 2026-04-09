import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileLayout from "@/components/MobileLayout";
import RegistrationFlow from "@/components/RegistrationFlow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const petEmojis = ["🐕", "🐈", "🐠", "🦜", "🐇"];
const features = ["📸 Share moments", "💬 Discuss & help", "🏥 Track health", "📚 Pet knowledge"];

const AuthScreen = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    // Check if Google-signed-in user needs onboarding (no full_name means new)
    const checkProfile = async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      if (!data?.full_name) {
        // New Google user — send to pet details (step 1)
        setRegistrationStep(1);
        setShowRegistration(true);
      } else {
        navigate("/feed", { replace: true });
      }
    };
    checkProfile();
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

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/feed" },
    });
    if (error) toast.error(error.message);
  };

  if (showRegistration) {
    return (
      <RegistrationFlow
        initialStep={registrationStep}
        onComplete={() => navigate("/feed")}
        onBackToLogin={() => setShowRegistration(false)}
      />
    );
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
          {/* Google sign-in */}
          <Button variant="outline" className="w-full h-12 rounded-full border-[#E0DAD5] bg-white text-primary font-semibold mb-4 gap-3"
            onClick={handleGoogleSignIn}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#E0DAD5]" />
            <span className="text-xs text-text-muted font-medium">or</span>
            <div className="flex-1 h-px bg-[#E0DAD5]" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-muted/50 border-0 px-4 font-body" />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl bg-muted/50 border-0 px-4 font-body" />
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign In"}
            </Button>
          </form>
          <p className="text-center text-sm text-text-mid mt-4">
            New here?{" "}
            <button onClick={() => { setRegistrationStep(0); setShowRegistration(true); }} className="text-primary font-semibold hover:underline">
              Create account
            </button>
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default AuthScreen;
