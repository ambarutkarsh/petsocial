import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

import { BookVetIcon, DocumentIcon, LocationPinIcon, ProfileIcon, VetIcon } from "@/components/icons/PetosauraIcons";
import AdminLayout from "@/components/admin/AdminLayout";

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

  const { data: stats, isLoading: statsLoading, error: statsError, dataUpdatedAt } = useQuery({
    queryKey: ["admin-dashboard-stats", user?.id],
    enabled: !authLoading && !!user,
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      // Use total counts (RLS-safe, no fragile .or()) and subtract seed counts
      // to derive non-seed numbers. This avoids PostgREST quirks with head:true + .or().
      const [u, p, v, b, su, sp] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("vets").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("vet_bookings").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_seed_user", true),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("is_seed_post", true),
      ]);
      const errors = [
        u.error && `profiles(non-seed): ${u.error.message}`,
        p.error && `posts(non-seed): ${p.error.message}`,
        v.error && `vets: ${v.error.message}`,
        b.error && `bookings: ${b.error.message}`,
        su.error && `profiles(seed): ${su.error.message}`,
        sp.error && `posts(seed): ${sp.error.message}`,
      ].filter(Boolean) as string[];
      if (errors.length) {
        console.error("[AdminDashboard] errors:", errors);
        throw new Error(errors.join(" | "));
      }
      const totalUsers = u.count ?? 0;
      const totalPosts = p.count ?? 0;
      const seedUsers = su.count ?? 0;
      const seedPosts = sp.count ?? 0;
      return {
        users: totalUsers,                          // ALL users (real signal)
        posts: totalPosts,                          // ALL posts
        realUsers: Math.max(0, totalUsers - seedUsers),
        realPosts: Math.max(0, totalPosts - seedPosts),
        vets: v.count ?? 0,                         // active (verification not required)
        bookings: b.count ?? 0,
        seedUsers,
        seedPosts,
      };
    },
    retry: 1,
  });

  const { data: recent = [], error: recentError } = useQuery({
    queryKey: ["admin-recent-registrations", user?.id],
    enabled: !authLoading && !!user,
    queryFn: async () => {
      // Fetch last 20 then filter out seed users client-side (avoids .or() quirks).
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, city, created_at, is_seed_user")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      const filtered = (data ?? []).filter((p: any) => p.is_seed_user !== true).slice(0, 10);
      const ids = filtered.map((p) => p.id);
      const { data: pets } = ids.length
        ? await supabase.from("pets").select("owner_id, name").in("owner_id", ids)
        : { data: [] as any[] };
      const petByOwner = new Map<string, string>();
      (pets ?? []).forEach((p: any) => { if (!petByOwner.has(p.owner_id)) petByOwner.set(p.owner_id, p.name); });
      return filtered.map((p) => ({ ...p, pet: petByOwner.get(p.id) ?? "—" }));
    },
  });

  return (
    <AdminLayout title="Dashboard" subtitle="Petosauras admin overview">
      {/* Always-on diagnostics so 0 vs blocked is distinguishable */}
      <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-body text-slate-700 space-y-0.5">
        <div><b>Auth:</b> {authLoading ? "loading…" : user ? `signed in as ${user.email} (${user.id.slice(0,8)}…)` : "NOT signed in"}</div>
        <div><b>Stats query:</b> {statsLoading ? "loading…" : statsError ? `ERROR: ${(statsError as Error).message}` : `OK — updated ${dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—"}`}</div>
        {stats && (
          <div><b>Counts:</b> non-seed users={stats.users}, non-seed posts={stats.posts}, seed users={stats.seedUsers}, seed posts={stats.seedPosts}, active vets={stats.vets}, bookings(7d)={stats.bookings}</div>
        )}
        {recentError && <div className="text-red-700"><b>Recent error:</b> {(recentError as Error).message}</div>}
      </div>

      {statsError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-body">
          Failed to load stats: {(statsError as Error).message}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ProfileIcon} label="Total Users" value={statsLoading ? "…" : stats?.users ?? 0} hint="Profiles" />
        <StatCard icon={DocumentIcon} label="Total Posts" value={statsLoading ? "…" : stats?.posts ?? 0} hint="All posts" />
        <StatCard icon={VetIcon} label="Active Vets" value={statsLoading ? "…" : stats?.vets ?? 0} hint="Verified" />
        <StatCard icon={BookVetIcon} label="Bookings" value={statsLoading ? "…" : stats?.bookings ?? 0} hint="This week" />
      </div>

      <Card className="rounded-2xl bg-white overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: "#F5F1EC" }}>
          <h2 className="text-base font-heading font-bold">Recent Registrations</h2>
          <p className="text-xs text-muted-foreground font-body mt-0.5">Last 10 new pet parents</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-[#FAFAFA] text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">Pet</th>
                <th className="text-left px-5 py-3 font-medium">City</th>
                <th className="text-left px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r: any) => (
                <tr key={r.id} className="border-t" style={{ borderColor: "#F0EDF5" }}>
                  <td className="px-5 py-3">{r.full_name ?? "—"}</td>
                  <td className="px-5 py-3">{r.pet}</td>
                  <td className="px-5 py-3">{r.city ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
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
