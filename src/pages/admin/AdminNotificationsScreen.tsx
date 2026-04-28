import { useState } from "react";
import { ShareIcon } from "@/components/icons/PetosauraIcons";
import { Send, Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminNotificationsScreen = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [redirect, setRedirect] = useState("");
  const [sending, setSending] = useState(false);

  if (!isAdminEmail(user?.email)) {
    return (
      <AdminLayout title="Push Notifications">
        <p className="text-sm font-body text-muted-foreground">Admin access only.</p>
      </AdminLayout>
    );
  }

  const send = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body required");
      return;
    }
    setSending(true);
    const { data: users, error: e1 } = await supabase
      .from("profiles")
      .select("id")
      .or("is_seed_user.is.null,is_seed_user.eq.false");
    if (e1 || !users) {
      setSending(false);
      toast.error("Failed to load users");
      return;
    }
    const rows = users.map((u) => ({
      user_id: u.id,
      title: title.trim(),
      body: body.trim(),
      redirect_url: redirect.trim() || null,
      type: "broadcast",
      from_user_id: user!.id,
    }));
    const chunkSize = 500;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const slice = rows.slice(i, i + chunkSize);
      const { error } = await supabase.from("notifications").insert(slice);
      if (error) {
        setSending(false);
        toast.error(`Failed at batch ${i}: ${error.message}`);
        return;
      }
    }
    setSending(false);
    toast.success(`Sent to ${rows.length} users`);
    setTitle("");
    setBody("");
    setRedirect("");
  };

  return (
    <AdminLayout title="Push Notifications" subtitle="Send a broadcast notification to all real users">
      <div className="space-y-4 max-w-2xl">
        <div className="rounded-2xl bg-white border p-5 space-y-3" style={{ borderColor: "#E8E5F0" }}>
          <div>
            <label className="text-xs font-body font-semibold text-muted-foreground">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New competition is live! 🏆"
              maxLength={80}
            />
          </div>
          <div>
            <label className="text-xs font-body font-semibold text-muted-foreground">Body</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Submit your best photo before Sunday..."
              rows={4}
              maxLength={300}
            />
          </div>
          <div>
            <label className="text-xs font-body font-semibold text-muted-foreground">Redirect URL (optional)</label>
            <Input
              value={redirect}
              onChange={(e) => setRedirect(e.target.value)}
              placeholder="/feeds?pill=competition"
            />
          </div>
          <Button onClick={send} disabled={sending} className="w-full" size="lg">
            {sending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
            ) : (
              <><ShareIcon className="w-4 h-4 mr-2" strokeWidth={2} /> ShareIcon to all real users</>
            )}
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground font-body">
          Sends only to non-seed users. Inserts in batches of 500.
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminNotificationsScreen;
