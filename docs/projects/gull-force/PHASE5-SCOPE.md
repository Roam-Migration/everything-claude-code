# Gull Force — Phase 5 UI/UX Scope Assessment & Proposal

**Date:** 2026-02-28
**Status:** Ready for implementation
**Prerequisite phases:** 0–4 complete (1,191 gf_member, 607 gf_headstone, 8 gf_memorial)
**Input docs:**
- `UI-UX-ANALYSIS.md` — IA, nav redesign, audiences (Phase 2 planning doc)
- Session notes: Phases 0–4 (nominal roll, portraits, plaques, memorials)
- Live site audit: all 11 pages, all CPTs, current shortcodes

---

## 1. Current State (Post Phase 4)

### Data Assets Now Available

| Asset | Count | Notes |
|-------|-------|-------|
| `gf_member` posts | 1,191 | 362 association vets + 829 nominal roll |
| `gf_headstone` posts | 607 | All Ambon War Cemetery headstone photos |
| `gf_memorial` posts | 8 | 4 countries: Indonesia, Australia, China |
| Portrait photos | 36 matched | From 731-image pool; 128 unmatched candidates |
| Plaque photos | 39 | Across 5 categories (ambon, shrine, australia, awm, hainan) |
| Memorial photos | 31+ | Distributed across 8 gf_memorial posts |
| Historical PDFs | 45 | Nominal Roll, grant docs, booklets |
| Pilgrimage images | 382+ | 2017 Ambon pilgrimage |

### War History Distribution (1,191 members)

| war_history | Count | Geographic Meaning |
|-------------|-------|--------------------|
| Ambon | 529 | POW at Tantui camp, Ambon Island |
| Laha | 293 | Executed at Laha airstrip, Feb 1942 |
| Hainan | 270 | Transported to Hainan Island POW camps |
| Escaped | 40 | Escaped before/during capture |
| Unknown | 35 | Fate unconfirmed |
| Escaped (uncertain) | 11 | Possible escape, unconfirmed |
| Returned to Australia | 4 | Repatriated before fall |

### 8 Memorial Locations (gf_memorial CPT)

| Memorial | Location | Country | Type |
|----------|----------|---------|------|
| Ambon War Cemetery | Tantui, Ambon | Indonesia | Cemetery |
| Laha Memorial | Laha, Ambon | Indonesia | Massacre site |
| Kudamati Memorial | Kudamati, Ambon | Indonesia | War memorial |
| Tantui Memorial | Tantui, Ambon | Indonesia | War memorial |
| Tawiri Memorial | Tawiri, Ambon | Indonesia | War memorial |
| Shrine of Remembrance | Melbourne, VIC | Australia | Plaque/garden |
| Australian War Memorial | Canberra, ACT | Australia | Plaque |
| Hainan Island Memorial | Hainan Island | China | War memorial |

### Pages Built (Phases 1–4)

| ID | Page | Status | Notes |
|----|------|--------|-------|
| 12 | Home | Live | Hero, aims, stats |
| 13 | Community | Live | Headstone gallery, veteran intro |
| 14 | Memorabilia | Live | 5 WooCommerce products |
| 15 | Contact | Live | Email, postal, membership |
| 16 | Pilgrimages | Live | Timeline + 382 images + 3 booklets |
| 2554 | Veterans Directory | Live | Searchable 1,191-member grid |
| 2556 | 2/21st History | Live | Full battalion history |
| 2558 | 1/21st History | Live | Predecessor battalion |
| 2569 | Veteran Photos | Live | 36 portrait gallery |
| 2610 | Plaques & Memorials | Live | 5-category plaque galleries |
| 2650 | Memorials | Live (basic) | 8-card gf_memorial grid; no single template |

---

## 2. UI/UX Gap Analysis

### Critical Gaps (Breaking User Journeys)

**Gap 1: No single veteran profile page**
1,191 veterans are searchable but clicking a result goes nowhere useful. A descendant Googling their grandfather's name will land on a blank or default page. This is the single most impactful gap.

**Gap 2: No single memorial detail page**
The Memorials page shows 8 cards, but `/memorial/ambon-war-cemetery/` renders with no custom template — default WordPress title + blank content. The ACF data (gallery, significance, description) is stored but not displayed.

