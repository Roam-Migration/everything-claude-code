# Session: Gull Force — Member Database & Phase 1 Pages

**Date:** 2026-02-28
**Repos:** gull-force-wp (master), everything-claude-code
**Scope:** Full Phase 1 implementation — `gf_member` CPT, CSV import, headstone expansion, headstone linking, three new pages.

---

## What Was Accomplished

### Phase 0 — Headstone Expansion (53 → 607)
- Existing `import-headstones.php` re-run after headstone photos placed in uploads
- Result: 607 headstone posts (was 53). Script processes ~6,684 files in uploads dir including WP thumbnail variants — script correctly skips non-source files via naming filter.

### gf_member CPT — Full Implementation
**`web/wp-content/mu-plugins/gull-force.php`** — added:
- `gf_member` CPT registration (slug: `member`, public, REST-enabled, dashicons-groups)
- `[gf_member_directory]` shortcode — searchable/filterable grid with client-side JS (name + war_history + unit filters, data attributes on each card)
- `[gf_member_card id=""]` shortcode — full profile panel

**`scripts/create-member-fields.php`** — ACF field group `group_gf_member`:
- Service record: `service_number`, `member_rank`, `member_surname`, `member_given_names`, `member_initials`, `member_unit` (select), `war_history` (select)
- Dates/location: `date_of_birth`, `date_of_death` (text — "D Month YYYY"), `place_of_birth`, `cemetery`, `cemetery_plot`
- Relationship: `headstone_link` (ACF relationship → `gf_headstone`, max 1)
- Geolocation: `birthplace_lat` (number), `birthplace_lng` (number), `birthplace_label` (text)
- Media: `portrait_photo` (image), `service_photos` (gallery)
- Rich content: `biography` (wysiwyg), `post_war_story` (wysiwyg), `member_documents` (repeater), `family_stories` (repeater), `sources` (repeater)
- Admin: `legacy_id` (number), `membership_type` (text), `record_verified` (true_false)

### CSV Import (362 veterans)
**`scripts/import-members.php`** — key decisions:
- Filter: `Relationship` field starts with `'Veteran'` — excludes 465 non-veteran relatives
- Does NOT import: address, city, email, phone, payment history (private)
- `gf_parse_unit()`: strips "Veteran " prefix + birth date suffix, normalises unit names (A Coy, B Coy, HQ Coy, BHQ, 2/21 Bn, etc.)
- `gf_normalise_war_history()`: maps Ambon/Hainan/Escaped/RTA, `'?'` → `'Unknown'`; blank passes through
- `gf_parse_date()`: "MM/DD/YYYY 00:00:00" → "D Month YYYY"
- Post title: "Surname, Given Names" for alphabetical admin sorting
- Idempotent: matches existing by `legacy_id` postmeta
- Result: **362 veterans created**

### Headstone Linking
**`scripts/link-member-headstones.php`** — exact match only:
- Index: `strtolower(surname) . '|' . strtolower(initials)` → post_id
- Result: **0 matches** — this is CORRECT (see Key Learnings below)
- Surname-only fallback was removed after producing 74 false positives in a prior run

**`scripts/clear-headstone-links.php`** — created to undo the 74 false surname-only links:
- Iterates all `gf_member` posts, clears `headstone_link` field if set
- Result: Cleared 74 posts. Separate script required because `wp eval` inline code with `$pid` causes bash to expand the variable before WP-CLI receives it.

### Three Phase 1 Pages Built

| Script | Page | ID | URL |
|--------|------|----|-----|
| `build-veterans-directory-elementor.php` | Veterans Directory | 2554 | `/veterans-directory/` |
| `build-battalion-history-elementor.php` | 2/21st Battalion History | 2556 | `/battalion-history/` |
| `build-1-21bn-history-elementor.php` | 1/21st Battalion History | 2558 | `/1-21st-battalion/` |

Layout pattern: dark navy hero → alternating cream/white content sections → dark navy closing section.
Content sourced directly from legacy HTML files in `content/legacy-site/`.

---

## Key Learnings

### 1. CSV veterans ≠ headstone population (expect 0 exact matches)
The `gullforce-members.csv` is the **Association membership list** — it records survivors who joined the association after the war. The `gf_headstone` CPT represents **the Ambon War Cemetery** — those who died at Ambon.

