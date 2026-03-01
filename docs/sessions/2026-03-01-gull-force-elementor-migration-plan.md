# Session Notes — Gull Force Elementor Cloud Migration Plan

**Date:** 2026-03-01
**Project:** Gull Force Association WordPress Site
**Session type:** Migration planning + pre-migration cleanup

---

## Context

- Local DDEV site: `/home/jtaylor/gull-force-wp`, URL `http://gull-force.100.115.92.195.nip.io`
- Target: Elementor Cloud (Business plan, includes Elementor Pro)
- Migration goal: create staging environment first, verify, then push to live
- Single remaining go-live blocker: PayPal Business account (for membership payments)

---

## What Was Completed This Session (Before Migration)

### 1. Converted 5 classic-editor pages to Elementor builder mode

All pages now use the Elementor HTML widget to host shortcodes (not classic editor text blocks):

| Page | ID | Shortcode(s) |
|------|----|--------------|
| Memorials | 2650 | `[gf_statistics]`, `[gf_memorial_map height="500px"]`, `[gf_memorial_grid columns="2"]` |
| Member Login | 3926 | `[gf_member_login]` |
| Newsletters | 3934 | `[gf_newsletter_archive]` |
| Member Area | 3935 | `[gf_member_dashboard]` |
| Join | 3938 | `[gf_join]` |

Script used: `scripts/convert-classic-to-elementor.php` — already run, no need to re-run.

### 2. Full Elementor audit

All 19 content pages are now confirmed in builder mode with shortcodes in the correct widget type (HTML widget, not Shortcode widget — important for multi-shortcode pages).

### 3. Pilgrimages photo reconciliation

- `web/wp-content/uploads/gull-force/pilgrimages/` directory: 3.3 GB, 394 unique JPGs not in WP media library, 40 ARW camera-raw files (578 MB)
- Zero WP attachment records point to this directory
- Client contact sheet generated and accessible at: `http://gull-force.100.115.92.195.nip.io/wp-content/uploads/gull-force/pilgrimages-review.html`
- Decision: exclude from migration, send contact sheet to client for review
- Script: `scripts/reconcile-pilgrimages.php`

---

## Upload Size Breakdown

| Directory | Size | Include in migration? |
|-----------|------|-----------------------|
| gull-force/headstones/ | 2.8 GB | YES |
| gull-force/pilgrimages/ | 3.3 GB | NO — exclude, pending client review |
| 2026/02/ | 1.0 GB | YES |
| gull-force/images/ | 701 MB | YES |
| gull-force/documents/ | 55 MB | YES |
| gull-force/audio/ | 4.6 MB | YES |
| gull-force/newsletters/ | 8.9 MB | YES |
| **Migration total (excl. pilgrimages)** | **~4.6 GB** | |

---

## Migration Method — Two Options (Decision Needed at Start of Next Session)

### Option A: All-in-One WP Migration + Unlimited Extension

- Cost: ~$69 USD one-time
- Install plugin on DDEV, configure to exclude `gull-force/pilgrimages/`
- Export .wpress file (~4.6 GB)
- Create staging on Elementor Cloud dashboard
- Import .wpress on staging — handles URL replacement automatically
- Pros: simplest, handles search-replace automatically
- Cons: cost, upload time for 4.6 GB

### Option B: WP-CLI DB Export + SFTP Uploads (Free)

Steps:
1. `ddev wp db export /var/www/html/web/backup.sql --path=/var/www/html/web`
2. Search-replace DDEV URL in SQL: `sed -i 's/gull-force.100.115.92.195.nip.io/stg-XXXX.elementor.cloud/g' backup.sql`
3. Create staging on Elementor Cloud (get staging URL first, replace `stg-XXXX` above)
4. SFTP uploads to staging — exclude `gull-force/pilgrimages/`
5. Import SQL via phpMyAdmin on staging
6. On staging: `wp option update siteurl https://stg-XXXX.elementor.cloud`
7. On staging: `wp option update home https://stg-XXXX.elementor.cloud`
8. On staging: `wp elementor flush-css --path=/var/www/html/web`

- Pros: free, reliable, no size limit
- Cons: more manual steps, SFTP of 4.6 GB takes time

**Recommended: Option A** for simplicity unless cost is a concern.

---

## Plugins Installed (Need to Be Active on Staging)

| Plugin | Version | Status | Notes |
|--------|---------|--------|-------|
| Advanced Custom Fields Pro | 6.7.0.2 | Active | |
| Elementor | 3.35.5 | Active | Elementor Cloud includes this — verify version match post-import |
| Elementor Pro | 3.35.1 | Active | Elementor Cloud includes this — verify version match post-import |
| WooCommerce | 10.5.2 | Active | |
| Akismet | — | Inactive | Leave as-is |
| gull-force.php | — | Must-use | Auto-loads from mu-plugins dir — must be present |

Note: Elementor Cloud comes with Elementor and Elementor Pro pre-installed. The .wpress import will bring our versions; verify they match or upgrade to the Cloud version post-import.

---

