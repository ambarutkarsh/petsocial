import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileLayout from "@/components/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const ResetPasswordScreen = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User arrived from password reset link
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const pwValid = newPassword.length >= 8;
  const pwMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async () => {
    if (!pwValid) { setError("Password must be at least 8 characters"); return; }
    if (!pwMatch) { setError("Passwords do not match"); return; }
    setError("");
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    toast.success("Password updated!");
    setTimeout(() => navigate("/feed", { replace: true }), 2000);
  };

  if (success) {
    return (
      <MobileLayout>
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <span className="text-5xl mb-4">✅</span>
          <h2 className="text-xl font-heading font-bold">Password updated!</h2>
          <p className="text-sm text-text-muted mt-2">Redirecting to your feed...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col px-6 pt-16">
        <h1 className="text-2xl font-heading font-bold mb-2">Set New Password</h1>
        <p className="text-sm text-text-muted mb-6">Enter your new password below.</p>

        <div className="space-y-4">
          <div className="relative">
            <Input type={showPw ? "text" : "password"} placeholder="New password (min 8 chars)"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="h-12 rounded-xl bg-muted/50 border-0 pr-10" />
            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Input type={showConfirm ? "text" : "password"} placeholder="Confirm new password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 rounded-xl bg-muted/50 border-0 pr-10" />
            <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {!pwMatch && confirmPassword.length > 0 && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button onClick={handleSubmit} className="w-full" size="lg" disabled={submitting || !pwValid || !pwMatch}>
            {submitting ? "Updating…" : "Update Password"}
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default ResetPasswordScreen;
