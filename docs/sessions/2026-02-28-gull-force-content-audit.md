# Session: Gull Force — Live Site Content Audit

**Date:** 2026-02-28
**Scope:** Full audit of gullforce.org.au (live static HTML site) vs Elementor dev site (DDEV). Identifies all content, assets, and resources on the live site that are not yet represented in the dev build.
**Next Session:** UI/UX review — determine how to surface unimplemented content in the new site.

---

## Live Site Overview

The live site at `gullforce.org.au` is a **static HTML site** (13 `.html` files). There is no CMS or database — all assets are flat files on the server. Navigation structure:

```
index.html               → Home
About_us.html            → About Us
Battalion_History.html   → Battalion History
Photos.html              → Photos (placeholder only — no gallery content)
Plaques.html             → Plaques and Memorials
Veteran's_photos.html    → Veteran's Photos
Ambon_photos.html        → Ambon (Pilgrimages)
Historical_Ambon.html    → Historical Ambon
Articles_and_Contributions.html → Articles & Contributions
Veteran.html             → Veteran's List
Newsletter.html          → Calendar of Events
Merchandise.html         → Merchandise
1_21Bnpage.html          → 1/21BN History
```

---

## Dev Site Overview

Five published pages (WordPress + Elementor + ACF), plus WooCommerce:

| Post ID | Page | Content |
|---------|------|---------|
| 12 | Home | Hero, association aims, membership info |
| 13 | Community | 53 Ambon War Cemetery headstone images, veteran content |
| 14 | Memorabilia | 5 WooCommerce products + order form PDF |
| 15 | Contact | Email, postal address, membership info (membership form PDF pending) |
| 16 | Pilgrimages | Structured timeline 1979–2017, POW gallery (8 images), 2017 gallery (374 images), 3 commemoration booklets |

---

## Page-Level Mapping: Live → Dev

| Live Page | Dev Equivalent | Status | Notes |
|-----------|----------------|--------|-------|
| Home | Home | ✅ | Full match |
| About Us | Home (partial) | ⚠️ | Aims + membership in Home ACF; Lloyd Swanton CD announcement not captured |
| Battalion History | — | ❌ | Entirely missing |
| Photos | — | — | Placeholder on live; no content worth migrating |
| Plaques & Memorials | — | ❌ | Entirely missing |
| Veteran's Photos | — | ❌ | Entirely missing — largest content area on the live site |
| Ambon (Pilgrimages) | Pilgrimages | ✅ | Dev is richer: structured timeline vs flat HTML page |
| Historical Ambon | Pilgrimages (partial) | ⚠️ | Dev has 8 POW camp images; live has 50+ pre-1998 historical images |
| Articles & Contributions | — | ❌ | Entirely missing |
| Veteran's List | — | ❌ | Entirely missing |
| Calendar of Events | — | ❌ | Entirely missing |
| Merchandise | Memorabilia | ⚠️ | 5 of 7 products; missing Pen and Stubby Holder |
| 1/21BN History | — | ❌ | Entirely missing |

---

## Content Gap Detail

### 1. Battalion History
**Live page:** `Battalion_History.html`

Full narrative of 2/21st Battalion formation at Trawool (Aug 1940), march to Bongilla, transit to Darwin, and deployment to Ambon. Covers composition of Gull Force (1,131 men), the January 1942 Japanese landing, surrender, and POW captivity narrative.

**Images on live site:**
- `Ambon map.jpg`
- `corvettes.jpg`

**Status:** ❌ No equivalent in dev.

---

### 2. Veteran's Photos
**Live page:** `Veteran's_photos.html`

The **largest content area on the live site** by volume. 200+ individually named historical photographs with detailed captions identifying servicemen by name and role.

**Content categories:**
- Company group photos (B Coy, D Coy, A Coy, HQ Coy, Officers) with full roll calls in captions
- Pre-embarkation portraits and group shots (Trawool 1940)
- March to Darwin and train journey (1941)
- Darwin camp life (training, boxing, weight training, band, mess tent, recreational)
- Individual veteran portraits (named series: Searant ×8, Beckwith ×7, Hawksworth ×17, Arrowsmith ×7, Boulton ×4, McLeavy ×3, Jordan ×4, Booth ×3, Haley ×3, etc.)
- Darwin crocodile/fish photos, Lee Point picnic
- 2/21st Battalion Band (multiple group and march shots)
- Post-war reunion photos (circa 1950, later years)
- Hainan POW camp photos (Hashio Camp, Samah Hospital)
- ANZAC Day 2012

