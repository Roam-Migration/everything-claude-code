# Gull Force — Phase 5 Sprint 1: UI/UX Analysis & First Implementations

**Date:** 2026-02-28
**Session type:** Analysis + Implementation
**Repo:** `/home/jtaylor/gull-force-wp` (GitHub: jtaylorcomplize/gull-force-wp, master)
**Commit:** `224cd62`

---

## What Was Accomplished

### 1. UI/UX Scope Assessment

Deployed 3 parallel agents to analyse the project from all angles simultaneously:
- **Repo explorer**: CPTs, ACF fields, all 43 scripts, shortcodes, theme structure, geo/lightbox gaps
- **Session notes reader**: Full Phase 0–4 project history synthesis
- **Live site auditor**: Page-by-page content and UI inventory (11 pages)

Synthesised findings into:
- `docs/projects/gull-force/PHASE5-SCOPE.md` — comprehensive Phase 5 scope (752 lines)
  - Gap analysis (7 critical + 5 moderate)
  - 4-sprint implementation plan with MoSCoW prioritisation
  - Effort estimates (Fibonacci), design decisions to confirm
  - Geographic map opportunities identified from `war_history` data
- `docs/projects/gull-force/PHASE6-MEMBER-PORTAL-SCOPE.md` — member portal concept scope

**Key insight from analysis:** The `war_history` field encodes geographic data (Laha = massacre site, Hainan = Chinese POW camps). Every memorial, headstone, and veteran can be cross-linked through this single field without complex relational structures.

---

### 2. Sprint 1 Implementation

**Commit `224cd62` — 759 insertions across 5 files**

#### Task 1: lat/lng ACF fields on gf_memorial

- Updated `scripts/create-memorial-fields.php` — added `field_gf_mr_lat` (`memorial_lat`) and `field_gf_mr_lng` (`memorial_lng`) as `number` type fields (order_no 8 & 9)
- Created `scripts/populate-memorial-coordinates.php` — hardcoded coordinates for all 8 memorials by post slug
- Ran both scripts via WP-CLI: field group recreated (ID 3482), all 8 memorials geolocated

**Coordinates stored:**

| Memorial | Lat | Lng |
|----------|-----|-----|
| Ambon War Cemetery | -3.686 | 128.186 |
| Laha Memorial | -3.608 | 128.043 |
| Kudamati Memorial | -3.658 | 128.192 |
| Tantui Memorial | -3.693 | 128.183 |
| Tawiri Memorial | -3.620 | 128.064 |
| Shrine of Remembrance | -37.830 | 144.973 |
| Australian War Memorial | -35.295 | 149.143 |
| Hainan Island Memorial | 19.196 | 109.447 |

#### Task 2: war_history Filter Labels

The `[gf_member_directory]` filter is dynamically built from actual post data — "Laha" already auto-appears since 293 records were imported in Phase 4. Enhanced the filter UI:
- Added `$wh_labels` map in the shortcode: `Laha → 'Laha (Executed)'`, `Ambon → 'Ambon (POW)'`, `Hainan → 'Hainan (POW)'`
- Added `title` tooltip attribute to the `<select>` explaining each location category
- These labels make the filter UX meaningful to users unfamiliar with the campaign geography

#### Task 3: Fancybox 5 Lightbox

All galleries upgraded from `target="_blank"` (new-tab) to Fancybox 5 lightbox with captions.

**Enqueue (mu-plugin):**
```php
// Fancybox 5 — MIT, vanilla JS, no jQuery dependency
wp_enqueue_style('fancybox', 'cdn.jsdelivr.net/npm/@fancyapps/ui@5/...');
wp_enqueue_script('fancybox', 'cdn.jsdelivr.net/npm/@fancyapps/ui@5/...');
wp_add_inline_script('fancybox', 'Fancybox.bind("[data-fancybox]", {...});');

// Leaflet — only on single gf_memorial pages (saves load elsewhere)
if ( is_singular( 'gf_memorial' ) ) { wp_enqueue_style/script('leaflet', ...); }
```

**Gallery groups updated:**

