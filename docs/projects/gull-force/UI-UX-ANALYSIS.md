# Gull Force Website — UI/UX Analysis & Redesign Strategy

**Date:** 2026-02-28
**Status:** Planning — for implementation in next dev session
**Scope:** Full information architecture review, content placement for all live-site gaps, veteran database design, navigation redesign, and UI patterns.
**Inputs:**
- Live site content audit (`docs/sessions/2026-02-28-gull-force-content-audit.md`)
- Veteran database analysis session (separate — `gf_member` CPT proposal)
- Dev site architecture review (Hello Elementor, ACF Pro, 5 existing pages, `gf_headstone` CPT)
- Live site page fetches (gullforce.org.au — 13 static HTML pages)

---

## 1. Site Purpose & Dual Mission

The Gull Force Association has **three stated aims** (from `About_us.html`):

1. **Veteran support** — ongoing support network for Gull Force veterans and families
2. **Community awareness** — raise awareness of events important to Gull Force
3. **Humanitarian aid** — material, practical, and emotional support to the people of Ambon

The new site must serve **two temporal dimensions simultaneously**:
- The **historical** (honoring 1,131 men sent to Ambon; 779 who gave their lives; the full wartime arc from Trawool 1940 to liberation 1945)
- The **contemporary** (the active Association; pilgrimages to Ambon; charitable works; annual commemorations)

This duality should be explicit in the navigation, not buried. A visitor arriving to research their grandfather should never land in the middle of the events calendar, and vice versa.

---

## 2. Primary Audiences & User Journeys

### Audience 1: Descendants & Family Members
*"My grandfather was in Gull Force. I want to find him and learn what happened."*

- **Entry point:** search by name, or Google landing on a veteran profile
- **Journey:** Veterans Directory → individual veteran profile → service record, photos, fate, memorials, family stories
- **Emotional need:** connection, recognition, dignity for their ancestor
- **Key feature:** every veteran has a named, findable page — not buried in a gallery grid

### Audience 2: Historians & Researchers
*"I'm studying the Ambon campaign / writing about a specific soldier."*

- **Entry point:** Our History section, Articles & Contributions, veteran profiles
- **Journey:** Battalion history → academic theses → primary documents → oral history videos → individual veteran data
- **Functional need:** citable, downloadable resources; structured service records; referenced images with captions

### Audience 3: Contemporary Association Members
*"I want to attend the next event / buy a pin / renew my membership."*

- **Entry point:** Homepage → Calendar of Events or Memorabilia
- **Journey:** Events list → Membership info → Contact / Order form
- **Functional need:** current event dates, membership form, merchandise order

### Audience 4: General Public & Educators
*"I'm learning about Australian WWII history and want to understand Gull Force."*

- **Entry point:** Home hero or search
- **Journey:** Home → Our History → Veterans Photos → Pilgrimages
- **Need:** compelling narrative, quality images, clear context

---

## 3. Information Architecture — Current vs Proposed

### Current Dev Nav (5 pages)
```
Home | Community | Pilgrimages | Memorabilia | Contact
```

**Problems:**
- "Community" is an ambiguous label for the headstone/veteran content
- No home for Battalion History, Veterans Photos, Plaques, Articles, or the Veteran Directory
- Pilgrimages is the right label but underrepresents the full historical archive content
- No explicit space for the Association's contemporary work

### Proposed Navigation (7 top-level, some with dropdowns)

```
HOME  |  OUR HISTORY ▼  |  THE MEN ▼  |  REMEMBRANCE ▼  |  ARCHIVES ▼  |  THE ASSOCIATION ▼  |  MEMORABILIA
```

**OUR HISTORY dropdown:**
- 2/21st Battalion History
- 1/21st Battalion History
- The Ambon Campaign (links to Pilgrimages page top)

**THE MEN dropdown:**
- Veterans Directory (searchable gf_member CPT archive)
- Veterans Photos (photographic archive — 200+ named images)
- Nominal Roll (download page — PDF)

**REMEMBRANCE dropdown:**
- Pilgrimages to Ambon
- Plaques & Memorials
- Calendar of Events

**ARCHIVES dropdown:**
- Articles & Contributions
- Videos & Oral Histories

**THE ASSOCIATION dropdown:**
- About & Aims
- Membership
- Our Work in Ambon (charitable mission — currently underrepresented)

