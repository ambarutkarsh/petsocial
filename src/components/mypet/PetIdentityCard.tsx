import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { differenceInMonths, differenceInYears } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { CameraIcon } from "@/components/icons/PetosauraIcons";
import { useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  pet: any;
}

const PetIdentityCard = ({ pet }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: chip } = useQuery({
    queryKey: ["pet-chip", pet.id],
    enabled: !!user && !!pet?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("pet_microchips")
        .select("chip_number, verification_status")
        .eq("pet_id", pet.id)
        .eq("owner_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
  });

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

  const age = pet.date_of_birth
    ? (() => {
        const dob = new Date(pet.date_of_birth);
        const yrs = differenceInYears(new Date(), dob);
        const mos = differenceInMonths(new Date(), dob) % 12;
        return `${yrs}y ${mos}m`;
      })()
    : pet.age_years
    ? `${pet.age_years}y`
    : "—";

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
    <div className="rounded-2xl border border-border bg-card p-4 shadow-petosauras">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {pet.avatar_url ? (
            <img
              src={pet.avatar_url}
              alt={pet.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-card shadow-petosauras"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center text-4xl">
              {pet.avatar_emoji || "🐾"}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-petosauras"
            aria-label="Change photo"
          >
            <CameraIcon className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatar}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-heading font-bold text-lg truncate">{pet.name}</h2>
          <p className="text-xs text-muted-foreground font-body">
            {pet.species || pet.pet_type}
            {pet.gender ? ` • ${pet.gender}` : ""}
            {age !== "—" ? ` • ${age}` : ""}
            {latestWeight ? ` • ${latestWeight} kg` : ""}
          </p>

          <div className="mt-2">
            {chip?.chip_number ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-2.5 py-1">
                <span className="text-[10px] font-mono font-bold">
                  🔖 {chip.chip_number}
                </span>
                <span className="text-[9px] uppercase font-bold bg-secondary/20 text-secondary px-1.5 py-0.5 rounded-full">
                  {chip.verification_status === "document_verified" ? "Verified" : "Registered"}
                </span>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] px-3"
                onClick={() => navigate(`/hub/microchip/register?pet=${pet.id}`)}
              >
                + Add Microchip
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetIdentityCard;
