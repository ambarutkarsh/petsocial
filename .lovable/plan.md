
# MyPet Redesign — Pet-wise Health Locker

This is a large change covering data model, storage, RLS, and a redesigned MyPet experience. I'll keep the existing visual language (lilac primary / peach CTAs / rounded cards), reuse existing components (`PetMicrochipCard`, `AddPetSheet`, `BottomNav`, `MobileLayout`), and keep all routes and other modules (Home, Community, NearBy, eHub, Chatbot) untouched.

## 1. Database changes (single migration)

New tables:

- `pet_health_records`
  - `id, owner_id, pet_id, record_type, title, record_date, next_due_date, status, notes, created_at, updated_at`
  - `record_type`: vaccine | deworming | vet_visit | lab_report | prescription | surgery | allergy | medication | insurance | microchip | general_document
  - RLS: owner-only (`auth.uid() = owner_id`)
- `pet_documents`
  - `id, owner_id, pet_id, health_record_id (nullable), document_type, file_name, file_url, file_mime_type, file_size, uploaded_at, visibility default 'private'`
  - `document_type`: vaccination_certificate | prescription | lab_report | insurance | adoption_registration | microchip_certificate | invoice | other
  - RLS: owner-only

Existing tables kept for back-compat (`vaccinations`, `pet_records`, `pet_microchips`) — not dropped, so existing data isn't lost. New flows write to the new tables; the Vaccines tab will read from `pet_health_records` where `record_type='vaccine'` AND fall back to legacy `vaccinations` for read-only display.

New private storage bucket `pet-documents` with path:
`{owner_id}/{pet_id}/{record_type}/{record_id|general}/{filename}`

Storage RLS: owner can read/write only objects under their own `{owner_id}/...` prefix; viewing uses signed URLs.

## 2. New / refactored screens

```text
/mypet (redesigned)
  ├── Overview tab (default)        ← new dashboard
  ├── Vaccines tab
  ├── Deworming tab                 ← new
  ├── Reports tab                   ← new (lab_report + prescription)
  ├── Documents tab                 ← health locker
  ├── Growth tab                    ← reuse existing weight chart
  └── Reminders tab                 ← upcoming dues across record types
```

### Pet identity card (top of MyPet)
- Photo, name, species/breed, gender, age, weight
- Microchip row directly below: "Microchip ID: …" + Registered badge OR "+ Add Microchip" CTA → `/hub/microchip/register?pet={petId}`
- Summary chips: upcoming vaccine, deworming due, doc count, last vet visit, microchip status

### Overview cards
Health Snapshot, Upcoming Care, Documents Summary, Growth/Weight, Microchip Status, Quick Actions (Add Vaccine, Upload Report, Add Prescription, Book Vet, Set Reminder, Add Microchip).

### Vaccines / Deworming / Reports
Each record card opens a detail view that **only** shows documents where `pet_id = activePet.id` AND `health_record_id = record.id` AND `owner_id = user.id`. Upload from inside a record auto-fills `health_record_id`.

### Documents tab (health locker)
- Privacy badge "Private • visible only to {pet}'s owner"
- Filters by `document_type` including Microchip
- Each card shows linked record name when `health_record_id` is set
- Query is **always** scoped by `owner_id + pet_id`, never by type alone

### Microchip integration
- `RegisterMicrochipScreen` accepts `?pet=<id>` query param to preselect pet
- On successful microchip save, also create a `pet_health_records` row (`record_type='microchip'`) and link any uploaded chip certificate as `pet_documents` with `document_type='microchip_certificate'` and that `health_record_id`

## 3. Files to create

- `src/pages/MyPetScreen.tsx` (replaces/wraps current `ShopScreen.tsx` MyPet view) — Overview + tab shell
- `src/components/mypet/PetIdentityCard.tsx`
- `src/components/mypet/OverviewDashboard.tsx`
- `src/components/mypet/VaccinesPanel.tsx`
- `src/components/mypet/DewormingPanel.tsx`
- `src/components/mypet/ReportsPanel.tsx`
- `src/components/mypet/DocumentsPanel.tsx` (health locker)
- `src/components/mypet/RemindersPanel.tsx`
- `src/components/mypet/HealthRecordDetailSheet.tsx` (record + scoped docs)
- `src/components/mypet/UploadDocumentSheet.tsx` (reusable; takes `petId`, optional `healthRecordId`, `documentType`)
- `src/lib/petDocuments.ts` — strict scoped fetchers + signed URL helper

## 4. Files to update

- `src/App.tsx` — point `/mypet` to new `MyPetScreen`
- `src/pages/ShopScreen.tsx` — keep file but `MyPetScreen` becomes the new export target (rename internal logic preserved for fallback)
- `src/pages/hub/RegisterMicrochipScreen.tsx` — accept `?pet=`, write linked `pet_health_records` + `pet_documents` rows in addition to `pet_microchips`
- `src/components/microchip/PetMicrochipCard.tsx` — show "Registered" badge + chip ID in pet card style
- Keep `PetDigiLockerScreen` for any legacy routes; new code does not depend on it

## 5. Acceptance verification

- Aston's Rabies certificate appears only inside Rabies record + Documents (linked to Rabies) — not under Deworming or under Guinness
- Aston's microchip never shows on Guinness
- All document queries filter by `owner_id + pet_id` (and `health_record_id` inside record details)
- Signed URLs only — bucket is private
- No regressions: Home, Community, NearBy, eHub, Chatbot, login/register all untouched

## Technical notes

- Reuse design tokens from `index.css`/`tailwind.config.ts` (no hardcoded colors)
- TanStack Query keys include `pet_id` so switching pets refetches scoped data
- Microchip route stays `/hub/microchip/register` (in-app), with `?pet=<id>` for pet context
- Legacy `vaccinations` and `pet_records` data shown read-only; new entries go to `pet_health_records` / `pet_documents`

## Out of scope

- No changes to Home, Community, NearBy, eHub, Chatbot, auth
- No removal of existing tables / data
- No new edge functions

If you approve, I'll run the migration first (you'll get an approval prompt for the DB), then ship the screens.
