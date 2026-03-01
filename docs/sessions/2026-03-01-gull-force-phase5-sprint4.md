# Session: Gull Force Phase 5 Sprint 4

**Date:** 2026-03-01
**Repo:** jtaylorcomplize/gull-force-wp (master)
**Key commit:** f226c91 (feat: Phase 5 Sprint 4)

---

## Delivered

### 1. `single-gf_headstone.php` — Individual Headstone Profile Template

Individual page for each of the 607 `gf_headstone` posts. Accessible at `/headstone/{slug}/`.

**Design:**
- Hero: navy background, two-column (text left, headstone photo right)
- Text column: "Headstone Record" eyebrow, H1 name, cemetery subtitle, CWGC badge
- Photo column: headstone image (Fancybox lightbox on click), max-height 320px, contain fit (preserves stone proportions)
- Body: record panel (cream, gold border-left) + Related Records grid + context note

**Data fields:**
- `headstone_image` — ACF, returns int or array; handles both
- `headstone_surname` — ACF string
- `headstone_initials` — ACF string
- `linked_memorial` — raw postmeta int (NOT ACF field, no `_linked_memorial` key) → use `get_post_meta()`
- Reverse lookup for linked `gf_member` via wpdb LIKE on `headstone_link` serialised value

**Apostrophe handling:**
```php
$display_surname = str_replace( '_', "'", $surname );
```
Converts `O_Brien` → `O'Brien`, `O_Connor` → `O'Connor` in all display contexts.

**Reverse member lookup:**
```php
$member_ids = $wpdb->get_col( $wpdb->prepare(
    "SELECT post_id FROM {$wpdb->postmeta}
     WHERE meta_key = 'headstone_link' AND meta_value LIKE %s",
    '%"' . $post_id . '"%'
) );
```
ACF relationship fields store IDs as serialised strings: `a:1:{i:0;s:4:"1234";}`. The `%"1234"%` LIKE pattern matches within the serialised value. Currently returns no matches (headstones = Ambon dead; member CSV = survivors — different populations). Will be more useful if nominal roll member–headstone links are added in future.

**Related Records grid:**
- Veteran Profile card (portrait thumb if available, rank, service number)
- Ambon War Cemetery memorial card (gallery thumb, location)
Both link to their respective single post pages.

**Back link:** → Plaques & Memorials (page 2610)

**Gitignore:** `single-gf_headstone.php` was pre-emptively added to gitignore negation in a prior session — no gitignore changes needed.

---

### 2. `gf_headstone_grid` Shortcode — Updated to Link to Post Pages

**Change:** Cards now wrap in `<a href="get_permalink($pid)">` instead of opening Fancybox directly.

**Why:** Without this change, `single-gf_headstone.php` would be unreachable from the UI — the grid was the only entry point. Pattern now consistent with veteran directory (grid → post page → Fancybox on image click).

**Additional fixes in the same change:**
- `str_replace('_', "'", ...)` applied to `$name` so grid labels show `O'Brien` not `O_Brien`
- "No image" placeholder div for headstones without photos (previously just rendered nothing)
- `$full_hs` variable removed (no longer needed — Fancybox moved to single template)

---

### 3. Nominal Roll Download Page — `/nominal-roll/` (ID 3922)

**PDF:** `Gull Force - Nominal Roll..pdf` (note double dot in filename) exists on disk at:
`web/wp-content/uploads/gull-force/documents/Gull Force - Nominal Roll..pdf`
Was not previously registered as a WP attachment.

**Registration pattern:**
```php
$upload_dir = wp_upload_dir();
$pdf_rel    = 'gull-force/documents/Gull Force - Nominal Roll..pdf';
$pdf_abs    = $upload_dir['basedir'] . '/' . $pdf_rel;

$att = ['post_mime_type' => 'application/pdf', 'post_title' => '...', 'post_status' => 'inherit'];
$pdf_id = wp_insert_attachment( $att, $pdf_abs );
// wp_insert_attachment sets _wp_attached_file automatically from $pdf_abs
```

WP-CLI registered: PDF attachment ID **3921**, URL uses `wp_upload_dir()['baseurl']` + relative path.

**Page content (3 Elementor sections):**
1. Navy hero — "Nominal Roll" H1, subtitle (8th Division, 1941–1945)
2. Cream — "About the Nominal Roll": 1,131 men, AWM source, link to Veterans Directory
3. Navy — "Download": description + gold download button linking to PDF URL

**Nav:** Added to History dropdown (gull-force-navigation menu ID 17) as item 3924, parent 3718, position 10 (after Pilgrimages).

**Script:** `scripts/build-nominal-roll-page.php` — idempotent (checks for existing page by slug, existing attachment by `_wp_attached_file`).

---

### 4. History Pages (2556, 2558) — Confirmed Complete

Both pages were found to already have full Elementor content from a previous session:
- Page 2556 (2/21st Battalion History, slug `battalion-history`): 5 sections, 12,644 chars
- Page 2558 (1/21st Battalion History, slug `1-21st-battalion`): 5 sections, 9,721 chars

Build scripts `scripts/build-battalion-history-elementor.php` and `scripts/build-1-21bn-history-elementor.php` had already been run. No changes required.

---

## Technical Notes

### linked_memorial is NOT an ACF field
Despite being set during import, `linked_memorial` on `gf_headstone` posts has no `_linked_memorial` field-key postmeta row. Must use `get_post_meta($id, 'linked_memorial', true)` — `get_field()` will not find it.

### WP attachment registration for files outside /YYYY/MM/
Files in custom upload subdirectories (`gull-force/documents/`) work correctly with `wp_insert_attachment()`. The `_wp_attached_file` meta stores the path relative to `wp_upload_dir()['basedir']`. The URL is derived via `baseurl . '/' . relative_path` — no CDN or rewrite changes needed.

### Headstone apostrophe in post slugs
WordPress slugs use `o_brien-l-n` (underscore for apostrophe, hyphen for space). The display fix is purely presentational and doesn't affect URLs.

---

## Phase Status

**Phase 5 Sprint 4: COMPLETE**

All three Sprint 4 items delivered:
- ✅ `single-gf_headstone.php`
- ✅ Nominal Roll download page
- ✅ Articles / history pages (2556, 2558 confirmed built)

**Next: Phase 6 — Member Portal**
Scope documented in `docs/projects/gull-force/PHASE6-MEMBER-PORTAL-SCOPE.md`:
- $50 AUD life membership (PayPal + BACS/PayID)
- Auto-approval on payment
- `gf_association_member` WP role
- Newsletter archive (gf_newsletter CPT)
- Single access gate: `gf_current_user_is_member()`
