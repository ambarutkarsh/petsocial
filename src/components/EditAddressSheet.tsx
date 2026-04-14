import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { indianStates } from "@/lib/registrationData";

interface Props {
  open: boolean;
  onClose: () => void;
  currentCity?: string | null;
  currentState?: string | null;
  currentPin?: string | null;
}

const EditAddressSheet = ({ open, onClose, currentCity, currentState, currentPin }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [city, setCity] = useState(currentCity || "");
  const [state, setState] = useState(currentState || "");
  const [pinCode, setPinCode] = useState(currentPin || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCity(currentCity || "");
      setState(currentState || "");
      setPinCode(currentPin || "");
    }
  }, [open, currentCity, currentState, currentPin]);

  if (!open) return null;

  const pinError = pinCode && !/^\d{6}$/.test(pinCode) ? "PIN code must be exactly 6 digits" : "";

  const handleSave = async () => {
    if (!user || pinError) return;
    setSaving(true);
    await supabase.from("profiles").update({
      city: city || null,
      state: state || null,
      pin_code: pinCode || null,
    }).eq("id", user.id);
    setSaving(false);
    toast.success("Address updated!");
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-card rounded-t-[28px] p-6 animate-slide-up">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-bold">Edit Address</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-text-hint" /></button>
        </div>
        <div className="space-y-4">
          <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <select value={state} onChange={(e) => setState(e.target.value)}
            className="w-full h-12 rounded-[16px] bg-surface-alt border-[1.5px] border-border px-4 font-body text-sm">
            <option value="">Select state</option>
            {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div>
            <Input placeholder="PIN Code (6 digits)" value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
            {pinError && <p className="text-xs text-destructive mt-1">{pinError}</p>}
          </div>
          <Button onClick={handleSave} disabled={saving || !!pinError} className="w-full" size="lg">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : "Save Address"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditAddressSheet;
