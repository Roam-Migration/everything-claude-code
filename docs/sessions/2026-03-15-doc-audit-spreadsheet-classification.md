# Session: DOC-AUDIT-2025 — Spreadsheet Cleanup + Classification System

**Date:** 2026-03-15
**Project:** Compass Wiki / DOC-AUDIT-2025
**Spreadsheet:** `1T8PjTWN3jsqilOo24djnU5i1C1VS-YlZvdMihKnUiBE`

---

## What Was Done

### Spreadsheet Cleanup (`clean_spreadsheet.py`)

Reduced the 35-column pipeline spreadsheet to a manageable user-facing layout:

- **Deleted 7 artefact columns** (right-to-left to avoid index shifting):
  L (Potential Duplicate), M (Duplicate Match IDs), N (Scan Timestamp),
  O (Content Hash), S (Domain Confidence), U (Classification Notes), AE (Family Notes)
- **Hidden 15 technical/pipeline columns** (still in sheet, not visible):
  Cluster ID, File ID, MIME Type, Owner Email, Created Date, File Size, Source Drive,
  Duplicate Confidence, Confidence Reason, Canonical Score, Canonical Rank, Scoring Notes,
  Copy Status, Copied File ID, Copy Timestamp
- **13 visible user-facing columns** remain: File Name, Folder Path, Direct URL,
  Last Modified, Suggested Domain, Suggested Subclass, Decision, Decision Notes,
  Reviewed, Document Family, Applies To, Format, Trashed

### Classification Columns Added

Three new columns at AC–AE with dropdown validation:
- **Doc Type** (AC): PROC / TEMP / KNOW / FORM / POLD / ROLE
- **Domain** (AD): 01 Visa Programs / 02 Procedures / 03 Templates & Forms /
  04 Legal Research / 05 Standards & Compliance / 06 Administration
- **Status** (AE): Active / Draft / Archived

### Classification Auto-Population

Two-pass approach:

**Pass 1 (`clean_spreadsheet.py`)** — basic keyword matching on Document Family + Format:
- 1,041 Doc Type suggestions
- 1,938 Domain suggestions (from existing Suggested Domain codes)

**Pass 2 (`suggest_classification.py`)** — extended immigration-law keyword set across
File Name + Folder Path + Document Family + Format + Suggested Subclass + Applies To:
- Additional 1,001 Doc Type fills (TEMP: 843, KNOW: 93, FORM: 59, POLD: 5, ROLE: 1)
- Additional 290 Domain fills (03 Templates: 237, 05 Compliance: 30, 06 Admin: 13, 02 Procedures: 6)

**Final coverage (2,218 active rows):**
| Type | Count |
|------|-------|
| TEMP | ~1,180 |
| FORM | ~269 |
| KNOW | ~247 |
| PROC | 68 |
| POLD | 35 |
| ROLE | 24 |
| Blank | ~395 |

| Domain | Count |
|--------|-------|
| 03 Templates & Forms | ~826 |
| 01 Visa Programs | ~604 |
| 05 Standards & Compliance | ~150 |
| 02 Procedures | ~111 |
| 04 Legal Research | ~105 |
| 06 Administration | ~13 |
| Blank | ~409 |

### Status Column

- Set `Status = Active` for all 2,218 non-trashed, non-DEP rows
- Fixed checkbox-validation artefact (`FALSE` in Status cells) before populating

### Visual Formatting (`format_spreadsheet.py`)

- **Doc Type color coding**: 6 pastel colors (blue=PROC, green=TEMP, purple=KNOW, amber=FORM, pink=POLD, teal=ROLE)
- **Domain color coding**: 6 pastel colors (lavender/mint/yellow/rose/peach/grey)
- **Yellow row highlight**: rows where both Doc Type AND Domain are blank
- **11 named filter views** (View → Filter views):
  - Active Documents (sorted Domain → Doc Type → Name)
  - Needs Doc Type
  - Needs Domain
  - Review Queue (Decision = REVIEW)
  - KEEP — Notion Import
  - Domain: 01 through Domain: 06
- **Column widths** tuned for readability

---

## Scripts Written This Session

All in `/home/jtaylor/apps-script-projects/doc-audit-2025/`:

| Script | Purpose |
|--------|---------|
| `clean_spreadsheet.py` | Delete artefact cols, hide pipeline cols, add classification cols, initial auto-suggest |
| `suggest_classification.py` | Extended immigration-law keyword inference for blank Doc Type / Domain |
| `format_spreadsheet.py` | Conditional formatting, filter views, column widths |

---

## Technical Notes

### Column Deletion Order (Critical)
Always delete Sheets columns right-to-left in a single `batchUpdate`. Each `deleteDimension`
shifts remaining column indices left — processing left-to-right corrupts subsequent indices.

### Filter View API Quirks
- Field name is `criteria` (not `filterCriteria`)
- `TEXT_NOT_EQ` is not supported in filter view criteria — use `hiddenValues: ['TRUE']` instead
- Multiple criteria per view = AND logic

### Checkbox Artefact
When a new column is added adjacent to a checkbox-validated column, it can inherit
checkbox validation, causing default `FALSE` values. Fix: explicitly re-apply dropdown
validation + clear the column before writing.

---

## Remaining Work

- **~395 rows** with blank Doc Type — manual review in sheet
- **~409 rows** with blank Domain — manual review in sheet
- **Emily's REVIEW queue** — cross-check flagged rows
- **Notion import** — once de-dup + review signed off, import KEEP rows to Notion
- **Staff training** — brief team on Doc Type/Domain/Status taxonomy

---

## Pipeline Status (Complete)

| Phase | Status |
|-------|--------|
| Initial scan (2,625 docs) | ✅ Complete |
| Duplicate detection + clustering | ✅ Complete |
| Canonical selection | ✅ Complete |
| Copy canonicals to Register | ✅ 1,803 copied |
| Execute deletions (HIGH → trash, MEDIUM/LOW → DEP) | ✅ Complete |
| Re-promote failed KEEP clusters | ✅ Complete (3 iterations) |
| Spreadsheet cleanup | ✅ Complete |
| Classification system | ✅ Complete (82% coverage) |
| Manual review of blanks + REVIEW queue | 🔄 In progress (Emily) |
| Notion import | ⏳ Pending review sign-off |
