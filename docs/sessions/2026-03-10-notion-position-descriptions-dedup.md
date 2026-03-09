# Session: Notion Position Descriptions De-duplication
**Date:** 2026-03-10
**Project:** RML Intranet — Notion Core Data
**Database:** [📄 Position Descriptions](https://www.notion.so/1ba77069f47043c7b5268713aedefb0e)

---

## What Was Done

De-duplicated the Position Descriptions Notion database across two passes, resolving 7 duplicate pairs total. No content was deleted — duplicates were archived (Status=Archived, Active=false) and all unique properties were merged into the retained page before archiving.

---

## Pass 1 — Self-Identified (3 pairs)

Identified by searching the database with multiple semantic queries and comparing titles case-insensitively.

| Position | Kept | Archived | Content Action |
|----------|------|----------|----------------|
| **Systems Administrator** | `306e1901...8150` (Mar 5, comprehensive) | `300e1901...8153` (Feb 13) | Transferred Person + Role + Last Reviewed + 5 extra KPIs (Backup verification, Security alert review, User access review, Password compliance, DR test) |
| **Full Stack Developer** | `306e1901...814a` (Mar 5, full content) | `305e1901...80ff` (Feb 13, blank) | Transferred Role + Last Reviewed |
| **Accounts Officer** | `306e1901...80cc` (Mar 9, has Role) | `306e1901...81d1` (Mar 5) | Transferred Person relation; content was identical |

---

## Pass 2 — User-Specified (4 pairs)

| Pair | Kept | Archived | Transferred to Keeper |
|------|------|----------|-----------------------|
| Accounts/Paralegal → **Accounts Officer & Paralegal Support** | `306e1901...8195` (full content) | `305e1901...80ba` (blank) | Role + Last Reviewed |
| CEO → **Chief Executive Officer** | `306e1901...81fe` (full content) | `306e1901...802f` (blank) | Person + Role + Team Assignment + Last Reviewed |
| Finance Manager (blank) → **Finance Manager** (content) | `306e1901...8169` (full content) | `306e1901...80af` (blank) | Role + Last Reviewed |
| Training & Admin Manager → **Training & Quality Manager** | `306e1901...8188` (full content) | `306e1901...80db` (blank) | Role + Last Reviewed |

---

## Key Pattern Observed

The duplicates followed a consistent structural split:
- **Blank pages** (typically older, created ~Feb 13): had `Role` relation + `Last Reviewed` date set, but no page body content
- **Content-filled pages** (typically newer, created Mar 5–9): had `Person` relation + full position description body, but missing `Role` and `Last Reviewed`

This suggests two separate data-entry workflows ran in parallel and were never reconciled — one populating org-structure relations, one writing position description prose. The fix in each case was to merge the relation properties from the blank into the content page, then archive the blank.

---

## Consolidation Method

Since Notion has no native merge:
1. `notion-update-page → update_properties` on keeper: add missing relation URLs
2. For content differences (Systems Administrator only): `update_content` to append unique KPIs
3. `notion-update-page → update_properties` on duplicate: set `Status=Archived`, `Active=false`

Archived pages remain in the database and are excluded from active views (the "By Team" view filters `Active=true`).

---

## Remaining Cleanup (Optional)

- The archived pages (7 total) can be permanently deleted from the database via Notion UI if desired — not done here as the user did not request deletion
- A review of the `Career Progression` self-relation field across all positions may surface further inconsistencies (not in scope today)
- The `Accounts Officer` page archived in Pass 1 (`...81d1`) and the two `Systems Administrator` pages from last session may have downstream relation links pointing to them that need updating
