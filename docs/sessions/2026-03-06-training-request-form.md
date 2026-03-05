# Session: Training Request Form — RML Intranet

**Date:** 2026-03-06
**Project:** RML Intranet (`/tmp/Rmlintranetdesign`)
**Branch:** main

## What was built

A "Request Training" feature on the Training & Competency intranet page, allowing staff to submit training requests that are captured in a Notion database for HR review.

### Components

| Component | Path |
|---|---|
| Frontend modal | `src/app/components/RequestTrainingModal.tsx` |
| Training page (updated) | `src/app/pages/TrainingCompetencyPage.tsx` |
| Backend route | `backend/src/routes/training-requests.ts` |
| Backend registration | `backend/src/index.ts` |
| Nginx proxy | `nginx.conf.template` |
| Backend env var | `backend/cloudbuild.yaml` |
| Admin page register | `src/app/pages/AdminPage.tsx` |

### Notion

- **Training Requests DB:** https://www.notion.so/148b84f17ff14a4d9fffa44dda43b40f
- **Data source ID:** `e8ba4238-498b-47b7-b0fb-58a802ab0b4d`
- **Parent:** Intranet Core Data (`2ece1901e36e806e8d7ac3ebf84b9b73`)
- **Env var:** `NOTION_TRAINING_REQUESTS_DB_ID=148b84f17ff14a4d9fffa44dda43b40f` (hardcoded as fallback in route, also in `backend/cloudbuild.yaml`)

### Notion DB schema

| Property | Type | Options |
|---|---|---|
| Training Topic | Title | — |
| Status | Select | Submitted, Under Review, Approved, Declined |
| Submitted By | Rich Text | — |
| Email | Email | — |
| Delivery | Select | Internal, External |
| Training Category | Select | Immigration Law & Policy, Internal Process & Procedures, Soft Skills, Foundation Skills, Other |
| Priority | Select | Urgent, High, Normal, Low |
| Justification | Rich Text | — |
| Preferred Timeframe | Rich Text | — |
| Estimated Cost | Number ($) | Only sent for External delivery |
| Submission Date | Date | — |

### API

- **Endpoint:** `POST /api/training-requests`
- **Auth:** IAP (X-Goog-Authenticated-User-Email header)
- **Pattern:** Direct Notion write — does NOT use the Supabase forms API or `form_definitions` table
- **Nginx proxy:** `location = /api/training-requests` in `nginx.conf.template`

### Form UX

- Internal/External toggle (card buttons with icons) — replaces old training type dropdown
- Training Category dropdown with contextual hint text
- Placeholder text adapts to selected delivery type
- Estimated Cost field only appears for External
- Priority selector (Urgent / High / Normal / Low)

## Documentation updated

- **Platform Map (Notion):** Added "Training Request Form" entry — Status: Functional, Section: Training & Competency
  - URL: https://www.notion.so/31ae1901e36e817e9a23d791c556f633
- **Notion Core Data:** Training & Competency section updated Stub → Partial, Training Requests DB linked
- **Admin Hub → Direct Integration Forms:** New table section listing forms that bypass the Supabase forms API

## Architecture note

The Training Requests form uses a **direct-to-Notion** pattern (same as `/api/updates/critical`), not the generic Supabase forms pipeline. This means:
- No `form_definitions` row in Supabase
- No `form_submissions` row in Supabase
- Only visible in the Training Requests Notion DB
- Logged in Admin Hub under "Direct Integration Forms" (not "Forms Management")

Future forms using this pattern should also be added to the Admin Hub direct forms table.

## Commits

- `8b41201` — feat: training request modal + backend Notion integration
- `64e4cd7` — feat: update training request form — internal/external delivery + category