**Rationale for "THE MEN" label:**
This phrase echoes the site's own language — "the 1,131 men who were sent to defend Ambon." It is historically resonant, clear in intent, and appropriate for the commemorative context. It anchors the site's purpose visibly in the nav.

---

## 4. The Veteran as Central Data Model

### Why a veteran-centred architecture?

The live site is a flat collection of pages and images. A family member searching for their ancestor must manually scroll through 200+ photos, 300+ headstone images, and unstructured gallery pages. The new site should make every named veteran **discoverable** — and once found, should surface **all content related to them** from across the site.

This is the "data-driven but highly navigable" requirement.

### Data Architecture

Three CPTs (two new, one existing):

```
gf_member       (363 veterans — public historical record)
gf_headstone    (53 Ambon War Cemetery grave markers — EXISTING)
gf_memorial     (plaques and memorial sites — NEW)
```

Plus one taxonomy:
```
gf_company      (A Coy, B Coy, D Coy, HQ Coy, Officers, BHQ, Attached)
```

And one ACF field group on WP Media attachments:
```
veterans_tagged → ACF Relationship → gf_member[]
```
(Allows each photo to be tagged with which veterans appear in it.)

### gf_member CPT — Full Field Schema

**Core Service Record (always public):**
| Field | Type | Notes |
|-------|------|-------|
| `service_number` | text | e.g. "VX 24681" |
| `member_rank` | select | Pte., Cpl., L/Cpl., Sgt., CSM., 2Lt., Lt., Capt., Maj. |
| `member_surname` | text | For display and search |
| `member_given_names` | text | Full given names where available |
| `member_initials` | text | Initials (from nominal roll where given names unknown) |
| `member_unit` | taxonomy | gf_company taxonomy term |
| `war_history` | select | Ambon, Hainan, Escaped, Escaped (uncertain), RTA |
| `state_prefix` | select | VX, NX, QX, SX, TX, WX, other |

**Dates & Vital Records:**
| Field | Type | Notes |
|-------|------|-------|
| `date_of_birth` | date | Where known |
| `date_of_death` | date | Where applicable |
| `place_of_birth` | text | Town/suburb where known |
| `age_at_death` | number | Auto-compute from DoB/DoD if both known |

**Burial & Memorial:**
| Field | Type | Notes |
|-------|------|-------|
| `cemetery` | text | Cemetery name |
| `cemetery_state` | text | State or country |
| `cemetery_plot` | text | Section/row/grave ref (from CWGC data) |
| `headstone_link` | Relationship → gf_headstone | Links to cemetery photo where it exists. Only ~121 of 363 will have this. |

**Rich Media (the new capability):**
| Field | Type | Notes |
|-------|------|-------|
| `portrait_photo` | image | Primary identified portrait |
| `service_photos` | gallery | Additional photos from Veterans Photos archive |
| `documents` | repeater (file + label) | PDFs, DOC files related to this veteran |

**Biography & Stories:**
| Field | Type | Notes |
|-------|------|-------|
| `biography` | wysiwyg | Full narrative where known |
| `pre_war_occupation` | text | Civilian career/trade |
| `post_war_story` | wysiwyg | Survivors only |
| `family_stories` | repeater (title, author, wysiwyg) | Submitted tributes and family accounts |

**Research Admin (back-end, not shown on frontend):**
| Field | Type | Notes |
|-------|------|-------|
| `legacy_id` | text | CSV AddressID for data lineage |
| `record_verified` | true_false | Manual QA flag |
| `sources` | repeater (citation + URL) | Provenance |

### gf_memorial CPT — Field Schema

| Field | Type | Notes |
|-------|------|-------|
| `location_name` | text | e.g. "Shrine of Remembrance, Melbourne" |
| `location_state_country` | text | VIC / Hainan Island, China |
| `dedication_date` | date | When unveiled |
| `unveiled_by` | text | Named individuals |
| `gallery` | gallery | 2–4 photos of the memorial |
| `description` | wysiwyg | Inscription text, context |
| `veterans_commemorated` | Relationship → gf_member[] | Optional: link to specific veterans named on plaque |
| `geo_lat` / `geo_lng` | text | For optional map display |

### Cross-linking architecture

When a veteran's profile page is viewed, it dynamically pulls:
1. Their portrait + service record (from gf_member fields)
2. Their headstone photo (from linked gf_headstone post)
3. All photos they're tagged in (reverse query on media attachment `veterans_tagged`)
4. All memorials they're commemorated on (reverse query on gf_memorial `veterans_commemorated`)
5. Any documents in their `documents` repeater
6. Any family stories in their `family_stories` repeater

