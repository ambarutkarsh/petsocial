import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import PageWrapper from "@/components/PageWrapper";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { toast } from "@/components/ui/sonner";

const SPEC_OPTIONS = ["General Practice", "Dermatology", "Surgery", "Dentistry", "Cardiology", "Ophthalmology", "Exotics"];

const AdminVetsScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", whatsapp_number: "",
    clinic_name: "", clinic_address: "", city: "Chennai",
    specialisations: ["General Practice"], years_experience: 5, vc_india_registration: "",
  });

  const { data: vets = [] } = useQuery({
    queryKey: ["admin-vets"],
    queryFn: async () => (await supabase.from("vets").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  if (!user || !isAdminEmail(user.email)) {
    return (
      <MobileLayout>
        <PageWrapper>
          <p className="text-sm font-body">Admin access only.</p>
        </PageWrapper>
      </MobileLayout>
    );
  }

  const submit = async () => {
    const { data, error } = await supabase.from("vets").insert({
      ...form,
      is_verified: false,
      is_active: false,
      onboarding_status: "invited",
      state: "Tamil Nadu",
    }).select().single();
    if (error) {
      toast.error(error.message);
      return;
    }
    // send invite email
    supabase.functions.invoke("invite-vet", { body: { email: form.email, full_name: form.full_name } }).catch(() => {});
    toast("Vet invited");
    qc.invalidateQueries({ queryKey: ["admin-vets"] });
    setForm({ ...form, full_name: "", email: "", phone: "", whatsapp_number: "", clinic_name: "", clinic_address: "", vc_india_registration: "" });
  };

  const verify = async (id: string) => {
    await supabase.from("vets").update({ is_verified: true, verified_at: new Date().toISOString(), is_active: true, onboarding_status: "active" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-vets"] });
  };

  const deactivate = async (id: string) => {
    await supabase.from("vets").update({ is_active: false }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-vets"] });
  };

  const toggleSpec = (s: string) => {
    setForm((f) => ({
      ...f,
      specialisations: f.specialisations.includes(s) ? f.specialisations.filter((x) => x !== s) : [...f.specialisations, s],
    }));
  };

  return (
    <MobileLayout>
      <PageWrapper>
        <header className="flex items-center gap-3">
          <button onClick={() => navigate("/hub")} aria-label="Back" className="w-9 h-9 rounded-[12px] bg-card border border-border shadow-petosauras flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.8} />
          </button>
          <h1 className="font-heading font-bold text-[18px]">Admin · Vet Onboarding</h1>
        </header>

        <div className="mt-4 paw-card p-3 space-y-2 text-xs font-body">
          <p className="font-heading font-bold text-sm">Invite a Vet</p>
          {[
            ["full_name", "Full name"], ["email", "Email"], ["phone", "Phone"], ["whatsapp_number", "WhatsApp number"],
            ["clinic_name", "Clinic name"], ["clinic_address", "Clinic address"], ["vc_india_registration", "VCI Registration"],
          ].map(([k, label]) => (
            <input
              key={k}
              value={(form as any)[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              placeholder={label}
              className="w-full p-2 rounded border border-border font-body"
            />
          ))}
          <input
            type="number"
            value={form.years_experience}
            onChange={(e) => setForm({ ...form, years_experience: Number(e.target.value) })}
            placeholder="Years experience"
            className="w-full p-2 rounded border border-border font-body"
          />
          <div>
            <p className="font-heading font-bold mb-1">Specialisations</p>
            <div className="flex gap-1 flex-wrap">
              {SPEC_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSpec(s)}
                  className={`px-2 py-1 rounded-full border text-[10px] ${
                    form.specialisations.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
          <button onClick={submit} className="w-full py-2.5 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm">Send Invite</button>
        </div>

        <p className="font-heading font-bold text-sm mt-5 mb-2">Vets ({vets.length})</p>
        <div className="space-y-2">
          {vets.map((v: any) => (
            <div key={v.id} className="paw-card p-3 text-xs font-body">
              <p className="font-heading font-bold">{v.full_name}</p>
              <p className="text-[11px] text-muted-foreground">{v.clinic_name ?? "—"} · {v.city}</p>
              <p className="text-[11px]">Status: {v.is_active ? "Active" : "Inactive"} · {v.is_verified ? "Verified ✅" : "Unverified"}</p>
              <p className="text-[11px]">User linked: {v.user_id ? "Yes" : "No"}</p>
              <div className="mt-2 flex gap-2">
                {!v.is_verified && <button onClick={() => verify(v.id)} className="px-2 py-1 rounded-full bg-green-600 text-white text-[10px] font-heading font-bold">Verify</button>}
                {v.is_active && <button onClick={() => deactivate(v.id)} className="px-2 py-1 rounded-full border border-red-300 text-red-700 text-[10px] font-heading font-bold">Deactivate</button>}
              </div>
            </div>
          ))}
        </div>
        <div className="h-20" />
      </PageWrapper>
      <BottomNav />
    </MobileLayout>
  );
};

export default AdminVetsScreen;
