import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInDays, differenceInMonths, differenceInYears, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchHealthRecords, fetchPetDocuments } from "@/lib/petDocuments";
import { Pencil, Syringe, Bug, FileText, Calendar, ShieldCheck, Cpu } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

interface Props {
  pet: any;
}

const PetIdentityCard = ({ pet }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: latestWeight } = useQuery({
    queryKey: ["latest-weight", pet.id],
    enabled: !!pet?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("health_logs")
        .select("weight_kg")
        .eq("pet_id", pet.id)
        .not("weight_kg", "is", null)
        .order("log_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.weight_kg ?? null;
    },
  });

  const { data: records = [] } = useQuery({
    queryKey: ["mypet-summary", pet.id],
    enabled: !!user && !!pet?.id,
    queryFn: () => fetchHealthRecords({ ownerId: user!.id, petId: pet.id }),
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["pet-documents", pet.id],
    enabled: !!user && !!pet?.id,
    queryFn: () => fetchPetDocuments({ ownerId: user!.id, petId: pet.id }),
  });

  const { data: microchip } = useQuery({
    queryKey: ["pet-microchip", pet.id],
    enabled: !!user && !!pet?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("pet_microchips")
        .select("chip_number, verification_status, is_active")
        .eq("pet_id", pet.id)
        .eq("owner_id", user!.id)
        .eq("is_active", true)
        .order("registered_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const hasChip = !!(microchip?.chip_number || pet.microchip_number);
  const chipNumber = microchip?.chip_number || pet.microchip_number;
  const isVerified = microchip?.verification_status === "verified";

  const upcomingVaccines = records.filter(
    (r: any) => r.record_type === "vaccine" && r.next_due_date && new Date(r.next_due_date) > new Date()
  );
  const upcomingDeworm = records.find(
    (r: any) => r.record_type === "deworming" && r.next_due_date && new Date(r.next_due_date) > new Date()
  );
  const lastVet = records.find((r: any) => r.record_type === "vet_visit" && r.record_date);

  const age = pet.date_of_birth
    ? (() => {
        const dob = new Date(pet.date_of_birth);
        const yrs = differenceInYears(new Date(), dob);
        const mos = differenceInMonths(new Date(), dob) % 12;
        return yrs >= 1 ? `${yrs} yr${yrs > 1 ? "s" : ""}` : `${mos} mo`;
      })()
    : pet.age_years
    ? `${pet.age_years} yrs`
    : null;

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${pet.id}/avatar_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed");
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("pets").update({ avatar_url: data.publicUrl }).eq("id", pet.id);
    qc.invalidateQueries({ queryKey: ["my-pets"] });
    toast.success("Photo updated");
  };

  return (
    <div className="rounded-3xl border border-border bg-primary-light/40 p-3.5 shadow-petosauras">
      {/* Top row: avatar + name + meta */}
      <div className="flex items-start gap-3">
        <button onClick={() => fileRef.current?.click()} className="relative shrink-0">
          {pet.avatar_url ? (
            <img
              src={pet.avatar_url}
              alt={pet.name}
              className="w-[88px] h-[88px] rounded-2xl object-cover border-2 border-card shadow-petosauras"
            />
          ) : (
            <div className="w-[88px] h-[88px] rounded-2xl bg-card flex items-center justify-center text-4xl">
              {pet.avatar_emoji || "🐾"}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatar}
          />
        </button>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-1.5">
            <h2 className="font-heading font-bold text-xl truncate">{pet.name}</h2>
            <button
              onClick={() => navigate(`/profile/edit-pet/${pet.id}`)}
              className="p-1 rounded-full hover:bg-card/60"
              aria-label="Edit pet"
            >
              <Pencil className="w-3.5 h-3.5 text-primary" />
            </button>
          </div>
          <p className="text-xs text-foreground/70 font-body mt-0.5">
            {[pet.breed || pet.species || pet.pet_type, pet.gender, age, latestWeight ? `${latestWeight} kg` : null]
              .filter(Boolean)
              .join(" • ")}
          </p>

          {/* 2 inline status pills */}
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            <StatPill
              icon={<Syringe className="w-3.5 h-3.5 text-secondary" />}
              value={`${upcomingVaccines.length}`}
              label="Upcoming vaccine"
            />
            <StatPill
              icon={<Bug className="w-3.5 h-3.5 text-accent" />}
              value={
                upcomingDeworm
                  ? `Deworming`
                  : "Deworming"
              }
              label={
                upcomingDeworm
                  ? `due in ${Math.max(
                      0,
                      differenceInDays(new Date(upcomingDeworm.next_due_date), new Date())
                    )} days`
                  : "Up to date"
              }
              compact
            />
          </div>
        </div>
      </div>

      {/* Bottom row: 2 wider pills */}
      <div className="grid grid-cols-2 gap-2 mt-2.5">
        <StatPill
          icon={<FileText className="w-3.5 h-3.5 text-primary" />}
          value={`${docs.length}`}
          label="Documents"
        />
        <StatPill
          icon={<Calendar className="w-3.5 h-3.5 text-primary" />}
          value="Last vet visit"
          label={
            lastVet?.record_date
              ? format(new Date(lastVet.record_date), "dd MMM yyyy")
              : "—"
          }
          compact
        />
      </div>
    </div>
  );
};

const StatPill = ({
  icon,
  value,
  label,
  compact,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  compact?: boolean;
}) => (
  <div className="flex items-center gap-2 rounded-2xl bg-card px-2.5 py-1.5 border border-border/50">
    <div className="shrink-0 w-7 h-7 rounded-full bg-primary-light/70 flex items-center justify-center">
      {icon}
    </div>
    <div className="min-w-0 leading-tight">
      <p className={`font-body font-bold text-foreground truncate ${compact ? "text-[11px]" : "text-sm"}`}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground font-body truncate">{label}</p>
    </div>
  </div>
);

export default PetIdentityCard;
