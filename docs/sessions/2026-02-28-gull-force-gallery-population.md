# Session: Gull Force — ACF Gallery Field Population

**Date:** 2026-02-28
**Repo:** gull-force-wp (master)
**Commit:** 62fb494

---

## What Was Accomplished

Bulk-assigned 374 images to the `pilgrimage_2017_gallery` ACF gallery field on post 16 (Pilgrimages page).

**Before:**
- `pilgrimage_2017_gallery`: 7 manually curated images (Haley1-4, poppies2017, wreath2017, tour group 2017)
- `pow_camp_gallery`: 8 historical images (unchanged — already correct)

**After:**
- `pilgrimage_2017_gallery`: **374 images** — 7 curated named images first, then 367 DSC trip photos
- `pow_camp_gallery`: 8 images (no change needed)

---

## Key Technical Discovery: guid vs _wp_attached_file

**Problem:** Initial query used `guid LIKE '%/gull-force/pilgrimages/%'` — returned 0 results.

**Root cause:** WordPress sets `guid` to the post permalink URL (e.g., `http://gull-force.ddev.site/sony-dsc-99/`) for attachments imported via `wp media import` on a directory. This is a known behaviour — the guid is unreliable for path-based queries when bulk-importing.

**Fix:** Query via `_wp_attached_file` postmeta instead, which stores the relative path from `wp-content/uploads/` (e.g., `gull-force/pilgrimages/DSC00001-scaled.jpg`). This is always set correctly regardless of import method.

```sql
SELECT p.ID
FROM wp_posts p
JOIN wp_postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '_wp_attached_file'
WHERE p.post_type = 'attachment'
  AND p.post_mime_type LIKE 'image/%'
  AND pm.meta_value LIKE 'gull-force/pilgrimages/%'
  AND pm.meta_value NOT LIKE 'gull-force/pilgrimages/% - Copy%'
ORDER BY pm.meta_value ASC
```

---

## Source Directory Had Pre-Generated Thumbnails

The `gull-force/pilgrimages/` upload folder contained WordPress-generated thumbnail and scaled
files (`DSC00001-scaled.jpg`, `DSC00001-100x100.jpg`, etc.) from a previous environment.

When `wp media import` ran on the directory, it imported ALL files — including thumbnails — as
separate attachment records. This produced:

| Category | Count |
|----------|-------|
| Total attachments in pilgrimages/ | 397 |
| `- Copy` variants (exact duplicates) | 30 |
| Thumbnail-sized (`-NNNxNNN.jpg`) | 0 (no separate records — thumbnails share the parent attachment) |
| Primary images after filtering copies | 367 |

The `- Copy` suffix variants were filtered via `NOT LIKE '% - Copy%'`.

---

## ACF Gallery Field Storage

ACF gallery fields (`return_format: array`) store an ordered PHP array of integer attachment IDs
in `wp_postmeta`. `update_field()` accepts this array directly.

**Note:** `update_field()` returns `false` when the new value is identical to what's already stored
— this is not an error. Verify success by re-reading the field after update, not by checking the
return value.

---

## pow_camp_gallery — No Change Required

The 8 currently assigned images remain the correct curated set:
- `aerial photo of camp` (ID 357)
- `Hut-No7`, `PoW-return`, `PoW-return2`, `Womersley-Grave1`, `Womersley-Grave2`, `Wharf2`, `wharf1`
  (IDs 1983–1989, imported via `media_handle_sideload()` to `2026/02/` date-based path)

The broader `gull-force/images/` pool (435 images) is mixed general content (portraits, Darwin 1941
training photos, band photos, etc.) — not specifically POW camp material. No bulk additions warranted.

---

## Scripts Added

| Script | Purpose |
|--------|---------|
| `scripts/diagnose-gallery-fields.php` | Reports field state, attachment counts by folder, overlap analysis |
| `scripts/bulk-assign-pilgrimage-gallery.php` | Populates pilgrimage_2017_gallery — idempotent |
| `scripts/diagnose-pow-gallery.php` | Lists gull-force/images/ candidates not in pow_camp_gallery |

---

## Next Session

- Visual QA: verify `[gf_2017_gallery]` shortcode renders the full 374-image gallery correctly in Elementor
- Client to supply: membership form PDF, newsletter PDF, hero background images
- Populate: `membership_form_pdf`, `newsletter_pdf`, `commemoration_booklets[*].file` ACF fields
- Consider: DB snapshot export for handover / staging deployment
