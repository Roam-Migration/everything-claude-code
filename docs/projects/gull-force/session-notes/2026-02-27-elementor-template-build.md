# Session: Elementor Template Build — All 5 Pages

**Date:** 2026-02-27
**Repo:** gull-force-wp (master)
**Commits:** 901e134 (initial build), 6d1ad91 (wp_slash fix)

---

## What Was Accomplished

Built complete Elementor page templates programmatically for all 5 pages of the Gull Force
Association site. ACF dynamic tags pre-wired to every field. All pages rendering with live content.

Pages built:
- Post 12 — Home (hero, stats bar, aims, membership, contact strip)
- Post 13 — Community (battalion history, veteran stories, portraits, external links, headstone grid, newsletter)
- Post 14 — Memorabilia (intro, WooCommerce products widget, order form)
- Post 15 — Contact (2-column split, membership form section)
- Post 16 — Pilgrimages (intro, timeline, POW gallery, 2017 gallery, booklets, upcoming)

Also built:
- Elementor Theme Builder header + footer (elementor_library posts 2141, 2143)
- Nav menu "Gull Force Navigation" (ID 17) with all 5 pages
- 11 mu-plugin shortcodes for ACF repeater content

---

## Technical Stack

| Component | Version / Detail |
|-----------|-----------------|
| Theme | Hello Elementor 3.4.6 (installed this session) |
| Elementor | Pro 3.35.5 (Flex Container model) |
| ACF | Pro — all fields pre-populated from previous session |
| DDEV | Local environment, Crostini (Linux on ChromeOS) |
| Site URL | http://gull-force.100.115.92.195.nip.io |

---

## Critical Bug: wp_slash() Required for _elementor_data

**Symptom:** Pages rendered header + footer only. Playwright found 2 containers per page, zero
widget content. `data-elementor-id` not present on body.

**Root cause:** `update_post_meta()` internally calls `wp_unslash()` before writing to DB.
This strips backslash escapes from the JSON string — `\"` becomes `"` — making the stored
JSON invalid. `json_decode()` returns NULL. Elementor silently skips rendering.

**Fix:** Wrap `wp_json_encode($elements)` with `wp_slash()` in every `gf_inject()` call:

```php
update_post_meta( $post_id, '_elementor_data', wp_slash( wp_json_encode( $elements ) ) );
```

`wp_slash()` adds an extra escaping layer that `wp_unslash()` then cancels out, leaving the
JSON intact on read. This is the canonical WordPress pattern for storing JSON in postmeta.

This bug affects ALL scripts that store JSON in postmeta programmatically. Updated:
- build-home-elementor.php
- build-community-elementor.php
- build-memorabilia-elementor.php
- build-contact-elementor.php
- build-pilgrimages-elementor.php
- build-header-footer.php

---

## ChromeOS/Crostini DDEV Access

**Problem:** Chrome runs in ChromeOS. DDEV runs in Crostini (Linux container). The `.ddev.site`
domain resolves to `127.0.0.1` via public DNS — which is ChromeOS's loopback, not the Linux
container's loopback. Connection refused.

**Fix (3 parts):**

1. Bind DDEV router to all interfaces:
   ```bash
   sg docker -c "ddev config global --router-bind-all-interfaces=true"
   ```

2. Add nip.io FQDN to `.ddev/config.yaml`:
   ```yaml
   additional_fqdns:
     - gull-force.100.115.92.195.nip.io
   ```
   `nip.io` is a free wildcard DNS service: `*.100.115.92.195.nip.io` resolves to `100.115.92.195`
   which is the Linux container's IP, reachable from ChromeOS.