This is achieved via custom shortcodes or Elementor custom queries — no plugin required beyond ACF Pro.

---

## 5. Page-by-Page Content Decisions

### 5.1 HOME (Post 12) — Retain, Add Cross-Links

Current Home is content-complete. One addition:
- Add "Start here" pathways section: three CTA cards
  - "Find a veteran" → Veterans Directory
  - "Our story" → 2/21st Battalion History
  - "Support our work" → The Association / Membership

### 5.2 OUR HISTORY — Two New Pages

**A. 2/21st Battalion History** (new page)

Two-column Elementor layout:
- Left: full narrative text (Trawool → Darwin → Ambon → Laha Massacre → POW → Liberation)
- Right: sticky sidebar with:
  - Timeline milestones (same pattern as Pilgrimages timeline)
  - Key statistics: 1,131 men, 779 casualties, 229 massacred at Laha, 267 to Hainan
  - Images: Ambon map, corvettes photo (download from live site)
  - "Learn more about the men" → CTA to Veterans Directory

Sections (use `<h2>` heading anchors for internal links):
- Formation at Trawool, 1940
- Darwin, 1941
- Embarkation to Ambon, December 1941
- The Invasion, January 1942
- The Laha Massacre
- Captivity — Ambon
- Captivity — Hainan
- Liberation, 1945

ACF field group: `group_gf_battalion_history` on a new page (post to be created).

**B. 1/21st Battalion History** (new page)

Short single-column page:
- Narrative: formation 1915, Gallipoli, Western Front, disbandment 1918, reconstitution 1921
- Sidebar: 3 images (James Horsburgh, Horsburgh portrait, 21stBn circa 1950)
- Notable: Private James Martin (youngest casualty, 14), Sgt Albert Lowerson (VC), Lt James Horsburgh (MM, DCM)
- Brief note on connection to 2/21st Battalion

ACF: simple wysiwyg + gallery, or inline Elementor.

### 5.3 THE MEN

**A. Veterans Directory** (new page — flagship feature)

The most important new page for descendants and researchers.

Layout:
```
[Search by name or service number ____________]
[Filters: Company ▼ | Status ▼ | State ▼]
[Showing 363 veterans]

[Card] [Card] [Card] [Card]   ← 4-col grid, 3-col tablet, 1-col mobile
```

Veteran card:
```
┌────────────────────────────┐
│  [Portrait or silhouette]  │
│  Pte. John Smith VX-24681  │
│  B Company                 │
│  ● Died — POW Ambon        │
└────────────────────────────┘
```

Status badge colours (accessible contrast ratios):
| Status | Badge colour | Background |
|--------|-------------|------------|
| Survived | Olive green | Cream |
| Escaped | Amber | Light ochre |
| KIA | Dark navy | Steel grey |
| Massacred — Laha | Crimson | Rose |
| Died in captivity — Ambon | Dark red | Blush |
| Died in captivity — Hainan | Burgundy | Mauve |
| Unknown | Slate grey | Warm grey |

Search: client-side filtering (JavaScript on page load) — same pattern as existing headstone grid shortcode `[gf_headstone_grid]`. Extend the `[gf_veteran_directory]` shortcode to add filter dropdowns.

