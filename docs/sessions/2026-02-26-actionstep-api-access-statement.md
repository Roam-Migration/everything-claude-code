# Session: Actionstep API Access Statement
**Date:** 2026-02-26
**Branch:** fix/p1-documentation-updates

---

## What Was Accomplished

Drafted and revised an API access statement for the Actionstep development team, covering scope of integration required across current and planned RML projects.

### Projects Researched (via Notion)
- **RML Intranet** (`307e1901-e36e-8185-bd35-edca1fadbbca`) — React SPA, Google IAP auth, Notion API integration
- **CMS Transformation Project** (`30be1901-e36e-8036-8e97-c9c4fb9a70ec`) — 12-week project to make intranet self-service; planned Actionstep data integration in Q2 2026
- **AS Gmail Plugin Chrome Extension v3** (`311e1901-e36e-805c-98e4-cb1b55ebe88a`) — Active project, currently blocked on Actionstep API credentials (OAuth2)

---

## Final Statement Structure

**Use Case 1 — Gmail Chrome Extension (Active)**
- OAuth2, domain-restricted to @roammigrationlaw.com
- Capabilities: matter search/retrieval, matter creation, time entry, file notes, task creation, attachment upload, contact/participant lookup

**Use Case 2 — Internal Staff Portal / Intranet (Planned, Q2 2026)**
- Read-only matter data surfaced through the intranet
- Overlaps with Use Case 1 scope; full spec TBD

**Use Case 3 — Third-Party and Client-Facing Integrations (Planned)**
- Server-to-server / service account auth (separate from user OAuth2)
- Client portal providing read-only matter visibility to external clients
- Webhook/event subscription support flagged as a requirement
- Complize reference deliberately excluded

---

## Key Decisions

### Why Use Case 3 Was Added
Initial draft only covered internal, user-OAuth2-authenticated use cases. Adding UC3 was necessary because:
1. **Auth model mismatch** — Complize-style and client-portal integrations require service account / client credentials flow, not user OAuth2
2. **Actor mismatch** — external clients are not @roammigrationlaw.com users
3. **Establishing scope early** — avoids a second negotiation with the AS team once development is underway
4. **Rate limit / data residency profile** — AS team needs visibility of batch/event-driven call patterns

### Scope Boundary
- Complize removed from statement at user's direction (keep third-party integrations generic)
- Client portal described as read-only visibility at a "macro level" — no write access proposed for external consumers

---

## Lessons Learned

- API access statements should capture the full intended integration surface, not just the immediate project. Auth model differences (user OAuth2 vs service-to-service) are a meaningful scope distinction that warrant explicit coverage.
- For legal tech platforms like Actionstep, flagging client-facing data flows early is important — they likely have their own data sharing and compliance requirements that need lead time to resolve.

---

## Next Steps

- Submit statement to Actionstep development team
- Await Actionstep OAuth2 credentials to unblock AS Gmail Plugin Phase 2+
- Confirm webhook/event subscription availability with AS team
- Revisit UC2 and UC3 scope when CMS Transformation reaches integration phase (Q2 2026)
