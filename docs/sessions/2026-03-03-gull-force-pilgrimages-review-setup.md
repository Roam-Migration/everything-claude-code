# Session Notes — Gull Force Pilgrimages Review Setup

**Date:** 2026-03-03
**Project:** Gull Force Association WordPress Site
**Session type:** Bug investigation + local dev fix

---

## What Was Completed This Session

### 1. Pilgrimages photo status investigation

Confirmed full picture of why pilgrimage photos were broken on SiteGround:

| Environment | ACF gallery data | Image files | Result |
|-------------|-----------------|-------------|--------|
| DDEV (local) | `pilgrimage_2017_gallery`: 374 IDs, `pow_camp_gallery`: 8 IDs | Present in `gull-force/pilgrimages/` | Working — images serve 200 |
| SiteGround | Same attachment IDs (migrated via .wpress) | Directory excluded from rsync | Broken — all images 404 |

The root cause on SiteGround: the `gull-force/pilgrimages/` directory was excluded from the rsync migration pending client review. The DB has all attachment records pointing to those paths, but the files don't exist on disk.

### 2. Fixed DDEV URL mismatch for ChromeOS

**Problem:** `wp-config-ddev.php` hardcodes `WP_HOME` to `https://gull-force.ddev.site`. From Chrome on ChromeOS, `.ddev.site` resolves to `127.0.0.1` (ChromeOS loopback), not the Linux container. The page HTML loads via nip.io, but all asset URLs reference `.ddev.site` → 404 on CSS/JS/images → site appears completely broken.

**Fix:** Added dynamic `WP_HOME` definition to `web/wp-config.php` in the custom values section, before the DDEV settings include:

```php
if ( ! defined( 'WP_HOME' ) && isset( $_SERVER['HTTP_HOST'] ) && ! empty( $_SERVER['HTTP_HOST'] ) ) {
    $scheme = ( ! empty( $_SERVER['HTTPS'] ) && $_SERVER['HTTPS'] !== 'off' ) ? 'https' : 'http';
    define( 'WP_HOME', $scheme . '://' . $_SERVER['HTTP_HOST'] );
}
```

`wp-config-ddev.php` uses `defined('WP_HOME') || define(...)` — the guard means our definition wins if set first. WP-CLI is unaffected (no `HTTP_HOST` in CLI context → falls through to DDEV's hardcoded value).

Also removed the `#ddev-generated` comment from `wp-config.php` so DDEV won't overwrite the file.

**Note:** `wp-config.php` is gitignored — this change lives only in the local DDEV environment. If DDEV regenerates `wp-config.php`, this fix will need to be re-applied.

### 3. Created public pilgrimage photo review page

Created WP page (ID 3963, slug `pilgrimage-review`, no login required) with:
- Brief instructions for the client (which gallery each photo should go in)
- Button linking to the contact sheet at `/wp-content/uploads/gull-force/pilgrimages-review.html`

**URL:** `http://gull-force.100.115.92.195.nip.io/pilgrimage-review/`

Decided against a WP Admin bar link — DDEV is a staging environment, a simple public page is sufficient.

---

## Outstanding — Pilgrimages on SiteGround

The `gull-force/pilgrimages/` directory (3.3 GB, ~394 JPGs + 40 ARW camera-raw files) still needs to be rsync'd to SiteGround once the client has reviewed the contact sheet.

When client review is complete:
```bash
rsync -avz --progress \
  -e "ssh -i /home/jtaylor/.ssh/siteground_gullforce -p 18765 -o StrictHostKeyChecking=no" \
  --exclude='*.ARW' \
  /home/jtaylor/gull-force-wp/web/wp-content/uploads/gull-force/pilgrimages/ \
  u2316-1fi6cxp40agu@ssh.jacksont.sg-host.com:~/www/jacksont.sg-host.com/public_html/wp-content/uploads/gull-force/pilgrimages/
```

`--exclude='*.ARW'` drops the 40 camera-raw files (~578 MB) — web-unusable. ~2.7 GB transfer.

---

## Key Lessons

- **DDEV + ChromeOS**: `wp-config.php` custom section (before `require_once($ddev_settings)`) is the right place for a dynamic `WP_HOME` override. Removes the `#ddev-generated` marker to prevent DDEV overwriting.
- **DDEV staging**: Don't over-engineer for a local staging env. A plain public WP page is simpler than WP Admin hooks.
- **wp-config.php is gitignored** in this Bedrock-style setup — document local-only config changes in session notes.
