# Session Notes — 2026-03-15 — Document Hub Consolidation Planning

## What Was Done

- Identified Legal Hub page (`/legal-hub`) as the best partial page to complete — has 3 explicit `ComingSoon` sections (SOP Downloads, Application Checklists, Legal Precedents) and broken client tabs
- Reviewed `DocumentHubCard` component — already functional on CoreOperationsPage, ready to use on Legal Hub once Document Hub DB has content
- Discussed and documented the Document Hub management strategy:
  - Non-destructive migration: add `Migrated to Doc Hub`, `Doc Hub URL`, `Migration Date` fields to source DBs — never delete originals until Phase 7
  - Unified schema: Name, Document Type, Department, Status, Published/Review dates, Owner, Approver, Content Location, Google Drive URL, Source Database, Migration Notes, Visible on Intranet, Intranet Categories
  - Department/team views with access controls
  - Document lifecycle: Draft → Under Review → Published → Archived
- Created "Document Hub Consolidation" project page in Notion Projects DB with 7-phase plan
- Updated task "Doc Hub - surface Doc Hub in Intranet" (`323e1901e36e8096b7c0ce0d4a0d12be`) with Phase 6 deliverables and correct project relation
- Updated Intranet Core Data page Core Operations section — replaced informal notes with structured 7-phase summary and project link

## Root Causes / Gaps Diagnosed

- **Document Hub DB 404**: The main intranet Document Hub DB (`29ae1901e36e804a91d9dd85c8f331d4`) returns 404 — integration lacks access or DB was deleted. Must be diagnosed in Phase 0.
- **No formal project existed**: Only an empty task and informal notes existed for Document Hub work. Created proper project page.
- **Client tabs broken in LegalHubPage**: `activeTab` state wired to tab underline only — content area never changes based on active client.

## Technical Patterns Learned

### Document Hub DB Filter Pattern
`DocumentHubCard` accepts `categories?: string[]` — these map exactly to Intranet Categories multi-select values in the Document Hub Notion DB. The SOP Downloads section should use `categories={['SOP', 'Process guide']}`, Application Checklists `categories={['Checklist']}`, Legal Precedents `categories={['Legal precedent', 'Template']}`.

### Legal Hub Client Tabs — Needs Data-Driven Content
LegalHubPage has `activeTab` state but the 4 cards (Client SOP, SLA Summary, Fee Schedule, Key Contacts) render static hardcoded content regardless of the active tab. To complete, each tab needs per-client data sourced from the `clients` config array and rendered conditionally.

## Remaining Work

- [ ] Phase 0: Fetch the 7 unidentified source database IDs from Core Data Core Operations table and complete source inventory
- [ ] Phase 0: Diagnose Document Hub DB 404 (`29ae1901e36e804a91d9dd85c8f331d4`)
- [ ] Phase 1: Audit unified schema against existing Document Hub DB schema — add missing fields non-destructively
- [ ] Phase 2: Add migration tracking fields to each source DB
- [ ] Phase 3: Migrate documents into Document Hub DB
- [ ] Phase 6: Replace 3 `ComingSoon` sections in `LegalHubPage.tsx` with `DocumentHubCard` instances (blocked until Phase 3)
- [ ] Fix broken client tabs in `LegalHubPage.tsx` — content never changes on tab switch

## Notion Tasks Created

| Task | URL |
|------|-----|
| Inventory Document Hub source databases (Phase 0) | https://www.notion.so/324e1901e36e8100b4f3fdf01a6c38a1 |
| Fix Legal Hub client tab content switching | https://www.notion.so/324e1901e36e81b1acb0d34568169716 |

## Key IDs / References

| Resource | ID/URL |
|----------|--------|
| Document Hub Consolidation project | https://www.notion.so/324e1901e36e81b5847cdcee451e0658 |
| Doc Hub - surface Doc Hub in Intranet task | https://www.notion.so/323e1901e36e8096b7c0ce0d4a0d12be |
| Document Hub DB (to diagnose) | `29ae1901e36e804a91d9dd85c8f331d4` |
| Intranet Core Data page | `2ece1901e36e806e8d7ac3ebf84b9b73` |
| LegalHubPage | `/tmp/Rmlintranetdesign/src/app/pages/LegalHubPage.tsx` |
| DocumentHubCard | `/tmp/Rmlintranetdesign/src/app/components/DocumentHubCard.tsx` |
| Source DBs to inventory | `2a0e1901e36e805fa7e4e67f4103687c`, `b0b174bf1bfd4e8b89dd5a68a6f3e9f6`, `2ece1901e36e80eaae9cf2deb1e878a3`, `20711107d6f241c4926918ceb66688f9`, `1cbe1901e36e80ed8bc7f9e03cb470c9`, `134e1901e36e8059b180fa8c3c499191`, `c4938bb4d29441e6a78c5e8911376cb8` |
