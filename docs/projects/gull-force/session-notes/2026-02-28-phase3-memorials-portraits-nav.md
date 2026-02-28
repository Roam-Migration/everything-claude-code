# Gull Force Phase 3 — Session Notes
**Date:** 2026-02-28
**Commits:** `97ea5e6`, `f98f551`, `c1bf6f2`

---

## What Was Done

### 1. Nav Menu — Veterans Dropdown

Added a "Veterans" parent item (position 6) to both menus:
- **Gull Force Navigation** (term_id 17, slot `menu-1`) — the active menu
- **Primary Navigation** (term_id 16)

Children added:
- Veterans Directory → /veterans-directory/ (ID 2554)
- Veteran Photos → /veteran-photos/ (ID 2569)
- Plaques & Memorials → /plaques-memorials/ (ID 2610)
- 2/21st Battalion History → /battalion-history/ (ID 2556)
- 1/21st Battalion History → /1-21st-battalion/ (ID 2558)
- Memorials → /memorials/ (ID 2650) — added later after page creation

WP-CLI pattern used:
```bash
# Parent (custom link with # href)
wp menu item add-custom 17 'Veterans' '#' --porcelain --path=/var/www/html/web
# → returns parent db_id (2612)

# Children
wp menu item add-post 17 {page_id} --title='...' --parent-id=2612 --porcelain --path=/var/www/html/web
```

Menu items are stored in WP database — nothing to git commit.

---

### 2. Portrait Matching Improvements (match-portraits.py)

**Bug fixed:** Trailing digit strip regex `\s+\d+$` → `\s*\d+$`
- `ERSmith1.jpg` previously failed because no whitespace before trailing "1"
- After fix: strips to `ERSmith` → CamelCase handler splits to `["ER", "Smith"]` → matches Smith, Eric
- Added as service_photo for post 2473

**SKIP_TOKENS expanded:**
- Added: `band`, `brothers`, `gull force`, `gullforce`, `powmem`, `leahari`, `pombo`, `lawamena`, `church`, `cenotaph`, `cross`, `flag`, `choir`, `tour group`, etc.
- Fixed: `visor.jpg` → `visor` (so "new visor web.jpg" is now caught)

**GROUP_INDICATORS expanded:**
- Added bare `&` and `+` (without surrounding spaces)
- Catches: `Tom&Eddie.jpg`, `Eddie+Juneemen.jpg`

**SKIP_PATTERNS (new regex list):**
- `r'^tin\d'` — memorabilia tin items (tin1.jpg through tin26.jpg)
- `r'^\d+\.(jpg|jpeg|png|gif)$'` — bare numeric filenames (1.jpg, 2.JPG)

**Results:**
| Metric | Before | After |
|--------|--------|-------|
| Portrait candidates | 276 | 164 |
| Matched images | 35 | 36 |
| Unmatched | 241 | 128 |

The 128 remaining unmatched are confirmed not-in-DB individuals (family members, pilgrimage participants, non-Gull-Force people).

**Key insight:** Most unmatched images name people not in the 362-member survivor DB. The DB covers survivors only; many image subjects are deceased (different population from headstones) or non-military attendees.

**Import re-run:**
- Staged 9 previously-deleted portrait files back to `content/portraits/`
- Re-ran import-member-portraits.php: 9 newly imported, 14 skipped, 20 portrait_photo set, 16 gallery images added
- Import is fully idempotent (deduplicates by filename and attachment ID)

---

### 3. gf_memorial CPT

**CPT registered** in `mu-plugins/gull-force.php`:
- Slug: `memorial` | Icon: `dashicons-location` | Position: 27
- Supports: `title`, `thumbnail`, `editor`

**ACF field group** (`group_gf_memorial`, DB ID 2641):

| Field key | Field name | Type |
|-----------|-----------|------|
| `field_gf_mr_location` | `memorial_location` | text |
| `field_gf_mr_country` | `memorial_country` | select |
| `field_gf_mr_type` | `memorial_type` | select |
| `field_gf_mr_significance` | `memorial_significance` | text |
| `field_gf_mr_description` | `memorial_description` | wysiwyg |
| `field_gf_mr_gallery` | `memorial_gallery` | gallery |
| `field_gf_mr_year` | `memorial_dedication_year` | number |
| `field_gf_mr_sort` | `memorial_sort_order` | number |

**CRITICAL: `acf_import_field_group()` not `acf_add_local_field_group()`**
- `acf_add_local_field_group()` only persists for the PHP request lifetime
- `update_field()` in a subsequent script can't find those field keys
- `acf_import_field_group()` writes to `wp_posts`/`wp_postmeta` (same as Admin UI)
- All other gf_* field groups on this site use DB storage — must be consistent

**8 memorial posts created (IDs 2633–2640):**

| ID | Title | Country | Photos |
|----|-------|---------|--------|
| 2633 | Ambon War Cemetery | Indonesia | 9 |
| 2634 | Laha Memorial | Indonesia | 2 |
| 2635 | Kudamati Memorial | Indonesia | 4 |
| 2636 | Tantui Memorial | Indonesia | 2 |
| 2637 | Tawiri Memorial | Indonesia | 2 |
| 2638 | Shrine of Remembrance | Australia | 6 |
| 2639 | Australian War Memorial | Australia | 3 |
| 2640 | Hainan Island Memorial | China | 3 |

All gallery fields link to existing Phase 2 plaque attachment IDs (no new image imports).

**[gf_memorial_grid] shortcode** added to gull-force.php:
- Attributes: `columns` (default 2), `country` (filter)
- Card layout: lead image (220px) + gold accent border + title + location + type + significance + photo count
- Responsive: 1 col below 800px

**Memorials page** (ID 2650): `/memorials/` — content is `[gf_memorial_grid columns="2"]`

---

## Scripts Added / Modified

| Script | Purpose |
|--------|---------|
| `scripts/match-portraits.py` | Updated: trailing digit fix, expanded SKIP_TOKENS, SKIP_PATTERNS, GROUP_INDICATORS |
| `scripts/portrait-mapping.json` | Regenerated: 36 entries |
| `scripts/create-memorial-fields.php` | Registers ACF field group in DB (run once before import) |
| `scripts/import-memorials.php` | Idempotent: creates/updates 8 memorial posts + ACF fields + gallery |
| `scripts/check-memorials.php` | Verification: prints field values + photo counts |
| `scripts/list-plaques.php` | Helper: lists attachment IDs by gf_plaque_category |
| `scripts/list-acf-storage.php` | Diagnostic: shows whether field groups are local or DB-backed |

---

## Phase 3 Remaining / Phase 4 Candidates

- **Elementor page template for /memorials/** — currently plain WordPress content with shortcode; needs Elementor layout consistent with other pages
- **Memorial detail pages** — individual CPT posts have no single-post template yet (single-gf_memorial.php)
- **Photo lightbox** — plaque/memorial galleries have no lightbox; open in new tab currently
- **gf_memorial ↔ gf_headstone linking** — connect memorial locations to individual headstones in the same geographic area
- **Map view** — lat/lng fields exist on gf_memorial; could power a Leaflet/Google Maps integration
- **Expand portrait matching** — 128 remaining unmatched; only fixable by adding more member data (the DB covers survivors only)

---

## Dev Environment

- **DDEV URL:** http://gull-force.100.115.92.195.nip.io
- **WP-CLI path:** always `--path=/var/www/html/web`
- **sg docker wrapper:** required for all `ddev` commands from host shell
- **wp eval inline:** fails on ChromeOS due to `$` variable expansion — use `eval-file` with a temp script instead
