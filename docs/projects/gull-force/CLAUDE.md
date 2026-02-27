# Gull Force — Claude Code Project Instructions

## Context

This is the Gull Force Association WordPress site project. You are populating five Elementor Pro
page templates with real historical content extracted by Python scrapers from the legacy site.

**Site URL:** vmoeoorvf.elementor.cloud
**Stack:** WordPress + Elementor Pro + ACF Pro + WooCommerce (confirm status)
**Integration:** WP-CLI for batch operations, ACF API for field population

---

## Workflow Order

Always follow this sequence for each page:

1. **Audit ACF fields** — list registered field groups and fields for the target page
2. **Review available content** — check `content/` subdirectory for scraped assets
3. **Propose mapping** — create/update `acf-mapping/<page>-mapping.md` before writing any data
4. **Get confirmation** — present mapping table to user before running WP-CLI commands
5. **Populate** — run WP-CLI / ACF API commands to populate fields
6. **Validate** — verify output matches template expectations

---

## WP-CLI Conventions

```bash
# Always specify URL for multisite safety
wp post list --url=vmoeoorvf.elementor.cloud

# Update ACF fields by post ID
wp eval 'update_field("field_key_or_name", "value", $post_id);' --url=vmoeoorvf.elementor.cloud

# Import images to media library
wp media import /path/to/image.jpg --title="Caption" --url=vmoeoorvf.elementor.cloud
```

---

## Content Sensitivity Rules

- **Member/casualty data:** 779 deaths. Never display casualty data as a count without context.
  Use language like "779 of our 1,131 members gave their lives" rather than clinical statistics.
- **Living family connections:** Some families are actively engaged. Treat all personal information
  as sensitive — do not expose contact details publicly without confirmation from the Association.
- **Contact details:** The Ambon, Indonesia office address must be verified against the Association's
  current records before populating the Contact page. Do not use legacy site data without confirmation.

---

## ACF Field Naming

- Field keys follow pattern: `field_xxxxxxxx`
- Field names (slugs) are the readable version used in `update_field()` calls
- Always confirm field key vs field name — ACF accepts both but keys are unambiguous
- Repeater fields: use array syntax `[ ['sub_field' => 'value'], ... ]`

---

## Elementor Compatibility

- **Content changes** go through ACF fields that Elementor Dynamic Tags read — do not hand-edit
  JSON in the Elementor editor UI
- **Programmatic template builds** use `wp eval-file scripts/build-*.php` — see `scripts/` for
  the proven pattern. ALWAYS wrap `wp_json_encode()` with `wp_slash()` when calling
  `update_post_meta()` — WordPress strips backslash escapes internally and corrupts JSON otherwise
- If a template section uses hard-coded text (not a dynamic tag), flag it for manual update in
  the Elementor editor rather than rebuilding the whole template
- **ACF repeaters** are not supported by Elementor Loop Builder — use `shortcode` widgets backed
  by mu-plugin shortcodes (see `gull-force.php` mu-plugin)
- **Site URL:** http://gull-force.100.115.92.195.nip.io (ChromeOS/Crostini access via nip.io)

---

## WooCommerce (Memorabilia Page)

Before populating the memorabilia carousel:
1. Confirm WooCommerce is active: `wp plugin status woocommerce --url=vmoeoorvf.elementor.cloud`
2. If inactive, stub the product data as a static ACF repeater field instead
3. Do not activate WooCommerce without user confirmation — it changes the DB schema

---

## File Locations

| Asset type       | Location                                    |
|------------------|---------------------------------------------|
| Raw scraper output | `content/scraped-raw/`                    |
| Processed images | `content/images/`                           |
| Documents/PDFs   | `content/documents/`                        |
| Member records   | `content/member-data/`                      |
| ACF mappings     | `acf-mapping/<page>-mapping.md`             |
| WP-CLI scripts   | `scripts/`                                  |
| Session notes    | `session-notes/YYYY-MM-DD-<topic>.md`       |

---

## Before Each Session

Check for new content transfers:
```bash
ls docs/projects/gull-force/content/scraped-raw/
cat docs/projects/gull-force/content/README.md
```

Review last session notes:
```bash
ls -t docs/projects/gull-force/session-notes/ | head -3
```
