# Session Notes — Gull Force SiteGround Migration

**Date:** 2026-03-03
**Project:** Gull Force Association WordPress Site
**Session type:** Production migration to SiteGround

---

## What Was Completed This Session

### 1. Migration method decision
- Option A (All-in-One WP Migration) selected
- Unlimited Extension purchased and installed
- ACF Pro zip also installed/updated (force overwrite)

### 2. Plugin installs on DDEV
- `all-in-one-wp-migration` v7.102 installed from WP.org
- `all-in-one-wp-migration-unlimited-extension` v2.82 installed from local zip
- `advanced-custom-fields-pro` v6.7.0.2 updated via --force

### 3. Hosting platform clarification
- Elementor Pro Advanced Solo (A-S02727353) = plugin licence only, NOT Elementor Cloud hosting
- Elementor Cloud staging workflow does not apply
- SiteGround purchased as hosting platform

### 4. Backup strategy — split migration
- Initial 8 GB full backup generated (includes media) — too large for browser upload on non-fibre
- New 210 MB backup created with `--exclude-media` flag — uploads in minutes
- Pilgrimages excluded via temp directory rename before backup

### 5. WP-CLI backup commands used
```bash
# Full backup (8GB — kept for reference)
sg docker -c "ddev exec wp ai1wm backup --exclude-spam-comments --exclude-post-revisions --exclude-cache --exclude-inactive-themes --path=/var/www/html/web"

# Media-excluded backup (210MB — used for import)
sg docker -c "ddev exec wp ai1wm backup --exclude-media --exclude-spam-comments --exclude-post-revisions --exclude-cache --exclude-inactive-themes --path=/var/www/html/web"
```

### 6. SiteGround setup
- Site URL: https://jacksont.sg-host.com
- WordPress installed via "Start new website" (not migrate)
- All-in-One WP Migration + Unlimited Extension installed on SiteGround
- 210 MB .wpress imported successfully via WP Admin > AIOWPM > Import

### 7. SSH key authentication for SiteGround
- Generated: `/home/jtaylor/.ssh/siteground_gullforce` (ed25519)
- Public key added to SiteGround Site Tools > Devs > SSH Keys Manager
- Connection: `ssh -i /home/jtaylor/.ssh/siteground_gullforce -p 18765 u2316-1fi6cxp40agu@ssh.jacksont.sg-host.com`
- WordPress root: `/home/u2316-1fi6cxp40agu/www/jacksont.sg-host.com/public_html/`

### 8. Media transfer via rsync
- 13,591 files, 4.46 GB transferred
- Excluded: `gull-force/pilgrimages/` (client review pending)
- Command used:
```bash
rsync -avz --progress \
  -e "ssh -i /home/jtaylor/.ssh/siteground_gullforce -p 18765 -o StrictHostKeyChecking=no" \
  --exclude='gull-force/pilgrimages*' \
  /home/jtaylor/gull-force-wp/web/wp-content/uploads/ \
  u2316-1fi6cxp40agu@ssh.jacksont.sg-host.com:~/www/jacksont.sg-host.com/public_html/wp-content/uploads/
```

### 9. Post-import verification (via WP-CLI on SiteGround)
| Content | Count |
|---------|-------|
| gf_member | 1,191 |
| gf_headstone | 607 |
| gf_memorial | 8 |
| Pages | 25 |
| Posts | 5 |
| WC Products | 9 |

### 10. Elementor Pro activated on SiteGround
- Licence activated via WP Admin
- `wp elementor flush-css` run after activation

### 11. Member CSV import
- Script + CSV copied to SiteGround, run via WP-CLI, cleaned up after
- Result: 324 created, 6 updated, 503 skipped, 0 errors
- Member numbers: GF-0001 through GF-0324

### 12. Disk quota issue resolved
- SiteGround quota exceeded (106%) due to failed 8GB upload attempt
- AIOWPM stored partial .wpress in `wp-content/plugins/all-in-one-wp-migration/storage/`
- Two temp files deleted: ~5.8 GB freed
- Quota restored to normal

---

## SiteGround Connection Details

| Field | Value |
|-------|-------|
| URL | https://jacksont.sg-host.com |
| SSH host | ssh.jacksont.sg-host.com |
| SSH port | 18765 |
| SSH user | u2316-1fi6cxp40agu |
| SSH key | /home/jtaylor/.ssh/siteground_gullforce |
| WP root | /home/u2316-1fi6cxp40agu/www/jacksont.sg-host.com/public_html/ |

---

## Remaining Tasks Before Go-Live

| Task | Owner | Notes |
|------|-------|-------|
| PayPal Business account | Client | Configure in WooCommerce > Payments |
| Custom domain | Client | e.g. gullforce.org.au |
| DNS cutover to SiteGround | Dev | After domain confirmed |
| Password reset emails to 324 members | Dev | WP Admin > Users bulk action |
| Pilgrimages photo review | Client | Contact sheet at jacksont.sg-host.com/wp-content/uploads/gull-force/pilgrimages-review.html |

---

## Key Lessons

- **All-in-One WP Migration temp storage**: after any import, check and delete `wp-content/plugins/all-in-one-wp-migration/storage/` — can accumulate GBs from failed/completed imports
- **Split migration pattern**: `--exclude-media` backup (small, fast) + rsync for media is the correct approach for large sites on slow connections
- **Elementor Pro ≠ Elementor Cloud**: Pro is a plugin licence; Cloud is a separate hosted product
- **SiteGround SSH**: requires key auth (no password SSH). Generate key locally, add public key via Site Tools > Devs > SSH Keys Manager
