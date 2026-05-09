import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  pet: any;
}

const RemindMeLaterSheet = ({ open, onClose, pet }: Props) => {
  const { user } = useAuth();
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);

  const presets = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const weekend = new Date();
    weekend.setDate(weekend.getDate() + ((6 - weekend.getDay() + 7) % 7 || 7));
    weekend.setHours(10, 0, 0, 0);
    const week = new Date();
    week.setDate(week.getDate() + 7);
    week.setHours(9, 0, 0, 0);
    return [
      { label: "Tomorrow morning", date: tomorrow },
      { label: "This weekend", date: weekend },
      { label: "In 7 days", date: week },
    ];
  })();

  const schedule = async (when: Date) => {
    if (!user || !pet) return;
    setSaving(true);
    const { error } = await supabase.from("pet_health_reminders").insert({
      owner_id: user.id,
      pet_id: pet.id,
      reminder_type: "health_snapshot",
      scheduled_for: when.toISOString(),
      notification_title: `Update ${pet.name}'s Health Snapshot`,
      notification_body: `Take 2 minutes to complete ${pet.name}'s wellness check.`,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Reminder set for ${when.toLocaleString()}`);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="font-heading">Remind me later</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 mt-4 pb-6">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => schedule(p.date)}
              disabled={saving}
              className="w-full text-left p-3 rounded-2xl border border-border bg-card hover:bg-muted/50"
            >
              <p className="font-body font-bold text-sm">{p.label}</p>
              <p className="text-xs text-muted-foreground">{p.date.toLocaleString()}</p>
            </button>
          ))}
          <div className="pt-2">
            <p className="text-xs font-body font-bold mb-1">Custom date & time</p>
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
              <Button
                disabled={!custom || saving}
                onClick={() => schedule(new Date(custom))}
              >
                Set
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RemindMeLaterSheet;