**Gap 3: No geographic visualisation**
The war_history field encodes geographic information (Laha = Ambon Island massacre site, Hainan = Chinese POW camps) but there is no map view. Users cannot see where these places are or how the campaign unfolded spatially.

**Gap 4: No lightbox on galleries**
All gallery images currently open in a new browser tab (`target="_blank"`) — no lightbox, no captions, no navigation between images. This makes the pilgrimage gallery (382 images), headstone grid (565 images), and portrait gallery effectively unusable for browsing.

**Gap 5: Memorial ↔ headstone relationship unbuilt**
The Ambon War Cemetery memorial contains 309+ Australian graves, but there is no connection between the `gf_memorial` post and the `gf_headstone` posts. A visitor to the memorial page cannot browse the buried soldiers.

**Gap 6: war_history filters missing "Laha"**
The Veterans Directory filter UI enumerates war_history options, but "Laha" was added only during the Phase 4 nominal roll import. The filter dropdown is incomplete.

**Gap 7: Navigation doesn't match current content**
Current nav: `Home | Community | Memorabilia | Contact | Pilgrimages | Veterans ▼ (6 items)`
The Veterans dropdown now has 6 children and will need 1–2 more (individual profiles, map view). The top-level nav proposed in UI-UX-ANALYSIS.md is a better structure.

### Moderate Gaps (Reduced UX Quality)

**Gap 8: No cross-linking between CPTs**
- A veteran's profile should link to their headstone (if found at Ambon War Cemetery)
- A headstone should link to the veteran's profile
- A memorial should show which members died there (via war_history filter)
- None of these connections are surfaced to users

**Gap 9: No single headstone detail page**
607 headstone photos have individual post URLs but no template. An identified soldier's headstone is not linked to their member profile.

**Gap 10: Portrait matching incomplete**
Only 36 of 1,191 veterans (3%) have portrait photos. 128 unmatched image candidates remain. The portrait matching cascade could be extended.

**Gap 11: Statistics page absent**
The homepage shows "1,131 men / 779 gave their lives" but there is no page that tells the full story of the numbers: age distributions, enlistment localities, battalion/company breakdown, casualty timeline.

**Gap 12: Content gaps from live site not yet filled**
Per Phase 1 content audit, the following live-site content is absent from dev:
- Articles & Contributions (25+ artefact photos, PDFs, YouTube embeds)
- Calendar of Events (2023 events; needs client-editable solution)
- 2 missing WooCommerce products (Pen, Stubby Holder)
- Historical Ambon expansion (50+ additional images)

---

## 3. Phase 5 Proposed Enhancements

### A. Single Post Templates (Highest Priority)

#### A1. `single-gf_memorial.php` — Memorial Detail Page

**What it displays:**
```
[Hero image — full-width banner]
[Memorial name + location badge (country flag emoji)]

[Two-column layout]
Left:
  - Type label (Cemetery / Massacre Site / War Memorial / Plaque)
  - Location address
  - Year established
  - Historical significance (1–2 sentence summary)

Right:
  - Interactive map (Leaflet.js — single pin showing location)

[Description section — full WYSIWYG content from ACF]

[Photo gallery — lightbox grid]
  - All images from field_gf_mr_gallery
  - Fancybox or PhotoSwipe with captions

[Related Veterans section]
  - If type = Cemetery or Massacre Site: query gf_member by war_history match
  - Ambon War Cemetery → members with war_history = Ambon
  - Laha Memorial → members with war_history = Laha
  - Hainan → members with war_history = Hainan
  - Grid of 12 names (with "View all in directory" link)

[Related Headstones section — for Ambon War Cemetery only]
  - Query gf_headstone posts linked to this memorial
  - Show headstone photo grid (lightbox)
```

**Implementation:** PHP template in theme; uses `get_field()` for all ACF data; Leaflet for map.

---

#### A2. `single-gf_member.php` — Veteran Profile Page

