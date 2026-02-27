# ACF Field Mapping — Pilgrimages Page

*Status: Complete — ACF field group `group_gf_pilgrimages` (ID 1993), 6 top-level fields populated on post ID 16. 9 pilgrimage entries (1979–2017), 8 POW camp historical images, 7 curated 2017 gallery images, 3 commemoration booklets. Upcoming pilgrimage fields left blank pending client confirmation.*

---

## Content Available

### Pilgrimage History (Historical_Ambon.html)

Named pilgrimages documented in the legacy site:
- **1979** — Ambon Pilgrimage (group photo with names)
- **1983** — Pilgrimage (3 photos)
- **Early 1980s** — Ben Amor, Frank McCormack, Alan Letcher
- **1985** — Hainan Pilgrimage (L-R list: Clive Newnham, Neil Roach, Wally Hicks, Rod Gabriel, Stan Vaughan, Andy Kirwan + second group)
- **1987** — Bridge of Sighs, Pattimura memorial, Rod Gabriel at Laha memorial
- **1988** — Kudamati memorial Anzac Day; Wreath laying at Laha; Bill Page + Jim Rogers at graveside
- **1993** — Names: Ross McDonald, Ted Winnell, Ralph Godfrey, Reg Brassey, Ben Amor, Leo Manning, Rod Gabriel, Eric Edwards, Clive Newnham, Arthur Deakin, Cyril Pearce, G Kissick, Harry Wil[liamson]

### 2017 Ambon Trip (pilgrimages-2017/)
439 JPGs from the 2017 trip. Key named photos in legacy site:
- `poppies2017.JPG`, `wreath2017.JPG` — wreath laying ceremony
- `tour group 2017.jpg` — group photo
- `Haley1.jpg`, `Haley2.jpg`, `Haley3.jpg`, `Haley4.jpg` — Haley family visit to grave

### 2024 GFA Trip (drive-001-raw/2024 GFA Trip/)
Content from 2024 trip interest/enquiries:
- Documents: `2024 Ambon Enquiries.xlsx`, interest lists
- Some member photos (named individuals)

### POW Camp Historical Photos (images/ from legacy site)
- `aerial photo of camp.jpg` — aerial of POW prison camp ~1945
- `Hut No7.png` — POW hut
- `PoW return.png`, `PoW return2.png` — return from captivity 1945
- `Womersley Grave1.png`, `Womersley Grave2.png` — original grave markers
- `Wharf2.png`, `wharf1.png` — Ambon wharf

### Commemoration Booklets (documents-historical/)
- `Commemoration booklet 2014.pdf`
- `Commemoration booklet 2017.pdf`
- `Commemoration booklet- Kudamati.pdf`

---

## Proposed ACF Mapping (pending field audit)

| ACF Field (expected)            | Type      | Content Source                                   |
|---------------------------------|-----------|--------------------------------------------------|
| `pilgrimages` (repeater)        | repeater  | One row per pilgrimage year                      |
| `pilgrimages.year`              | number    | e.g., 1979, 1983, 1985, 1987, 1993, 2017        |
| `pilgrimages.location`          | text      | e.g., "Ambon", "Hainan Island"                  |
| `pilgrimages.description`       | textarea  | Summary from Historical_Ambon.html              |
| `pilgrimages.gallery`           | gallery   | Trip photos for that year                        |
| `pilgrimages.participants`      | textarea  | Named participant list (where available)         |
| `upcoming_pilgrimage`           | group     | Next planned trip details                        |
| `upcoming_pilgrimage.year`      | number    | Next year                                        |
| `upcoming_pilgrimage.interest_contact` | text | Email/contact for registering interest        |
| `pow_camp_gallery`              | gallery   | Historical POW camp images                       |
| `commemoration_booklets` (repeater) | repeater | PDF links                                   |
| `commemoration_booklets.year`   | number    | Booklet year                                     |
| `commemoration_booklets.file`   | file      | PDF from `documents-historical/`                |

---

## 2017 Gallery Curation Note

439 photos is too many to display raw. Recommended approach:
1. Identify ~30–50 representative shots from `pilgrimages-2017/`
2. Curate into a gallery (ceremony, group, memorials, community moments)
3. Link to full album (Google Photos or similar) for complete set

Filenames are all `DSC00XXX.JPG` — client will need to identify key shots
OR we can select based on file size (larger = more detail/significance).
