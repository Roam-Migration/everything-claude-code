# Session: Gull Force — UI/UX Analysis & Architecture

**Date:** 2026-02-28
**Scope:** Full information architecture design, content placement for all live-site gaps, veteran database design, navigation redesign, and client Q&A resolution.
**Deliverable:** `docs/projects/gull-force/UI-UX-ANALYSIS.md` (758 lines, committed 98b3068)

---

## What Was Accomplished

### 1. Full UI/UX Analysis Written
Comprehensive redesign strategy covering:
- Site purpose and dual mission (historical memorial + contemporary Association work)
- Primary audience journeys (descendants, researchers, Association members, general public)
- Proposed 7-item navigation replacing the current 5-page flat structure
- Veteran as central data model — CPT schema, cross-linking architecture
- Content placement decisions for all 7 missing live-site pages
- UI patterns, design principles, status badge system
- Phase 0–3 implementation roadmap

### 2. Asset Inventory Confirmed
All assets located in `docs/projects/gull-force/content/`:
- `images/`: 731 images (categorised: plaques ×57, Ambon historical ×85, band ×18, Darwin ×32, tin artefacts ×26, named veteran portraits ×478)
- `headstones/`: **605 headstone photos** — dev site has only 53 imported (critical gap)
- `documents-historical/`: 45 PDFs (Nominal Roll, McCormack, Antella, Bill Doolan, Ambon 2015, grant documents, booklets)
- `legacy-site-html/`: all 14 live site HTML files
- `member-data/gullforce-members.csv`: 833 rows (368 veterans + 465 non-veterans)

### 3. Client Questions Resolved (6/6)
| # | Question | Answer |
|---|----------|--------|
| 1 | Our Work in Ambon content? | Photos of orphanage/school/hospital visits; medical supplies in-kind. Evidence: `Samah Hospital.jpg`, 2011 community series, grant applications. |
| 2 | Calendar archive? | Yes — show past events in archive section |
| 3 | Veterans privacy? | Public record — all 368 publishable |
| 4 | Family story submissions? | Yes — future members area for forums + additional materials |
| 5 | Lloyd Swanton CD? | https://www.birdland.com.au/lloyd-swanton-ambon — $32, 2CD, back-ordered |
| 6 | Veteran CSV location? | Confirmed: `content/member-data/gullforce-members.csv` |

### 4. Parallel Session Coordination
A parallel database session built the `gf_member` CPT code (4 files):
- `mu-plugins/gull-force.php` — CPT + `[gf_member_directory]` + `[gf_member_card]` shortcodes
- `scripts/create-member-fields.php` — ACF field group
- `scripts/import-members.php` — CSV import (363 veterans)
- `scripts/link-member-headstones.php` — surname-match linking

Deployment sequence established:
```
1. wp eval-file scripts/create-member-fields.php
2. wp eval-file scripts/import-members.php
3. [PHASE 0: expand headstones 53 → 605]   ← do this before step 4
4. wp eval-file scripts/link-member-headstones.php
```

---

## Key Architectural Decisions

### Proposed Navigation
```
HOME | OUR HISTORY ▼ | THE MEN ▼ | REMEMBRANCE ▼ | ARCHIVES ▼ | THE ASSOCIATION ▼ | MEMORABILIA
```

### CPT Architecture
- `gf_headstone` (existing, expand to 605)
- `gf_member` (new — 368 veterans, central data model)
- `gf_memorial` (new — plaques and memorial sites)
- `gf_company` taxonomy (A/B/D/HQ Coy, Officers, BHQ, Attached)
- ACF field on media attachments: `veterans_tagged` → Relationship → `gf_member[]`

### "The Men" as Nav Label
Echoes the site's own language ("1,131 men who were sent to defend Ambon"). Historically resonant, clear in intent.

### The 2/21st Band
The most emotionally resonant section on the live site. Documents 25+ individual fates (executions at Laha, POW deaths, one killed in Chinese ambush). Warrants its own dedicated sub-section within Veterans Photos with full "What happened to the band?" narrative.

---

## Implementation Phases

| Phase | Scope | Trigger |
|-------|-------|---------|
| **Phase 0** | Expand headstones: 53 → 605 (bulk WP media import + `import-headstones.php`) | Next session |
| **Phase 1** | `gf_member` CPT deploy + Veterans Directory page + Battalion History pages | After Phase 0 |
| **Phase 2** | Veterans Photos, Plaques & Memorials, Articles & Contributions, Pilgrimages expansion | After Phase 1 |
| **Phase 3** | Cross-linking (photo tagging), nav redesign, calendar, members area hooks | After Phase 2 |

---

## Files Created This Session
- `docs/projects/gull-force/UI-UX-ANALYSIS.md` — full analysis document (committed)
- `docs/projects/gull-force/.gitignore` — added `*.zip` exclusion (committed)
- `.gitignore` — root rule scoped from whole directory to `content/` only (committed)