**What it displays:**
```
[Page header]
  - Portrait photo (if available) — circular, 180px, float right
  - Name: "Private Harold George Adams"
  - Service number
  - War history badge (colour-coded: Ambon=#C4A35A, Laha=#8B1A1A, Hainan=#2C4A7C)

[Service Record section]
  - Rank | Unit | Service Number
  - Date of birth / Place of birth
  - Date of enlistment
  - War history narrative (what "Ambon" / "Laha" / "Hainan" means in context)
  - Date of death (contextualised: wartime vs post-war)
  - Cemetery / Cemetery plot

[Source flag: "Association record" or "Nominal Roll"]

[Photos section — if available]
  - Portrait photo + service photos (gallery, lightbox)

[Family Stories section — if any repeater entries]
  - Title + story + submitted by
  - "Submit a family story" CTA → contact form

[Documents section — if any]
  - Linked PDFs

[Links]
  - Related memorial (based on war_history → matching gf_memorial)
  - Headstone link (if headstone_link field set)
  - Back to Veterans Directory
```

**War history contextualisation text (hardcoded per value):**
- Ambon: "Captured at the fall of Ambon (February 1942). Held as a prisoner of war at Tantui camp, Ambon Island until liberation in August 1945."
- Laha: "Killed at Laha airstrip, Ambon (February 1942). One of approximately 300 Allied prisoners executed by Japanese forces following the fall of Ambon."
- Hainan: "Captured at Ambon (February 1942). Transported to Hainan Island, China (October 1942) where he was held as a prisoner of war until liberation in August 1945."
- Escaped: "Escaped before or during the fall of Ambon (January–February 1942)."
- Returned to Australia: "Returned to Australia before the fall of Ambon."

**Implementation:** PHP template + `[gf_member_card id=""]` shortcode (already exists, extend it).

---

#### A3. `single-gf_headstone.php` — Headstone Detail Page

**What it displays:**
```
[Headstone photo — large, centred]
[Soldier name + rank (from ACF)]
[Unit + service number if known]

[Cross-links]
  - If headstone linked to gf_member: "View [Name]'s full service record →"
  - Link to Ambon War Cemetery memorial page
  - Map showing Ambon War Cemetery location (Leaflet, single pin)
```

**Note:** Many headstones may not have identified soldier data — display what is available, gracefully.

---

### B. Geographic Map Features

This is the highest-value differentiator for the site. The data structure already supports three distinct map views.

#### B1. World Memorial Map (for /memorials/ page)

**Leaflet.js interactive map** showing all 8 memorial locations globally.

```
Map centered on Indo-Pacific region (zoom ~3)
Markers:
  - 🇮🇩 Ambon, Indonesia (5 sites clustered): Cemetery, Laha, Kudamati, Tantui, Tawiri
  - 🇦🇺 Melbourne, VIC: Shrine of Remembrance
  - 🇦🇺 Canberra, ACT: Australian War Memorial
  - 🇨🇳 Hainan Island: Hainan Memorial

On marker click: popup with memorial name, type, thumbnail → "View memorial →" link
Layer toggles: All / Indonesia / Australia / China
```

**Coordinates to hardcode (or add to ACF):**

| Memorial | Lat | Lng |
|----------|-----|-----|
| Ambon War Cemetery (Tantui) | -3.686 | 128.186 |
| Laha Memorial | -3.608 | 128.043 |
| Kudamati Memorial | -3.658 | 128.192 |
| Tantui Memorial | -3.686 | 128.186 |
| Tawiri Memorial | -3.620 | 128.064 |
| Shrine of Remembrance | -37.830 | 144.973 |
| Australian War Memorial | -35.295 | 149.143 |
| Hainan Island | 19.000 | 109.700 |

**Implementation options:**
1. Add `lat` and `lng` ACF fields to `gf_memorial` CPT (preferred — editable)
2. Hardcode coordinates in a PHP array keyed by post slug (simpler, no admin UI needed)

Recommended: Option 1 — add lat/lng fields to gf_memorial field group; populate via a quick `populate-memorial-coordinates.php` script. Coordinate data is stable enough.

---

#### B2. Battle Map (for /our-history/ or inline on 2/21st History page)

Static SVG map of Ambon Island annotated with key battle/POW sites.

```
Annotated map (could be Leaflet at higher zoom ~10):
  - Laha airstrip — "293 men executed Feb 1942"
  - Tantui — "Main POW camp; 529 prisoners"
  - Tawiri — "Airfield defence; Battle of Ambon Jan 1942"
  - Kudamati — "Australian-funded memorial, community collaboration"
  - Ambon War Cemetery — "309 Australian graves"
```

