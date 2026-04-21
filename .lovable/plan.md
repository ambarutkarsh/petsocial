

## Update Petosauras logo and favicon

Two new official logo files have been provided. They will replace the existing placeholder logo across the entire app, and a new icon-only version will be used for the favicon and TopBar.

### Asset setup
1. Copy `user-uploads://6c8d79f4-1c2f-40d5-a8d2-ed8cb0c88757.jpeg` (icon-only dinosaur + paw) to:
   - `public/petosauras-icon.png` (favicon, PWA 192px, TopBar)
   - `src/assets/petosauras-icon.png` (TopBar import)
2. Copy `user-uploads://a9972570-e524-4dfb-8708-f1252fd253f0.jpeg` (full logo with "PETOSAURAS — Your All-In-One Pet Hub") to:
   - `public/petosauras-logo.png` (overwrite existing — full logo, PWA 512px, OG image, auth/onboarding)
   - `src/assets/petosauras-logo.png` (overwrite existing)

### File updates

**`index.html`** — switch favicon trio to the new icon file:
- `<link rel="icon" type="image/png" href="/petosauras-icon.png" />`
- `<link rel="apple-touch-icon" href="/petosauras-icon.png" />`
- `<link rel="shortcut icon" href="/petosauras-icon.png" />`
- Keep `og:image` and `twitter:image` pointing at `/petosauras-logo.png` (full logo is correct for social cards).

**`public/manifest.json`** — use icon for 192px, full logo for 512px:
```json
"icons": [
  { "src": "/petosauras-icon.png", "sizes": "192x192", "type": "image/png" },
  { "src": "/petosauras-logo.png", "sizes": "512x512", "type": "image/png" }
]
```

**`src/components/TopBar.tsx`** — switch import to icon-only (32px height already in place):
- `import logo from "@/assets/petosauras-icon.png";`

**Auth / onboarding / registration — keep full logo** (already using `/petosauras-logo.png`, will look correct once the file is replaced):
- `src/pages/AuthScreen.tsx` (80px) — no code change, file replacement only
- `src/pages/CompleteRegistrationScreen.tsx` (60px) — no code change
- `src/pages/OnboardingScreen.tsx` — currently uses emoji tiles; no change needed

**Other in-app headers (small accent placements)** — switch to icon-only for cleaner small rendering:
- `src/pages/FeedScreen.tsx` (line 194, 36px header) → `/petosauras-icon.png`
- `src/pages/HealthScreen.tsx` (line 23, 36px header) → `/petosauras-icon.png`
- `src/pages/ProfileScreen.tsx` (line 144, 28px header accent) → `/petosauras-icon.png`

### Lock comments
Add (or preserve) the `LOGO LOCKED — Do not change without explicit user instruction` comment above every logo reference in:
- `index.html` (already present, extend to icon links)
- `public/manifest.json` (JSON — comment goes in `index.html` only; manifest cannot have comments)
- `TopBar.tsx` (already present)
- `AuthScreen.tsx`, `CompleteRegistrationScreen.tsx`, `FeedScreen.tsx`, `HealthScreen.tsx`, `ProfileScreen.tsx` (add)

### Rule going forward
The two files `petosauras-icon.png` (icon only) and `petosauras-logo.png` (full logo + tagline) are the **only** Petosauras brand assets. Do not regenerate, swap, or modify them in future changes unless you explicitly ask.

### Summary of placements
| Surface | File | Size |
|---|---|---|
| Favicon / PWA 192 | petosauras-icon.png | browser default |
| TopBar (all screens) | petosauras-icon.png | 32px |
| Feed / Health / Profile headers | petosauras-icon.png | 28–36px |
| Auth screen | petosauras-logo.png | 80px |
| Complete registration | petosauras-logo.png | 60px |
| OG / Twitter card / PWA 512 | petosauras-logo.png | social default |