## Custom Files That Must Transfer (Included in Both Migration Options)

- `web/wp-content/mu-plugins/gull-force.php` — all CPT registrations, shortcodes, member portal logic
- `web/wp-content/themes/hello-elementor/single-gf_member.php`
- `web/wp-content/themes/hello-elementor/single-gf_headstone.php`
- `web/wp-content/themes/hello-elementor/single-gf_memorial.php`
- All other hello-elementor theme files (functions.php, assets, etc.)

---

## Post-Migration Verification Checklist (Staging)

- [ ] Home page loads with correct design/fonts (Playfair Display + Source Serif 4)
- [ ] Veterans Directory page — member grid with filters loads (1191 members)
- [ ] A veteran profile page (single-gf_member.php) renders correctly
- [ ] A headstone page (single-gf_headstone.php) renders correctly
- [ ] A memorial page (single-gf_memorial.php) with Leaflet map renders
- [ ] Plaques & Memorials page — Fancybox galleries work
- [ ] Pilgrimages page — 2017 gallery and POW gallery show images
- [ ] Memorials page — statistics charts (Chart.js), world map (Leaflet), memorial grid
- [ ] Member Login page renders [gf_member_login] shortcode
- [ ] Newsletters page renders [gf_newsletter_archive] shortcode
- [ ] Member Area page renders [gf_member_dashboard] shortcode
- [ ] Join page renders [gf_join] shortcode with BACS details correct
- [ ] WooCommerce shop — 3 products visible (Lapel Pin $8, Pen $5, Stubby Holder $10)
- [ ] WooCommerce membership product — $50 AUD life membership (hidden from shop)
- [ ] BACS payment method shows CBA bank details (BSB 063-138, Acc 1020 2007)
- [ ] ACF field groups visible in admin
- [ ] Elementor Kit design tokens (colours, typography) preserved
- [ ] Further Resources bibliography page renders correctly
- [ ] Nominal Roll page — PDF attachment link works

---

## Post-Staging Tasks (Before Going Live)

1. Run member CSV import on staging:
   ```
   ddev wp eval-file scripts/import-gullforce-members-csv.php
   ```
   Source file: `scripts/gullforce-members.csv` must be present on the server (349 life members).

2. Client review of pilgrimages photos — provide `pilgrimages-review.html` contact sheet.

3. PayPal Business account setup — configure in WooCommerce > Payments.

4. Set WooCommerce live URL / payment return URLs to final domain (not staging URL).

5. Domain: confirm final custom domain for Elementor Cloud (e.g. gullforce.org.au).

6. Push staging to live via Elementor Cloud dashboard "Push to live" button.

7. Point DNS to Elementor Cloud.

8. SSL certificate auto-provisions (included in Elementor Cloud).

---

## Remaining Blocker Summary

| Blocker | Owner | Blocks |
|---------|-------|--------|
| PayPal Business account | Client | Live membership payments |
| Pilgrimages photo review | Client | Gallery completeness |
| Member CSV import | Dev (runnable now on staging) | Member accounts on live |
| Custom domain confirmation | Client | DNS cutover |

---

## Key Scripts

| Script | Status | Notes |
|--------|--------|-------|
| `scripts/reconcile-pilgrimages.php` | Complete | Photo reconciliation tool, generates contact sheet HTML |
| `scripts/convert-classic-to-elementor.php` | Already run | Do not re-run |
| `scripts/import-gullforce-members-csv.php` | Ready | Run on staging/live; reads `scripts/gullforce-members.csv` |
| `scripts/import-association-members.php` | Ready | Generic CSV import, fallback option |
| `scripts/set-bacs-details.php` | Already run | BACS confirmed set (BSB 063-138, Acc 1020 2007) |

---

## Notes

- Elementor Pro is already active on DDEV — all Pro features (Loop templates, etc.) are available on Cloud.
- CPT single templates (member/headstone/memorial) work as PHP templates on Elementor Cloud.
- To fully Elementorize CPT templates for visual editing would require Elementor Pro Theme Builder — future Phase 7 consideration.
- `gull-force/pilgrimages/` directory: DO NOT delete from DDEV until client has reviewed and confirmed photos. Archive to local HD first.
- Elementor Cloud staging: created via My Elementor dashboard > website card > Advanced > Create Staging. Gets `stg-XXXX.elementor.cloud` URL. Push to live via "Push to live" button. Pull via "Pull to staging" for reverse sync. Can be password-locked for client preview.

---

## Elementor Cloud Programmatic Capability (Confirmed Available)

| Tool | Notes |
|------|-------|
| SSH terminal | Via Elementor Cloud dashboard |
| WP-CLI | All `wp eval-file` patterns work identically |
| SFTP | Deploy mu-plugin, theme templates |
| Git integration | Push-to-deploy available |

Not available: `apt-get` / system packages, Python interpreter, direct MySQL CLI (use WP-CLI instead).

All Phase 4/5/6 WP-CLI and PHP patterns transfer without modification. Python bulk import scripts are already complete and will not be needed post-migration.
