# Session Notes — 2026-03-14 — Doc Automation + Project X Scoping

## What Was Done

- Ran a full product scoping exercise for the Document Automation Platform (DAP) and its relationship to the long-term Project X vision
- Deployed a research sub-agent to read all relevant session notes, intranet code, ECC docs, and skills
- Produced a comprehensive scoping document covering: current state analysis, Project X vision, DAP scope definition, technical architecture, phased roadmap (Phase 1–5), key decisions, and immediate next steps
- Confirmed DAP Phase 1 is fully live (fee quote calculator at `/legal-hub/fees/calculator` + `GoogleDocsService` + `DocumentService` + `generated_documents` audit trail)
- Confirmed Chrome Extension (Gmail add-on) is blocked pending Actionstep OAuth2 credentials
- Scoping doc saved to Notion as standalone project page

## Root Causes Diagnosed

- **No code was written this session** — this was a pure scoping/planning session

## Technical Patterns Learned

*(None new — this session synthesised existing knowledge)*

## Project X Architecture Decision (Captured)

Project X must be a **separate application** from the RML Intranet:
- Google IAP is incompatible with external user identity at the infrastructure level
- Intranet is deliberately desktop-only, staff-first — incompatible with a client portal product
- Correct pattern: shared Supabase + shared DAP backend (extracted to `rml-documents-api`), separate Project X frontend on new Cloud Run instance
- For Project X client data: new Supabase project in `ap-southeast-2` (Sydney) to satisfy Privacy Act 1988 obligations

## Remaining Work

- [ ] Wire live rate fetching in `FeeCalculatorPage` (currently uses hardcoded fallback for preview; endpoint `/api/documents/fee-schedule/fee-quote-482` is live but not called on mount)
- [ ] Build `engagement-letter-482` Google Docs template (legal ops designs; engineering wires it — highest priority Phase 2)
- [ ] Escalate Actionstep OAuth2 credential delivery timeline (submitted 2026-02-26, no response — Chrome Extension phases 2–5 gated on this)
- [ ] Select document signing provider (HelloSign vs DocuSign vs Adobe Sign) — Phase 4 and Project X dependency
- [ ] Build document history page at `/legal-hub/fees/history` or `/my-workspace/documents` — endpoint live, no frontend
- [ ] Design complete Phase 2 template library (see scoping doc)
- [ ] Plan Project X: external auth system, client data model, portal UI
- [ ] Post-generation validation: wire `validateGeneratedDocument()` into generate flow

## Key IDs / References

| Resource | ID/URL |
|----------|--------|
| DAP Fee Calculator | `/legal-hub/fees/calculator` |
| DAP Backend routes | `/tmp/Rmlintranetdesign/backend/src/routes/documents.ts` |
| GoogleDocsService | `/tmp/Rmlintranetdesign/backend/src/services/GoogleDocsService.ts` |
| DocumentService | `/tmp/Rmlintranetdesign/backend/src/services/DocumentService.ts` |
| DocumentContext type | `/tmp/Rmlintranetdesign/backend/src/types/documents.ts` |
| Supabase migration | `/tmp/Rmlintranetdesign/supabase/migrations/20260311_document_automation.sql` |
| DAP Compass Wiki requirements | `/tmp/Rmlintranetdesign/docs/DAP-COMPASS-WIKI-REQUIREMENTS.md` |
| fee-quote-482 Drive template | `1JFETU6cBg9brblTJuU1ci-f-LKMSQTOTwy_BS9a3CGU` |
| Drive output folder | `1yc1wG15WthGYhKkOBcSUA_tDDbG9_Og1` |
| Scoping doc (Notion) | See Notion task links below |
