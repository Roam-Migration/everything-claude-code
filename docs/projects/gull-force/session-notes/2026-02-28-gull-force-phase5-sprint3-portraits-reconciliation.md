# Gull Force Phase 5 Sprint 3 — Portrait Matching & Photo Reconciliation System

**Date:** 2026-02-28
**Repo:** jtaylorcomplize/gull-force-wp (`master`)
**Session scope:** Portrait matcher improvements, wrong-match corrections from website caption audit, photo reconciliation admin system (Option A), memorial map + statistics shortcodes committed.

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Veterans with portrait_photo | 20 | 61 |
| Unmatched images staged in WP | 0 | 616 |
| ACF field groups on attachments | 0 | 1 (`group_gf_attachment`) |
| Media library reconciliation statuses | — | 616 × `unreviewed` |

---

## 1. Portrait Matcher Improvements (`scripts/match-portraits.py`)

### Full dataset fix
Previous matcher runs used only 362 association members. Re-run against all 1,191 `gf_member` posts immediately lifted match count from 20 to 47.

### Strategy additions
Added to the cascade after initial+surname:

**Strategy 6 — 3-token (Firstname + Middle + Surname)**
Handles filenames like `John H Smith.jpg`. Takes `clean_tokens[-1]` as surname, `clean_tokens[0]` as firstname, queries `by_surname_firstname` dict. Falls through to abbreviation expansion if firstname is an ABBREVIATIONS key.

**Strategy 7 — Celtic prefix fallback**
For `initial+surname` that returns 0 results, tries `o` + `mc` + `mac` prefixes on the surname key. Handles `O'Brien.jpg`, `McLean.jpg` etc. where the file omits the prefix.

**Second-initial fallback (Strategy 4 extension)**
When `len(narrowed) == 0` and `len(initials_tok) > 1`, takes `initials_tok[1]` as an alternative first initial. Catches `J.H. Williams.jpg` → Williams, Harry (where H is the second initial and also the known name).

### `FILENAME_CORRECTIONS` dict
Typo map applied at parse time. Example: `'schaeferr' → 'schaefer'`.

### `MANUAL_OVERRIDES` dict
Hardcoded `{filename: post_id}` for caption-confirmed corrections that automated matching can't solve:

| File | Automated match | Correct member (ID) | Source |
|------|-----------------|---------------------|--------|
| `Gilbert2.jpg` | Maric Gilbert | George Trezise (2418) | "George Trezise B Coy" caption |
| `Gilbert3.jpg` | Maric Gilbert | George Trezise (2418) | "Pte G. Trezise B Coy" caption |
| `F Greig3.JPG` | Frank Greig | Frederick Heintz (2978) | "Frederick Heintz" caption |
| `Bret Jones.jpg` | Jones, Herbert (3028) | Jones, Bert (2277) | "Bert Jones" caption |
| `J.H. Williams.jpg` | none | Williams, Harry (2489) | "J.H. Williams known as Harry" |

Wired into main loop: files in `MANUAL_OVERRIDES` are pulled from their group before normal processing and emitted with `strategy='manual_override'`.

### `rsl` false-positive fix
`'rsl'` was in `SKIP_TOKENS` as a substring, which matched `womersley1.jpg` (contains `r-s-l`). Moved to `SKIP_PATTERNS` as `re.compile(r'\brsl\b', re.I)` — word-boundary match only.

### Website caption cross-reference
Fetched https://gullforce.org.au/Veteran's_photos.html and extracted all ~265 image filenames + captions. Used to identify the five wrong/missing matches above. Only 3 legacy-site images not in local `content/images/` (trivial missing files).

---

## 2. ACF Field Group Registration Fix

**Problem:** `update_field('field_gf_mem_portrait', ...)` stored data under `field_gf_mem_portrait` as the `meta_key` (not `portrait_photo`) when ACF field group `group_gf_member` was not in the DB.

**Root cause:** `acf_add_local_field_group()` only persists for the duration of one PHP request. Any subsequent WP-CLI script couldn't find the field group and ACF fell back to using the field key as the meta_key.

**Fix:**
1. Re-run `create-member-fields.php` → writes `group_gf_member` to `wp_options` via `acf_import_field_group()`.
2. `fix-portrait-meta.php` → reads misrouted data from `field_gf_mem_portrait` key, writes to `portrait_photo`, deletes old key. Fixed 36 posts.
3. `fix-service-photos.php` → same for 21 `service_photos` galleries.

**Rule confirmed:** Always use `acf_import_field_group()`. Never use `acf_add_local_field_group()` in WP-CLI scripts that are meant to persist data.

---

## 3. Wrong-Match Cleanup (`scripts/cleanup-wrong-matches.php`)

