import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

import { BookVetIcon, DocumentIcon, ProfileIcon, VetIcon } from "@/components/icons/PetosauraIcons";
import AdminLayout from "@/components/admin/AdminLayout";

interface Stats {
  users: number;
  posts: number;
  vets: number;
  bookings: number;
}

interface RecentUser {
  full_name: string | null;
  city: string | null;
  state: string | null;
  created_at: string | null;
}

const StatCard = ({ icon: Icon, label, value, hint }: { icon: any; label: string; value: number | string; hint: string }) => (
  <Card className="p-5 rounded-2xl bg-white">
    <div className="flex items-center justify-between mb-3">
      <Icon className="w-5 h-5 text-[#7B5EA7]" />
    </div>
    <p className="text-xs font-body text-muted-foreground">{label}</p>
    <p className="text-2xl font-heading font-bold mt-1">{value}</p>
    <p className="text-[11px] font-body text-muted-foreground mt-1">{hint}</p>
  </Card>
);

const AdminDashboardScreen = () => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = async () => {
    setStatsLoading(true);
    setStatsError(null);

    // Hard 8s timeout — never let UI sit on "..."
    const timeoutPromise = new Promise<"timeout">((resolve) =>
      setTimeout(() => resolve("timeout"), 8000)
    );

    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const work = Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .or("is_seed_user.eq.false,is_seed_user.is.null"),
        supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .or("is_seed_post.eq.false,is_seed_post.is.null"),
        supabase
          .from("vets")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("is_verified", true),
        supabase
          .from("vet_bookings")
          .select("*", { count: "exact", head: true })
          .gte("created_at", weekAgo.toISOString()),
      ]);

      const result = await Promise.race([work, timeoutPromise]);

      if (result === "timeout") {
        console.error("Admin stats error: query exceeded 8s");
        setStats({ users: 0, posts: 0, vets: 0, bookings: 0 });
        setStatsError("Stats query timed out (>8s). Showing 0.");
        return;
      }

      const [u, p, v, b] = result;
      setStats({
        users: u.count ?? 0,
        posts: p.count ?? 0,
        vets: v.count ?? 0,
        bookings: b.count ?? 0,
      });
    } catch (err: any) {
      console.error("Admin stats error:", err);
      setStats({ users: 0, posts: 0, vets: 0, bookings: 0 });
      setStatsError(err?.message ?? "Unknown error");
    } finally {
      setStatsLoading(false);
    }
  };

  const loadRecentUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, city, state, created_at")
        .or("is_seed_user.eq.false,is_seed_user.is.null")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      setRecentUsers(data ?? []);
    } catch (err) {
      console.error("Recent users error:", err);
      setRecentUsers([]);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    loadStats();
    loadRecentUsers();
  }, [authLoading, user?.id]);

  return (
    <AdminLayout title="Dashboard" subtitle="Petosauras admin overview">
      {statsError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-body">
          {statsError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ProfileIcon} label="Real Users" value={statsLoading ? "0" : stats?.users ?? 0} hint="Excludes seed users" />
        <StatCard icon={DocumentIcon} label="Real Posts" value={statsLoading ? "0" : stats?.posts ?? 0} hint="Excludes seed posts" />
        <StatCard icon={VetIcon} label="Verified Vets" value={statsLoading ? "0" : stats?.vets ?? 0} hint="Active & verified" />
        <StatCard icon={BookVetIcon} label="Bookings" value={statsLoading ? "0" : stats?.bookings ?? 0} hint="Last 7 days" />
      </div>

      <Card className="rounded-2xl bg-white overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: "#F5F1EC" }}>
          <h2 className="text-base font-heading font-bold">Recent Registrations</h2>
          <p className="text-xs text-muted-foreground font-body mt-0.5">Last 10 new pet parents (excluding seed)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-[#FAFAFA] text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">City</th>
                <th className="text-left px-5 py-3 font-medium">State</th>
                <th className="text-left px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((r, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "#F0EDF5" }}>
                  <td className="px-5 py-3">{r.full_name ?? "—"}</td>
                  <td className="px-5 py-3">{r.city ?? "—"}</td>
                  <td className="px-5 py-3">{r.state ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No registrations yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboardScreen;