**Sample image filenames:**
`B Coy Group photo.JPG`, `D Coy Group photo.jpg`, `Officers.png`, `Roach.jpg`, `Marching 1941.png`, `Gilbert1-3.jpg`, `S Hawksworth 1–17.jpg`, `Band marching.jpg`, `2 21st Band.jpg`, `Hashio Camp Hainan.jpg`, `PoW return.png`, `Reunion.JPG`, `Anzac-Day-2012.jpg` (+ ~180 others)

**Downloads on live page:**
- `POW story.doc`

**Status:** ❌ No equivalent in dev.

---

### 3. Plaques & Memorials
**Live page:** `Plaques.html`

20+ photos documenting memorial plaques and dedications at multiple sites across Australia, China, and Singapore.

**Locations covered:**
| Location | Notes |
|----------|-------|
| POW Memorial, Ballarat VIC | Multiple photos |
| Heidelberg Repatriation Hospital | Plaque unveiling by Bill Cook |
| Hainan Island | Tom Pledger at dedication ceremony |
| Darwin | Same design as Hainan Island plaque, unveiled 2002 |
| Singapore Memorial | Inscription on wall |
| POW Memorial, Mornington VIC | |
| Riverside Gardens, Swan Hill VIC | |
| Trawool VIC | |
| Memorial Tree, Shrine of Remembrance, Melbourne | Gull Force veterans unveiling Oct 1995; Walter Hicks unveils descriptive plaque 1 Feb 2009; plaque at base of tree |
| Australian War Memorial, Canberra | Walter Hicks + Eddie Gilbert unveiling 20/03/2009; pathway location map included |

**Image filenames:**
`Ballarat1.JPG`, `GullForce powmem2.jpg`, `Gull Force-Ballarat.jpg`, `Gull Force H W.jpg`, `Chinaplaque.jpg`, `Chinaplaque1.jpg`, `Hainan plaque.jpg`, `ambon plaque.jpg`, `Singapore Memorial.jpg`, `Inscription.jpg`, `DSC02792.JPG`, `DSC02810.JPG`, `DSC02811.JPG`, `2.JPG`, `DSCF5825.JPG`, `Gull Force veterans4.JPG`, `tree plaque Melb.JPG`, `Heidleberg plaque.jpg`, `Unveiling.JPG`, `shrine plaque2009.JPG`, `AWM Plaque1.jpg`, `vets shake hands.JPG`, `AWM plaque place.JPG`, `AWM Plaque place-2.jpg`

**Status:** ❌ No equivalent in dev.

---

### 4. Historical Ambon (Expansion Required)
**Live page:** `Historical_Ambon.html`

The dev Pilgrimages page includes a POW gallery (8 images) and historical photo section. The live site has significantly more:

**Additional content on live site not in dev:**
- Aerial photograph of POW camp (c. April 1945) + downloadable description
- Individual grave cross photos: Womersley, E R Smith, B A E Haley, Colin Goodwin, Francis Henry Jordan, Frederick Schaefer
- PoW graves photo (December 1945)
- Ambon cemetery honour wall
- 1943 Tan Toey map (`ambon_1943 Tan Toey map.JPG`)
- Ambon War Cemetery series (7 images: `Ambon War Cemetery 1-3.jpg`, `Ambon cemetery3-8.JPG`)
- Pre-1998 pilgrimage archive photos:
  - Kudamati 1980, 1988
  - Laha 1988
  - Pilgrimage 1979 (×2)
  - Pilgrimage 1983 (×2)
  - Pilgrimage 1985 Hainan (×2)
  - Pilgrimage 1987 (bridge of sighs, statue)
  - Laha historical (×2)
  - Kudamati 1983 memorial
  - Gull Force veterans group photos (×3)
  - Ambon group photo
  - Anzac Day 1996
  - Tantui Gates / Entrance
  - Old Hila Church (exterior + interior)
  - Kudamati 1999

**Downloads:**
- `Aerial Photograph discription.doc`

