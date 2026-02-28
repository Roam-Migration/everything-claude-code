# Session Learnings — Gull Force Design System

**Date:** 2026-02-28
**Repo:** gull-force-wp (master)
**Commit:** `8e3b74b` — design: implement brand typography and colour system

---

## Context

Pre-Sprint 4 design review. User identified that the site's fonts and colour scheme were inappropriate for a WWII veterans memorial organisation — particularly the typography (Inter, a tech/UI font) and the WordPress default vivid colour palette bleeding through on Elementor pages.

---

## Key Findings from UI/UX Audit

### Typography problems
- Two competing heading fonts: **Playfair Display** (custom PHP templates) vs **Cardo** (Elementor pages via WooCommerce @font-face)
- Body font: **Inter** (loaded via WooCommerce plugin assets) — designed for UI interfaces, not appropriate for memorial/historical biographical content
- System font stack as fallback — different OS rendered different fonts, no intentional typographic voice
- No font hierarchy system — sizes hardcoded across 3+ PHP files

### Colour problems
- **Hot pink link colour** (`#c36`) from Hello Elementor reset.css bleeding through all Elementor pages
- WordPress block editor vivid preset palette (red, orange, cyan, purple) appearing on Elementor pages — completely misaligned with memorial heritage purpose
- Custom PHP templates had a correct heritage palette (Navy/Gold/Maroon/Cream) but it was NOT reaching Elementor pages
- ~130 hardcoded hex values scattered across `gull-force.php` and 2 templates — no single source of truth
- No CSS custom properties / design tokens

### Root cause
Elementor's Global Kit had empty `_elementor_page_settings` — so no global fonts or colours were set. The Elementor pages defaulted to WordPress block editor presets. The custom PHP templates had their own independent colour system that never bridged to Elementor.

---

## Decisions Made

- **Body font**: Source Serif 4 (variable, self-hosted) — best readability for older audience, optical sizing, authoritative but not clinical
- **Heading font**: Playfair Display (variable, self-hosted) — already in use in custom templates, conveys heritage and authority
- **Font loading**: Self-hosted (no Google CDN) — GDPR-friendly, no external dependency
- **Architecture**: Elementor Global Kit as authoritative source; supplemental CSS as override layer for Hello Elementor defaults

---

## Implementation

### 1. Font download
- Fetched woff2 files from Google Fonts CDN (latin subset only — English content)
- 4 files, ~324K: `playfair-display-latin-{normal,italic}.woff2`, `source-serif-4-latin-{normal,italic}.woff2`
- Stored: `web/wp-content/themes/hello-elementor/assets/fonts/gull-force/`

### 2. Elementor Global Kit update (`scripts/update-elementor-kit.php`)
Run via: `ddev exec wp eval-file scripts/update-elementor-kit.php --path=/var/www/html/web`

Sets on kit post ID 11 (`get_option('elementor_active_kit')` to find the ID):
- **System colours**: Primary=Navy `#1A2744`, Secondary=Gold `#C4A35A`, Text=`#2C2C2C`, Accent=Maroon `#8B1A1A`
- **Custom colours**: Cream `#F5F0EB`, Cream-mid `#F0EBE3`, Cream-dark `#E8DFD0`, Border `#D4C9B0`, Text-muted `#5C5247`, Gold-light `#D4B870`
- **System typography**: Primary/Secondary = Playfair Display 700/600; Text/Accent = Source Serif 4 17px/13px
- **Page background**: `#F5F0EB` (cream), **Link colours**: navy / maroon hover

Generates `wp-content/uploads/elementor/css/post-11.css` with all `--e-global-*` variables.

### 3. Design system CSS (`assets/css/gull-force-design-system.css`)
Loaded via `gull-force.php` at **priority 20** (after all theme + Elementor CSS → wins cascade without `!important`).

Contents:
- `@font-face` for both fonts (unicode-range: latin)
- `--gf-*` CSS custom properties (design tokens for shortcodes/templates)
- Global overrides: body font, link colour (replaces `#c36`), page background cream
- Suppresses WordPress vivid preset colour classes
- `--e-global-*` fallback variables for non-Elementor contexts

### 4. Google Fonts blocking
```php
add_filter( 'elementor/frontend/print_google_fonts', '__return_false' );
```

### 5. Shortcode and template tokenisation
- ~130 hardcoded hex values replaced with `var(--gf-*)` in `gull-force.php`
- Both CPT templates updated (`single-gf_member.php`, `single-gf_memorial.php`)
- War history badge colours: `--gf-wh-escaped`, `--gf-wh-returned`, `--gf-wh-unknown`
- Memorial type badge colours: `--gf-mt-cemetery`, `--gf-mt-massacre`, `--gf-mt-memorial`, `--gf-mt-monument`, `--gf-mt-plaque`, `--gf-mt-garden`

---

## Design Token Reference

| Token | Value | Use |
|-------|-------|-----|
| `--gf-navy` | `#1A2744` | Primary — headings, nav, dark bg |
| `--gf-gold` | `#C4A35A` | Accent — borders, buttons, highlights |
| `--gf-maroon` | `#8B1A1A` | Secondary — sacrifice contexts, link hover |
| `--gf-cream` | `#F5F0EB` | Page background |
| `--gf-text` | `#2C2C2C` | Body text |
| `--gf-text-muted` | `#5C5247` | Captions, secondary labels |
| `--gf-border` | `#D4C9B0` | All borders and dividers |
| `--gf-font-heading` | `'Playfair Display', Georgia, serif` | All headings |
| `--gf-font-body` | `'Source Serif 4', Georgia, serif` | All body text |

---

## Critical Gotchas

- **`elementor/fonts/excluded_fonts` does NOT work** for kit typography fonts — use `elementor/frontend/print_google_fonts` → `__return_false` instead
- **WordPress 6.9+ warns** on unregistered `wp_enqueue_style` dependencies — use priority offset instead of `depends` param
- **Variable font syntax**: `font-weight: 400 700` in @font-face declares a weight *range*, not two values. Single file covers all interpolated weights.
- **Elementor kit meta**: stored as PHP array in `_elementor_page_settings`, NOT JSON. Use `update_post_meta()` directly.
- **Always clear cache** after kit update: `\Elementor\Plugin::$instance->files_manager->clear_cache()`
- **Load order matters**: design system CSS at priority 20 wins over theme reset (priority 10) via natural cascade — no `!important` needed

## CSS Load Order (final)
```
woocommerce-*-css          (priority 10)
hello-elementor-css        (priority 10) ← has #c36 link colour
elementor-frontend-css     (priority 10)
elementor-post-11-css      (priority 10) ← Global Kit colours/fonts
gf-design-system-css       (priority 20) ← our overrides WIN cascade
```

---

## Files Changed

| File | Change |
|------|--------|
| `.gitignore` | Added whitelist for `assets/css/` and `assets/fonts/gull-force/` |
| `scripts/update-elementor-kit.php` | New — Elementor Global Kit updater |
| `web/wp-content/mu-plugins/gull-force.php` | Design system enqueue, Google Fonts block, ~130 token replacements |
| `assets/css/gull-force-design-system.css` | New — tokens, @font-face, overrides |
| `assets/fonts/gull-force/*.woff2` | New — 4 self-hosted font files |
| `single-gf_member.php` | Font + colour token replacements |
| `single-gf_memorial.php` | Font + colour token replacements |
