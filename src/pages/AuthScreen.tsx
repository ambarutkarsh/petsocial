import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileLayout from "@/components/MobileLayout";
import RegistrationFlow from "@/components/RegistrationFlow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { isAdminEmail } from "@/lib/admin";

const petEmojis = ["🐕", "🐈", "🐠", "🦜", "🐇"];
const features = ["📸 Share moments", "💬 Discuss & help", "🏥 Track health", "📚 Pet knowledge"];

type SheetView = "login" | "forgotPassword" | "resetSent" | "otp";

const AuthScreen = () => {
  const navigate = useNavigate();
  const { user, loading, isNewGoogleUser } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sheetView, setSheetView] = useState<SheetView>("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStage, setOtpStage] = useState<"request" | "verify">("request");
  const [otpSubmitting, setOtpSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    if (isAdminEmail(user.email)) {
      navigate("/admin", { replace: true });
      return;
    }

    if (isNewGoogleUser) {
      navigate("/complete-registration", { replace: true });
      return;
    }

    const checkProfile = async () => {
      const { data } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single();
      if (!data?.full_name || data.full_name === "PawSocial User") {
        // Check if Google user needing registration
        const provider = user.app_metadata?.provider;
        if (provider === "google") {
          navigate("/complete-registration", { replace: true });
        } else {
          setRegistrationStep(1);
          setShowRegistration(true);
        }
      } else {
        navigate("/feeds", { replace: true });
      }
    };
    checkProfile();
  }, [user, loading, navigate, isNewGoogleUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    trackEvent("login_success");
    if (isAdminEmail(email)) { navigate("/admin"); return; }
    navigate("/feeds");
  };

  const handleGoogleSignIn = async () => {
    trackEvent("google_login_click");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://petosauras.com/feeds" },
    });
    if (error) toast.error("Google sign-in failed. Please try again.");
  };

  const handleForgotPassword = async () => {
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setResetError("Please enter a valid email address");
      return;
    }
    setResetError("");
    setResetSubmitting(true);
    await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setResetSubmitting(false);
    setSheetView("resetSent");
  };

  const handleSendOtp = async () => {
    if (!otpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail)) {
      toast.error("Enter a valid email");
      return;
    }
    setOtpSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: otpEmail,
      options: { shouldCreateUser: false },
    });
    setOtpSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Code sent! Check your email.");
    setOtpStage("verify");
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) { toast.error("Enter the 6-digit code"); return; }
    setOtpSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({
      email: otpEmail,
      token: otpCode,
      type: "email",
    });
    setOtpSubmitting(false);
    if (error) { toast.error(error.message); return; }
    trackEvent("otp_login_success");
    if (isAdminEmail(otpEmail)) { navigate("/admin"); return; }
    navigate("/feeds");
  };

  if (showRegistration) {
    return (
      <RegistrationFlow
        initialStep={registrationStep}
        onComplete={() => navigate("/feeds")}
        onBackToLogin={() => setShowRegistration(false)}
      />
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "radial-gradient(ellipse at top, #EDE5FF 0%, #FBF8F4 50%, #FFF0EB 100%)" }}>
        <div className="absolute top-[-80px] left-[-60px] w-[220px] h-[220px] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-[40px] right-[-80px] w-[200px] h-[200px] rounded-full bg-secondary/15 blur-3xl" />
        <div className="absolute bottom-[200px] left-[50%] w-[180px] h-[180px] rounded-full bg-accent/10 blur-3xl" />

        <div className="flex-1 flex flex-col items-center justify-center pt-16 pb-6 px-6 relative z-10">
          {/* LOGO LOCKED — Do not change without explicit user instruction */}
          <img src="/petosauras-logo.png" alt="Petosauras" style={{ height: 80, objectFit: "contain", marginBottom: 12 }} />
          <div className="flex gap-3 mt-6">
            {petEmojis.map((emoji, i) => (
              <div key={i} className="w-12 h-12 rounded-full bg-card border-2 border-border-strong shadow-petosauras flex items-center justify-center text-xl animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                {emoji}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-6 justify-center">
            {features.map((f) => (
              <span key={f} className="text-xs font-body font-semibold bg-card shadow-petosauras px-3 py-1.5 rounded-full text-muted-foreground">{f}</span>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-t-[28px] shadow-[0_-8px_40px_rgba(123, 94, 167,0.12)] px-6 pt-8 pb-8 relative z-10 animate-slide-up">
          {sheetView === "login" && (
            <>
              <Button variant="outline" className="w-full h-12 rounded-full border-border bg-card text-foreground font-bold mb-4 gap-3"
                onClick={handleGoogleSignIn}>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-text-hint font-body font-medium">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="flex bg-muted rounded-full p-1 mb-4">
                <button
                  type="button"
                  onClick={() => setAuthMode("password")}
                  className={`flex-1 text-xs font-body font-bold py-2 rounded-full transition-all ${
                    authMode === "password" ? "bg-card text-foreground shadow-petosauras" : "text-muted-foreground"
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("otp")}
                  className={`flex-1 text-xs font-body font-bold py-2 rounded-full transition-all ${
                    authMode === "otp" ? "bg-card text-foreground shadow-petosauras" : "text-muted-foreground"
                  }`}
                >
                  Email OTP
                </button>
              </div>

              {authMode === "password" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <div>
                    <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <div className="flex justify-end mt-1.5">
                      <button type="button" onClick={() => { setResetEmail(email); setSheetView("forgotPassword"); }}
                        className="text-[13px] text-primary font-body font-semibold">
                        Forgot password?
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                    {submitting ? "Signing in…" : "Sign In to Petosauras"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  {otpStage === "request" ? (
                    <>
                      <Input type="email" placeholder="Email address" value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} />
                      <Button onClick={handleSendOtp} className="w-full" size="lg" disabled={otpSubmitting}>
                        {otpSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : "Send code"}
                      </Button>
                      <p className="text-[11px] text-text-hint font-body text-center">
                        We'll email a 6-digit code. No password needed.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[13px] text-muted-foreground font-body text-center">
                        Code sent to <strong>{otpEmail}</strong>
                      </p>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="6-digit code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="text-center text-lg tracking-[0.5em] font-bold"
                      />
                      <Button onClick={handleVerifyOtp} className="w-full" size="lg" disabled={otpSubmitting}>
                        {otpSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</> : "Verify & sign in"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => { setOtpStage("request"); setOtpCode(""); }}
                        className="w-full text-[13px] text-primary font-body font-semibold"
                      >
                        Use a different email
                      </button>
                    </>
                  )}
                </div>
              )}

              <p className="text-center text-sm text-muted-foreground mt-4 font-body">
                New here?{" "}
                <button onClick={() => { setRegistrationStep(0); setShowRegistration(true); trackEvent("signup_started"); }} className="text-primary font-bold hover:underline">
                  Join Petosauras
                </button>
              </p>
            </>
          )}

          {sheetView === "forgotPassword" && (
            <div className="animate-fade-in">
              <button onClick={() => setSheetView("login")}
                className="flex items-center gap-1 text-sm font-bold text-primary mb-4">
                <ChevronLeft className="w-4 h-4" strokeWidth={1.8} /> Back to login
              </button>
              <h2 className="text-[22px] font-heading font-bold mb-1">Reset your password</h2>
              <p className="text-sm text-text-hint mb-6 font-body">
                Enter your registered email address. We'll send you a link to reset your password.
              </p>
              <div className="space-y-4">
                <div>
                  <Input type="email" placeholder="Email address" value={resetEmail}
                    onChange={(e) => { setResetEmail(e.target.value); setResetError(""); }} />
                  {resetError && <p className="text-xs text-destructive mt-1">{resetError}</p>}
                </div>
                <Button onClick={handleForgotPassword} className="w-full" size="lg" disabled={resetSubmitting}>
                  {resetSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending…</> : "Send Reset Link"}
                </Button>
              </div>
            </div>
          )}

          {sheetView === "resetSent" && (
            <div className="animate-fade-in text-center py-4">
              <span className="text-5xl mb-4 block">✉️</span>
              <h2 className="text-xl font-heading font-bold mb-2">CheckIcon your inbox</h2>
              <p className="text-sm text-text-hint mb-6 font-body">
                We've sent a password reset link to <strong>{resetEmail}</strong>. It may take a few minutes to arrive.
              </p>
              <button onClick={() => setSheetView("login")} className="text-sm text-primary font-bold hover:underline">
                Back to login
              </button>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default AuthScreen;