| Shortcode | Gallery Group | Caption source |
|-----------|--------------|----------------|
| `gf_headstone_grid` | `gf-headstones` | Headstone surname + initials |
| `gf_member_photo_gallery` | `gf-portraits` | Name — Rank · War history |
| `gf_plaque_gallery` | `gf-plaques-{category}` | Attachment post title |
| `gf_pow_gallery` | `gf-pow-gallery` | Attachment caption/title |
| `gf_2017_gallery` | `gf-2017-gallery` | Attachment caption/title |

**Headstone grid change:** Images were bare `<img>` with no anchor — needed to compute `$full_hs` URL from the `headstone_image` ACF field (handles both array format and raw attachment ID) and wrap in `<a data-fancybox>`.

#### Task 4: single-gf_memorial.php Template

New PHP template at `web/wp-content/themes/hello-elementor/single-gf_memorial.php`.

**Template sections:**
1. **Hero** — full-width banner image (first gallery photo or featured image); overlaid title + location/type/year badges
2. **Two-column layout**: info panel (left) + Leaflet map (right)
3. **Info panel** — location, country + flag emoji, type (colour-coded), year, related member count
4. **Leaflet map** — CartoDB Light tiles, gold dot marker, popup with memorial name + location; graceful "Map location not yet recorded" fallback
5. **Description** — full ACF WYSIWYG content
6. **Photo gallery** — responsive grid with Fancybox; per-memorial `data-fancybox="gf-memorial-{post_id}"` group
7. **Related veterans** — queried via `war_history` meta (hardcoded `$wh_map` per post slug); shows up to 12 cards with name/rank/wh badge; "View all N members" CTA to Veterans Directory; war history context explanation box
8. **Back link** — `← All Memorials` to /memorials/

**war_history → memorial slug mapping (hardcoded in template):**
```php
'ambon-war-cemetery'      => ['Ambon'],
'laha-memorial'           => ['Laha'],
'kudamati-memorial'       => ['Ambon', 'Laha'],
'tantui-memorial'         => ['Ambon'],
'tawiri-memorial'         => ['Ambon'],
'shrine-of-remembrance'   => ['Ambon', 'Laha', 'Hainan', 'Escaped'],
'australian-war-memorial' => ['Ambon', 'Laha', 'Hainan', 'Escaped'],
'hainan-island-memorial'  => ['Hainan'],
```

**gitignore fix:** `web/wp-content/themes/` was fully excluded. Changed to `web/wp-content/themes/*` (ignores contents but not directory itself) plus negation patterns for custom templates — allows subdirectory un-ignoring which the trailing-slash form blocks.

**Rewrite flush:** After creating the template, `wp rewrite flush --hard` was needed to resolve 404s on memorial URLs. This is a normal WP requirement after CPT changes.

---

## Verification

All 11 template checks passed on `laha-memorial/`:
```
[FOUND] Template loaded
[FOUND] Hero section
[FOUND] Map container
[FOUND] Veterans grid
[FOUND] Fancybox gallery
[FOUND] Fancybox JS enqueued
[FOUND] Leaflet JS enqueued
[FOUND] Section headers
[FOUND] WH context box
[FOUND] Leaflet marker init
[FOUND] Correct page title
```

Live pages verified:
- `/memorial/laha-memorial/` — 293 related members, 2-image gallery, Leaflet map at -3.608/128.043
- `/memorial/ambon-war-cemetery/` — 529 related members, 9-image gallery

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Map library | Leaflet 1.9.4 | Free, no API key, 42KB, OpenStreetMap-compatible |
| Map tiles | CartoDB Light | Clean, low-distraction, appropriate for memorial context |
| Lightbox | Fancybox 5 | MIT, vanilla JS (no jQuery), 50KB |
| Related veterans logic | Hardcoded slug→wh_map | 8 stable memorials; PHP array faster than ACF relationship field on 1,191 posts |
| Leaflet load condition | `is_singular('gf_memorial')` only | Avoids loading 46KB Leaflet on every page |
| Template location | hello-elementor theme | WordPress template hierarchy requires active theme |
| gitignore pattern | `themes/*` not `themes/` | Trailing `/` blocks all negation inside the directory |

---

## Key Patterns (Reusable)