**Status:** ⚠️ Partially covered in dev Pilgrimages; significant historical archive not yet included.

---

### 5. Articles & Contributions
**Live page:** `Articles_and_Contributions.html`

Mixed content page with video embeds, article PDFs, and artefact photography.

**YouTube / Video embeds:**
| Description | URL |
|-------------|-----|
| Anzac Day march Melbourne 2019 (Gull Force group, from 49 min) | Facebook permalink |
| Gull Force collection playlist | youtube.com/user/221GULLFORCE |
| Veteran recollections Pt 1 (Tom Pledger, Bob Allen, Vernon Ball, Jack Serant) | youtube.com/watch?v=38TY2Ogx2wA |
| Japanese surrender on USS Missouri (2 Sep 1945) | youtube.com/watch?v=vcnH_kF1zXc |

**Research / thesis links:**
- David Evans PhD thesis "The Ambon Forward Observation Strategy 1941–1942: A Lesson in Military Incompetence" (Murdoch repository)
- Paul Rosenzweig MA thesis in SE Asian Studies (CDU)
- sevensoldiersons.com.au

**Artefact photo series (25 images):**
`tin1.jpg` – `tin25.jpg` — Items found in a tin, including personal effects and wartime artefacts

**Other historical document photos:**
`From Billy in Darwin.jpg`, `image001.jpg`, `image002.jpg`, `souvenir.jpg`, `letter7May42.jpg`, `telegram.jpg`, `Frederick Schaefers deathtelegram.jpg`, `article massacre of 300.jpeg`, `scroll for Hudswell.jpg`, `Syd Riddock 1.JPG`, `Invictus-1.jpg`, `Invictus-2.jpg`, `To the Women of Australia Badge 3 Stars.jpg`, `R Field.jpg`

**Downloads:**
- `Bill Doolan article.pdf`
- `1 BRIAN Biography.docx`
- `McCormack001.pdf`, `McCormack002.pdf`, `McCormack003.pdf`, `McCormack telegrams.pdf`
- `Antella1.pdf`, `Antella2.pdf`

**Status:** ❌ No equivalent in dev.

---

### 6. Veteran's List
**Live page:** `Veteran.html`

Simple page with one downloadable resource. Text explains the nominal roll was compiled by Paul Liversidge from Courtney Harrison's book *Ambon Island of Mist*. Also references Commonwealth War Graves Commission records (Ambon + Yokohama cemeteries) available by email.

**Downloads:**
- `Gull Force - Nominal Roll..pdf`

**Status:** ❌ No equivalent in dev.

---

### 7. Calendar of Events
**Live page:** `Newsletter.html`

2023 events listed:
- **Shrine Pilgrimage + AGM** — Sunday 5 February 2023, Shrine of Remembrance Melbourne (11:15am assembly at 2/21st Bn Memorial Tree; 12 noon Memorial Service)
- **Anzac Day March** — 25 April 2023, Melbourne (Flinders St east, south side, 10am assembly)

**Image:** `Anzac day 18001.jpg`

**Status:** ❌ No equivalent in dev. **Note:** Events content is time-sensitive and needs a client-editable solution.

---

### 8. 1/21BN History
**Live page:** `1_21Bnpage.html`

History of the 21st Battalion (predecessor unit): raised at Broadmeadows Feb 1915 for WWI, 6th Brigade 2nd Division, served at Gallipoli and the Western Front, last to pull back when Australian Corps withdrew. Re-raised 1921 as part-time Citizens Force, amalgamated with 23rd Battalion in 1929.

**Images:**
- `James Horsburgh.jpg`
- `Horsburgh.jpg`
- `21stBn circa 1950.jpg`

**Status:** ❌ No equivalent in dev.

---

### 9. About Us (Partial Gap)
**Live page:** `About_us.html`

Core content (association aims, membership fee, membership form download) is present in Home and Contact ACF fields.

**Not captured anywhere in dev:**
- Lloyd Swanton *Ambon* double CD announcement (Bugle Records, released 30 Oct 2014). Stuart Swanton's coded diary is the source material. CD description + review context.

**Status:** ⚠️ Mostly covered; Lloyd Swanton announcement omitted.

---

## Merchandise Gap