Removed `Gilbert2.jpg`, `Gilbert3.jpg` from Maric Gilbert (post #2393) service_photos gallery, and `F-Greig3.jpg` from Frank Greig (post #2939).

**ACF gallery pitfall:** `get_field('field_gf_mem_service_photos', $post_id)` returns an array of attachment arrays (not bare IDs). Must extract `$img['ID']` and compare `basename($img['url'])` for filename lookup.

**WP filename sanitization:** `F Greig3.JPG` is stored as `F-Greig3.jpg` after upload (spaces → hyphens, extension lowercased). Cleanup script must match against the sanitized form, not the original filename.

---

## 4. Photo Reconciliation System (Option A — ACF on Attachments)

### Architecture decision
Three options were evaluated:
- **A:** ACF fields on `attachment` post type — selected (zero CPT overhead, uses media library UI)
- B: Dedicated `gf_photo` CPT
- C: Custom admin page

Option A wins because: WP media library already has bulk-edit, filtering, and search; ACF relationship field is reversible (can query from either side); no custom UI required for basic tagging.

### ACF field group (`group_gf_attachment`)
Registered via `scripts/create-attachment-fields.php` → `acf_import_field_group()`.

| Field key | Name | Type | Notes |
|-----------|------|------|-------|
| `field_gf_att_status` | `gf_reconciliation_status` | Select | unreviewed / tagged / confirmed / irrelevant |
| `field_gf_att_type` | `gf_photo_type` | Select | portrait / group_photo / activity / event / memorial / document / unknown |
| `field_gf_att_tagged_members` | `gf_tagged_members` | Relationship → gf_member | multi, search filter |
| `field_gf_att_caption` | `gf_photo_caption` | Text | max 500 chars |
| `field_gf_att_notes` | `gf_photo_notes` | Textarea | internal research notes |

### Image staging
618 unmatched images from `docs/projects/gull-force/content/images/` (ECC repo) were hardlinked into `gull-force-wp/content/images/` (project repo staging dir). Both repos are on the same btrfs filesystem → hardlinks use zero extra disk space and are transparent to the container's bind mount.

Path inside container: `/var/www/html/content/images/`

`scripts/import-unmatched-photos.php` — imports all files not already in WP media library, sets `gf_reconciliation_status = 'unreviewed'` via `update_field()`. Copies source to `sys_get_temp_dir()` before `media_handle_sideload()` (which moves/deletes `tmp_name`).

`scripts/backfill-attachment-status.php` — backfills status on the 285 pre-existing attachments in `content/images/` that were already in the media library from prior imports.

**Result:** 616 attachments with `gf_reconciliation_status = 'unreviewed'`.

### Media library admin UI (mu-plugin additions)

```
// Column: GF Status
manage_upload_columns → adds 'gf_status' column
manage_media_custom_column → renders colour-coded badge

// Column: Tagged Members
manage_media_custom_column → up to 3 member links + overflow count

// Status filter dropdown
restrict_manage_posts (attachment) → renders <select name="gf_status_filter">
parse_query → adds meta_query when filter is active

// "Tagged In Photos" metabox on gf_member edit screen
add_meta_boxes → add_meta_box('gf_tagged_in_photos', ..., 'gf_member', ...)
gf_render_tagged_photos_metabox() → queries via:
    SELECT post_id FROM wp_postmeta
    WHERE meta_key = 'gf_tagged_members'
    AND meta_value LIKE '%"$member_id"%'
```

**Reverse relationship query pattern:**
ACF relationship fields are serialized PHP arrays in postmeta. Reverse lookup uses `LIKE '%"ID"%'` — reliable for integer post IDs (the quoted integer string cannot appear in other field values without quotes).

### Client workflow
1. Media Library → filter "GF Status: Unreviewed"
2. Open photo → set `gf_tagged_members`, `gf_photo_type`, `gf_photo_caption`
3. Set status → "Tagged — awaiting confirmation"
4. Confirmation pass → "Confirmed"
5. Open any veteran profile → "Tagged In Photos" metabox shows all tagged photos

---

## 5. Sprint 3 Shortcodes (Previously Uncommitted)

### `[gf_memorial_map]` (`scripts/build-memorial-map.php`)
Renders a Leaflet.js map of all `gf_memorial` posts. Uses CartoDB Light tiles (no API key). Each marker shows memorial name + type + significance snippet. Lat/lng stored in ACF fields `memorial_lat`, `memorial_lng`. Leaflet script is conditionally enqueued: only loads on `gf_memorial` singular pages or pages containing `[gf_memorial_map]` shortcode.

### `[gf_statistics]`
Renders Chart.js horizontal bar charts for:
- Casualties by war history destination (Ambon/Laha/Hainan/Escaped/Unknown)
- Member counts by unit/formation

Data is cached via `set_transient('gf_statistics_data', ..., HOUR_IN_SECONDS)` to avoid repeated DB queries. Chart.js script (`chart.js@4`) conditionally enqueued only on pages containing `[gf_statistics]` shortcode.

---

## 6. Scripts Inventory (Phase 5 Sprint 3)

| Script | Purpose | Status |
|--------|---------|--------|
| `create-attachment-fields.php` | Register `group_gf_attachment` ACF fields | Keep (re-runnable) |
| `import-unmatched-photos.php` | Bulk import unmatched images from `content/images/` | Keep (idempotent) |
| `backfill-attachment-status.php` | Backfill `gf_reconciliation_status` on pre-existing attachments | Keep |
| `fix-portrait-meta.php` | One-time fix for misrouted portrait meta | Keep (reference) |
| `fix-service-photos.php` | One-time fix for misrouted gallery meta | Keep (reference) |
| `cleanup-wrong-matches.php` | One-time removal of Gilbert2/3 + F-Greig3 wrong matches | Keep (reference) |

---

## Key Patterns Established

1. **Hardlinks for staging** — use `os.link()` to stage files across same-filesystem repos. Avoids copying, transparent to Docker bind mounts.
2. **ACF on attachments** — standard `attachment` post type, location rule `['param' => 'attachment', 'operator' => '==', 'value' => 'all']`. All ACF APIs work normally.
3. **Reverse relationship via LIKE** — `meta_value LIKE '%"$id"%'` reliably finds ACF relationship backlinks for integer IDs.
4. **Conditional script enqueue** — `has_shortcode($post->post_content, 'slug')` in `wp_enqueue_scripts` prevents loading heavy libs (Leaflet, Chart.js) on pages that don't need them.
5. **`media_handle_sideload` + temp copy** — always `copy($src, $tmp)` before calling `media_handle_sideload`, since WP moves (not copies) the `tmp_name` file.
