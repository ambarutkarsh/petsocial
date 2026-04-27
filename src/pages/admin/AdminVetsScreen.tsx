import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, CheckCircle2, Pencil, Ban, Power, Loader2 } from "lucide-react";

const SPEC_OPTIONS = [
  "General Practice", "Surgery", "Dermatology", "Cardiology", "Ophthalmology",
  "Dentistry", "Orthopaedics", "Oncology", "Exotics",
];
const CITIES = ["Chennai"];

type VetForm = {
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  clinic_name: string;
  clinic_address: string;
  city: string;
  pin_code: string;
  specialisations: string[];
  years_experience: number;
  vc_india_registration: string;
  is_verified: boolean;
};

const blankForm: VetForm = {
  full_name: "", email: "", phone: "", whatsapp_number: "",
  clinic_name: "", clinic_address: "", city: "Chennai", pin_code: "",
  specialisations: ["General Practice"], years_experience: 5,
  vc_india_registration: "", is_verified: false,
};

const StatusPill = ({ vet }: { vet: any }) => {
  if (!vet.is_active && vet.onboarding_status === "invited") {
    return <span className="text-[11px] font-body px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Invited</span>;
  }
  if (vet.is_active) {
    return <span className="text-[11px] font-body px-2 py-0.5 rounded-full bg-green-100 text-green-800">Active</span>;
  }
  return <span className="text-[11px] font-body px-2 py-0.5 rounded-full bg-red-100 text-red-700">Inactive</span>;
};

const VerifiedPill = ({ verified }: { verified: boolean }) =>
  verified ? (
    <span className="text-[11px] font-body px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">✅ Verified</span>
  ) : (
    <span className="text-[11px] font-body px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">⏳ Pending</span>
  );

