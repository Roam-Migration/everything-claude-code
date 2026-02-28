# Session: Gull Force Phase 5 Sprint 2

**Date:** 2026-02-28
**Repo:** jtaylorcomplize/gull-force-wp (master)
**Key commits:** 4b0c528 (single-gf_member.php), ffca06f (nav), 02b6377 (photo reconciliation tools)

---

## Delivered

### 1. `single-gf_member.php` — Veteran Profile Template

1,191 veteran records now have individual findable profile pages at `/member/{slug}/`.

**Layout:** Hero (portrait or silhouette placeholder) + Service Record panel + War History context + service photos gallery + related memorials grid.

**Critical: date_of_death dual semantics**

The single `date_of_death` field carries different meanings by record source:
- `source=nominal_roll` + `war_history=Laha` → label "Executed"
- `source=nominal_roll` + `war_history=Ambon|Hainan` → label "Died in captivity"
- `source=''` (association/survivor) → label "Passed away"
- `war_history=Escaped|Returned to Australia` → suppress date field entirely

Centralise this in a lookup array. Don't scatter conditionals through template.

**Portrait storage:** `portrait_photo` meta key stores an attachment integer ID (not a URL). Use `wp_get_attachment_image_url($id, 'large')`. ACF also writes `_portrait_photo = field_gf_mem_portrait` as the reference key.

**service_photos:** PHP-serialised array of attachment IDs. Use `maybe_unserialize()` — handles both serialised and plain strings safely.

**Hero layout pattern (portrait + text):**
```css
.hero-inner { display: grid; grid-template-columns: 1fr 340px; }
@media (max-width: 760px) { .portrait-col { display: none; } }
```
Hiding portrait on mobile (not stacking) avoids layout breaks with tall portrait images.

**Actual ACF fields vs. spec:** biography, post_war_story, date_of_birth, place_of_birth, family_stories were in the Phase 5 scope doc but were never populated in the DB. Template gracefully skips unpopulated sections.

---

### 2. Navigation Redesign

**Script:** `scripts/rebuild-nav-menu.php`

**Final structure:**
```
Home | Community>(News,Events) | History>(2/21st,1/21st,Memorials,Pilgrimages)
    | Veterans>(Directory,Photos,Plaques&Memorials) | Memorabilia | Contact
```

**Split rationale:**
- History = campaign narrative + memorial places + pilgrimages (the story)
- Veterans = people, records, commemorative plaques (the people)

**Variance from Notion spec:** The 7-section structure (Our History / The Men / Remembrance / Archives / The Association) was simplified to 6 sections at client direction. Archives and The Association deferred until content pages exist.

**WP nav menu API note:** `wp_update_nav_menu_item($menu_id, 0, [...])` returns the new **menu item post ID**. Pass this as `menu-item-parent-id` for child items — not the page object ID. Capture parent return values.

**News + Events stubs:** Created as `post_parent=13` (Community) → URLs `/community/news/`, `/community/events/`. IDs 3712, 3713.

---

### 3. Photo Reconciliation Admin Tooling

**mu-plugin additions:**
- Media library `GF Status` column (unreviewed/tagged/confirmed/irrelevant)
- Media library filter by `gf_reconciliation_status`
- `Tagged In Photos` metabox on `gf_member` edit screen

**`scripts/import-unmatched-photos.php`:**
- Bulk-imports `content/images/` images not yet in WP media library
- Sets `gf_reconciliation_status = 'unreviewed'`
- `GF_DRY_RUN=1` for safe preview

---

## Data Reference

| Metric | Value |
|--------|-------|
| gf_member total | 1,191 (362 association + 829 nominal roll) |
| With portrait | 56 (4.7%) |
| With service_photos | 5 |
| war_history breakdown | Ambon 529, Laha 293, Hainan 270, Escaped 40, Unknown 35, Escaped(uncertain) 11, RTA 4 |

---

## Carry Forward

- **Sprint 3**: World memorial map shortcode (Leaflet, all 8 gf_memorial coords), memorial↔headstone linking, statistics/charts shortcode
- **Sprint 4**: Articles page, nominal roll download page, `single-gf_headstone.php`
- **Photo reconciliation**: Run `import-unmatched-photos.php` to seed unreviewed queue, then tag via media library UI
- **Nav Archives/Association sections**: Implement when Articles + About Us content pages are ready
- **Nav Notion spec variance**: Notion task `315e1901-e36e-8173` documents the delta between spec and delivery
