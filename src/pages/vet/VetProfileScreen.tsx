import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import VetDashboardLayout from "@/components/vet/VetDashboardLayout";
import VetGuard from "@/components/vet/VetGuard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

const VetProfileInner = () => {
  const { user } = useAuth();
  const { data: vet, refetch } = useQuery({
    queryKey: ["my-vet", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("vets").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [bio, setBio] = useState("");
  const [years, setYears] = useState(0);
  const [vci, setVci] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!vet) return;
    setClinicName(vet.clinic_name ?? "");
    setClinicAddress(vet.clinic_address ?? "");
    setBio(vet.bio ?? "");
    setYears(vet.years_experience ?? 0);
    setVci(vet.vc_india_registration ?? "");
    setPhotoUrl(vet.profile_photo_url ?? null);
  }, [vet]);

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !vet) return;
    const path = `${vet.id}/avatar-${Date.now()}.${f.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, f, { upsert: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    setPhotoUrl(pub.publicUrl);
  };

  const save = async () => {
    if (!vet) return;
    setSaving(true);
    const patch: any = { clinic_name: clinicName, clinic_address: clinicAddress, bio: bio.slice(0, 300), years_experience: years, profile_photo_url: photoUrl };
    if (!vet.is_verified) patch.vc_india_registration = vci;
    const { error } = await supabase.from("vets").update(patch).eq("id", vet.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast("Profile updated");
      refetch();
    }
  };

  return (
    <VetDashboardLayout title="My Profile">
      <div className="paw-card p-3">
        {photoUrl && <img src={photoUrl} alt="" className="w-20 h-20 rounded-full object-cover" />}
        <input type="file" accept="image/*" onChange={onPhoto} className="text-xs font-body mt-2" />
      </div>

      <div className="mt-3 space-y-2 text-xs font-body">
        <div>
          <label className="font-heading font-bold">Full name</label>
          <input value={vet?.full_name ?? ""} readOnly className="w-full p-2 rounded border border-border bg-muted mt-1" />
        </div>
        <div>
          <label className="font-heading font-bold">Clinic name</label>
          <input value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="w-full p-2 rounded border border-border mt-1" />
        </div>
        <div>
          <label className="font-heading font-bold">Clinic address</label>
          <input value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} className="w-full p-2 rounded border border-border mt-1" />
        </div>
        <div>
          <label className="font-heading font-bold">Bio (max 300)</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full p-2 rounded border border-border mt-1" />
        </div>
        <div>
          <label className="font-heading font-bold">Years experience</label>
          <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full p-2 rounded border border-border mt-1" />
        </div>
        <div>
          <label className="font-heading font-bold">VCI Registration</label>
          <input value={vci} onChange={(e) => setVci(e.target.value)} disabled={vet?.is_verified} className="w-full p-2 rounded border border-border mt-1" />
        </div>
      </div>

      <div className={`mt-4 paw-card p-3 ${vet?.is_verified ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50"}`}>
        <p className="font-heading font-bold text-sm">
          {vet?.is_verified ? "✅ Verified Veterinarian" : "⏳ Verification Pending"}
        </p>
        <p className="text-[11px] font-body">
          {vet?.is_verified
            ? "Your profile shows a verified badge to all pet parents."
            : "Petosauras is reviewing your VCI registration. You'll be notified when verified."}
        </p>
      </div>

      <button onClick={save} disabled={saving} className="mt-4 w-full py-3 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm disabled:opacity-50">
        {saving ? "Saving…" : "Save Profile"}
      </button>
    </VetDashboardLayout>
  );
};

const VetProfileScreen = () => <VetGuard><VetProfileInner /></VetGuard>;
export default VetProfileScreen;