const AdminVetsScreen = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VetForm>(blankForm);
  const [submitting, setSubmitting] = useState(false);

  const { data: vets = [], isLoading } = useQuery({
    queryKey: ["admin-vets"],
    enabled: isAdminEmail(user?.email),
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-list-vets");
      if (error) throw error;
      return (data as { data?: any[] })?.data ?? [];
    },
  });

  if (!isAdminEmail(user?.email)) {
    return (
      <AdminLayout title="Vet Management">
        <p className="text-sm font-body text-muted-foreground">Admin access only.</p>
      </AdminLayout>
    );
  }

  const openInvite = () => {
    setEditingId(null);
    setForm(blankForm);
    setOpen(true);
  };

  const openEdit = (v: any) => {
    setEditingId(v.id);
    setForm({
      full_name: v.full_name ?? "",
      email: v.email ?? "",
      phone: v.phone ?? "",
      whatsapp_number: v.whatsapp_number ?? "",
      clinic_name: v.clinic_name ?? "",
      clinic_address: v.clinic_address ?? "",
      city: v.city ?? "Chennai",
      pin_code: v.pin_code ?? "",
      specialisations: v.specialisations ?? ["General Practice"],
      years_experience: v.years_experience ?? 5,
      vc_india_registration: v.vc_india_registration ?? "",
      is_verified: !!v.is_verified,
    });
    setOpen(true);
  };

  const toggleSpec = (s: string) => {
    setForm((f) => ({
      ...f,
      specialisations: f.specialisations.includes(s)
        ? f.specialisations.filter((x) => x !== s)
        : [...f.specialisations, s],
    }));
  };

  const handleSubmit = async () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Name, email, and phone are required");
      return;
    }
    setSubmitting(true);

    if (editingId) {
      const { error } = await supabase.functions.invoke("admin-update-vet", {
        body: {
          id: editingId,
          updates: {
            ...form,
            verified_at: form.is_verified ? new Date().toISOString() : null,
            state: "Tamil Nadu",
          },
        },
      });
      setSubmitting(false);
      if (error) { toast.error(error.message); return; }
      toast.success("✅ Vet updated successfully");
    } else {
      const payload = {
        ...form,
        is_active: form.is_verified,
        onboarding_status: "invited",
        state: "Tamil Nadu",
        verified_at: form.is_verified ? new Date().toISOString() : null,
      };
      const { error } = await supabase.functions.invoke("admin-insert-vet", { body: payload });
      setSubmitting(false);
      if (error) { toast.error(error.message); return; }
      // best-effort invite email
      supabase.functions.invoke("invite-vet", {
        body: { email: form.email, full_name: form.full_name },
      }).catch(() => {});
      toast.success("✅ Vet invited successfully! They can now log in and set up their dashboard.");
    }

    setOpen(false);
    setForm(blankForm);
    qc.invalidateQueries({ queryKey: ["admin-vets"] });
  };

  const callUpdate = async (id: string, updates: any, successMsg: string) => {
    const { error } = await supabase.functions.invoke("admin-update-vet", { body: { id, updates } });
    if (error) { toast.error(error.message); return; }
    toast.success(successMsg);
    qc.invalidateQueries({ queryKey: ["admin-vets"] });
  };

  const verify = (v: any) =>
    callUpdate(v.id, {
      is_verified: true,
      is_active: true,
      verified_at: new Date().toISOString(),
      onboarding_status: "active",
    }, "Vet verified");

  const setActive = (v: any, active: boolean) =>
    callUpdate(v.id, { is_active: active }, active ? "Vet activated" : "Vet deactivated");

  return (
    <AdminLayout
      title="Vet Management"
      subtitle="Manage verified vets on Petosauras"
      headerRight={
        <Button onClick={openInvite} style={{ background: "#1B2A4A" }} className="text-white hover:opacity-90">
          <Plus className="w-4 h-4 mr-1" /> Invite New Vet
        </Button>
      }
    >
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E8D5B8" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-[#FAFAFA] text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Clinic</th>
                <th className="text-left px-4 py-3 font-medium">City</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Verified</th>
                <th className="text-left px-4 py-3 font-medium">Registered</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
                </td></tr>
              )}
              {!isLoading && vets.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No vets yet. Invite the first vet.</td></tr>
              )}
              {vets.map((v: any) => (
                <tr key={v.id} className="border-t" style={{ borderColor: "#F0EDF5" }}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{v.full_name}</p>
                    <p className="text-[11px] text-muted-foreground">{v.email}</p>
                  </td>
                  <td className="px-4 py-3">{v.clinic_name ?? "—"}</td>
                  <td className="px-4 py-3">{v.city}</td>
                  <td className="px-4 py-3"><StatusPill vet={v} /></td>
                  <td className="px-4 py-3"><VerifiedPill verified={!!v.is_verified} /></td>
                  <td className="px-4 py-3 text-muted-foreground text-[12px]">
                    {v.created_at ? new Date(v.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      {!v.is_verified && (
                        <button onClick={() => verify(v)} className="text-[11px] px-2.5 py-1 rounded-full bg-green-600 text-white font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verify
                        </button>
                      )}
                      <button onClick={() => openEdit(v)} className="text-[11px] px-2.5 py-1 rounded-full border bg-white inline-flex items-center gap-1" style={{ borderColor: "#E8D5B8" }}>
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      {v.is_active ? (
                        <button onClick={() => setActive(v, false)} className="text-[11px] px-2.5 py-1 rounded-full border border-red-300 text-red-700 font-bold inline-flex items-center gap-1">
                          <Ban className="w-3 h-3" /> Deactivate
                        </button>
                      ) : (
                        <button onClick={() => setActive(v, true)} className="text-[11px] px-2.5 py-1 rounded-full border border-green-300 text-green-700 font-bold inline-flex items-center gap-1">
                          <Power className="w-3 h-3" /> Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Vet" : "Invite New Vet"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <FieldLabel label="Full Name *">
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </FieldLabel>
              <FieldLabel label="Email *">
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </FieldLabel>
              <FieldLabel label="Phone *">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10 digits" />
              </FieldLabel>
              <FieldLabel label="WhatsApp Number">
                <Input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} />
              </FieldLabel>
            </div>
            <div className="space-y-3">
              <FieldLabel label="Clinic Name">
                <Input value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} />
              </FieldLabel>
              <FieldLabel label="Clinic Address">
                <Textarea rows={3} value={form.clinic_address} onChange={(e) => setForm({ ...form, clinic_address: e.target.value })} />
              </FieldLabel>
              <FieldLabel label="City">
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full h-10 rounded-md border bg-white px-3 text-sm font-body"
                  style={{ borderColor: "#E8D5B8" }}
                >
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">More cities coming soon</p>
              </FieldLabel>
              <FieldLabel label="PIN Code">
                <Input value={form.pin_code} onChange={(e) => setForm({ ...form, pin_code: e.target.value })} />
              </FieldLabel>
            </div>

            <div className="md:col-span-2 space-y-4">
              <FieldLabel label="Specialisations">
                <div className="flex flex-wrap gap-2">
                  {SPEC_OPTIONS.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => toggleSpec(s)}
                      className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                        form.specialisations.includes(s)
                          ? "bg-[#1B2A4A] text-white border-[#1B2A4A]"
                          : "bg-white text-foreground"
                      }`}
                      style={form.specialisations.includes(s) ? {} : { borderColor: "#E8D5B8" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </FieldLabel>

              <FieldLabel label="Years of Experience">
                <Input
                  type="number"
                  value={form.years_experience}
                  onChange={(e) => setForm({ ...form, years_experience: Number(e.target.value) })}
                />
              </FieldLabel>

              <FieldLabel label="VCI Registration Number">
                <Input
                  value={form.vc_india_registration}
                  onChange={(e) => setForm({ ...form, vc_india_registration: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Paste the vet's Veterinary Council of India registration number
                </p>
              </FieldLabel>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F5F2FB]">
                <Switch
                  checked={form.is_verified}
                  onCheckedChange={(v) => setForm({ ...form, is_verified: v })}
                />
                <div>
                  <p className="text-sm font-semibold">Mark as verified immediately</p>
                  <p className="text-[11px] text-muted-foreground">
                    Use when you personally know the vet and have confirmed their credentials
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ background: "#1B2A4A" }}
              className="text-white hover:opacity-90"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Save Changes" : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

const FieldLabel = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-body font-semibold text-muted-foreground block mb-1">{label}</label>
    {children}
  </div>
);

export default AdminVetsScreen;
