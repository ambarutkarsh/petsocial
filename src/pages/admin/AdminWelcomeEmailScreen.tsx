import { useState } from "react";
import { Loader2, Mail, Eye, Send } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminWelcomeEmailScreen = () => {
  const { user } = useAuth();
  const [userId, setUserId] = useState("");
  const [overrideEmail, setOverrideEmail] = useState("");
  const [loading, setLoading] = useState<"preview" | "send" | null>(null);
  const [preview, setPreview] = useState<{ to?: string; subject?: string; html?: string } | null>(null);

  if (!isAdminEmail(user?.email)) {
    return (
      <AdminLayout title="Welcome Email Test"><p className="text-sm font-body text-muted-foreground">Admin access only.</p></AdminLayout>
    );
  }

  const run = async (mode: "preview" | "send") => {
    const val = userId.trim();
    if (!val) { toast.error("Provide a user_id or a profile email"); return; }
    setLoading(mode);
    setPreview(null);
    try {
      const body: any = {};
      if (val.includes("@")) body.email = val;
      else body.user_id = val;
      if (mode === "preview") body.preview = true;
      else body.test = true;
      if (overrideEmail.trim()) body.override_email = overrideEmail.trim();
      const { data, error } = await supabase.functions.invoke("send-welcome-email", { body });
      if (error) throw error;
      const d = data as any;
      if (mode === "preview") {
        setPreview({ to: d.to, subject: d.subject, html: d.html });
        toast.success("Preview generated");
      } else {
        if (d?.sent) toast.success(`Test email sent to ${d.to}`);
        else if (d?.error) toast.error(`Failed: ${d.error}`);
        else toast.message(JSON.stringify(d));
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <AdminLayout title="Welcome Email Test" subtitle="Preview or send a test welcome email without marking the user as sent">
      <div className="space-y-4 max-w-3xl">
        <div className="rounded-2xl bg-white border p-5 space-y-3" style={{ borderColor: "#E8E5F0" }}>
          <div>
            <label className="text-xs font-body font-semibold text-muted-foreground">User ID or profile email</label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid or user@example.com" />
          </div>
          <div>
            <label className="text-xs font-body font-semibold text-muted-foreground">Override recipient email (optional)</label>
            <Input value={overrideEmail} onChange={(e) => setOverrideEmail(e.target.value)} placeholder="you@yourdomain.com" />
            <p className="text-[11px] text-muted-foreground font-body mt-1">If set, the test email is delivered here instead of the user's address.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => run("preview")} disabled={!!loading} variant="outline" className="flex-1">
              {loading === "preview" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
              Preview HTML
            </Button>
            <Button onClick={() => run("send")} disabled={!!loading} className="flex-1">
              {loading === "send" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send test email
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">
            Test sends do NOT set <code>welcome_email_sent</code>, so the real welcome can still fire on first registration.
          </p>
        </div>

        {preview && (
          <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: "#E8E5F0" }}>
            <div className="px-5 py-3 border-b text-xs font-body" style={{ borderColor: "#F0EAF7" }}>
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" /> To: <span className="text-foreground">{preview.to ?? "—"}</span></div>
              <div className="text-muted-foreground mt-0.5">Subject: <span className="text-foreground">{preview.subject}</span></div>
            </div>
            <iframe title="welcome-preview" srcDoc={preview.html} className="w-full" style={{ height: 720, border: 0, background: "#fff" }} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminWelcomeEmailScreen;
