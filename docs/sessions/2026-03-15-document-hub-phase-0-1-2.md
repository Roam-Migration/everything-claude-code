# Session Notes — 2026-03-15 — Document Hub Phases 0, 1, 2

## What Was Done

- **Phase 0 completed:** All 13 source databases inventoried and documented in the Document Hub Consolidation project page
  - 8 proper DBs to migrate (Arcare, AWH, Roam Doc Register, Document Register, Amplifon, RML Onboarding, All Materials DB, Legal Resources)
  - 2 Notion-native page sources (SOP page, Sales page)
  - 3 nav/view-only pages (no independent content)
  - Document Hub target DB created fresh with unified schema (`e8bb8093ed41479284f42ece9562e15e`, collection `c733d7ec-3921-455a-aab1-701fce4db63b`)
- **Schema extended:** Added `Tags` (multi-select, 11 options) and `Audience` (select: Internal/External/Client-Facing/All Staff) to Document Hub DB and project page schema table
- **Phase 0 checklist updated** in project page — all items checked off
- **Phase 1 completed:**
  - Schema confirmed by Jackson
  - All DB property options verified present
  - Property mapping tables written for all 11 sources with content (in project page under "Property Mapping Tables" section)
  - Core Data page updated with unified schema reference table
- **Phase 2 completed:** Three tracking fields added to all 8 source DBs via `ADD COLUMN` DDL (non-destructive):
  - `Migrated to Doc Hub` (checkbox)
  - `Doc Hub URL` (url)
  - `Migration Date` (text)
- Project page and Core Data page updated to reflect all three phases complete

## Technical Patterns Learned

### Notion MCP parallel DDL — safe for independent collections
Running `notion-update-data-source` on 8 collections in a single parallel batch is safe because each targets a different collection ID. `ADD COLUMN` is non-destructive — never touches existing rows.

### Migration tracking field pattern
Adding `Migrated to Doc Hub` + `Doc Hub URL` + `Migration Date` directly to source DBs creates idempotency: Phase 3 can be interrupted and resumed by filtering `WHERE "Migrated to Doc Hub" IS NOT true`. Count verification: records in hub from source N = records in source DB (minus exclusions).

### Source vs target collection IDs
- All Materials Database: the _page_ URL is `107e1901e36e80619cc8d110666e2299` but the inline DB collection is `a0999219-13f2-430d-a3b5-27d158b42fe7` — always fetch the collection, not the page, to get the schema.
- Roam Document Register `2a0e1901e36e805fa7e4e67f4103687c?v=...` — the `?v=` param is a filtered view, not a different database.

## Remaining Work

- [ ] Phase 3 — migrate All Materials DB (HIGH) → Notion task: https://www.notion.so/324e1901e36e81be8e8edce209a6efae
- [ ] Phase 3 — migrate Document Register + Roam Doc Register → Notion task: https://www.notion.so/324e1901e36e81fe94f4eab79fab152a
- [ ] Phase 3 — migrate remaining sources (Arcare, AWH, SOP page, Amplifon, Legal Resources, Onboarding) → Notion task: https://www.notion.so/324e1901e36e81a3b86bf75d8c17bdef
- [ ] Phases 4 & 5 — department views + lifecycle workflow → Notion task: https://www.notion.so/324e1901e36e81ecb599d2d16773f01f
- [ ] Phase 6 — wire DocumentHubCard to Legal Hub + Training pages → Notion task: https://www.notion.so/324e1901e36e81f48505c88d9e24e387
- [ ] Phase 7 — deferred cleanup (archive originals after team confirmation)
- [ ] Fix broken client tabs in LegalHubPage.tsx (Notion task: https://www.notion.so/324e1901e36e81b1acb0d34568169716)

## Key IDs / References

| Resource | ID/URL |
|----------|--------|
| Document Hub Consolidation project page | https://www.notion.so/324e1901e36e81b5847cdcee451e0658 |
| Document Hub DB | `e8bb8093ed41479284f42ece9562e15e` · collection `c733d7ec-3921-455a-aab1-701fce4db63b` |
| Intranet Core Data page | `2ece1901e36e806e8d7ac3ebf84b9b73` |
| All Materials DB (HIGH priority source) | collection `a0999219-13f2-430d-a3b5-27d158b42fe7` |
| Document Register | collection `93dd6ab4-5a29-461c-bfe4-34ce57cac88d` |
| Roam Document Register | collection `2a0e1901-e36e-80b6-bb5e-000be0b94770` |
| Arcare Document Hub | collection `2fee1901-e36e-8171-b4ae-000ba06efb60` |
| AWH Document Hub | collection `2fee1901-e36e-8010-a964-000b186785d4` |
| Amplifon Documentation | collection `2c4e1901-e36e-80c8-9d0a-000b93d7dacc` |
| RML Onboarding | collection `5b2f18bb-66dc-4f49-8d0e-e98837478538` |
| Legal Resources | collection `2e6f8b76-2cd9-433d-825e-4731bf80ffec` |
| SOP page (Notion-native, Phase 3) | `899625c2502d41f98b1ffbc3fb858289` |
| Sales page (GDrive links, Phase 3) | `20711107d6f241c4926918ceb66688f9` |