**Implementation:** Either Leaflet with polygon overlays, or a commissioned SVG map. A Leaflet implementation is feasible without commissioned artwork.

---

#### B3. Origin Map — Where Did Gull Force Men Come From?

The nominal roll contains `place_of_birth` and `locality_on_enlistment` for 1,189 records. This data can be geocoded to show the Australian geographic spread of the battalion.

**Display options:**
- Dot map: one dot per soldier, placed at birthplace/enlistment location
- Heatmap: density overlay showing VIC-heavy concentration
- Bar chart per state (simpler, no map needed)

**Implementation complexity:** Medium — requires geocoding. Batch geocoding via Nominatim (free, rate-limited) or a one-time Google Maps Geocoding API pass. Output stored as lat/lng in `birthplace_lat`, `birthplace_lng` ACF fields (already registered).

**Value assessment:** High — a beautiful origin map is shareable, educational, and tells the story of the battalion's composition. The ACF fields already exist for this.

---

### C. Lightbox & Gallery Enhancement

#### C1. Replace new-tab gallery opening with Fancybox 5

All current galleries open images in `target="_blank"`. Replace with Fancybox 5 (free, vanilla JS, ~50KB):

**Galleries to upgrade:**
- Headstone grid (565 photos) — add caption: soldier name, unit
- Veteran photos gallery (36 portraits) — add caption: name, rank, war_history
- Pilgrimage 2017 gallery (382 images)
- POW camp gallery
- Memorial galleries on single-gf_memorial.php
- Plaque galleries

**Implementation:** Add Fancybox CSS/JS to `gull-force.php` mu-plugin via `wp_enqueue_scripts`. Modify all shortcode `<a>` tags to add `data-fancybox="gallery-name"` and `data-caption`.

**Effort:** Low–medium. All gallery output is centralised in shortcodes — change in one place.

---

#### C2. Headstone Grid Enhancement

Current: 565 headstones in a simple image grid, client-side search by surname.

Enhanced:
- Fancybox lightbox on click
- Caption shows: photo file-derived name (or ACF soldier name if identified)
- Search stays — add "identified / unidentified" toggle
- "View linked veteran profile →" button in lightbox for identified headstones

---

### D. Memorial ↔ Headstone Geographic Linking

**Proposed ACF relationship:** Add `linked_headstones` field to `gf_memorial` (relationship field, max posts = unlimited, returns post objects).

**For Ambon War Cemetery:** Run `link-memorial-headstones.php` script to attach all 309+ `gf_headstone` posts to the Ambon War Cemetery memorial. This enables:
- Memorial page → "Browse headstones in this cemetery" section
- Headstone page → "This headstone is at [Memorial]" with map link
- Search/filter headstones by memorial location

**For Laha, Tantui, Tawiri:** These are massacre/combat sites, not cemeteries. The link is via `war_history` on `gf_member`, not via headstones directly. A "293 men were killed here" section on the Laha memorial pulls from `gf_member WHERE war_history = 'Laha'`.

---

### E. Navigation Redesign

**Current nav (Phase 4 state):**
```
Home | Community | Memorabilia | Contact | Pilgrimages | Veterans ▼
  └── Veterans Directory
  └── Veteran Photos
  └── Plaques & Memorials
  └── 2/21st Battalion History
  └── 1/21st Battalion History
  └── Memorials
```

**Issues:** "Community" is ambiguous; Veterans dropdown has 6 items and will grow; Remembrance content is split across multiple places.

**Proposed nav (from UI-UX-ANALYSIS.md, updated for Phase 4 state):**

```
HOME  |  OUR HISTORY ▼  |  THE MEN ▼  |  REMEMBRANCE ▼  |  ARCHIVES ▼  |  THE ASSOCIATION ▼  |  MEMORABILIA
```

| Section | Children |
|---------|---------|
| **Our History** | 2/21st Battalion · 1/21st Battalion · The Campaign (future: map view) |
| **The Men** | Veterans Directory · Veteran Photos · [Individual profiles via search] |
| **Remembrance** | Memorials · Plaques & Memorials · Pilgrimages · Headstone Memorial |
| **Archives** | Articles & Contributions · Nominal Roll Download · Documents (future) |
| **The Association** | About Us / Community · Events · Contact |
| **Memorabilia** | (no dropdown — direct page) |

