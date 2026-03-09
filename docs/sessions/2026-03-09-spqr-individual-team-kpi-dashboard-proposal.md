# Session: SPQR Individual & Team KPI Dashboard Proposal

**Date:** 2026-03-09
**Project:** SPQR Dashboard (Metabase, wealth-fish.metabaseapp.com)

---

## What Was Accomplished

Designed the architecture for individual and team leader KPI dashboards, to be built programmatically without maintaining separate Metabase dashboards per person.

## Notion Task Created

**"Build Individual & Team KPI Dashboards via Signed Embedding"**
- URL: https://www.notion.so/31ee1901e36e813ebb0acbf9a6cb6f5e
- Project: AS SPQR BI Dashboard Project
- Priority: High | Effort: 5 | Status: Not started

---

## Architecture Decision

**Single parameterized Metabase dashboard + signed embedding in intranet.**

Rejected alternatives:
- 15 separate Metabase dashboards (maintenance burden, schema changes must propagate)
- Metabase-native URL filter (no access control — staff can change the filter)
- Metabase Pro row-level permissions (cost, complexity)

### Individual Dashboard
- One Metabase dashboard with `{{participant_id}}` template tag
- Embedded in intranet `/my-performance` page
- Intranet resolves `participant_id` from IAP email via staff mapping table
- JWT-locked parameter — staff cannot change it
- Leverages existing `docs/patterns/jwt-signed-embedding-pattern.md`

### Team Leader View
- Same (or similar) dashboard with parameter unlocked
- Embedded in intranet `/team-performance` (manager-role gated)

---

## Implementation Steps (in task)

1. Parameterize Card 2278 with `{{participant_id}}` + add 6-month trend version
2. Build Matter WIP card (open matters, stage, days open)
3. Assemble dashboard
4. Build email → participant_id mapping
5. Wire into intranet with role-gated embed

---

## References

- Signed embedding pattern: `docs/patterns/jwt-signed-embedding-pattern.md`
- Billing data model: `docs/SPQR Dashboards/htmigration-billing-data-model.md`
- KPI Summary card: https://wealth-fish.metabaseapp.com/card/2278
