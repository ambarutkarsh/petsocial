import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CURATABLE_PILLS, type FeedPillKey } from "@/lib/feedPills";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  initial: FeedPillKey[];
  /** Called after a successful save / clear. */
  onSaved?: (next: FeedPillKey[]) => void;
}

const MIN = 2;
const MAX = 3;

const FeedPreferencesSheet = ({ open, onClose, userId, initial, onSaved }: Props) => {
  const [selected, setSelected] = useState<FeedPillKey[]>(initial);
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(initial);
      setConfirmClear(false);
    }
  }, [open, initial]);

  if (!open) return null;

  const toggle = (key: FeedPillKey) => {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX) return prev; // cap silently — note shown below
      return [...prev, key];
    });
  };

  const canSave = selected.length >= MIN && selected.length <= MAX;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ feed_preferences: selected as unknown as string[] })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error("Could not save preferences");
      return;
    }
    toast.success("Curated feed updated! ⭐");
    onSaved?.(selected);
    onClose();
  };

  const handleClear = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ feed_preferences: [] })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error("Could not clear preferences");
      return;
    }
    toast.success("Feed preferences cleared");
    onSaved?.([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className="relative w-full mx-auto bg-card rounded-t-[28px] px-6 pt-4 pb-8 animate-slide-up"
        style={{ maxWidth: 480, maxHeight: "85vh", overflowY: "auto" }}
      >
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
        <h2 className="text-lg font-heading font-bold mb-1">Curate Your Feed</h2>
        <p className="text-sm text-muted-foreground font-body mb-4">
          Select 2 or 3 topics to build your personalised Curated feed.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {CURATABLE_PILLS.map((p) => {
            const active = selected.includes(p.key);
            return (
              <button
                key={p.key}
                onClick={() => toggle(p.key)}
                className={`p-3 rounded-[16px] border-2 text-left transition-all ${
                  active ? "border-primary bg-primary-light" : "border-border bg-card"
                }`}
              >
                <p className="text-sm font-heading font-bold">
                  {p.emoji} {p.label}
                </p>
                <p className="text-[11px] text-muted-foreground font-body mt-0.5">{p.desc}</p>
              </button>
            );
          })}
        </div>

        {selected.length < MIN && (
          <p className="text-xs text-muted-foreground font-body mt-3 text-center">
            Select at least {MIN} to enable your Curated feed.
          </p>
        )}
        {selected.length >= MAX && (
          <p className="text-xs text-warning font-body mt-3 text-center">
            Maximum {MAX} selections.
          </p>
        )}

        <Button
          className="w-full mt-4"
          size="lg"
          disabled={!canSave || saving}
          onClick={handleSave}
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {canSave ? "Save Preferences" : `Select ${MIN}–${MAX} feeds to save`}
        </Button>

        {initial.length > 0 && !confirmClear && (
          <button
            onClick={() => setConfirmClear(true)}
            className="block mx-auto mt-3 text-xs font-body font-bold text-destructive"
          >
            Clear Preferences
          </button>
        )}
        {confirmClear && (
          <div className="mt-4 p-3 rounded-[14px] border border-destructive/30 bg-destructive/5 text-center">
            <p className="text-xs font-body text-foreground">
              This will remove your Curated feed. Continue?
            </p>
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={handleClear}
                disabled={saving}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPreferencesSheet;
