import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackBookVet } from "@/lib/analytics";

type State =
  | { kind: "loading" }
  | { kind: "ok"; action: "confirm" | "reject"; ref: string }
  | { kind: "error"; message: string };

const VetBookingActionScreen = () => {
  const [params] = useSearchParams();
  const booking_id = params.get("booking_id");
  const token = params.get("token");
  const action = params.get("action") as "confirm" | "reject" | null;

  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!booking_id || !token || (action !== "confirm" && action !== "reject")) {
        setState({ kind: "error", message: "Invalid link." });
        return;
      }
      const { data, error } = await supabase.functions.invoke(
        "handle-vet-booking-action",
        { body: { booking_id, token, action } },
      );
      if (cancelled) return;
      const payload = (data ?? {}) as any;
      if (error || payload?.error || !payload?.ok) {
        const msg = payload?.error ?? error?.message ?? "Could not process action.";
        setState({ kind: "error", message: msg });
        return;
      }
      trackBookVet(
        action === "confirm" ? "vet_confirmed_from_email" : "vet_rejected_from_email",
        { booking_id },
      );
      setState({ kind: "ok", action, ref: payload.booking_reference });
    })();
    return () => { cancelled = true; };
  }, [booking_id, token, action]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-[460px] paw-card p-6 text-center">
        {state.kind === "loading" && (
          <>
            <div className="text-3xl mb-2">⏳</div>
            <h1 className="font-heading font-bold text-lg">Processing booking action…</h1>
          </>
        )}

        {state.kind === "ok" && state.action === "confirm" && (
          <>
            <div className="text-5xl mb-2">✅</div>
            <h1 className="font-heading font-bold text-lg">Appointment confirmed</h1>
            <p className="mt-2 text-sm font-body text-muted-foreground">
              Booking <b>{state.ref}</b> has been confirmed. The pet parent has been notified.
            </p>
          </>
        )}

        {state.kind === "ok" && state.action === "reject" && (
          <>
            <div className="text-5xl mb-2">❌</div>
            <h1 className="font-heading font-bold text-lg">Appointment rejected</h1>
            <p className="mt-2 text-sm font-body text-muted-foreground">
              Booking <b>{state.ref}</b> has been rejected. The slot has been released for other users.
            </p>
          </>
        )}

        {state.kind === "error" && (
          <>
            <div className="text-5xl mb-2">⚠️</div>
            <h1 className="font-heading font-bold text-lg">Link expired or invalid</h1>
            <p className="mt-2 text-sm font-body text-muted-foreground">
              This confirmation link is invalid or expired. Please open the vet dashboard or contact Petosauras.
            </p>
            <p className="mt-2 text-[11px] font-body text-muted-foreground">{state.message}</p>
          </>
        )}

        <a
          href="https://petosauras.com"
          className="mt-5 inline-block px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm"
        >
          Open Petosauras
        </a>
      </div>
    </div>
  );
};

export default VetBookingActionScreen;
