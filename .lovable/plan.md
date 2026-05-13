## Goal

Replace Interakt-based vet WhatsApp confirmation with a free MVP flow: email Confirm/Reject links (Resend), WhatsApp click-to-chat fallback, and Google Sheet clinic ledger sync. Keep all existing tables/functions, modify in place.

## Database changes (one migration)

Add to `vet_bookings`:
- `action_token` text
- `action_token_expires_at` timestamptz
- `vet_action_at` timestamptz
- `vet_action_source` text  (`email_link` | `dashboard`)
- `google_sheet_synced` boolean default false
- `cancelled_by` text
- `cancellation_reason` text
- `cancelled_at` timestamptz
- `confirmed_at` timestamptz

New table `vet_ledger_sync_logs`:
- `booking_id`, `status` (success|error), `error`, `payload` jsonb, `created_at`
- RLS: admin select; insert allowed via service role only.

Index on `vet_bookings(action_token)` for fast lookup.

## Secrets

Already present: `RESEND_API_KEY`, `INTERAKT_API_KEY` (will be ignored).
Need to add: `GOOGLE_SHEET_LEDGER_WEBHOOK_URL` (Apps Script Web App URL — user provides).

## Edge functions

**`create-vet-booking`** (modify)
- Generate `action_token` (crypto.randomUUID + random) and `action_token_expires_at = now() + 7d`.
- Insert into `vet_bookings` with token fields.
- Build `whatsapp_link` from vet phone/whatsapp_number with prefilled booking message.
- Return `{ ok, booking_id, booking_reference, whatsapp_link }`.
- Remove any Interakt invocation. Still calls `notify-vet-booking`.

**`notify-vet-booking`** (rewrite)
- Drop Interakt branch entirely.
- Send email via Resend with branded HTML: Confirm / Reject buttons, Reschedule link, WhatsApp link, booking details, emergency badge.
- Insert `vet_notifications` row (channel=`email`, status, payload, provider_response, attempts=1, delivered_at).
- Insert user `notifications` row ("Booking request sent to vet").
- POST to `GOOGLE_SHEET_LEDGER_WEBHOOK_URL`; on success set `vet_bookings.google_sheet_synced=true` and log success in `vet_ledger_sync_logs`; on failure log error and continue.

**`handle-vet-booking-action`** (new, public, verify_jwt=false)
- Input: `{ booking_id, token, action }`.
- Validate token + expiry + status=`pending_vet_confirmation`.
- Confirm → booking confirmed, slot booked, user notified.
- Reject → booking rejected, slot released, user notified.
- POST status update to Google Sheet webhook (best-effort).
- Returns `{ ok, action, booking_reference }`.

**`vet-whatsapp-webhook`** — leave file but mark deprecated in header; remove from `config.toml` deployment list if present (keep file to avoid breaking existing deploy; just no longer relied on).

## Frontend

**`/vet-booking-action`** (new public page `src/pages/VetBookingActionScreen.tsx`)
- Reads `booking_id`, `token`, `action` from query.
- Calls `handle-vet-booking-action` via supabase.functions.invoke.
- Loading / success(confirm) / success(reject) / invalid states with the copy specified.
- "Open Petosauras" button → `/`.
- Registered in `src/App.tsx` (no auth wrapper).

**`BookingSuccessScreen`** (modify)
- Use `whatsapp_link` from `create-vet-booking` response (passed via location state).
- Copy: "Booking request sent" / "The vet has been notified by email…" / Primary "Back to Health" / Secondary "Message Vet on WhatsApp".
- Helper line: "Manual WhatsApp message only. Confirmation happens through email or vet dashboard."

**`ConfirmBookingScreen`** (modify)
- Update copy ("Vet will confirm by email or dashboard").
- Pass `whatsapp_link` forward to success screen.

**`BookAVetScreen`** (already filters bookable vets)
- Add empty-state messages per spec when no bookable vets.

**`VetProfileScreen`** — only show Book Now if active+onboarded+has slots; otherwise show "No slots available for this vet right now."

**Vet dashboard**
- `VetRequestsScreen` (existing) → tabs Today / Upcoming / Pending / Confirmed / Rejected / Completed; per-row Confirm / Reject / WhatsApp; "Exported to Sheet: Yes/No" badge.
- Confirm/Reject actions invoke `handle-vet-booking-action` (we'll allow vet's own user via secondary ownership check inside the function: when no token provided AND the caller's auth uid owns the vet, also allow). Simpler: keep dashboard updates direct via supabase client (RLS already permits the vet) and skip the function for dashboard path; track `vet_action_source='dashboard'`.

## Analytics

Add events to `src/lib/analytics.ts` `BookVetEvent` union and fire from the relevant screens/components:
`vet_email_notification_sent/failed`, `vet_confirmed_from_email/dashboard`, `vet_rejected_from_email/dashboard`, `vet_whatsapp_click_to_chat_clicked`, `google_sheet_ledger_sync_success/failed`.

## Out of scope / no changes

- No removal of `vet-whatsapp-webhook` file or `INTERAKT_API_KEY` secret (just stop calling it).
- No new auth, no schema changes to `vets`, `vet_slots`, `vet_availability`.

## Post-implementation actions for user

1. Add `GOOGLE_SHEET_LEDGER_WEBHOOK_URL` secret (Apps Script Web App URL accepting POST JSON).
2. Verify Resend domain.
