import { useState } from "react";
import { X, MapPin, AlertTriangle } from "lucide-react";
import PetTypeIcon from "@/components/PetTypeIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PET_TYPES = ["Canine", "Feline", "Avian", "Aquatic", "Small Pet", "Reptile"];

const AlertForm = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [alertType, setAlertType] = useState<"lost" | "found">("lost");
  const [petType, setPetType] = useState("Canine");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [posting, setPosting] = useState(false);
  const [detecting, setDetecting] = useState(false);

  if (!open) return null;

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a = data.address || {};
          const parts = [a.suburb || a.neighbourhood || "", a.city || a.town || "", a.state || ""].filter(Boolean);
          setLocation(parts.join(", "));
        } catch {
          toast.error("Couldn't detect location");
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setDetecting(false);
        toast.error("Location access denied");
      }
    );
  };

  const submit = async () => {
    if (!user) return;
    if (description.trim().length < 20) {
      toast.error("Description must be at least 20 characters");
      return;
    }
    if (!location || !contact) {
      toast.error("Location and contact are required");
      return;
    }
    setPosting(true);
    const title = `${alertType === "lost" ? "🔴 LOST" : "🟢 FOUND"}: ${description.slice(0, 60)}`;
    const content = `${description}\n\n📍 ${location}\n📞 ${contact}`;
    const { error } = await supabase.from("forum_topics").insert({
      user_id: user.id,
      title,
      content,
      pet_category: petType,
      is_urgent: true,
      tags: [alertType === "lost" ? "lost_pet" : "found_pet"],
    });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    trackEvent("alert_posted", { type: alertType, pet_type: petType });
    toast.success("Alert posted! 🚨 The community will help.");
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
    queryClient.invalidateQueries({ queryKey: ["forum-topics"] });
    onClose();
    setDescription("");
    setLocation("");
    setContact("");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-card rounded-t-[28px] p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-bold flex items-center gap-2">
            <AlertTriangle size={20} strokeWidth={1.5} color="#FF6B6B" /> Post an Alert
          </h2>
          <button onClick={onClose}><X size={20} strokeWidth={1.5} /></button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setAlertType("lost")}
            className={`p-3 rounded-[16px] border-2 font-heading font-bold transition-all ${alertType === "lost" ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground"}`}
          >
            🔴 Lost Pet
          </button>
          <button
            onClick={() => setAlertType("found")}
            className={`p-3 rounded-[16px] border-2 font-heading font-bold transition-all ${alertType === "found" ? "border-success bg-success/10 text-success" : "border-border text-muted-foreground"}`}
          >
            🟢 Found Pet
          </button>
        </div>

        <label className="block text-xs font-heading font-bold text-muted-foreground mb-2 uppercase">Pet type</label>
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
          {PET_TYPES.map((t) => {
            const selected = petType === t;
            return (
              <button
                key={t}
                onClick={() => setPetType(t)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all"
                style={{
                  background: selected ? "#7B5EA7" : "#fff",
                  borderColor: selected ? "#7B5EA7" : "#E8E5F0",
                  color: selected ? "#fff" : "#6B6880",
                }}
              >
                <PetTypeIcon petType={t} size={16} color={selected ? "#fff" : "#7B5EA7"} />
                <span className="text-[12px] font-body font-bold">{t}</span>
              </button>
            );
          })}
        </div>

        <label className="block text-xs font-heading font-bold text-muted-foreground mb-1 uppercase">Description (min 20 chars)</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the pet, what happened, identifying features..." className="mb-3" rows={3} />

        <label className="block text-xs font-heading font-bold text-muted-foreground mb-1 uppercase">Last seen location</label>
        <div className="rounded-[16px] bg-surface-alt border-[1.5px] border-border px-[14px] py-2.5 flex items-center gap-2 mb-3">
          <MapPin size={14} strokeWidth={1.5} className="text-muted-foreground shrink-0" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Area, city"
            className="flex-1 bg-transparent outline-none text-[14px] font-body"
          />
          <button type="button" onClick={detectLocation} disabled={detecting} className="text-[12px] font-body font-bold text-primary hover:underline disabled:opacity-60">
            {detecting ? "…" : "Detect"}
          </button>
        </div>

        <label className="block text-xs font-heading font-bold text-muted-foreground mb-1 uppercase">Contact phone</label>
        <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+91 ..." className="mb-4" />

        <Button onClick={submit} disabled={posting} className="w-full" size="lg" style={{ background: "#FF6B6B" }}>
          {posting ? "Posting..." : "Post Alert 🚨"}
        </Button>
      </div>
    </div>
  );
};

export default AlertForm;
