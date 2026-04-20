import { useState } from "react";
import { X } from "lucide-react";
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

const PET_TYPES = ["Dog", "Cat", "Bird", "Rabbit", "Other"];

const AlertForm = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [alertType, setAlertType] = useState<"lost" | "found">("lost");
  const [petType, setPetType] = useState("Dog");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [posting, setPosting] = useState(false);

  if (!open) return null;

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
    const title = `${alertType === "lost" ? "🔴 LOST" : "🟢 FOUND"} ${petType} — ${location}`;
    const content = `${description}\n\n📍 ${location}\n📞 ${contact}`;
    const { error } = await supabase.from("forum_topics").insert({
      user_id: user.id,
      title,
      content,
      pet_category: "alert",
      is_urgent: true,
      tags: ["alert", alertType, petType.toLowerCase()],
    });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    trackEvent("alert_posted", { type: alertType, pet_type: petType });
    toast.success("Alert posted! Pinned to Play tab 🚨");
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
          <h2 className="text-xl font-heading font-bold">🚨 Pet Alert</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
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

        <label className="block text-xs font-heading font-bold text-muted-foreground mb-1 uppercase">Pet type</label>
        <select value={petType} onChange={(e) => setPetType(e.target.value)} className="w-full h-12 rounded-[16px] bg-surface-alt border-[1.5px] border-border px-4 mb-3 font-body">
          {PET_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>

        <label className="block text-xs font-heading font-bold text-muted-foreground mb-1 uppercase">Description (min 20 chars)</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Color, breed, distinguishing features..." className="mb-3" rows={3} />

        <label className="block text-xs font-heading font-bold text-muted-foreground mb-1 uppercase">Last seen location</label>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Area, city" className="mb-3" />

        <label className="block text-xs font-heading font-bold text-muted-foreground mb-1 uppercase">Contact phone</label>
        <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+91 ..." className="mb-4" />

        <Button onClick={submit} disabled={posting} className="w-full" size="lg">
          {posting ? "Posting..." : "Post Alert 🚨"}
        </Button>
      </div>
    </div>
  );
};

export default AlertForm;