| Product | Live Site | Dev Site | Price (live) |
|---------|-----------|----------|--------------|
| Gull Force Bag | ✅ | ✅ | $30.00 |
| Gull Force Cap (Black or White) | ✅ | ✅ | $25.00 |
| Gull Force Black Visor | ✅ | ✅ | $25.00 |
| Ambon-Hainan Remembrance Pin | ✅ | ✅ | $12.00 (1–3), $10.00 (4+) |
| Gull Force Bucket Hat (White) | ✅ | ✅ | $25.00 |
| **Gull Force Pen** | ✅ | ❌ | — |
| **Gull Force Stubby Holder** | ✅ | ❌ | — |
| Lapel pin | Membership gift (not sold separately) | N/A | — |

**Order form:** Dev Memorabilia page has `order_form_pdf` (attachment 1975). ✅

---

## Downloadable Files Not in Dev

| File | Live Page |
|------|-----------|
| `Application for Membership of Gull Force.docx` | About Us (Contact page placeholder — client to supply) |
| `Gull Force - Nominal Roll..pdf` | Veteran's List |
| `Ambon Pilgrimage report 2013.docx` | Ambon/Pilgrimages |
| `Ambon 2015 by A Miles.pdf` | Ambon/Pilgrimages |
| `Aerial Photograph discription.doc` | Historical Ambon |
| `POW story.doc` | Veteran's Photos |
| `Bill Doolan article.pdf` | Articles & Contributions |
| `1 BRIAN Biography.docx` | Articles & Contributions |
| `McCormack001.pdf` | Articles & Contributions |
| `McCormack002.pdf` | Articles & Contributions |
| `McCormack003.pdf` | Articles & Contributions |
| `McCormack telegrams.pdf` | Articles & Contributions |
| `Antella1.pdf` | Articles & Contributions |
| `Antella2.pdf` | Articles & Contributions |

---

## YouTube / Video Content Not in Dev

| Video | Source Page |
|-------|-------------|
| Gull Force collection playlist (youtube.com/user/221GULLFORCE) | Articles |
| Veteran recollections Pt 1 & 2 (Pledger, Allen, Ball, Serant) | Articles |
| Japanese surrender on USS Missouri | Articles |
| Anzac Day march Melbourne 2019 (Facebook) | Articles |
| Ambon pilgrimage videos 2007 (×5) | Ambon_photos.html |
| Ambon pilgrimage videos 2009 (×5) | Ambon_photos.html |
| Ambon pilgrimage videos 2010 (×3) | Ambon_photos.html |
| Ambon pilgrimage videos 2011 (×5) | Ambon_photos.html |
| Ambon pilgrimage videos 2013+ (multiple) | Ambon_photos.html |

---

## Priority Summary for UI/UX Review Session

| Priority | Gap | Volume |
|----------|-----|--------|
| 🔴 High | Veteran's Photos page | 200+ images, extensive named captions |
| 🔴 High | Plaques & Memorials page | 20+ images, 8+ locations |
| 🔴 High | Battalion History page | Text narrative + 2 images |
| 🟡 Medium | Historical Ambon expansion | 50+ additional images + 1 download |
| 🟡 Medium | Articles & Contributions page | PDFs, YouTube embeds, 25+ artefact photos |
| 🟡 Medium | 1/21BN History page | Text + 3 images |
| ⚪ Low | Veteran's List (Nominal Roll) | 1 PDF download |
| ⚪ Low | Calendar of Events | Client-editable events solution needed |
| ⚪ Low | 2 missing merchandise products | Pen, Stubby Holder |
| ⚪ Low | YouTube embeds in Pilgrimages | Pilgrimage videos 2007–2015 |

---

## Key Observation for UI/UX Review

The **Veteran's Photos** section is by far the most significant gap. It is the largest content area on the live site and is entirely absent from the dev build. The UI/UX review must determine how to present 200+ captioned historical portrait and group photos in a way that is navigable, respectful, and consistent with the site's commemorative purpose.

Possible approaches to evaluate:
- Searchable/filterable gallery by company (A, B, C, D, HQ), year, or individual name
- Individual veteran profile cards with name, rank, and photo
- Chronological archive (training → Darwin → Ambon → POW → post-war)
- Integration with the existing Veteran's List / Nominal Roll

This decision will drive whether the Community page expands to absorb veteran photos, or whether a new dedicated page is required.
