# Session: RML Intranet Home Layout & Header Fixes
**Date:** 2026-02-26
**Branch:** troubleshoot/notion-integration
**Status:** Partially complete — home layout deployed, header work in progress

---

## Completed

### 1. Home Page Layout — Team Calendar moved above Quick Resources

**File:** `src/app/pages/HomePage.tsx`
**Commit:** `c099192`
**Deployed:** Yes — Cloud Build `678e5866`, SUCCESS (~2m13s)

**Before order:**
1. Hero
2. Daily Pulse
3. Quick Actions
4. Quick Resources
5. Team Calendar

**After order:**
1. Hero
2. Daily Pulse
3. Quick Actions
4. **Team Calendar** (moved up — bg-white)
5. **Quick Resources** (now last — bg-[#f9f9f9])

Background colour alternation still works: grey → white → grey gives visual separation.

---

## In Progress / Carry Forward

### 2. Header — Three Issues Identified (NOT YET FIXED)

**File:** `src/app/components/Header.tsx`

#### Issue 1: Logo text → image
- Replace `{siteConfig.branding.companyName}` (EB Garamond text) with `<img>`
- Logo source: `/home/jtaylor/everything-claude-code/docs/logo.png` (198×198px RGBA PNG)
- Copy to `/tmp/Rmlintranetdesign/public/logo.png` so Vite serves it as `/logo.png`
- Suggested size: `h-10 w-auto` (40px height, auto width) — smaller than the wide text, frees horizontal space

#### Issue 2: Search + avatar overlapping nav at intermediate viewport widths
- Root cause: 9 nav items ("Training & Competency", "Business Intelligence", etc.) are long labels
- At the `lg` (1024px) breakpoint, logo text (~200px) + 9 nav items + right controls = too wide
- Right section is `flex-shrink-0` so it stays fixed; nav items overflow or get pushed under it
- Fix approach: replacing text logo with ~40px image frees ~160px; also add `overflow-hidden` to nav

#### Issue 3: Mobile hamburger menu — no search button
- Mobile menu (`lg:hidden` dropdown) shows nav links but search button is only in the always-visible right section
- Search button IS visible at mobile (it's in the `flex-shrink-0` right div, always shown)
- However, user reports it as missing in hamburger context — may need to add a search row to the mobile menu dropdown for discoverability

**Header structure summary:**
```
[Logo flex-shrink-0] [Nav hidden lg:flex flex-1 min-w-0] [Search+Avatar+Hamburger flex-shrink-0]
```

**Recommended next steps:**
1. Copy logo.png to `public/`
2. Replace logo text with `<img src="/logo.png" alt="Roam Migration Law" className="h-10 w-auto" />`
3. Test at 1024px — if nav still overflows, consider bumping breakpoint to `xl` (1280px)
4. Add search button row to mobile menu dropdown

---

## Deployment Notes
- Frontend deploy: `cd /tmp/Rmlintranetdesign && gcloud builds submit --config cloudbuild.yaml --project=rmlintranet --quiet`
- Backend deploy (if needed): `cd /tmp/Rmlintranetdesign/backend && gcloud builds submit --config cloudbuild.yaml --project=rmlintranet --quiet`
- Live at: `intranet.roammigrationlaw.com`
