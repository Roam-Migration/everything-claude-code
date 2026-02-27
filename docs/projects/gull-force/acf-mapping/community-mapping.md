# ACF Field Mapping — Community Page

*Status: Complete — field groups `group_gf_community` (ID 1471) + `group_gf_headstone` (ID 1486), all fields populated on post ID 13. 565 headstone CPT posts (all 602 attachments processed; 34 non-soldier cenotaph/memorial posts deleted; EXIF camera-title override fixed for 121 attachments; apostrophe and comma surname fixes applied). Data quality notes: `Lilly G.F.` and `Lily G.F.` both present — client to verify if same soldier; `Tayolr, D` is a typo in original filename.*

---

## Content Available

### Association History (About_us.html)
Founded by veterans of Gull Force after WW2.

### Battalion History (Battalion_History.html — full text)

Key narrative sections:
1. **Formation** — Trawool, Victoria, August 1940. CO: Lt Col. L.N.Roach.
2. **Training** — Trawool → Bongilla/Albury → Darwin (Winnellie)
3. **Embarkation** — 9 Dec 1941, destination Ambon
4. **Gull Force composition** — 1,131 total (2/21st Bn + attachments)
5. **The Defence** — Split: 292 to Laha airstrip, remainder to Tantui
6. **Surrender** — overwhelmed by ~20,000 Japanese
7. **POW years** — Ambon & Hainan Island camps
8. **After the war** — Association formed by veterans

### Veteran Stories (Articles_and_Contributions.html)
- Poem: "The Heroes Behind the Fence" by Gillian Moxom
- Poem: "A Soldier's Prayer" by Pompey Jackson (aged 22, from Ambon)
- Links to YouTube interviews: Tom Pledger, Bob Allen, Vernon Ball, Jack Serant
- Link to PhD thesis: "The Ambon Forward Observation Strategy 1941-1942"
- Link to MA thesis: Paul Rosenzweig — "Ziarah: The Gull Force Association Pilgrimages to Ambon"
- Link to Facebook: Anzac Day march Melbourne 2019

### Veteran Portraits (Veteran_s_photos.html + images/)
Named portrait photos in `images/`:
- `ADAMS James.jpg`
- `Alan Flowerday1.PNG`, `Alan Flowerday2.PNG`
- `E R Smith002.jpg`
- `H W Benbow.JPG`
- `L J Stephens006.jpg`
- `Syd Riddock 1.JPG`
- `Chelew + Waring007.jpg`, `Waring008.jpg`
- And others from the public_html directory

### Headstone Memorial (headstones/)
605 individually-named headstone photos.
Format: `Surname I.I..JPG`
Source: Ambon War Cemetery photographs.

Can be cross-referenced against member database:
- `member-data/gullforce-members.csv` → `LastName` + `Initials` columns

---

## Proposed ACF Mapping (pending field audit)

| ACF Field (expected)          | Type      | Content Source                              |
|-------------------------------|-----------|---------------------------------------------|
| `battalion_history`           | wysiwyg   | `Battalion_History.html` full text          |
| `veteran_stories` (repeater)  | repeater  | Articles_and_Contributions.html             |
| `veteran_stories.title`       | text      | Story/poem title                            |
| `veteran_stories.content`     | wysiwyg   | Story/poem text                             |
| `veteran_stories.author`      | text      | Author name                                 |
| `veteran_portraits` (repeater)| repeater  | Named JPGs in `images/`                     |
| `veteran_portraits.name`      | text      | Filename-derived veteran name               |
| `veteran_portraits.image`     | image     | JPG from `images/`                          |
| `external_links` (repeater)   | repeater  | YouTube/thesis links from Articles page     |
| `external_links.label`        | text      | Link description                            |
| `external_links.url`          | url       | External URL                                |
| `headstone_gallery`           | gallery   | Subset of `headstones/` (605 photos)        |
| `newsletter_pdf`              | file      | `documents-historical/GFA 2023 Newsletter.pdf` |

---

## Headstone Gallery Note

605 headstone photos is too many for a standard gallery widget.
Recommend a searchable/filterable approach:
- Option A: ACF repeater with name + image, front-end search via JS
- Option B: Custom post type `headstone` with one post per soldier
- Option C: Static gallery with pagination

Confirm with client which approach fits the Elementor template.