### gitignore for Composer-managed theme with custom files
```gitignore
web/wp-content/themes/*          # ignore contents, not directory
!web/wp-content/themes/hello-elementor     # un-ignore the theme dir
web/wp-content/themes/hello-elementor/*   # re-ignore all files in it
!web/wp-content/themes/hello-elementor/single-gf_memorial.php  # track this
```

### Conditional Leaflet enqueue in WP mu-plugin
```php
if ( is_singular( 'gf_memorial' ) ) {
    wp_enqueue_style('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', [], '1.9.4');
    wp_enqueue_script('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', [], '1.9.4', true);
}
```

### Fancybox 5 init pattern (deferred, DOMContentLoaded)
```php
wp_add_inline_script('fancybox',
    'document.addEventListener("DOMContentLoaded",function(){' .
    'Fancybox.bind("[data-fancybox]",{Thumbs:{type:"modern"}});});'
);
```

### CPT single template — war_history → related veteran query
```php
// Hardcoded slug map is appropriate for small stable datasets
$wh_map = ['ambon-war-cemetery' => ['Ambon'], 'laha-memorial' => ['Laha'], ...];
$related_wh = $wh_map[ get_post_field('post_name', $post_id) ] ?? [];
$meta_q = ['relation' => 'OR'];
foreach ($related_wh as $wh) { $meta_q[] = ['key' => 'war_history', 'value' => $wh]; }
```

### Efficient WP_Query count (no post objects loaded)
```php
$count_q = new WP_Query(['post_type' => 'gf_member', 'posts_per_page' => -1,
    'fields' => 'ids', 'no_found_rows' => false, 'meta_query' => $meta_q]);
$total = $count_q->found_posts;
```

---

## Lessons Learned

1. **`wp rewrite flush` after template creation** — Adding a new CPT single template doesn't require flushing, but if CPT URLs were 404ing before (often the case after initial registration), flush is needed. Always check HTTP status after template creation.

2. **gitignore `dir/` vs `dir/*`**: trailing `/` on a gitignore directory exclusion makes it impossible to un-ignore any files inside via `!` patterns. Use `dir/*` instead — same practical effect but allows subdirectory negation.

3. **ACF `number` fields for coordinates** — Store lat/lng as `number` type, not `text`. PHP float values returned directly by `get_field()`, ready for Leaflet's `L.marker([lat, lng])` without parsing.

4. **war_history filter is already dynamic** — The `[gf_member_directory]` filter builds its options from actual post data. "Laha" appeared automatically after the Phase 4 nominal roll import — no code change needed. The real value-add was adding human-readable labels for unfamiliar location names.

---

## Remaining Phase 5 Work

### Sprint 2 (Next session)
- `single-gf_member.php` — veteran profile page (highest impact: 1,191 veterans get findable pages)
- Navigation redesign (7-section nav from UI-UX-ANALYSIS.md)

### Sprint 3
- `[gf_memorial_map]` world map shortcode (all 8 memorials on one map)
- Memorial ↔ headstone linking (ACF relationship + display)
- Statistics visualisation (Chart.js — fate distribution, casualty timeline)

### Sprint 4
- `single-gf_headstone.php`
- Articles & Contributions page
- Nominal Roll download page

---

## Files Changed This Session

| File | Type | Description |
|------|------|-------------|
| `docs/projects/gull-force/PHASE5-SCOPE.md` | New | Full Phase 5 scope document (752 lines) |
| `docs/projects/gull-force/PHASE6-MEMBER-PORTAL-SCOPE.md` | New | Member portal concept scope |
| `scripts/create-memorial-fields.php` | Modified | +lat/lng fields |
| `scripts/populate-memorial-coordinates.php` | New | Hardcoded coordinates for 8 memorials |
| `web/wp-content/mu-plugins/gull-force.php` | Modified | Fancybox enqueue, Leaflet conditional enqueue, 5 gallery shortcode upgrades, war_history filter labels |
| `web/wp-content/themes/hello-elementor/single-gf_memorial.php` | New | CPT single template (420 lines) |
| `.gitignore` | Modified | `themes/*` pattern + CPT template exceptions |

---

*Session notes: 2026-02-28 | Phase 5 Sprint 1 complete*
