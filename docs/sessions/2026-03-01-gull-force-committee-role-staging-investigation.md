# Session: Gull Force — Committee Role, Member CSV Import, Staging Investigation

**Date:** 2026-03-01
**Commit:** c97db48 (gull-force-wp)

---

## What Was Built

### 1. `gf_committee_admin` WordPress Role

A restricted administrative role for Association committee members who need to manage memberships but should not have full WordPress administrator access.

**Capabilities granted:**
- All `editor` capabilities (post news, manage media, manage categories)
- `list_users`, `edit_users`, `create_users` — member management
- `gf_view_newsletters` — full member area access (as a member themselves)
- `gf_manage_members` — custom cap used as guard on membership metabox

**Admin menu restrictions** (`admin_menu` hook, priority 999):
- Appearance, Plugins, Tools, Settings, ACF admin all removed for this role

**Login behaviour:**
- Lands in wp-admin (not `/member-area/`) — the `login_redirect` filter now excludes `gf_manage_members` users from the member redirect

**Membership metabox:**
- Both `gf_render_membership_metabox()` and `gf_save_membership_metabox()` now accept `gf_manage_members` alongside `manage_options` — committee members can read AND write membership fields

**To create a committee user:**
1. WP Admin → Users → Add New
2. Set role to "Gull Force Committee"
3. User receives wp-admin access with restricted menu

---

### 2. Member CSV Import Script (`scripts/import-gullforce-members-csv.php`)

Reads the existing `gullforce-members.csv` (Association's Access database export, 843 rows) and imports all Association members as WP users.

**CSV source:** `docs/projects/gull-force/content/member-data/gullforce-members.csv` in the ECC repo (not committed to gull-force-wp; copy to `scripts/gullforce-members.csv` before running)

**Filter criteria:**
- `Relationship` column does NOT start with "Veteran" (excludes WWII servicemen — 362 rows)
- `email` column is non-empty and valid
- Result: ~349 importable rows, all with `Membership = Life`

**Field mapping:**
| CSV Column | WP Field |
|-----------|---------|
| `FirstName` | `first_name` |
| `LastName` | `last_name` |
| `email` | `user_email`, `user_login` |
| `Updated` (M/D/YY HH:MM:SS) | `gf_membership_joined` |
| `Address` + `City` + `StateOrProvince` + `PostalCode` | `gf_postal_address` |
| `Relationship` | `gf_relationship` |
| `Membership` | `gf_admin_notes` (preserved as note) |

**To run:**
```bash
cp /home/jtaylor/everything-claude-code/docs/projects/gull-force/content/member-data/gullforce-members.csv \
   /home/jtaylor/gull-force-wp/scripts/gullforce-members.csv

cd /home/jtaylor/gull-force-wp
sg docker -c "ddev exec wp eval-file scripts/import-gullforce-members-csv.php --path=/var/www/html/web"
```

**Idempotent** — safe to re-run. Existing users updated (name/meta), not recreated.

---

## Staging Site Investigation

### Elementor Cloud Staging

The production target (`vmoeoorvf.elementor.cloud`) is on Elementor Hosting.

**Staging availability:**
- **Business plan and above** → built-in staging environment
- Grow/Scale plans → "Clone" only (separate site, not linked staging)

**How to use:**
1. My Elementor dashboard → click website card → **Advanced** → **Create Staging**
2. Staging URL: `stg-XXXX.elementor.cloud`
3. Password-lockable for client preview before launch
4. Sync options:
   - **Push to live** — deploys staging → production
   - **Pull to staging** — refreshes staging from current live site

**Recommended workflow for Gull Force launch:**
```
Local DDEV  →  All-in-One WP Migration export (.wpress)
            →  Import to Elementor Cloud staging (stg-XXXX.elementor.cloud)
            →  Client review + final testing on staging
            →  PayPal gateway test transaction
            →  "Push to live" → production (vmoeoorvf.elementor.cloud)
            →  Update siteurl/home options + flush Elementor CSS
```

**Action required before staging:** Check the Elementor Cloud account plan tier. If on Starter plan, staging is not available — consider upgrading to Business or using All-in-One WP Migration directly to production with a maintenance mode window.

### Alternative: All-in-One WP Migration Directly to Production

If the current Elementor plan doesn't support staging:
1. Install All-in-One WP Migration on local DDEV site
2. Export as `.wpress` file (note: free tier limits to 512MB; site is likely under this)
3. Import to `vmoeoorvf.elementor.cloud` via the plugin's import function
4. Post-import: `wp option update siteurl https://vmoeoorvf.elementor.cloud`
5. Post-import: `wp option update home https://vmoeoorvf.elementor.cloud`
6. Post-import: `wp elementor flush-css`

---

## Remaining Before Go-Live

| Item | Status | Action |
|------|--------|--------|
| PayPal Business account | Waiting for client | Client creates account; configure WC PayPal Payments plugin |
| Member CSV import | Ready | Run `import-gullforce-members-csv.php` after client confirms data is current |
| Newsletter public/private split | Defaulted to member-only | Client decision — change `newsletter_member_only` per issue if needed |
| Store address (WC) | N/A — online-only portal | No physical address required |
| Elementor Cloud staging | Investigate plan tier | See above |
| Elementor Cloud migration | After PayPal | Use All-in-One WP Migration |
| Post-migration: siteurl/home | After migration | WP-CLI update + elementor flush-css |
| Send password resets to imported members | After import | WP Admin → Users → select all → Send password reset |

---

## Technical Notes

### Why `gf_manage_members` Cap Instead of `manage_options`

The existing membership metabox used `manage_options` as its write guard, conflating "site administrator" with "can manage members." By introducing `gf_manage_members` as a custom capability, committee members get precisely scoped write access without needing site admin privileges. This is the standard WP pattern for custom admin interfaces.

### Committee Role Admin Menu Pruning

WordPress doesn't automatically hide menu items based on capability — it shows everything the user has any cap to access. The `admin_menu` hook at priority 999 (after WP's default priority 10) explicitly calls `remove_menu_page()` for items that would otherwise show. The priority 999 ensures custom plugins haven't re-added items after the default rendering.

### CSV Date Parsing

The `Updated` field uses M/D/YY format (`07/29/09 00:00:00`). PHP's `date_create_from_format('n/j/y', ...)` handles 2-digit years correctly: 00–68 → 2000–2068, 69–99 → 1969–1999. All records in the dataset are post-2000, so no ambiguity.
