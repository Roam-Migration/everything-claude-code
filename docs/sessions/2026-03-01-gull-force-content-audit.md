# Gull Force — Content Audit & Gap Remediation

**Date:** 2026-03-01
**Repo:** `/home/jtaylor/gull-force-wp` (commit d6f9f66)
**Phase:** Post-Phase-6 content audit (pre-Elementor Cloud migration)

---

## What Was Done

### Audit Methodology

Extracted all text content from 9 legacy site HTML files (in `docs/projects/gull-force/content/legacy-site-html/`) and compared against current WP site state using:
- `get_fields($post_id)` — ACF field dump per page
- Elementor widget tree walk — recursive function over `_elementor_data` JSON
- WC product list — `wc_get_products()`
- WP post list — `get_posts()`

### Gaps Found and Fixed

| Gap | Fix Applied |
|-----|-------------|
| 3 missing merchandise products (Lapel Pin $8, Pen $5, Stubby Holder $10) | Created via `WC_Product_Simple()` |
| Membership fee showing $35 (should be $50) | `update_field()` on Home (ID 12) and Contact (ID 15) |
| 3 missing Community external links (veteran interviews YT, Japanese surrender video, Evans PhD thesis) | Appended to `external_links` ACF repeater on Community (ID 13) |
| News and Events pages completely blank (no Elementor data, no posts) | Built Elementor JSON via PHP; created 5 WP posts from legacy 2021–22 calendar |
| "Hello world!" default post and "Sample Page" still existed | `wp_delete_post()` |
| "Further Reading" page needed renaming | `wp_update_post()` title + slug → "Further Resources" / `further-resources` |
| Elementor heading widget not updated by post rename | Recursive widget tree walk to update `settings.title` in-place |
| Section XI (Multimedia Resources) missing from Further Resources | Appended to existing HTML widget via `strrpos()` injection before closing `</div>` |
| Section XII (Historical Documents) missing from Further Resources | Same injection pattern; 6 newly imported + 4 pre-existing PDFs linked |
| Plaques page "Australian Memorials" text missing Mornington, Swan Hill, Trawool | Updated text-editor widget [84d5b68a] via recursive `update_widget_editor()` |
| Audio files not in media library | Copied to `uploads/gull-force/audio/`, `wp_insert_attachment()` + `update_attached_file()` |
| 6 historical documents not in media library | Same pattern into `uploads/gull-force/documents/` |

### What Was Not Changed

- **Further Resources page Elementor layout** — user confirmed page was already fully built; only injected new sections into existing HTML widget without rebuilding
- **1983 pilgrimage entry** — has only "Pilgrimage to Ambon." with no participants. Requires historical research, not programmatic fix.
- **Audio file embedding** — files are now in media library but not yet embedded on any page (e.g. memorial hero section). Separate task.

---

## Technical Patterns

### Elementor section injection without rebuild

Safe way to append content to an existing HTML widget without touching the rest of the page:

```php
function inject_html_widget(&$elements, $new_html) {
    foreach ($elements as &$el) {
        if (($el['widgetType'] ?? '') === 'html') {
            $current = $el['settings']['html'] ?? '';
            // Insert before the final closing </div>
            $el['settings']['html'] = substr($current, 0, strrpos($current, '</div>'))
                . $new_html
                . '</div>';
            return true;
        }
        if (!empty($el['elements']) && inject_html_widget($el['elements'], $new_html)) return true;
    }
    return false;
}
// Then save:
update_post_meta($page_id, '_elementor_data', wp_slash(wp_json_encode($el)));
\Elementor\Plugin::$instance->files_manager->clear_cache();
```

### Recursive widget field update

```php
function update_widget_editor(&$elements, $widget_id, $new_content) {
    foreach ($elements as &$el) {
        if ($el['id'] === $widget_id) {
            $el['settings']['editor'] = $new_content;
            return true;
        }
        if (!empty($el['elements']) && update_widget_editor($el['elements'], $widget_id, $new_content)) return true;
    }
    return false;
}
```

### Audio/document import pattern

```php
$upload_dir = wp_upload_dir()['basedir'] . '/gull-force/audio';
wp_mkdir_p($upload_dir);
copy($src, $dest);
$att_id = wp_insert_attachment([
    'post_mime_type' => wp_check_filetype($filename)['type'],
    'post_title'     => $title,
    'post_status'    => 'inherit',
], $dest);
update_attached_file($att_id, 'gull-force/audio/' . $filename);
```

---

## Outstanding (Manual / Client-Dependent)

1. **1983 pilgrimage description** — needs historical research to add participant names
2. **Audio embedding** — Last Post / Rouse could be added to memorial page hero section (IDs 3954–3956 now in media)
3. **Client-supplied data** — BSB/account for BACS, PayPal Business, member CSV, store address (Phase 6 blockers)
4. **Elementor Cloud migration** — next major milestone after client supplies data

---

## New Media Imports

| ID | Title | Type |
|----|-------|------|
| 3954 | Last Post | MP3 |
| 3955 | Ambon Last Post | MP3 |
| 3956 | Rouse | MP3 |
| 3957 | Bill Doolan — Article | PDF |
| 3958 | Caitlyn Antella Assignment — Part 1 | PDF |
| 3959 | Caitlyn Antella Assignment — Part 2 | PDF |
| 3960 | Kudamati Australian Monument — Ambon | PDF |
| 3961 | Laha and Tawiri Memorial History | PDF |
| 3962 | Frederick Schaefer — Prior to Leaving Australia | PDF |