**Implementation:** WordPress Menus admin; update Elementor header template if nav is in a global widget.

---

### F. war_history Filter Update

The Veterans Directory shortcode `[gf_member_directory]` currently enumerates war_history options for filtering. "Laha" must be added.

**Current filter options (assumed):** Ambon, Hainan, Escaped, Returned to Australia, Unknown
**Required addition:** Laha (293 records)

**Update location:** `gull-force.php` mu-plugin, `[gf_member_directory]` shortcode render function — find the war_history filter `<select>` or button group and add "Laha" option.

Also consider adding a visual war history legend explaining what each location means — a tooltip or inline description would help users unfamiliar with the history.

---

### G. Data Visualisation Opportunities

The nominal roll data enables compelling statistics pages that require no additional data collection.

#### G1. Statistics Section (on 2/21st History page or standalone)

**Visualisations to build:**
1. **Fate pie/donut chart** — Ambon 529 / Laha 293 / Hainan 270 / Escaped 40 / Unknown 35 / RTA 4
2. **Casualty timeline** — deaths by month/year (Jan–Feb 1942 battle; 1942–45 POW deaths)
3. **Age at enlistment distribution** — bar chart (from date_of_birth + date_of_enlistment in nominal roll)
4. **Enlistment state breakdown** — VIC/NSW/QLD/SA/WA/TAS (from locality_on_enlistment)
5. **Rank distribution** — Private/Corporal/Sergeant hierarchy (from member_rank)

**Implementation options:**
- Simple: CSS-only bar charts with hardcoded values (no JS dependency; calculated once from WP-CLI query)
- Dynamic: Chart.js or ApexCharts loaded via `wp_enqueue_scripts` (updates automatically if data changes)

Recommended: Chart.js (20KB, well-maintained). Render a `[gf_statistics]` shortcode that queries gf_member and outputs JSON data to a `<canvas>` element.

---

#### G2. Nominal Roll Download Page

One of the live site content gaps: a downloadable PDF of the full nominal roll. This exists (`documents-historical/GullForce_Nominal_Roll.pdf`).

**Simple implementation:** Create an "Archives" or "Resources" page; add nominal roll PDF download button alongside other historical documents.

---

### H. Content Gaps Still to Fill (from Phase 1 content audit)

These are items confirmed on the live site but absent from dev:

| Gap | Priority | Content Available? | Notes |
|-----|----------|--------------------|-------|
| Articles & Contributions | High | Partial — PDFs + YouTube URLs | 25+ artefact photos, 4 PDFs, 3 YouTube embeds |
| Calendar of Events | Medium | Past events data | Needs client-editable solution (custom post type or ACF repeater) |
| WooCommerce products (Pen, Stubby Holder) | Low | Product images needed | 5 of 7 products in dev |
| Historical Ambon expansion | Medium | 50+ images in content pool | Extra images for 2/21st history page |
| Membership form PDF | Medium | Awaiting from client | Contact page shows placeholder |

---

## 4. Implementation Priorities (MoSCoW)

### Must Have (Phase 5 Core)

| Feature | Effort | Impact |
|---------|--------|--------|
| A2: `single-gf_member.php` veteran profile | 8 | Enables all 1,191 veterans to have a discoverable page |
| A1: `single-gf_memorial.php` memorial detail | 5 | Completes Phase 3 memorial work |
| C1: Fancybox lightbox on all galleries | 3 | Fixes broken gallery UX across entire site |
| F: war_history filter — add Laha | 1 | Data completeness fix |
| E: Navigation redesign | 3 | Critical for information architecture |

### Should Have (Phase 5 Enhancements)

| Feature | Effort | Impact |
|---------|--------|--------|
| B1: World memorial map (Leaflet) | 5 | Highly shareable, unique UX differentiator |
| D: Memorial ↔ headstone linking | 3 | Enables "browse graves" on Ambon War Cemetery page |
| G1: Statistics visualisation | 5 | Compelling content for historians and press |
| H: Articles & Contributions page | 3 | Fills live-site content gap |
| A1 coordinate fields on gf_memorial | 2 | Required for map; admin-editable |

