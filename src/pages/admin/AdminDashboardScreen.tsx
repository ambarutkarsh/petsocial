import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, FileImage, Stethoscope, CalendarCheck } from "lucide-react";

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
  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [{ count: users }, { count: posts }, { count: vets }, { count: bookings }] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).or("is_seed_user.eq.false,is_seed_user.is.null"),
        supabase.from("posts").select("id", { count: "exact", head: true }).or("is_seed_post.eq.false,is_seed_post.is.null"),
        supabase.from("vets").select("id", { count: "exact", head: true }).eq("is_active", true).eq("is_verified", true),
        supabase.from("vet_bookings").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      ]);
      return { users: users ?? 0, posts: posts ?? 0, vets: vets ?? 0, bookings: bookings ?? 0 };
    },
  });

  const { data: recent = [] } = useQuery({
    queryKey: ["admin-recent-registrations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, city, created_at")
        .or("is_seed_user.eq.false,is_seed_user.is.null")
        .order("created_at", { ascending: false })
        .limit(10);
      const ids = (data ?? []).map((p) => p.id);
      const { data: pets } = ids.length
        ? await supabase.from("pets").select("owner_id, name").in("owner_id", ids)
        : { data: [] as any[] };
      const petByOwner = new Map<string, string>();
      (pets ?? []).forEach((p: any) => { if (!petByOwner.has(p.owner_id)) petByOwner.set(p.owner_id, p.name); });
      return (data ?? []).map((p) => ({ ...p, pet: petByOwner.get(p.id) ?? "—" }));
    },
  });

  return (
    <AdminLayout title="Dashboard" subtitle="Petosauras admin overview">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats?.users ?? "…"} hint="Profiles" />
        <StatCard icon={FileImage} label="Total Posts" value={stats?.posts ?? "…"} hint="All posts" />
        <StatCard icon={Stethoscope} label="Active Vets" value={stats?.vets ?? "…"} hint="Verified" />
        <StatCard icon={CalendarCheck} label="Bookings" value={stats?.bookings ?? "…"} hint="This week" />
      </div>

      <Card className="rounded-2xl bg-white overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: "#E8E5F0" }}>
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