These are different populations. When `link-member-headstones.php` returns 0 matches, that is **correct**. Do not add a surname-only fallback to "improve" the match rate — any surname match across these two populations is a false positive.

The `headstone_link` relationship field is the right architecture for a future full nominal roll import (all 1,131 men), but the current 362 CSV veterans will always return 0 headstone links.

### 2. Always write a companion clear/undo script for bulk-update operations
When `link-member-headstones.php` was run with a surname-only fallback, it created 74 false links across 74 posts. A companion `clear-headstone-links.php` script was needed to undo this. Pattern: any script that bulk-updates ACF relationship fields should have a corresponding clear/reset script.

### 3. WP-CLI path flag required for DDEV
The gull-force-wp docroot is `web/` — WP core is at `web/wp-load.php`. WP-CLI must be told this explicitly:
```bash
ddev exec wp eval-file /var/www/html/scripts/script.php --path=/var/www/html/web
```
Without `--path`, WP-CLI searches the repo root and prints "This does not seem to be a WordPress installation".

### 4. `wp eval` inline PHP cannot use `$variable` safely from shell
When running `wp eval 'update_field("headstone_link", [], $pid);'`, bash expands `$pid` to an empty string before WP-CLI receives it. For any bulk operation using PHP variables, write a `.php` script and use `wp eval-file`.

### 5. Hardcoded HTML in Elementor text-editor vs ACF dynamic tags
For static historical narrative content, hardcoding HTML directly into Elementor `text-editor` widget `editor` settings is simpler than ACF dynamic tags:
- No ACF field group registration required in the build script
- Content is immediately visible in Elementor editor
- No `gf_tag()` / `__dynamic__` plumbing needed
- ACF dynamic tags are worth the complexity only for content that needs a separate WP admin edit interface (e.g., the Community page's `battalion_history` field)

---

## Deployment Sequence (full Phase 1)

```
1. ddev exec wp eval-file /var/www/html/scripts/create-member-fields.php --path=/var/www/html/web
2. [Copy CSV] cp ~/everything-claude-code/docs/.../gullforce-members.csv ~/gull-force-wp/scripts/gullforce-members.csv
3. ddev exec wp eval-file /var/www/html/scripts/import-members.php --path=/var/www/html/web
4. [Phase 0 — headstone expansion to 607, run import-headstones.php]
5. ddev exec wp eval-file /var/www/html/scripts/link-member-headstones.php --path=/var/www/html/web
   → expect: 0 matches (correct)
6. ddev exec wp eval-file /var/www/html/scripts/build-veterans-directory-elementor.php --path=/var/www/html/web
7. ddev exec wp eval-file /var/www/html/scripts/build-battalion-history-elementor.php --path=/var/www/html/web
8. ddev exec wp eval-file /var/www/html/scripts/build-1-21bn-history-elementor.php --path=/var/www/html/web
```

---

## Phase 2 Next Steps

- Upload ~478 named veteran portrait JPEGs via WP Media Library → link to `portrait_photo` ACF field on each `gf_member` post (images in `content/images/`)
- Build Veteran Photos page (`[gf_veteran_portraits]` shortcode — not yet implemented)
- Build Plaques & Memorials page + `gf_memorial` CPT
- Integrate `[gf_member_directory]` and `[gf_member_card]` shortcodes into The Men nav section
- Nav redesign (Phase 3): 7-item nav per UI-UX-ANALYSIS.md

---

## Files Created/Modified This Session

**gull-force-wp:**
- `web/wp-content/mu-plugins/gull-force.php` — added `gf_member` CPT + 2 shortcodes
- `scripts/create-member-fields.php` — ACF field group (new)
- `scripts/import-members.php` — CSV import (new)
- `scripts/link-member-headstones.php` — headstone relationship linker (new)
- `scripts/clear-headstone-links.php` — bulk clear companion script (new)
- `scripts/build-veterans-directory-elementor.php` — Veterans Directory page builder (new)
- `scripts/build-battalion-history-elementor.php` — 2/21st Battalion History page builder (new)
- `scripts/build-1-21bn-history-elementor.php` — 1/21st Battalion History page builder (new)
