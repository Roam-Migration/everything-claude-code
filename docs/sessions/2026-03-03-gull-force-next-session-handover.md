# Handover — Gull Force WP: Post-Migration Complete

**Date:** 2026-03-03
**Site:** https://jacksont.sg-host.com (SiteGround production)
**Status:** P1–P4 complete. Site fully verified and operational.

---

## Current State

| Item | Status |
|------|--------|
| SiteGround migration | Complete |
| P1 Audio embedding | Complete — 3 audio players on /memorials/ |
| P2 Post-migration verification | Complete — all items pass |
| P3 SG Optimizer caching | Complete — exclusions set, cache active |
| P4 Elementor header/footer conditions | Confirmed intact — no action needed |
| P5 WooCommerce PayPal | Blocked — awaiting client PayPal Business account |
| P6 CPT → Elementor Theme Builder | Parked — Phase 7 scope |

---

## Connection Details

```
SSH:    ssh -i ~/.ssh/siteground_gullforce -p 18765 u2316-1fi6cxp40agu@ssh.jacksont.sg-host.com
WP root (filesystem/SCP): /home/u2316-1fi6cxp40agu/www/jacksont.sg-host.com/public_html/
WP root (WP-CLI --path):  /home/customer/www/jacksont.sg-host.com/public_html/

CRITICAL: Always use the /home/customer/ path for WP-CLI.
          The SSH filesystem path (/home/u2316-1fi6cxp40agu/) breaks the WooCommerce
          Jetpack autoloader — WC has its file path cache baked in as /home/customer/.
          Use /home/u2316-1fi6cxp40agu/ only for scp and filesystem operations (ls, find).

Local repo:    /home/jtaylor/gull-force-wp
Script pattern: scp script to /home/u2316-1fi6cxp40agu/www/.../script.php
                wp eval-file /home/customer/www/.../script.php --path=/home/customer/www/...
                rm (cleanup)
```

---

## Immediate Priorities

### P5 — WooCommerce PayPal (Client-blocked)

No code changes required. When client provides PayPal Business account:
1. WP Admin > WooCommerce > Payments > PayPal (Standard or Payments)
2. Set email to business account
3. Enable sandbox, test with $1 product
4. Enable live — `woocommerce_order_status_completed` hook already handles auto-approval

Note: PayPal skips `on-hold` → goes straight to `completed`. The BACS guard
(`$order->get_payment_method() === 'bacs'`) on the `on-hold` hook is already in
place. No code changes needed.

---

### P6 — CPT → Elementor Theme Builder (Phase 7, dedicated session)

**What it means:** Convert the three raw PHP single templates into visual Elementor
Theme Builder templates, so the client can edit veteran/headstone/memorial pages
without touching PHP.

**Current state:** Three PHP templates in `hello-elementor` theme:
- `single-gf_member.php` — veteran profile (portrait hero, war history, service photos, related memorials)
- `single-gf_headstone.php` — headstone + CWGC panel + related records grid
- `single-gf_memorial.php` — memorial + Fancybox photo gallery

**Conversion approach:**
1. Elementor Pro Theme Builder → create "Single Post" template → set CPT condition
2. Replace PHP `get_field()` calls with Elementor ACF Dynamic Tags
3. Replace PHP `foreach` grids (service photos, related memorials) with Elementor Loop Builder + Loop Item templates
4. Custom logic (e.g. date_of_death label switching on `source` + `war_history`) needs to become a registered shortcode or custom Dynamic Tag — cannot be expressed in Elementor visually

**Prerequisites:** Both Elementor Pro and ACF Pro are already active and licensed.

**Scope:** Full dedicated session. Map each PHP template to Elementor blocks before
starting. The existing PHP templates are the spec.

**Risk:** High. Loop Builder is complex. ACF relationship fields (related memorials,
tagged photos) require Loop Builder with custom query. Until fully replaced and
tested, keep PHP templates as fallback.

---

## Site Quick Reference

### Pages (IDs preserved from DDEV)