Veteran profile page (auto-generated by CPT single template):
- Header: full-width portrait or silhouette placeholder
- Left column: service record table (number, rank, unit, war history, dates, cemetery)
- Right column: portrait + headstone photo (if linked)
- Below: tabs or accordion
  - Photos (gallery of all photos they're tagged in)
  - Documents (any PDFs/DOCs)
  - Family Stories (tributes and accounts)
  - Related Memorials (plaques they're commemorated on)
  - "Share this page" (for descendants to share with family)

**B. Veterans Photos** (new page — largest content migration)

Not a raw gallery dump — organised chronologically by era. Each era is a named section with a brief introductory paragraph.

Era sections:
1. **Company Portraits** (pre-embarkation group shots: B Coy, D Coy, A Coy, HQ Coy, Officers)
2. **Training — Trawool & Bongilla, 1940** (tent camp, training activities, early personnel)
3. **Darwin, 1941** (camp life, sports, recreation, the march, crocodile photos)
4. **The 2/21st Battalion Band** *(dedicated section — poignant)*
   - "What happened to the band?" — the caption from the live site documents 25+ individual fates (executions at Laha, deaths as POWs, one killed in Chinese ambush, survivors)
   - This section deserves prominent treatment — it is one of the most emotionally resonant stories on the entire site
5. **Captivity — Hainan** (Hashio Camp, Samah Hospital photos)
6. **Liberation & Return** (POW return photos, 1945)
7. **Post-War Reunions** (circa 1950, 1985, 2005 Government House, 2010–2012 ANZAC marches)

Implementation:
- Each era uses an ACF gallery field on a new page
- Captions carry named individuals — this is mandatory, not optional
- Where a caption names a veteran whose name matches a `gf_member` record, the caption includes a hyperlink to their profile
- Download: POW story.doc as a "Further Reading" card at page bottom

ACF fields for this page (`group_gf_veterans_photos`):
- `photos_intro` wysiwyg
- `era_company_portraits` gallery
- `era_training_1940` gallery
- `era_darwin_1941` gallery
- `era_band` gallery
- `band_story` wysiwyg (the "What happened to the band?" narrative)
- `era_captivity_hainan` gallery
- `era_liberation` gallery
- `era_reunions` gallery
- `pow_story_download` file (POW story.doc)

**C. Nominal Roll** (new simple page)

Replace the live site's text-only page with a proper resource page:
- Brief explanation (compiled by Paul Liversidge from Courtney Harrison's *Ambon Island of Mist*)
- Download button: Gull Force — Nominal Roll.pdf
- Note: "Can't find who you're looking for? Search the Veterans Directory (link) or contact us."
- Mention CWGC records and how to access them

### 5.4 REMEMBRANCE

**A. Plaques & Memorials** (new page — uses gf_memorial CPT)

Layout: tabbed by geography (or a single scrolling page with anchor links)

Australian Memorials tab:
- Ballarat POW Memorial (Ballarat, VIC)
- Heidelberg Repatriation Hospital (VIC)
- Darwin (NT)
- Mornington POW Memorial (VIC)
- Swan Hill Riverside Gardens (VIC)
- Trawool (VIC)
- Memorial Tree, Shrine of Remembrance (Melbourne, VIC) — unveiled Oct 1995; plaque added 1 Feb 2009
- Australian War Memorial (Canberra, ACT) — unveiled 20 March 2009

International Memorials tab:
- Hainan Island, China — Tom Pledger at dedication
- Singapore Memorial — inscription on wall

Each memorial entry:
```
┌─────────────────────────────────────────────────────┐
│  BALLARAT POW MEMORIAL                              │
│  Ballarat, Victoria                                  │
│  [Image 1] [Image 2] [Image 3]                       │
│  Dedicated: [date]  Unveiled by: [name]             │
│  [Description paragraph]                            │
│  Veterans commemorated: [linked names]              │
└─────────────────────────────────────────────────────┘
```

Optional future: a Google Maps embed showing pins for all memorial locations.

**B. Pilgrimages to Ambon** (existing page — expand significantly)

The dev site's Pilgrimages page is already well-structured. Expand with:

1. **Historical Archive section** — add pre-1998 photos organised by year:
   - 1979 (2 photos)
   - 1983 (Kudamati memorial, 2 photos)
   - 1985 — Hainan pilgrimage (2 photos)
   - 1987 (bridge of sighs, statue, 2 photos)
   - 1988 (Kudamati, Laha)
   - 1996 (Anzac Day at Ambon)
   - 1999 (Kudamati)

2. **Individual grave photos** — add to POW gallery or create a separate sub-gallery:
   - Named grave crosses: Womersley, E R Smith, B A E Haley, Colin Goodwin, Francis Henry Jordan, Frederick Schaefer
   - Cemetery honour wall
   - Ambon War Cemetery series

3. **Historical map** — 1943 Tan Toey map as a zoomable image

4. **Video embeds** — per pilgrimage year in the timeline (YouTube, 2007–2015):
   - Add video sub-field to the pilgrimage timeline repeater: `pilgrimage_videos` (repeater of URL + title)

5. **Additional downloads:**
   - Ambon Pilgrimage report 2013.docx
   - Ambon 2015 by A Miles.pdf
   - Aerial Photograph description.doc (for the aerial camp photo)

**C. Calendar of Events** (new page — client-editable)

Implementation: ACF repeater on a dedicated page (no plugin needed).

ACF fields (`group_gf_events`):
```
events → repeater:
  - event_date (date field)
  - event_title (text)
  - event_location (text)
  - event_time (text — e.g. "11:15am assembly, 12 noon service")
  - event_description (textarea)
  - event_image (image — optional)
```

Display: upcoming events shown first (filter events with date >= today), past events auto-archived. Client can edit via standard ACF interface in WP admin.

Current recurring events to pre-populate:
- Shrine Pilgrimage + AGM (first Sunday of February)
- ANZAC Day March Melbourne (25 April)

### 5.5 ARCHIVES

**Articles & Contributions** (new page — multi-content type)

This page has the most content diversity. Use accordion or tab layout within Elementor to organise content types. Do NOT dump everything in one scrolling wall.

Section structure:

**1. In Their Own Words — Video Oral Histories**
The most valuable section. Four veterans recorded interviews:
- Tom Pledger (YouTube)
- Bob Allen (YouTube)
- Vernon Ball (YouTube)
- Jack Serant (YouTube)
Display as 2x2 video card grid with thumbnail, name, brief intro sentence.

**2. Watch & Listen — Videos**
- Anzac Day March Melbourne 2019 (Facebook — Gull Force at 49 min mark)
- Full Gull Force YouTube collection (playlist embed)
- Japanese Surrender on USS Missouri, 2 Sep 1945
Display as a 3-column grid of video cards.

**3. Poetry & Tributes**
Styled pull-quote layout on a cream background:
- "A Soldier's Prayer" — Pompey Jackson (age 22, executed at Ambon)
- "The Heroes Behind the Fence" — Gillian Moxom
- "The Fate of the 2/21st" — anonymous, 1941
- "My Grandfather" — Sharon Lee, 2018
Each poem in a bordered card with author byline. Link author name to their veteran profile where applicable (e.g. Pompey Jackson → veteran record).

**4. Personal Stories & Biographies**
Download card layout:
- Brian Alexander Evelyn Haley biography (1 BRIAN Biography.docx)
- Bill Doolan — killed in action (Bill Doolan article.pdf)
- Frank McCormack — letters home (McCormack001-003.pdf, McCormack telegrams.pdf)
- Caitlyn Antella assignment (Antella1.pdf, Antella2.pdf)
- POW story (POW story.doc) — cross-posted from Veterans Photos

**5. Artefacts**
Gallery of the 25 tin photographs (tin1.jpg – tin25.jpg):
- Caption: "Items found in a tin — personal effects and wartime artefacts from Sapper E.A. Rush (VX25649)"
- Lightbox gallery with captions
- Alongside: sketch by G.G. Locharini (died 7/9/45) depicting Ron Field

**6. Historical Documents**
A curated document gallery with context:
- Letter from Darwin, 7 May 1942
- Telegram (wartime)
- Frederick Schaefer death telegram
- "Massacre of 300" newspaper article
- Scroll for Hudswell
- Invictus (2 pages)
- "To the Women of Australia" badge (3 stars)
- R Field portrait
- Syd Riddock portrait

**7. Academic Research**
Cards with author, title, institution, year, download/link:
- David Evans PhD — "The Ambon Forward Observation Strategy 1941-1942: A Lesson in Military Incompetence" (Murdoch University)
- Paul Rosenzweig MA — "Ziarah. The Gull Force Association Pilgrimages to Ambon" (CDU)
- Seven Soldiers Sons — sevensoldiersons.com.au

**8. Music — In Memoriam**
The Lloyd Swanton Ambon double CD (Bugle Records, released October 2014):
- Stuart Swanton's coded diary as source material
- Jazz, military marches, spoken word
- Link to purchase / streaming
- This fits here rather than on About Us — it's a creative contribution to the Gull Force story

### 5.6 THE ASSOCIATION (About Us — Expand)

Currently the Home page has association aims and membership info in ACF. The Association section should have its own page (or dropdown items):

**About & Aims page:**
- The three association aims (support network, community awareness, humanitarian aid)
- Brief association history (founded post-WWII by veterans)
- Current committee/contacts (where the association is comfortable publishing)

**Membership page:**
- Currently split across Home and Contact — consolidate here
- Life membership: $35 AUD (includes lapel pin)
- Newsletter: $20 for 2 years (posted copy)
- Download membership form (currently pending — placeholder)
- Pay by post (P.O. Box 233, Wendouree VIC 3355)

**Our Work in Ambon page (NEW — currently invisible on the site):**
The third aim ("material, practical, and emotional support to the people of Ambon") is entirely absent from the dev build. This is a significant omission given it's a core association purpose. This page should:
- Describe the charitable work the association has done/does in Ambon
- Feature pilgrimage photos showing interaction with Ambon community
- Reference the Ambon-Australia relationship across the decades
- Potentially include a donate/fundraise component if applicable

### 5.7 MEMORABILIA (Post 14) — Minor Additions

Add two missing WooCommerce products:
- Gull Force Pen
- Gull Force Stubby Holder

Both need: product image (from live site), price, short description. Use existing WooCommerce product setup matching current 5 products.

---

## 6. UI Patterns & Design Principles

### Tone
- **Respectful and dignified** — this is a memorial site first
- No decorative flourishes, no playful microinteractions
- Warm and human — these are real people with real families
- Accessible — the audience includes older users; high contrast, legible font sizes

### Colour palette (extend existing dev site)
- Primary navy: `#1a2744` (existing dark hero background)
- Gold/brass: `#c9a227` (existing accent — medals, WWII insignia aesthetic)
- Warm cream: `#f5f0e8` (for content sections — archival/paper feel)
- Muted red/crimson: `#8b1a1a` (KIA status badges only — used sparingly)
- Olive: `#4a5c3a` (survivor status)
- White: `#ffffff` (clean content areas)

### Typography
- Headings: serif (Playfair Display or similar — dignity, history)
- Body: clean sans-serif (Open Sans or Inter — readability)
- Captions: italic, smaller, warm grey — archival feel
- Service record data: monospace or tabular-nums (numbers align cleanly)

### Photography
- Named captions on **every** historic photo — this is mandatory, not optional
- For photos with no portrait available: use a respectful silhouette placeholder (soldier profile, not a generic person icon)
- Lightbox on all galleries — click to enlarge with full caption
- Lazy loading (already default in Elementor — keep)

### Status badges
Consistent visual language across Veterans Directory and individual profiles:
- Small pill/badge next to veteran name
- Maximum 2-3 words: "Survived", "Died — Ambon", "Died — Hainan", "Massacred — Laha", "Escaped"
- Screen-reader accessible (aria-label)

### Search & filtering
- The search input should appear in the site header (sticky) for one-click access to veteran lookup
- On the Veterans Directory: filter dropdowns above the grid (Company, Status, State prefix)
- All filtering client-side for performance (363 records loads fine as JSON)
- Mobile: filters collapse into a single "Filter & Sort" button revealing a drawer

### Navigation
- Sticky header on scroll
- Active state on current top-level item
- Dropdown on hover (desktop) / tap (mobile)
- Mobile: hamburger → full-screen overlay nav (dark navy background, gold links)
- "Find a veteran" search appears in sticky header at all widths

---

## 7. Implementation Phases

### Phase 1 — Veteran Database & Core History (4–6 weeks)
*Establishes the data model everything else connects to.*

1. `gf_member` CPT + ACF field groups (as per schema above)
2. Register `gf_company` taxonomy
3. CSV import script — 363 veterans (service data only; no private contacts from the 470 non-veterans)
4. `[gf_veteran_directory]` shortcode: searchable/filterable grid + single template
5. **Veterans Directory** page (new)
6. **2/21st Battalion History** page (new, ACF + Elementor)
7. **1/21st Battalion History** page (new, short, inline Elementor)

### Phase 2 — Content Migration (3–4 weeks)
*Fills the largest content gaps from the live site.*

8. **Veterans Photos** page: ACF field group + 8 era galleries + bulk import from live site
9. **Plaques & Memorials** page: `gf_memorial` CPT + ACF + content from live site (24 images)
10. **Articles & Contributions** page: 8-section structure, YouTube embeds, PDF upload, artefact gallery
11. **Historical Ambon expansion**: add 50+ historical images to Pilgrimages page
12. **Pilgrimage videos**: embed YouTube 2007–2015 per timeline entry
13. **About Us / Association** pages: split Home ACF content into dedicated pages
14. **Nominal Roll** download page

### Phase 3 — Polish & Cross-Linking (2–3 weeks)
*Activates the data-driven navigation.*

15. ACF Relationship field on media attachments: `veterans_tagged`
16. Tag photos in Veterans Photos galleries to veteran records (manual — prioritise B/D/A/HQ Coy group shots and named individual series)
17. `gf_memorial` → `veterans_commemorated` relationships populated
18. Veteran single-page template: dynamic related content pulls (photos tagged in, memorials linked)
19. **Calendar of Events** page: ACF repeater, client-editable, 2 recurring events pre-loaded
20. 2 missing WooCommerce products (Pen, Stubby Holder)
21. Navigation redesign: expand to 7-item nav with dropdowns
22. Site-wide veteran search in sticky header
23. "Our Work in Ambon" page (charitable mission)

---

## 8. Key Decisions & Rationale

### Decision: gf_member CPT rather than embedding veteran data in Community page
The Community page (post 13) currently has a `veteran_portraits` repeater. This is insufficient for 363+ records with rich media and cross-linking. A proper CPT with its own archive URL and single template is the right structure. The Community page becomes the editorial home for battalion-wide content (headstone grid, stories); the new Veterans Directory is the factual record.

### Decision: gf_memorial CPT rather than a static ACF gallery page
Memorial data (location, GPS, dedication date, unveiling names, veterans commemorated) benefits from structured fields. A CPT allows individual memorial records to be linked from veteran profiles. The overhead of a CPT vs. a page gallery is justified here.

### Decision: Do not merge Veterans Photos into Veterans Directory
These serve different purposes. Veterans Photos is a photographic archive — images are the primary object, veterans are named in captions. Veterans Directory is a people archive — veterans are the primary objects, photos are attachments. The cross-link (photos tagged with veteran IDs) bridges them without merging them.

### Decision: Client-side filtering for Veterans Directory
363 records is well within the range that loads cleanly as JSON (< 100KB). Client-side filtering (like the existing headstone grid shortcode) avoids AJAX round-trips and works offline for families who archive the page. Use the same JavaScript pattern already established in `gull-force.php` mu-plugin.

### Decision: Keep Hello Elementor theme
No reason to change. The theme is intentionally minimal — all design is in Elementor. Extending with new shortcodes and CPT templates follows the existing pattern.

### Decision: No external veteran database (e.g. Supabase)
ACF Pro + WP REST API provides sufficient data management for this use case. A Supabase integration would require custom frontend development and wouldn't integrate with Elementor. The existing WP infrastructure (already running, already configured, client familiar with WP admin) is the right tool.

---

## 9. Confirmed Asset Inventory (Local)

All assets are located under:
`/home/jtaylor/everything-claude-code/docs/projects/gull-force/content/`

### Images

| Directory | Count | Contents |
|-----------|-------|----------|
| `images/` | 731 | Veteran portraits (named), company groups, plaques (57), Ambon historical (85), band (18), Darwin (32), tin artefacts (26), historical documents (13), reunion/ANZAC (5) |
| `headstones/` | 605 | Ambon War Cemetery headstone photos — filename = surname + initials (e.g. `Adams H.G..JPG`) |
| `jpgs-raw/.../Ambon trip 2017/` | 484 | 2017 Ambon trip (352 main + 34 curated share + 98 morePhotos) |
| `jpgs-raw/.../Ambon Head Stones/` | 404 | Duplicate/subset of headstones dir |

**Critical discrepancy:** The dev site Community page currently has **53 headstone records**. The `headstones/` directory contains **605 images**. Expanding the headstone grid to the full 605 is a separate action item from this UI/UX work but should be scheduled as Phase 1.5.

### Community/Charity Work Photos (confirmed — for "Our Work in Ambon")

In `images/` — 32 confirmed pilgrimage community photos:
- `2011 with Gov.JPG` — reception with Governor of Maluku province
- `2011 choir.JPG`, `2011 welcome.JPG`, `2011 reception.JPG` — community welcome ceremonies
- `2011 Leahari.JPG`, `2011 Pombo.JPG` — named community/village visits
- `Samah Hospital.jpg` — hospital visit (direct evidence of healthcare charitable work)
- `letter from Governor001.jpg` — official correspondence from Governor of Maluku
- Kudamati 2013 series (5 photos) — memorial restoration work
- 2011 Laha service + wreath series (6 photos)

### Documents

| Directory | Key Files |
|-----------|-----------|
| `documents-historical/` | `Gull Force - Nominal Roll..pdf`, `McCormack001-003.pdf`, `McCormack telegrams.pdf`, `Antella1-2.pdf`, `Bill Doolan article.pdf`, `Ambon 2015 by A Miles.pdf`, `Commemoration booklet 2014/2017/Kudamati.pdf`, `KUDAMATI AUSTRALIAN MONUMENT - AMBON.pdf` |
| `documents-historical/` | Grant documents: `Grant 2018001.pdf`, `Lega approval 2020002.pdf`, `grant3011.pdf`, `grant agreement signed.pdf`, `Funding Application for duty.pdf` — evidence of formal funded charitable programs in Ambon |
| `documents-historical/` | `Tawiri repair 2019.pdf` — Association-funded site repair at Tawiri |
| `documents-historical/` | `List of the deceased Part I.pdf`, `List of the deceased Part II.pdf` — additional CWGC casualty lists |
| `access-db/` | `Gullforce Member List.mdb` (source database), `AmbonTrip.accdb` (pilgrimage records) |

### Veteran CSV

**Location:** `content/member-data/gullforce-members.csv`
- 833 total records = **368 veterans** (have Rank field) + **465 non-veterans** (relatives, researchers)
- War History distribution: 182 Hainan · 122 Ambon · 40 Escaped · 11 Escaped? · 3 RTA · 6 blank/unknown
- State prefixes: VX (Victoria) dominant; NX (NSW), QX (Qld) also present
- Private contact data (address, email, phone) exists for non-veterans — must NOT be imported into WordPress. Veterans' CWGC data (cemetery, plot reference) is safe to publish.

### Still Required from Client

| Asset | Needed For | Status |
|-------|-----------|--------|
| Membership form PDF | Contact / Membership page | Client to supply — placeholder coded |
| Gull Force Pen product image | Memorabilia | Fetch from live site or client |
| Stubby Holder product image | Memorabilia | Fetch from live site or client |
| "Our Work in Ambon" narrative text | Association page | Client to write — photos exist |
| Caption/context for 2017 "Ambon share" photos | Pilgrimages / Our Work in Ambon | 34 images with DSC filenames only |

---

## 10. Client Q&A — Resolved

These questions were put to the client and answered. The analysis has been updated accordingly.

**Q1: "Our Work in Ambon" — photos and charitable activities?**
> "There are photos of the associations visits to orphanages, schools, and hospitals. The group bring items of value (medical supplies, etc.) rather than direct financial contributions."

*Resolved:* Photo evidence confirmed locally (`Samah Hospital.jpg`, 2011 community series, grant documents). The "Our Work in Ambon" page should feature: visit photos, named community locations (Leahari, Pombo, Tulehu), types of contributions (medical supplies, materials), and the grant-funded programs. No fundraising component — the Association contributes in-kind. Narrative text still needed from client.

**Q2: Calendar of Events — archive past events?**
> "Archive."

*Resolved:* Events ACF repeater displays all events. Past events (date < today) render in an "Archive" section below upcoming events, or on a separate tab. Both upcoming and past events remain visible.

**Q3: Veterans historical records — privacy concerns?**
> "Veterans historical records are already matters of public record."

*Resolved:* All 368 veteran records can be published in full. Service number, rank, unit, war history, cemetery/plot reference, date of death — all fields are safe to publish. The 465 non-veteran records (relatives) must NOT be in WordPress.

**Q4: Family story submissions?**
> "Yes, we hope to develop a separate members area for forums, additional materials, etc."

*Resolved:* Plan a future members area. For Phase 1–3, design the architecture to accommodate it:
- Add a `members_only` boolean to `gf_member` and content ACF fields (for future gating)
- Use a user role `gf_member` in WordPress (placeholder, no functionality yet)
- Family story submission form: build as a public form for now, with admin moderation. Content goes live only after association approval. This is achievable in Phase 3 without a full members system.

**Q5: Lloyd Swanton Ambon CD?**
> URL: https://www.birdland.com.au/lloyd-swanton-ambon

*Resolved:* Birdland Records, $32 AUD, 2CD set, currently back-ordered. Sydney Morning Herald called it "an extraordinary achievement" and "a conceptual and compositional triumph." Features Stuart Swanton's coded prison camp diary, 12 Australian musicians, includes historical photographs in booklet. Place in Archives → Articles & Contributions section 8 ("Music — In Memoriam"). Use direct product link. No affiliate arrangement assumed.

**Q6: Veteran CSV location?**
> "Provide location of existing veteran CSV."

*Resolved:* `content/member-data/gullforce-members.csv` — 833 rows, 368 veterans, 465 non-veterans. The Access database source is at `content/access-db/Gullforce Member List.mdb` for reference. Import script should filter `WHERE Rank != ''` to isolate veterans only.
