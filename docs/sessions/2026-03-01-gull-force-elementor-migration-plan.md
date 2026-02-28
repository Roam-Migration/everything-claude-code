# Session Notes — Gull Force Elementor Cloud Migration Planning

**Date:** 2026-03-01
**Project:** Gull Force Association WordPress Site
**Session type:** Planning / strategy (no code written)

---

## Context

Site is currently running in DDEV (local, ChromeOS/Crostini). Production target is Elementor Cloud
(`vmoeoorvf.elementor.cloud`). Question: when to push, and what programmatic capability survives
the migration?

---

## Remaining Work Before Migration (~35 story points)

### Phase 5 Sprint 4 (~7pts — one session)
- `single-gf_headstone.php` — headstone detail template
- Articles & Contributions page
- Nominal Roll download page

### Phase 6: Member Portal (~28pts — four sessions)
- Sprint 1: `gf_association_member` WP role, $50 WC product, PayPal + BACS gateways, order hooks, `/member-login/` page
- Sprint 2: `gf_newsletter` CPT, newsletter archive page, member dashboard shortcode
- Sprint 3: Admin UI (user list columns + membership meta box), nav login/logout integration
- Sprint 4: Bulk import scripts — member CSV → WP users, folder of PDFs → newsletter CPT posts

**Recommended migration point: after Phase 6 Sprint 4.** Reason: Sprint 4 bulk import scripts reference local file paths (`content/images/`, member CSVs). Finish all imports in DDEV with clean data, then migrate once.

---

## Elementor Cloud Programmatic Capability

### Available
| Tool | Notes |
|------|-------|
| SSH terminal | Via Elementor Cloud dashboard |
| WP-CLI | All `wp eval-file` patterns work identically |
| SFTP | Deploy mu-plugin, theme templates |
| Git integration | Push-to-deploy available |

### Not Available
| Tool | Reason |
|------|--------|
| `apt-get` / system packages | Managed host |
| Python scripts | No interpreter installed |
| Direct MySQL CLI | Use WP-CLI for DB ops |

### What Changes vs DDEV
- Edit files locally → deploy via SFTP or git push (no direct container file editing)
- Python import scripts: already complete in Phase 4/5 — not needed post-migration
- Local file path references in PHP: all bulk imports complete before migration — not an issue

### What Stays Identical
- All `wp eval-file scripts/foo.php` patterns (via SSH)
- `gull-force.php` mu-plugin — SFTP to `wp-content/mu-plugins/`, takes effect immediately
- PHP templates (`single-gf_member.php` etc.) — SFTP to theme folder
- ACF operations, WP User management, WC operations — WP-CLI or WP admin
- Phase 6 code is pure WP/PHP, zero local file dependencies — deploys cleanly

---

## Migration Process

**Tool:** All-in-One WP Migration plugin
1. Install on DDEV site, export as `.wpress` file (DB + uploads + mu-plugins bundled)
2. Install on Elementor Cloud, import `.wpress`
3. Post-migration: update `WP_HOME` / `WP_SITEURL` to new domain (WP-CLI: `wp option update siteurl` + `wp option update home`)
4. Verify Elementor CSS regeneration: `wp elementor flush-css` (or via Elementor > Tools > Regenerate CSS)
5. Test ACF fields, WC products, member portal flow end-to-end

**Upload size limit note:** All-in-One WP Migration free version has a 512MB import limit on some hosts. Elementor Cloud may require the paid "Unlimited" extension (~$69 one-off) if the `.wpress` exceeds this. Check export size before purchasing.

---

## Notion Tasks Created
- GF migration planning task — see session closure

---

## Lessons Learned
- Elementor Cloud is a capable managed host for this use case — SSH + WP-CLI means the entire programmatic workflow transfers without friction
- The only irreplaceable local capability is Python scripting, which is already finished
- Doing all bulk data imports before migration is the right call — avoids re-running scripts with path adjustments on a live host
