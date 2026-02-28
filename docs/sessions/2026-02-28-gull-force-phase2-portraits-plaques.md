# Gull Force — Phase 2: Veteran Portraits & Plaques Pages

**Date:** 2026-02-28
**Repo:** jtaylorcomplize/gull-force-wp (master)
**Commit:** `241ccee`

---

## Session Goals

Phase 2 of the Gull Force WordPress site, continuing from Phase 1 (362 veteran members, 607 headstones, Veterans Directory, Battalion History pages).

1. Match and import veteran portrait photographs from `content/images/` → link to `portrait_photo` ACF field on `gf_member` posts
2. Build **Veteran Photos** page (`/veteran-photos/`) with `[gf_member_photo_gallery]` shortcode
3. Build **Plaques & Memorials** page (`/plaques-memorials/`) with `[gf_plaque_gallery]` shortcode

All three goals delivered.

---

## Portrait Matching Pipeline

### Problem
478 potential portrait JPEGs in `content/images/` with inconsistent filename conventions:
- `W Hicks 1941.jpg`, `H.J.Legg.jpg`, `VX22055 P.O.Mills.jpg`, `Vince Brewer.jpg`, `Roach.jpg`
- Need to link to 362 `gf_member` posts (titles: "Surname, Firstname")

### Solution — `scripts/match-portraits.py`

Cascade matching strategies in priority order:

1. **Service number** — `VX22055` in filename → exact match on `service_number` postmeta
2. **Exact name** — both surname and given name tokens present
3. **Nickname** — ABBREVIATIONS dict (`vince→david`, `les→leslie`, `bill→william`, etc.)
4. **Initials + unique surname** — `W Hicks` → initials `W`, surname `Hicks` (unique in DB)
5. **Unique surname only** — single token, unique surname: `Roach.jpg` → Roach, Leonard
6. **Abbreviation + surname** — `H.J.Legg` → split CamelCase `HJ`+`Legg`

**Pre-filters:**
- `SKIP_TOKENS` set: excludes non-portrait images (ambon, cemetery, historical location names)
- `GROUP_INDICATORS` (`' and '`, `' & '`, `' + '`, `' with '`): excludes group shots
- Year removal: `re.sub(r'\b\d{4}\b', ...)` before matching

**Post-processing:**
- Post-level de-duplication: alphabetically first image per member → `portrait_photo`; rest → `service_photos`

**Results:** 35 matched images → 20 portrait_photo + 15 service_photos

### Staging & Import

Images staged to `content/portraits/` (DDEV-accessible at `/var/www/html/content/portraits/`).

`scripts/import-member-portraits.php`:
- Uses `media_handle_sideload()` via custom `gfp_import_file()` helper
- Checks existing attachments via `_wp_attached_file` postmeta (not guid — unreliable)
- Sets `portrait_photo` ACF field + `set_post_thumbnail()` for featured image
- Groups entries by post_id; portrait first, then service gallery
- Dry-run via `GF_DRY_RUN=1` env var (WP-CLI intercepts unknown flags)

**Result:** 9 files imported, 14 skipped (already in library), 20 portrait_photo set, 15 gallery images added

---

## ACF Meta Key Bug — Root Cause & Fix

**Bug:** `update_field('field_gf_mem_portrait', $att_id, $post_id)` stored data under `field_gf_mem_portrait` instead of `portrait_photo`.

**Root cause:** ACF field groups registered via `acf_import_field_group()` are only in local JSON, not the DB. When `update_field()` receives a field key, it calls `acf_get_field()` to resolve the field name. With no DB record, resolution fails → falls back to using the raw key as meta_key.

**Fix:**
- `scripts/fix-portrait-meta.php`: moves data from `field_gf_mem_portrait` → `portrait_photo`, sets `_portrait_photo` reference key, removes wrong key. Ran: 19 fixed.
- `scripts/fix-service-photos-meta.php`: same pattern for `service_photos` gallery. Ran: 6 fixed.

**Lesson:** When ACF field groups live in local JSON only, always use field **names** (not keys) in `update_field()` and `get_field()` calls.

---

## New Shortcodes (mu-plugins/gull-force.php)

### `[gf_member_photo_gallery columns="4"]`

- Queries `gf_member` posts with `portrait_photo` postmeta set (non-empty)
- Sorted alphabetically by `post_title` (ASC)
- Responsive CSS grid (4 cols → 3 → 2 → 1 at breakpoints)
- Card: portrait image (3:4 aspect, object-fit cover), name in gold, rank, war_history
- Handles both array return (ACF image format) and raw attachment ID string
- Note: `member_unit` has birth dates for many members (import data quirk) → use `war_history` instead

### `[gf_plaque_gallery category="ambon" columns="3"]`

- Queries `attachment` posts with `gf_plaque_category` postmeta = category
- Categories: `ambon`, `hainan`, `awm`, `shrine`, `australia`
- Figure + figcaption layout (image title as caption)
- Responsive (3 cols → 2 → 1)
- Sorted by post_title ASC

---

## Plaque Import

`scripts/import-plaques.php`:
- 39 images across 5 categories
- Assigns `gf_plaque_category` postmeta on each attachment
- Images staged to `content/plaques/`
- Safe to re-run: skips existing attachments, updates category meta

**Import result:** 39 imported, 0 errors

**Category breakdown:**
- ambon: 19 (Laha, Tantui, Tawiri, Kudamati, memorial roll panels)
- shrine: 6 (Shrine of Remembrance, Melbourne)
- australia: 8 (AWM-adjacent, Heidelberg, Singapore, cenotaph)
- awm: 3 (Australian War Memorial plaques)
- hainan: 3 (China/Hainan plaques)

---

## New Pages

### Veteran Photos (ID: 2569, `/veteran-photos/`)

Built via `scripts/build-veteran-photos-elementor.php`:
- Navy/gold page header (Playfair Display)
- Intro section (cream background)
- Gallery section: `[gf_member_photo_gallery columns="4"]`

### Plaques & Memorials (ID: 2610, `/plaques-memorials/`)

Built via `scripts/build-plaques-memorials-elementor.php`:
- Navy/gold page header
- Intro section
- 5 gallery sections with headings, descriptive text, shortcode each
- `gf_gallery_section()` helper function to DRY up repeated section structure

---

## DDEV Notes

- `ddev exec 'GF_DRY_RUN=1 wp eval-file ...'` — inline env var (DDEV exec doesn't support `-e` flag)
- WP-CLI intercepts unknown `--flags` as parameter errors; use env vars for script options
- `sg docker -c "cd /path && ddev exec ..."` required on ChromeOS Crostini to access Docker group

---

## Phase 3 Candidates

- Expand portrait matching: run `match-portraits.py` against full 478 portrait candidate images with improved strategies
- Add Veteran Photos + Plaques & Memorials to WP nav menu
- `gf_memorial` CPT for individual memorial pages (Laha, Tantui, Tawiri, etc.)
- `[gf_member_card]` pop-up/lightbox for veteran gallery cards linking to full member profile
