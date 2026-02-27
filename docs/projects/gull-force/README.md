# Gull Force Association Website

**Client:** Gull Force Association
**Site:** [vmoeoorvf.elementor.cloud](https://vmoeoorvf.elementor.cloud)
**Stage:** Content population (templates live, placeholder content)
**Handover From:** Claude Browser (initial template build)

---

## Project Background

Digital presence for the Gull Force Association, commemorating the 2nd/21st Battalion's
service on Ambon Island during WWII. The site honours 1,131 battalion members (779 casualties)
and maintains active connection with the Ambonese community.

**Primary audiences:**
- Surviving families and veterans' descendants
- Indonesian-Australian Ambonese community

---

## Site Structure

| Page         | URL Slug       | Status                             |
|--------------|----------------|------------------------------------|
| Home         | /              | Template live, placeholder content |
| Community    | /community/    | Template live, placeholder content |
| Memorabilia  | /memorabilia/  | Template live, placeholder content |
| Contact      | /contact/      | Template live, placeholder content |
| Pilgrimages  | /pilgrimages/  | Template live, placeholder content |

---

## Technical Stack

| Layer              | Tool                                          |
|--------------------|-----------------------------------------------|
| CMS                | WordPress                                     |
| Page Builder       | Elementor Pro                                 |
| Custom Fields      | ACF Pro                                       |
| Batch Operations   | WP-CLI                                        |
| Content Extraction | Custom Python scrapers (completed)            |
| Claude Integration | claude-code plugin / Everything repo          |

---

## Current State

Scrapers have already extracted from the legacy site:
- Images (battalion photos, memorabilia, event imagery)
- Documents (historical records)
- Member data (1,131 member records)

Content lives in `content/` subdirectories. See `content/README.md` for inventory.

---

## Primary Objectives

1. Map extracted scraper output to ACF field schema per page template
2. Programmatically populate Elementor template placeholders with real historical content via WP-CLI / ACF API
3. Replace placeholder images with scraped assets
4. Wire up dynamic content loops (events, pilgrimages, member stories) to ACF repeater fields
5. Validate output against the five page templates

---

## Key Constraints

- **Preserve Elementor template structure** — no layout rebuilding
- **Sensitivity:** member/casualty data involves 779 deaths and living family connections — handle with care
- **Contact page:** verify real association contact details before populating (Ambon, Indonesia office)
- **Memorabilia page:** e-commerce product carousel — confirm WooCommerce is active or stub appropriately

---

## Directory Structure

```
gull-force/
├── README.md                   # This file
├── CLAUDE.md                   # Claude Code project instructions
├── handover/
│   └── cb-session-brief.md    # Claude Browser handover document
├── content/
│   ├── README.md              # Content inventory and transfer status
│   ├── images/                # Scraped images (transferred here first)
│   ├── documents/             # PDFs, historical records
│   ├── member-data/           # Member/casualty records (CSV/JSON)
│   └── scraped-raw/           # Raw scraper output (unprocessed)
├── scripts/
│   ├── README.md              # Script index and usage
│   └── ...                    # WP-CLI and content population scripts
├── acf-mapping/
│   ├── README.md              # Mapping methodology
│   └── ...                    # Field-to-content mapping tables per page
└── session-notes/             # Per-session work logs
```

---

## Getting Started (New Session)

```bash
# 1. Audit ACF field groups on site
wp acf field-group list --url=vmoeoorvf.elementor.cloud

# 2. Check content inventory
cat docs/projects/gull-force/content/README.md

# 3. Review current mapping tables
ls docs/projects/gull-force/acf-mapping/

# 4. Start with home page population
# See: acf-mapping/home-mapping.md
```

---

## Resources

- **Handover brief:** `handover/cb-session-brief.md`
- **ACF mappings:** `acf-mapping/`
- **WP-CLI scripts:** `scripts/`
- **Session logs:** `session-notes/`