### Could Have (Phase 5+ or Phase 6)

| Feature | Effort | Impact |
|---------|--------|--------|
| B3: Origin/birthplace map (geocoded) | 8 | Beautiful but requires geocoding pipeline |
| B2: Battle map of Ambon Island | 8 | High impact but complex (SVG or Leaflet polys) |
| A3: `single-gf_headstone.php` | 3 | Incremental improvement; low traffic expected |
| G2: Nominal Roll download page | 1 | Simple — existing PDF |
| Portrait matching expansion | 5 | Diminishing returns; 36 matched already |
| Calendar of Events CPT | 5 | Client needs to define editorial workflow |

### Won't Have (Out of Scope / Future)

| Feature | Reason |
|---------|--------|
| Members-only area / family submissions | Requires authentication, moderation workflow, client buy-in |
| CWGC API integration | External dependency, complex |
| PDF export of veteran profiles | Complex; low demand |
| Oral history transcripts | Requires labour-intensive transcription |

---

## 5. Technical Approach

### Map Implementation (Leaflet.js)

Leaflet is the right choice over Google Maps or Mapbox:
- **Free** — no API key, no billing, no quota
- **Lightweight** — ~42KB JS + ~4KB CSS
- **OpenStreetMap tiles** — free, no key required
- **Plugin-free** — load via `wp_enqueue_scripts` in mu-plugin

**Loading pattern:**
```php
// In gull-force.php
function gf_enqueue_leaflet() {
    wp_enqueue_style('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    wp_enqueue_script('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', [], '1.9.4', true);
}
add_action('wp_enqueue_scripts', 'gf_enqueue_leaflet');
```

**Shortcode approach for the memorial map:**
```
[gf_memorial_map height="450px"]
```
Queries all gf_memorial posts, reads lat/lng ACF fields, renders a `<div id="gf-map">` with inline JS initialising Leaflet markers.

### Fancybox 5 Implementation

Fancybox 5 is MIT-licensed, vanilla JS (no jQuery), ~50KB bundle:
```php
// Enqueue in mu-plugin
wp_enqueue_style('fancybox', 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5/dist/fancybox/fancybox.css');
wp_enqueue_script('fancybox', 'https://cdn.jsdelivr.net/npm/@fancyapps/ui@5/dist/fancybox/fancybox.umd.js', [], '5', true);
wp_add_inline_script('fancybox', 'Fancybox.bind("[data-fancybox]", {});');
```

All shortcode gallery `<a>` tags need `data-fancybox="gallery-{$post_id}"` and `data-caption` attributes added.

### Single Post Templates

PHP files placed in the active theme (`hello-elementor`). WordPress template hierarchy:
- `single-gf_memorial.php` → fires for any single `gf_memorial` post
- `single-gf_member.php` → fires for any single `gf_member` post
- `single-gf_headstone.php` → fires for any single `gf_headstone` post

These templates can use Elementor's `\Elementor\Plugin::$instance->frontend->get_builder_content_for_display($post_id)` to inject Elementor-built sections, or be built purely in PHP using `get_field()` — the latter is simpler and more maintainable for data-heavy CPT templates.

**Recommended approach:** Pure PHP + ACF, styled with the same CSS variables used in existing shortcodes. No Elementor dependency on single CPT templates (reduces fragility).

### Statistics Charts (Chart.js)

```php
// [gf_statistics] shortcode
function gf_render_statistics() {
    $counts = [];
    $war_history_values = ['Ambon', 'Laha', 'Hainan', 'Escaped', 'Unknown'];
    foreach ($war_history_values as $wh) {
        $counts[$wh] = (int) get_posts([
            'post_type' => 'gf_member',
            'posts_per_page' => -1,
            'meta_query' => [['key' => 'war_history', 'value' => $wh]],
            'fields' => 'ids',
        ]);
    }
    // Pass to Chart.js via wp_add_inline_script or JSON in script tag
}
```

**Caching:** Use `get_transient`/`set_transient` with 1-hour expiry — 1,191 posts is a lightweight query but worth caching.

---

## 6. Effort Estimates (Fibonacci Scale)

