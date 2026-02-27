# Gull Force Association Website - Claude Browser Session Brief

*Source: Claude Browser handover to Claude Code*
*Date: 2026-02-26*

---

## Project Overview

Rebuilding the digital presence for the Gull Force Association, commemorating the 2nd/21st
Battalion's service on Ambon Island (WWII). The site honours 1,131 battalion members
(779 casualties) and maintains active connection with the Ambonese community.

Primary audiences: surviving families, veterans' descendants, and the
Indonesian-Australian Ambonese community.

---

## Current Site State

Five pages are built in Elementor Pro on a staging environment (vmoeoorvf.elementor.cloud).
Templates use navy/red styling with professional layouts. All pages currently contain
placeholder content -- the migration task is programmatic population of existing templates
with extracted historical content, not rebuilding from scratch.

| Page        | URL Slug      | Status                             |
|-------------|---------------|------------------------------------|
| Home        | /             | Template live, placeholder content |
| Community   | /community/   | Template live, placeholder content |
| Memorabilia | /memorabilia/ | Template live, placeholder content |
| Contact     | /contact/     | Template live, placeholder content |
| Pilgrimages | /pilgrimages/ | Template live, placeholder content |

---

## Technical Stack

| Layer              | Tool                                          |
|--------------------|-----------------------------------------------|
| CMS                | WordPress                                     |
| Page Builder       | Elementor Pro                                 |
| Custom Fields      | ACF Pro                                       |
| Batch Operations   | WP-CLI                                        |
| Content Extraction | Custom Python scrapers (completed)            |
| Claude Code Integration | claude-code plugin / Everything repo    |

Scrapers have already extracted: images, documents, historical records, and member data
from the legacy site.

---

## Claude Code Integration Note

Development uses the Everything Claude Code plugin/repo -- Claude Code has direct filesystem
and WordPress access. All content population, template wiring, and ACF field mapping should
be executed via Claude Code tooling rather than manual WP admin operations.

---

## Primary Objectives for This Session

1. Map extracted scraper output to ACF field schema per page template
2. Programmatically populate Elementor template placeholders with real historical content
   via WP-CLI / ACF API
3. Replace placeholder images with scraped assets (battalion photos, memorabilia, event imagery)
4. Wire up dynamic content loops (events, pilgrimages, member stories) to ACF repeater fields
5. Validate output against the five page templates shown above

---

## Key Constraints

- Preserve Elementor template structure -- no layout rebuilding
- Handle member/casualty data with sensitivity (779 deaths, living family connections)
- Contact page shows Ambon, Indonesia office location -- verify real association contact
  details before populating
- Memorabilia page has an e-commerce product carousel -- confirm WooCommerce is active
  or stub appropriately

---

## Prompt Starter for Claude Code

> "I'm working on the Gull Force Association WordPress site at vmoeoorvf.elementor.cloud.
> Python scrapers have already extracted content from the legacy site. Using the Everything
> Claude Code plugin, I need to map and populate the five Elementor Pro page templates
> (Home, Community, Memorabilia, Contact, Pilgrimages) with real content via ACF Pro fields
> and WP-CLI. Start by auditing the ACF field groups registered on the site and listing the
> scraped content available in [specify scraper output directory]. Then propose a field-to-content
> mapping table before we begin population."
