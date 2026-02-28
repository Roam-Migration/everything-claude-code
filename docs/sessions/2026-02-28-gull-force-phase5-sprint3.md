# Session: Gull Force Phase 5 Sprint 3

**Date:** 2026-02-28
**Repo:** jtaylorcomplize/gull-force-wp (master)
**Key commit:** d16e458 (feat: Phase 5 Sprint 3)

---

## Delivered

### 1. `[gf_memorial_map]` — World Map Shortcode

Interactive Leaflet.js world map of all 8 gf_memorial locations. Lives in `gull-force.php` mu-plugin.

**Features:**
- CartoDB Light tiles (consistent with single-gf_memorial.php)
- Colour-coded markers by country: Indonesia=#C4A35A (gold), Australia=#1A2744 (navy), China=#8B1A1A (maroon)
- Popup per marker: thumbnail, name, location, type, "View memorial →" CTA
- Country filter buttons (All / 🇮🇩 Indonesia / 🇦🇺 Australia / 🇨🇳 China) — show/hide markers

**Implementation notes:**
- Coordinates read from `memorial_lat` / `memorial_lng` postmeta (set in Sprint 1)
- Marker filter implemented via Leaflet `addTo`/`removeLayer` on the already-rendered markers
- Filter buttons query using `previousElementSibling` relative to the map `<div>` — avoids class-collision issues with multiple map instances on the same page
- Map centred at `[-12, 128]` zoom 3 — shows all three country clusters without cutting off Australia

**Enqueue pattern (`wp_enqueue_scripts`):**
```php
$needs_leaflet = is_singular( 'gf_memorial' )
    || ( is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'gf_memorial_map' ) );
```
`has_shortcode()` runs at enqueue time (before rendering), so Leaflet CSS is in `<head>` correctly.

---

### 2. Memorial ↔ Headstone Linking

All 607 `gf_headstone` posts now have `linked_memorial = 2633` (Ambon War Cemetery).

**Script:** `scripts/link-memorial-headstones.php`
- Sets `linked_memorial = 2633` via `update_post_meta` on all gf_headstone posts
- Idempotent: skips posts already correctly linked
- Run once this session: output "Linked 607 headstones to Ambon War Cemetery (ID 2633). 0 already linked."

**Template update (`single-gf_memorial.php`):**
- Queries headstones at PHP-render time: `meta_query` on `linked_memorial = $post_id`
- Headstone count shown in info panel ("607 photographed" row)
- 18-item sample grid with Fancybox lightbox (`data-fancybox="gf-headstones-memorial-{$post_id}"`)
- "Browse all N headstones →" link appears when count > 18
- Section only renders when `$type === 'Cemetery'` — appropriate for only Ambon War Cemetery

**Why postmeta on gf_headstone vs ACF relationship on gf_memorial:**
Storing 607 IDs in a single post's ACF relationship meta would produce a serialised blob of ~5KB per memorial post, complicating queries. Foreign-key meta on the child (gf_headstone) is more scalable and queries are efficient with a standard meta_query.

---

### 3. `[gf_statistics]` — Statistics Charts Shortcode

Summary stat cards + war history donut chart + rank horizontal bar chart. Chart.js 4. Lives in `gull-force.php` mu-plugin.

**Stat cards (4 cards):**
- Total Gull Force Members: 1,191
- Executed at Laha: 293
- Held as Prisoners of War: 799 (Ambon 529 + Hainan 270)
- Escaped or Returned: 55 (Escaped 40 + Escaped uncertain 11 + RTA 4)

**Charts:**
- War history donut: Ambon / Laha / Hainan / Escaped / Escaped (uncertain) / Unknown / Returned to Australia; legend shows label + count
- Rank bar (horizontal): Private / Lance Corporal / Corporal / Sergeant / Lieutenant / Captain / Major

**Caching:**
```php
$stats = get_transient( 'gf_statistics_data' );
// ...queries...
set_transient( 'gf_statistics_data', $stats, HOUR_IN_SECONDS );
```
1-hour transient avoids 14+ WP_Query calls on every page load.

**Enqueue:**
```php
$needs_chartjs = is_a( $post, 'WP_Post' ) && has_shortcode( $post->post_content, 'gf_statistics' );
if ( $needs_chartjs ) { wp_enqueue_script( 'chartjs', ... ); }
```

---

### 4. Memorials Page Updated

Page 2650 content updated from `[gf_memorial_grid columns="2"]` to:
```
[gf_statistics]
[gf_memorial_map height="500px"]
[gf_memorial_grid columns="2"]
```

Flow: **Stats intro** (what happened to the men) → **World map** (where they're commemorated) → **Memorial cards** (browse each site).

---

## Data Reference

| Metric | Value |
|--------|-------|
| Headstones linked | 607 (all to Ambon War Cemetery ID 2633) |
| gf_memorial_map markers | 8 |
| gf_statistics total members | 1,191 |
| Laha executed | 293 |
| POW (Ambon+Hainan) | 799 |
| Escaped/returned | 55 |

---

## Carry Forward

- **Sprint 4**: Articles & Contributions page, nominal roll download page, `single-gf_headstone.php`
- **Nav Archives/Association**: Implement when Articles + About Us pages are ready
- **`Browse all headstones` link**: Currently links to `/memorials/#headstones` — update when a dedicated headstone browse page or Community page section is built
- **Origin map (B3)**: Geocoding pipeline for birthplace/enlistment lat/lng still outstanding (Phase 5+ scope)
- **Battle map of Ambon Island (B2)**: Still outstanding (high effort, out of Sprint 3 scope)
- **Statistics transient invalidation**: If member data changes, manually delete transient via: `wp eval 'delete_transient("gf_statistics_data");' --path=/var/www/html/web`
