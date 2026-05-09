import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInMonths, differenceInYears } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Pencil, ShieldCheck, Cpu, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  pet: any;
}

const PetIdentityCard = ({ pet }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(pet.name || "");
  const [savingName, setSavingName] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      toast.error("Name cannot be empty");
      return;
    }
    setSavingName(true);
    const { error } = await supabase.from("pets").update({ name: trimmed }).eq("id", pet.id);
    setSavingName(false);
    if (error) {
      toast.error("Could not update name");
      return;
    }
    toast.success("Name updated");
    qc.invalidateQueries({ queryKey: ["my-pets"] });
    setEditOpen(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from("pets").delete().eq("id", pet.id);
    setDeleting(false);
    if (error) {
      toast.error("Could not delete pet");
      return;
    }
    toast.success(`${pet.name} removed`);
    qc.invalidateQueries({ queryKey: ["my-pets"] });
    setDeleteOpen(false);
    navigate("/mypet");
  };

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

          {/* Microchip row */}
          {hasChip ? (
            <button
              onClick={() => navigate(`/mypet/microchip/register?pet=${pet.id}`)}
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 border border-border/50 max-w-full"
            >
              <Cpu className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[11px] font-body font-semibold text-foreground truncate">
                {chipNumber}
              </span>
              {isVerified && (
                <ShieldCheck className="w-3 h-3 text-secondary shrink-0" />
              )}
            </button>
          ) : (
            <button
              onClick={() => navigate(`/mypet/microchip/register?pet=${pet.id}`)}
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-primary-foreground"
            >
              <Cpu className="w-3 h-3 shrink-0" />
              <span className="text-[11px] font-body font-semibold">
                Add microchip
              </span>
            </button>
          )}

        </div>
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