| Page | ID | Slug | Shortcode(s) |
|------|----|------|--------------|
| Home | 12 | `/` | — |
| Memorials | 2650 | `/memorials/` | `[gf_statistics]` `[gf_memorial_map]` `[gf_memorial_grid]` |
| Veterans Directory | 2554 | `/veterans-directory/` | `[gf_member_grid]` |
| Veteran Photos | 2569 | `/veteran-photos/` | `[gf_photo_gallery]` |
| Plaques & Memorials | 2610 | `/plaques-memorials/` | `[gf_headstone_grid]` |
| Nominal Roll | 3922 | `/nominal-roll/` | — |
| Member Login | 3926 | `/member-login/` | `[gf_member_login]` |
| Newsletters | 3934 | `/newsletters/` | `[gf_newsletter_archive]` |
| Member Area | 3935 | `/member-area/` | `[gf_member_dashboard]` |
| Join | 3938 | `/join/` | `[gf_join]` |

### WooCommerce Pages

| Page | ID | Slug |
|------|----|------|
| Shop | 6 | `/shop/` |
| Cart | 7 | `/cart/` |
| Checkout | 8 | `/checkout/` |
| My Account | 9 | `/my-account/` |

### Key IDs

| Item | ID |
|------|----|
| Elementor Kit | 11 |
| GF Header template | 2141 |
| GF Footer template | 2143 |
| Life Membership product | 3925 (SKU: gf-life-membership, $50 AUD) |
| Audio: Last Post | 3954 |
| Audio: Ambon Last Post | 3955 |
| Audio: Rouse | 3956 |

---

## Caching Configuration

SG Optimizer (sg-cachepress 7.7.7) active with:
- Page cache: ON | Auto-flush: ON | Gzip: ON | Browser caching: ON
- HTML/JS/CSS minification: OFF (test before enabling)
- WebP: OFF (archival image quality)
- Excluded: `/member-login/`, `/member-area/`, `/newsletters/`, `/join/`, `/cart/`, `/checkout/`, `/my-account/`, `/wp-admin/`, `/wp-login.php`

To enable JS/CSS minification later (test each separately):
```bash
wp option update siteground_optimizer_optimize_javascript 1 --path=/home/customer/www/...
wp option update siteground_optimizer_optimize_css 1 --path=/home/customer/www/...
```

---

## Outstanding Client Actions

| Item | Owner | Notes |
|------|-------|-------|
| PayPal Business account | Client | Needed to activate WC PayPal gateway |
| Custom domain (gullforce.org.au or similar) | Client | DNS cutover to SiteGround when ready |
| Pilgrimages photo review | Client | Contact sheet: `/wp-content/uploads/gull-force/pilgrimages-review.html` |
| Password reset for 324 members | Client/Dev | WP Admin > Users > bulk send password reset |

---

## Not Blocking Go-Live

- P6 CPT → Elementor Theme Builder — Phase 7
- bbPress forum / committee meeting notes — Phase 7
- 1983 pilgrimage participants — manual historical research
- Audio not yet embedded on individual memorial single pages (only on /memorials/)

---

## Key Files Reference

| File | Location |
|------|----------|
| mu-plugin | `web/wp-content/mu-plugins/gull-force.php` |
| Member template | `web/wp-content/themes/hello-elementor/single-gf_member.php` |
| Headstone template | `web/wp-content/themes/hello-elementor/single-gf_headstone.php` |
| Memorial template | `web/wp-content/themes/hello-elementor/single-gf_memorial.php` |
| Design system CSS | `web/wp-content/themes/hello-elementor/assets/css/gull-force-design-system.css` |
| Font files | `web/wp-content/themes/hello-elementor/assets/fonts/gull-force/` |
| Audio injection script | `scripts/add-audio-section.php` |
| SG Optimizer config script | `scripts/configure-sg-optimizer.php` |

---

## Reference Sessions

- `docs/sessions/2026-03-03-gull-force-p2-p3-verification.md` — this session
- `docs/sessions/2026-03-03-gull-force-wp-elementor-handover.md` — previous handover (pre-verification)
- `docs/sessions/2026-03-03-gull-force-siteground-migration.md` — migration details
- `docs/sessions/2026-03-01-gull-force-phase6-sprint4.md` — member portal final sprint
