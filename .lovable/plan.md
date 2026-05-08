# Petosauras IA Restructure Plan

## 1. Bottom Navigation (src/components/BottomNav.tsx)

Replace the 5 items with this order:

```
Community | NearBy | Home (FAB) | eHub | MyPet
```

- **Community** → `/feeds` (label changed from "Feeds" → "Community"; icon `Users`)
- **NearBy** → `/nearby` (unchanged)
- **Home** → `/home` (center FAB, circular purple button, icon-only `Home`). Replaces the `+ Create` FAB. Posting moves into Community (existing top-right `+` / create button stays in PlayScreen).
- **eHub** → `/hub` (label "Hub" → "eHub"; icon `LayoutGrid`)
- **MyPet** → `/mypet` (unchanged)

The current `+ Create` FAB is removed from the navbar. The existing in-page create entry points (PlayScreen header, story creator, post buttons) remain intact, so posting flows are preserved.

## 2. New Home Screen (`src/pages/HomeScreen.tsx`, route `/home`)

Layout (mobile-first, 430px max):

- Top: existing TopBar (unchanged).
- Greeting block: "Hi, Pet Parent! 👋" + "What would you like to do today?"
- 4 rounded feature cards (2×2 grid):
  1. **Pet Services** → `/nearby` (Services tab)
  2. **Pet Friendly Places** → `/nearby?tab=places`
  3. **Pet Community** → `/feeds`
  4. **Pet Budget** → `/hub/budget`
- **Logged-in users**: "My Pets" horizontal list (avatars + Add Pet) + compact **Health Brief** card (next vaccination, last weight, upcoming reminder — pulled from existing `pets`, `vaccinations`, `health_logs` tables).
- **Guest users**: two CTA cards instead of My Pets:
  - "I own a pet" → `/auth?redirect=/mypet`
  - "I am planning to get a pet" → `/mypet/pet-recommender`
- **Near You**: reuse `NearbyListings` (top 3, mixed) or compact preview list.
- **Top Blogs**: query `knowledge_articles` (`is_published=true`, top by `view_count`), 3 cards.

`/` (and `/welcome` for guests) remain the existing landing pages — only the in-app Home button targets `/home`. Default in-app entry after login also goes to `/home`.

## 3. NearBy 2-Tab Restructure (`src/pages/NearbyScreen.tsx`)

Add a top-level tab bar above the existing category pills:

- **Services** (default): Vets, Boarding, Spa & Grooming, Walker
- **Pet Friendly Places**: Restaurants & Cafés, Pet Parks, Pet Shows

Category mapping reuses existing slugs:
- Vets → `vets`
- Boarding → `boarding`
- Spa & Grooming → `spa-grooming`
- Walker → `walker` (empty-state)
- Restaurants & Cafés → `pet-restaurants`
- Pet Parks → `pet-parks`
- Pet Shows → `pet-shows`

The old mixed pill row (Help Stray, Lost & Found) is hidden — those routes still resolve if visited directly. Auto city detection, listing cards, ratings, comments, and detail flow are untouched.

## 4. Community → Reels Tab (`src/pages/PlayScreen.tsx`)

Reels are already supported via `posts.post_category = 'reel'` and `PostUploadModal` (video upload, 30s/5MB limits). No DB changes.

- Add a "Reels" pill alongside the existing pills (already present as `reels`). Confirm it's visible and default in Community.
- Wire the page header to label "Community" instead of "Feeds" if shown anywhere.
- Reels feed already renders `posts` with video media via `FeedVideoPlayer`/`ReelViewer`. Guest tap on "Post Reel" → `triggerGuestPopup()` (existing behavior).

No new tables; reuse `posts`, `posts` storage bucket, and existing RLS.

## 5. Routes (`src/App.tsx`)

- Add `<Route path="/home" element={<RegularUserRoute><HomeScreen /></RegularUserRoute>} />`.
- Keep `/`, `/feeds`, `/nearby`, `/hub`, `/mypet` as-is.

## What stays untouched

- Auth, RLS, Supabase tables, storage buckets.
- Feeds/Hub/MyPet/NearBy data fetching and listing detail pages.
- TopBar component and behaviors.
- `PostUploadModal`, story creator, comments, likes, saves, bookmarks.

## Technical notes

- Home → use `useAuth`, `useUserProfile`, and lightweight queries for vaccinations / health_logs / knowledge_articles.
- BottomNav: keep guest popup gating on MyPet; Community is open to guests (existing Feeds behavior).
- NearBy tabs persist active tab via URL query (`?tab=services|places`) so deep-links work.
- Add legacy redirect: removed `+ Create` button — verify no caller breaks (only `BottomNav onPostClick` consumers, which all also have other entry points).

Files to add: `src/pages/HomeScreen.tsx`.
Files to edit: `src/components/BottomNav.tsx`, `src/pages/NearbyScreen.tsx`, `src/App.tsx`, `src/pages/PlayScreen.tsx` (label only).
