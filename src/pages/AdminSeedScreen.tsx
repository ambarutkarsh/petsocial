import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MobileLayout from "@/components/MobileLayout";
import { toast } from "sonner";
import { ArrowLeft, Sprout, Trash2, Users, FileImage, Loader2 } from "lucide-react";

const ADMIN_EMAIL = "petosauras@gmail.com";

const AdminSeedScreen = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [seedUsers, setSeedUsers] = useState(0);
  const [seedPosts, setSeedPosts] = useState(0);
  const [running, setRunning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/feed");
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) fetchStatus();
  }, [isAdmin]);

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-dummy-users", {
        body: { action: "status" },
      });
      if (!error && data) {
        setSeedUsers(data.seed_users || 0);
        setSeedPosts(data.seed_posts || 0);
      }
    } catch {}
    setStatusLoading(false);
  };

  const handleSeed = async () => {
    setRunning(true);
    setLog(["🌱 Starting seed process..."]);
    try {
      setLog((prev) => [...prev, "Creating 20 users with pets, posts, follows, and comments..."]);
      const { data, error } = await supabase.functions.invoke("seed-dummy-users", {
        body: { action: "seed" },
      });
      if (error) throw error;
      setLog((prev) => [
        ...prev,
        `✅ ${data.users_created} users created`,
        `✅ ${data.posts_created} posts created`,
        data.skipped > 0 ? `⚠️ ${data.skipped} skipped (already exist)` : "",
        `🎉 ${data.message}`,
      ].filter(Boolean));
      toast.success(data.message);
      await fetchStatus();
    } catch (err: any) {
      setLog((prev) => [...prev, `❌ Error: ${err.message}`]);
      toast.error("Seed failed: " + err.message);
    }
    setRunning(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete ALL seed data? This cannot be undone.")) return;
    setDeleting(true);
    setLog(["🗑️ Deleting all seed data..."]);
    try {
      const { data, error } = await supabase.functions.invoke("seed-dummy-users", {
        body: { action: "delete" },
      });
      if (error) throw error;
      setLog((prev) => [...prev, `✅ ${data.message}`]);
      toast.success(data.message);
      await fetchStatus();
    } catch (err: any) {
      setLog((prev) => [...prev, `❌ Error: ${err.message}`]);
      toast.error("Delete failed: " + err.message);
    }
    setDeleting(false);
  };

  if (authLoading || !isAdmin) return null;

  return (
    <MobileLayout>
      <div className="px-5 py-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/feed")} className="p-2 rounded-xl bg-surface-alt">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-heading font-bold text-foreground">Seed Data Manager</h1>
        </div>

        {/* Status */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-4 text-center rounded-2xl">
            <Users className="w-6 h-6 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-foreground">
              {statusLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : seedUsers}
            </div>
            <div className="text-xs text-muted-foreground">Seed Users</div>
          </Card>
          <Card className="p-4 text-center rounded-2xl">
            <FileImage className="w-6 h-6 mx-auto mb-1 text-accent" />
            <div className="text-2xl font-bold text-foreground">
              {statusLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : seedPosts}
            </div>
            <div className="text-xs text-muted-foreground">Seed Posts</div>
          </Card>
        </div>

        {/* Seed button */}
        <Button
          onClick={handleSeed}
          disabled={running || deleting}
          className="w-full rounded-2xl h-12 text-base mb-4"
        >
          {running ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Seeding...</>
          ) : (
            <><Sprout className="w-5 h-5 mr-2" /> 🌱 Run Seed Data</>
          )}
        </Button>

        {/* Log */}
        {log.length > 0 && (
          <Card className="p-4 rounded-2xl mb-6 bg-muted/40 max-h-60 overflow-y-auto">
            <div className="text-xs font-mono space-y-1">
              {log.map((line, i) => (
                <div key={i} className="text-muted-foreground">{line}</div>
              ))}
            </div>
          </Card>
        )}

        {/* Danger zone */}
        {seedUsers > 0 && (
          <div className="border border-destructive/30 rounded-2xl p-4 mt-4">
            <h3 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h3>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={running || deleting}
              className="w-full border-destructive text-destructive hover:bg-destructive/10 rounded-2xl"
            >
              {deleting ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Deleting...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> 🗑️ Delete All Seed Data</>
              )}
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default AdminSeedScreen;
