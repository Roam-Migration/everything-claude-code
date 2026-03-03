# Session — Gull Force P2 Verification + P3 Caching

**Date:** 2026-03-03
**Site:** https://jacksont.sg-host.com (SiteGround production)
**Scope:** Post-migration verification pass (P2) + SG Optimizer caching (P3)

---

## What Was Done

### P1 — Audio Embedding (Memorials page)

Three audio files (IDs 3954–3956, confirmed on SiteGround) injected into Memorials
page (ID 2650) as a new Elementor HTML widget section between the memorial map
and the memorial grid.

Script: `gull-force-wp/scripts/add-audio-section.php`

Injection approach: decode `_elementor_data`, `array_splice()` after map section,
re-encode with `wp_slash(wp_json_encode())`, flush Elementor CSS cache.

Result: `<audio controls>` elements for Last Post, Ambon Last Post, Rouse —
visible at http://jacksont.sg-host.com/memorials/

---

### P2 — Post-Migration Verification Pass

All items checked. Results:

| Item | Status | Notes |
|------|--------|-------|
| Header/footer Elementor conditions | PASS | `include/general` intact on both templates |
| Self-hosted fonts (Playfair Display + Source Serif 4) | PASS | Files at `assets/fonts/gull-force/`, CSS at `assets/css/gull-force-design-system.css` |
| Google Fonts blocked | PASS | `elementor/frontend/print_google_fonts` returns false |
| ACF Pro | PASS | Active, 10 field groups present |
| Chart.js statistics (memorials) | PASS | CDN loading, shortcode renders stat cards |
| Leaflet memorial map | PASS | Tiles, markers, filter buttons all in page source |
| Fancybox | PASS | CSS + JS from jsdelivr CDN loading |
| WC pages | PASS | shop=6, cart=7, checkout=8, myaccount=9 |
| BACS bank details | PASS | Commonwealth Bank, BSB 063-138, Acc 1020 2007 |
| WC products | PASS | 9 products (3 merch + life membership + 5 others) |
| Member portal pages | PASS | 3926/3934/3935/3938 all published |
| MU-plugin | PASS | 140KB, active, all shortcodes registered |
| Audio (P1 result) | PASS | 3 `<audio>` elements in memorials page HTML |

**Key discovery — WP-CLI path on SiteGround:**

SiteGround exposes `/home/customer/` as the PHP runtime home dir, but SSH resolves
to `/home/u2316-1fi6cxp40agu/`. WooCommerce's Jetpack autoloader caches absolute
paths at activation time (via web = `/home/customer/`). If WP-CLI is called with the
SSH path (`--path=/home/u2316-1fi6cxp40agu/www/...`), WC's autoloader fails with a
fatal on `FeaturePluginCompatibility.php`.

**Always use the customer path for WP-CLI on this account:**
```bash
wp --path=/home/customer/www/jacksont.sg-host.com/public_html/
```

The frontend is unaffected — Apache/PHP-FPM consistently resolves `/home/customer/`.

---

### P3 — SiteGround Caching Configuration

`sg-cachepress` was installed but inactive. Activated and configured before any
pages could be incorrectly cached.

Script: `gull-force-wp/scripts/configure-sg-optimizer.php`

**Settings applied:**

| Setting | Value |
|---------|-------|
| Page cache | ON (was default-on at activation) |
| Auto-flush on publish | ON |
| Gzip compression | ON |
| Browser caching headers | ON |
| URL exclusions | 9 paths (see below) |
| HTML/JS/CSS minification | OFF (test before enabling) |
| WebP conversion | OFF (quality preservation for archival images) |

**Excluded URLs** (verified `X-Cache-Enabled: False` via curl):
```
/member-login/
/member-area/
/newsletters/
/join/
/cart/
/checkout/
/my-account/
/wp-admin/
/wp-login.php
```

**Verified:**
- Homepage → `X-Cache-Enabled: True` (caching active)
- All 6 member/WC pages → `X-Cache-Enabled: False` (bypassing cache)
- Cache engine: `X-Proxy-Cache-Info: DT:1` (SiteGround Dynamic Cache)

---

## Outstanding

### P4 — Elementor Conditions
Confirmed intact during P2. No action needed.

### P5 — WooCommerce PayPal
Still client-blocked. Client needs to provide PayPal Business account credentials.
No code changes needed once configured — BACS guard is already in place.

### P6 / Phase 7 — CPT → Elementor Theme Builder
See handover notes. Not scheduled.

---

## Next Session Handover

See: `docs/sessions/2026-03-03-gull-force-next-session-handover.md`

---

## Key Files Changed This Session

| File | Change |
|------|--------|
| `gull-force-wp/scripts/add-audio-section.php` | New — Elementor injection for audio |
| `gull-force-wp/scripts/configure-sg-optimizer.php` | New — SG Optimizer configuration |
| Memorials page (ID 2650) `_elementor_data` | +1 section (audio HTML widget) |
| WP options (sg-cachepress) | Plugin activated + 9 URL exclusions + gzip + browser cache |
