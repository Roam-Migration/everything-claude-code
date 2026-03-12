# Session: DAP Template Tokenisation + Wizard Wiring
**Date:** 2026-03-12
**Project:** Document Automation Platform (DAP)
**Repo:** `/tmp/Rmlintranetdesign`

---

## What Was Done

### 1. Google Doc Template Tokenised
- **Template:** `fee-quote-482 [TEMPLATE]` (Drive ID: `1JFETU6cBg9brblTJuU1ci-f-LKMSQTOTwy_BS9a3CGU`)
- 30 tokens inserted across: header, Professional Fees table, DHA Fees table, plain-text breakdown section
- Replacement order mattered: breakdown lines replaced BEFORE shared amounts to prevent bleed-through
- All 4 professional fee rows share `{{PROF_FEE_CHARGE/GST/TOTAL}}` (same rate for all)
- Conditional rows (dependents, STAC, CC, VAC adult/u18) tokenised for `~~EMPTY~~` row deletion
- Dry run confirmed 0 remaining `$` signs in paragraph text after tokenisation

### 2. `buildReplacementMap()` Rewritten
- **File:** `backend/src/services/DocumentService.ts`
- Removed old per-row tokens (`{{NOM_PREP_CHARGE}}` etc.) — replaced with shared `{{PROF_FEE_*}}`
- Added individual breakdown line tokens (`{{EMP_NOM_PREP_LINE}}`, `{{APP_VAC_MAIN_LINE}}`, etc.)
- Removed old block tokens (`{{EMPLOYER_PROF_LINES}}`, `{{APPLICANT_LINES}}`)
- Conditional rows return `EMPTY` marker → triggers row deletion in post-processing
- Token map now exactly mirrors what's in the template

### 3. Migration + Backend Config
- **Migration:** `supabase/migrations/20260311_document_automation.sql`
  - Template ID registered: `1JFETU6cBg9brblTJuU1ci-f-LKMSQTOTwy_BS9a3CGU`
  - SQL run in Supabase Studio to UPDATE output folder ID: `1yc1wG15WthGYhKkOBcSUA_tDDbG9_Og1`
- **cloudbuild.yaml:** Added `GDOCS_DEFAULT_OUTPUT_FOLDER_ID=1yc1wG15WthGYhKkOBcSUA_tDDbG9_Og1`
- OAuth2 secrets confirmed present in GCP Secret Manager (`gdocs-oauth-client-id`, `gdocs-oauth-client-secret`, `gdocs-refresh-token`)
- Backend deployed successfully during session

### 4. DAP Compass Wiki Requirements Doc
- **File:** `docs/DAP-COMPASS-WIKI-REQUIREMENTS.md` (in Rmlintranetdesign)
- Maps all Apps Script (RML Wiki Tools) capabilities to DAP equivalents
- Covers: theming, global variables, building blocks, templates, validation, add-on surface
- Priority table: P1 = validation + global variables + engagement letter

### 5. Wizard (FeeCalculatorPage) — Confirmed Complete
- Route: `/legal-hub/fees/calculator`
- Actionstep matter lookup auto-fills employer + applicant
- All form sections: employer details, SAF levy, family composition, STAC, payment method
- Live preview updates in real-time; "Generate Doc" calls backend → returns Google Doc URL
- Known limitation: frontend uses hardcoded `FEE_SCHEDULE` for preview; backend uses Supabase rates

### 6. Notion Project Created
- **Project:** "Document Automation Platform" — In progress, Driver: Jackson
- URL: https://www.notion.so/321e1901e36e8155b4b2f5af19bf635f

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Shared `{{PROF_FEE_*}}` tokens for all 4 rows | All 4 professional fee rows have the same rate — simpler than 4×3 individual tokens |
| Breakdown lines = individual tokens (not block) | Template has one token per line, not a single multi-line block replacement |
| `~~EMPTY~~` for conditional table rows | Existing GoogleDocsService row-deletion pattern; plain-text conditional lines use `''` |
| OAuth2 refresh token over service account | No Workspace admin needed; docs owned by the authorising account |
| DAP as its own Notion project | Multi-phase platform (Phases 1–3), distinct enough from Intranet Launch |

---

## Token Map Reference

### Header
| Token | Value |
|-------|-------|
| `{{EMPLOYER_NAME}}` | Employer/sponsor name |
| `{{APPLICANT_NAME}}` | First + last |
| `{{QUOTE_DATE}}` | Formatted date |

### Professional Fees Table (all 4 rows share same values)
| Token | Value |
|-------|-------|
| `{{PROF_FEE_CHARGE}}` | Base fee (e.g. $1,157.63) |
| `{{PROF_FEE_GST}}` | GST (e.g. $115.76) |
| `{{PROF_FEE_TOTAL}}` | Total inc. GST (e.g. $1,273.39) |
| `{{DEP_ROW_LABEL/CHARGE/GST/TOTAL}}` | Dependents row — EMPTY if no deps |

### DHA Fees Table
| Token | Notes |
|-------|-------|
| `{{SAF_LABEL}}`, `{{SAF_TOTAL}}` | Dynamic label includes rate × years |
| `{{NOM_FEE_TOTAL}}` | Nomination fee ($330) |
| `{{VAC_MAIN_TOTAL}}` | Main applicant VAC |
| `{{VAC_ADULT_LABEL/TOTAL}}` | EMPTY if no adult deps |
| `{{VAC_U18_LABEL/TOTAL}}` | EMPTY if no u18 deps |
| `{{STAC_LABEL/TOTAL}}` | EMPTY if stac count = 0 |
| `{{CC_LABEL/TOTAL}}` | EMPTY if EFT payment |
| `{{DHA_SUBTOTAL}}`, `{{GRAND_TOTAL}}` | Totals |

### Breakdown Section (plain text)
- `{{EMP_NOM_PREP_LINE}}`, `{{EMP_NOM_LODGE_LINE}}`, `{{EMP_SAF_LINE}}`, `{{EMP_NOM_FEE_LINE}}`, `{{EMP_CC_LINE}}`, `{{EMPLOYER_TOTAL}}`
- `{{APP_VIS_PREP_LINE}}`, `{{APP_VIS_LODGE_LINE}}`, `{{APP_DEP_LINE}}`, `{{APP_VAC_MAIN_LINE}}`, `{{APP_VAC_ADULT_LINE}}`, `{{APP_VAC_U18_LINE}}`, `{{APP_STAC_LINE}}`, `{{APP_CC_LINE}}`, `{{APPLICANT_TOTAL}}`

---

## Pending / Phase 2

- **Frontend rate sync:** FeeCalculatorPage uses hardcoded rates for preview — should fetch from `/api/documents/fee-schedule/fee-quote-482` on load
- **Document validation:** Post-generation token check (`validateGeneratedDocument()`) — P1
- **Global variables table:** `global_variables` in Supabase, merged at generation — P1
- **`engagement-letter-482` template** — P1
- **Client-specific rates:** `client_slug` on `fee_schedules` + "existing client?" dropdown in wizard — Phase 2
- **Tiered pricing:** `tier` column on `fee_schedules` — Phase 2
- **INTERNAL/EXTERNAL theming:** `applyTheme()` in GoogleDocsService — Phase 2
- **Building blocks (section markers)** — Phase 3
- **Google Docs add-on surface** — Phase 3
- **Spreadsheet cleanup** (fees-by-client) — separate session