| Feature | Story Points | Notes |
|---------|-------------|-------|
| A2: `single-gf_member.php` | 8 | Largest template; war history contextualisation; cross-links |
| A1: `single-gf_memorial.php` | 5 | Leaflet map integration; gallery; related veterans |
| B1: World memorial map | 5 | Lat/lng fields + Leaflet shortcode + popups |
| G1: Statistics visualisation | 5 | Chart.js + query pipeline + shortcode |
| A3: `single-gf_headstone.php` | 3 | Simpler template; limited fields |
| C1: Fancybox lightbox | 3 | Enqueue + modify all shortcode gallery `<a>` tags |
| D: Memorial ↔ headstone linking | 3 | ACF field + `link-memorial-headstones.php` script + display |
| E: Navigation redesign | 3 | WP menus admin + Elementor header update |
| H: Articles page | 3 | New page + shortcode or Elementor layout |
| F: war_history filter fix | 1 | 1-line shortcode change |
| G2: Nominal Roll download | 1 | Static page with PDF link |
| Coordinate fields on gf_memorial | 2 | Field group update + populate script |
| B3: Birthplace origin map | 8 | Geocoding pipeline + batch update + Leaflet |

**Phase 5 Core total (Must Have):** ~20 points
**Phase 5 Full (Must + Should):** ~37 points

---

## 7. Implementation Order (Suggested Sprint)

### Sprint 1 — Templates & Critical Fixes (Day 1)
1. Add lat/lng ACF fields to `gf_memorial` + `populate-memorial-coordinates.php` (2pts)
2. Fix war_history filter — add Laha (1pt)
3. Fancybox enqueue + gallery shortcode updates (3pts)
4. `single-gf_memorial.php` template with Leaflet single-pin (5pts)

### Sprint 2 — Veteran Profiles (Day 2)
5. `single-gf_member.php` full template (8pts)
6. Navigation redesign (3pts)

### Sprint 3 — Maps & Data (Day 3)
7. `[gf_memorial_map]` world map shortcode + Memorials page update (5pts)
8. Memorial ↔ headstone linking script + display (3pts)
9. Statistics visualisation shortcode (5pts)

### Sprint 4 — Content Gaps (Day 4)
10. Articles & Contributions page (3pts)
11. Nominal Roll download page (1pt)
12. `single-gf_headstone.php` template (3pts)

---

## 8. Key Design Decisions to Confirm

1. **War history colour coding** — Proposed: Ambon=#C4A35A (gold), Laha=#8B1A1A (burgundy/red — massacre site), Hainan=#1A2744 (navy), Escaped=#2E7D32 (green). Does this feel appropriate?

2. **Map tile provider** — OpenStreetMap tiles (free, no API key) vs Stamen Toner (high contrast, retro look better for memorial context) vs CartoDB Light. CartoDB Light is the cleanest for a memorial site.

3. **Date of death semantics** — `date_of_death` in nominal roll records = wartime death; in association records = post-war civilian death. Display must contextualise this. Recommend adding `(wartime)` / `(post-war)` suffix in template, keyed on `source` field.

4. **Missing portraits** — 1,155 of 1,191 veterans have no portrait. Options:
   - Show silhouette placeholder with rank badge
   - Show nothing (hide portrait section if empty)
   - Show unit colour patch
   Recommended: silhouette placeholder — maintains visual consistency in grid layouts.

5. **Laha war history label** — "Laha" is a specific place name unfamiliar to most visitors. Consider label: "Laha (Executed)" or "Laha Massacre" with tooltip.

---

## 9. Open Items

| Item | Status | Action Required |
|------|--------|----------------|
| Wills, Milton (VX 57981) | In WP; not in nominal roll | Manual verification |
| Membership form PDF | Awaiting from client | Client to supply |
| Pen + Stubby Holder product images | Awaiting from client | Client to supply |
| Calendar of Events solution | Needs client input | Discuss: events CPT vs static page |
| Map tile provider preference | Design decision | Confirm in next session |
| Geocoding: birthplace/enlistment lat/lng | Not started | Batch geocode via Nominatim if origin map approved |

---

*Prepared: 2026-02-28 | Builds on: UI-UX-ANALYSIS.md + Phases 0–4 session notes*
