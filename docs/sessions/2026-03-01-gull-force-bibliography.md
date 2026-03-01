# Session Notes — Gull Force Bibliography & Further Reading Page

**Date:** 2026-03-01
**Project:** Gull Force WP Site
**Repo:** `/home/jtaylor/gull-force-wp`
**Session type:** Research + WordPress build

---

## What Was Accomplished

### 1. Academic Bibliography Generated
- Compiled a fully verified academic bibliography covering Gull Force / 2/21st Battalion AIF, Ambon, and Hainan Island
- All sources verified against AWM catalogue, Informit, ANU/CDU/Murdoch repositories, publisher pages, WorldCat, NLA, and AustLII
- **Explicit exclusion policy**: sources that could not be independently verified were excluded and documented in a Research Gaps section
- File saved: `docs/projects/gull-force/BIBLIOGRAPHY.md` in ECC repo

### 2. Sources Verified (10 categories, 20+ entries)

| Category | Count | Notes |
|----------|-------|-------|
| Official histories | 1 | Wigmore, *The Japanese Thrust* |
| Unit histories | 1 | Harrison, *Ambon, Island of Mist* |
| Academic monographs | 6 | Beaumont ×3, Chauvel, Heller/Simpson, Krancher |
| War crimes scholarship | 4 | Fitzpatrick, Okada, Sissons ×2 |
| Journal articles | 5 | Beaumont ×3, Moore, Rosenzweig |
| Theses | 2 | Evans (Murdoch), Rosenzweig (CDU) |
| Japanese sources | 2 | Tachikawa (NIDS), Tozuka (Japanese Monograph 16) |
| Popular histories | 1 | Maynard, *Ambon* (Hachette) |
| Archival (AWM + NAA) | 13 records | AWM54, AWM127, private papers, oral histories |
| AWM digital resources | 4 | Research guides, online exhibitions |

### 3. Candidate Sources Evaluated
- 16 additional candidate sources provided by user and verified by research agent
- **Added**: Chauvel, Evans thesis, Fitzpatrick, Okada, Beaumont LISA 2020, Moore review, Tachikawa, Hicks oral history, Doolan tribunal document, Pledger oral history
- **Excluded** (documented): Van Liere & Van Dis (wrong "Ambon War" — 1999–2004 conflict, not 1942), Jinkins podcast shownotes, DACC web article, Payton *Repat* (too general), Craig Smith conference paper, Moore "caretaker" chapter (unverifiable)

### 4. Full Link Coverage Added
- Every bibliography entry now has at least one working hyperlink
- AWM private papers: direct collection URLs (PR01105, 3DRL:1763, PR00871, PR89:165)
- AWM54 records without confirmed C-numbers: AWM search URLs
- Books: NLA/Trove catalogue links for all Australian-published titles
- International books: IWM catalogue, Open Library, publisher pages
- NAA A471: direct RecordSearch link
- Journals: DOIs throughout; AustLII for Okada; OpenEdition for Beaumont LISA 2020

### 5. "Further Reading" WordPress Page Created
- **Page ID**: 3943, URL: `/further-reading/`
- **Template**: `elementor_full_width`
- **Elementor layout**: plum hero (brand colour #522241) + full-width HTML widget with bibliography
- **CSS**: brand colours (#522241, #d05c3d, #f6dfb6), blockquote styling, link colours, table striping
- **Nav**: Added to `gull-force-navigation` menu under History parent (db_id 3718)
- **Script**: `scripts/create-bibliography-page.php`

---

## Technical Decisions

### Bibliography Verification Standard
- Sources verified via 3+ independent databases before inclusion
- Unverifiable sources documented in Research Gaps section rather than silently excluded
- Distinction maintained between: direct collection URLs, search URLs (for AWM54 items without confirmed C-numbers), and paywalled items (noted explicitly)

### Elementor Page Architecture
- Single HTML widget chosen over multiple widget pairs (heading + text-editor per section)
- Rationale: easier to maintain, all content editable in one place, avoids fragmentation across 20+ widgets
- CSS scoped to `.gf-bibliography` class to avoid theme conflicts
- `wp_slash(wp_json_encode($data))` pattern used per established site convention

### Nav Placement
- Parent: History (db_id 3718) — custom link menu item
- History dropdown now: 2/21st Battalion History | 1/21st Battalion History | Memorials | Pilgrimages | Nominal Roll | Further Reading
- Decision made by user (Option A from presented alternatives)

### Joan Beaumont Relationship Note
- Beaumont is a member of the Gull Force Association and has attended pilgrimages
- After discussion, positionality notes were NOT added to her bibliography entries
- This remains relevant context for the Association but not for the public-facing bibliography

---

## Key People / Institutions

- **Joan Beaumont** (ANU): dominant scholarly voice — 1988 monograph, 2025 expanded edition, 3 journal articles. Association member who has attended pilgrimages.
- **D. C. S. Sissons**: key figure for Laha war crimes trials scholarship
- **Courtney Harrison**: unit history author (veteran community)
- **Paul Rosenzweig** (CDU): pilgrimage/pela relationship scholar
- **David Evans** (Murdoch): strategic failure analysis (only PhD thesis on the Ambon strategy)

---

## Challenges and Solutions

| Challenge | Solution |
|-----------|---------|
| AWM54 items without C-numbers (JS-rendered catalogue) | Used AWM advanced-search URLs as functional links |
| Candidate "Ambon War" article (Utrecht, 2018) | Identified as 1999–2004 religious conflict, not 1942 — excluded |
| Beaumont *War & Society* 1983 — no open access | Included DOI with explicit "paywalled" note |
| Evans thesis URL (Murdoch repo format uncertain) | Used DACC-hosted PDF with note to cite as Murdoch thesis |

---

## Files Created/Modified

| File | Change |
|------|--------|
| `docs/projects/gull-force/BIBLIOGRAPHY.md` (ECC) | Created; expanded with candidate sources; full link coverage added |
| `scripts/create-bibliography-page.php` (gull-force-wp) | Created; builds Elementor page + nav item |
| WP page 3943 `/further-reading/` (live site) | Created via script |

---

## Phase Context

- **Phase 5 Sprint 1–3**: Complete (galleries, memorial map, member profiles, reconciliation UI)
- **Phase 6**: Member portal (in progress — join page, PayPal/BACS, newsletter archive, member dashboard)
- **This session**: Standalone research/content task — bibliography is useful for both public visitors and the Association's own records

---

## Lessons Learned

1. **AWM catalogue C-numbers**: Not discoverable via static HTML — require JS-rendered search. AWM advanced-search URLs are a functional fallback for archival items without confirmed identifiers.
2. **"Ambon War" disambiguation**: The term refers to two distinct events — the 1942 Japanese invasion AND the 1999–2004 Christian-Muslim communal violence. Always check which conflict a source is discussing.
3. **Beaumont's dual role**: Being both the primary academic authority and an Association member is significant — explains exceptional access to survivor testimony and family collections across her career.
4. **Elementor HTML widget**: More maintainable than fragmenting a bibliography across heading+text-editor widget pairs. Scoped CSS inside the widget keeps styles isolated.