3. Add dynamic WP_HOME/WP_SITEURL to `wp-config.php` (before DDEV's include):
   ```php
   if ( getenv( 'IS_DDEV_PROJECT' ) === 'true' && ! empty( $_SERVER['HTTP_HOST'] ) ) {
       $_gf_scheme = ( ! empty( $_SERVER['HTTPS'] ) && $_SERVER['HTTPS'] !== 'off' ) ? 'https' : 'http';
       define( 'WP_HOME',    $_gf_scheme . '://' . $_SERVER['HTTP_HOST'] );
       define( 'WP_SITEURL', WP_HOME . '/' );
   }
   ```
   DDEV's `wp-config-ddev.php` uses `defined('WP_HOME') || define(...)`, so this pre-definition
   wins and avoids redirect loops when accessing via the nip.io hostname.

Both `.ddev/config.yaml` and `wp-config.php` are gitignored (environment-specific).

---

## Elementor Programmatic Build Pattern

### Element ID
```php
function gf_uid() { return substr( md5( uniqid( '', true ) ), 0, 8 ); }
```
8 lowercase hex chars — matches Elementor's internal format.

### ACF Dynamic Tag
```php
function gf_tag( $tag_name, $acf_key, $acf_field, $extra = [] ) {
    $settings = array_merge( [ 'key' => "{$acf_key}:{$acf_field}" ], $extra );
    $s        = urlencode( json_encode( $settings, JSON_FORCE_OBJECT ) );
    return '[elementor-tag id="' . gf_uid() . '" name="' . $tag_name . '" settings="' . $s . '"]';
}
```

Place in `__dynamic__` → `'editor'` (text-editor), `'title'` (heading), `'image'` (image widget).

Tag names: `acf-text`, `acf-wysiwyg`, `acf-image`, `acf-url`.

### Required Post Meta
```php
update_post_meta( $post_id, '_elementor_data',      wp_slash( wp_json_encode( $elements ) ) );
update_post_meta( $post_id, '_elementor_edit_mode', 'builder' );
update_post_meta( $post_id, '_elementor_version',   '3.35.5' );
```

### Theme Builder Conditions
```php
$cond_mgr = \ElementorPro\Modules\ThemeBuilder\Module::instance()->get_conditions_manager();
$cond_mgr->save_conditions( $post_id, [ [ 'type' => 'include', 'name' => 'general', 'sub_name' => '', 'id' => '' ] ] );
```
Template type set via `_elementor_template_type` postmeta (`'header'`, `'footer'`).

---

## Shortcodes for ACF Repeaters

Elementor's Loop Builder does not support ACF repeaters. Solution: mu-plugin shortcodes that
render the repeater data as styled HTML, consumed by Elementor `shortcode` widgets.

| Shortcode | Repeater | Page |
|-----------|----------|------|
| `[gf_veteran_stories]` | veteran_stories | 13 |
| `[gf_veteran_portraits]` | veteran_portraits | 13 |
| `[gf_external_links]` | external_links | 13 |
| `[gf_headstone_grid]` | gf_headstone CPT (client-side JS filter) | 13 |
| `[gf_newsletter_button]` | newsletter_pdf file field | 13 |
| `[gf_pilgrimage_timeline]` | pilgrimages repeater | 16 |
| `[gf_pow_gallery]` | pow_camp_gallery ACF gallery | 16 |
| `[gf_2017_gallery]` | pilgrimage_2017_gallery ACF gallery | 16 |
| `[gf_commemoration_booklets]` | commemoration_booklets repeater | 16 |
| `[gf_order_form_button]` | order_form_pdf | 14 |
| `[gf_membership_form_button]` | membership_form_pdf | 15 |

---

## Verification

Playwright audit confirmed all pages rendering:
- Home: H1 "Gull Force 2/21st Battalion" (ACF dynamic tag live)
- Community: 53 headstone images, veteran stories populated
- Memorabilia: Products widget rendering
- Contact: icon-boxes with email/postal address
- Pilgrimages: timeline and gallery shortcodes filled

---

## Files Changed This Session

| File | Status |
|------|--------|
| `web/wp-content/mu-plugins/gull-force.php` | Extended — 11 shortcodes added |
| `scripts/build-header-footer.php` | New |
| `scripts/build-home-elementor.php` | New, then fixed (wp_slash) |
| `scripts/build-community-elementor.php` | New, then fixed |
| `scripts/build-memorabilia-elementor.php` | New, then fixed |
| `scripts/build-contact-elementor.php` | New, then fixed |
| `scripts/build-pilgrimages-elementor.php` | New, then fixed |
| `scripts/debug-elementor-meta.php` | New (diagnostic) |
| `scripts/debug-json.php` | New (diagnostic) |
| `.ddev/config.yaml` | Modified — nip.io FQDN (gitignored) |
| `web/wp-config.php` | Modified — dynamic WP_HOME (gitignored) |

---

## Next Session (updated 2026-02-28 — gallery session complete)

**DONE (2026-02-28):**
- `pilgrimage_2017_gallery` now has 374 images (7 curated + 367 DSC 2017 trip photos)
- `pow_camp_gallery` confirmed correct at 8 curated historical images
- Scripts: `diagnose-gallery-fields.php`, `bulk-assign-pilgrimage-gallery.php`, `diagnose-pow-gallery.php`
- See: `docs/sessions/2026-02-28-gull-force-gallery-population.md`

**Still outstanding:**
- Visual QA: verify `[gf_2017_gallery]` shortcode renders the 374-image gallery in Elementor
- Client to supply: membership form PDF, newsletter PDF, hero background images
- Populate `membership_form_pdf`, `newsletter_pdf`, `commemoration_booklets[*].file` ACF fields
- Consider: export DDEV DB snapshot for handover / staging deployment
