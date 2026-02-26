# Session: RML ECC Training — Aaron Taylor Onboarding Project

**Date:** 2026-02-25
**Branch:** fix/p1-documentation-updates
**Commit:** d2c09c1

---

## What Was Accomplished

1. **Planned Aaron Taylor's ECC onboarding** — profiled as IS graduate, Excel-familiar, SQL reader, Windows user needing from-scratch setup
2. **Created Notion project "RML ECC Training"** — `https://www.notion.so/312e1901e36e81feb00bd5d0a6145206`
3. **Created 21 Notion tasks** (T0–T20) covering 6 training modules plus doc stub tasks
4. **Appended task numbers [T0]–[T20]** to all task names (workaround for Notion DB lacking native sequential IDs)
5. **Created 4 doc stubs** in ECC repo — Windows onboarding guide + Zapier, Google App Scripts, tool ecosystem map
6. **Converted `docs/onboarding-email-template.md`** to Notion task for Sochan's ECC onboarding (then deleted the file)
7. **Committed doc stubs** — `d2c09c1`

---

## Training Module Structure

| Module | Focus | Tasks | Priority |
|--------|-------|-------|----------|
| 0 (Prereq) | Jackson provisions access | T0 | Urgent |
| 1 | Windows env setup (WSL2, Node, Git, Claude CLI, VS Code) | T1–T2 | High |
| 2 | Notion as mission control | T3–T5 | High (first priority) |
| 3 | ECC framework (skills, agents, commands) | T6–T8 | Normal |
| 4 | Tool ecosystem (Intranet, Metabase, Supabase, Zapier, App Scripts) | T9–T12 | Normal |
| 5 | Collaborative workflows (Git concepts, sessions, task handoff) | T13–T15 | Normal |
| 6 | Hands-on practice | T16–T17 | Low |
| Doc stubs | Zapier, App Scripts, ecosystem map docs | T18–T20 | Normal |

---

## Technical Decisions

### Task numbering via suffix
Notion's All Staff Tasks DB has no native auto-increment ID. Appended `[T0]`–`[T20]` as suffix to task names to enable unambiguous referencing across conversations, emails, and docs. Chose suffix (not prefix) per user preference.

### Module ordering: Notion before ECC framework
Deliberately prioritised Notion (Module 2) before ECC repo exploration (Module 3). Rationale: Notion delivers immediate productivity value (task management) without requiring CLI/Git setup. Aaron can complete T3–T5 even if T1 (Windows setup) is slow.

### Driver assignment deferred
Aaron has no Notion user ID yet — he's not provisioned. T0 (Jackson's task) must complete before T1–T20 can be assigned to Aaron. Jackson is temporary Driver on the project; all training tasks have no Driver set.

### Doc stubs as double-duty tasks
T18–T20 are structured so completing them teaches the session workflow (open → work with Claude → close) while also producing real documentation for the team. Aaron fills in content; Claude writes and commits the files.

### Email template → Notion task
`docs/onboarding-email-template.md` was a stale untracked file (addressed to Sochan, never committed). Converted to a tracked Notion task assigned to Jackson, then deleted the file. Source of truth is now Notion, not a loose markdown file.

---

## Security Incident

User shared a Notion OAuth token (`ntn_60549...`) in the conversation when MCP authentication expired. Immediately advised user to revoke the token at `https://www.notion.so/profile/integrations`. User re-authenticated via `/mcp` OAuth flow. A Notion task was created to track token revocation confirmation.

**Lesson:** MCP token expiry should prompt users to use `/mcp` (OAuth flow), never to paste tokens into chat.

---

## Challenges and Solutions

| Challenge | Solution |
|-----------|----------|
| Notion MCP token expired mid-session | User re-authenticated via `/mcp` OAuth flow |
| User shared live token in chat | Immediately flagged; advised revocation |
| `git rm` failed on untracked file | Used `rm` directly (file was never staged/committed) |
| Aaron not yet in Notion — can't set Driver | Left Driver blank on T1–T20; noted in T0 to reassign after provisioning |

---

## Lessons Learned

- **Notion bulk task creation is reliable** — 21 tasks created + 21 title updates in two parallel batch calls with no failures
- **Suffix numbering works** — `[T0]` suffix on Notion task titles is a practical workaround for absent auto-increment IDs
- **Token sharing is a real risk** — users will share credentials when they hit auth errors; the correct UX is always `/mcp` re-auth, never manual token entry
- **Doc stubs reduce friction** — creating the file structure before Aaron arrives means he can focus on content, not on figuring out where files go

---

## Outstanding Items (Next Actions)

- **T0** — Jackson provisions Aaron's access (blocks everything)
- **Reassign Drivers** — update project + T1–T20 Driver to Aaron once he's in Notion
- **Revoke exposed token** — confirm `ntn_60549...` has been revoked at notion.so/profile/integrations
- **Push branch** — `git push team fix/p1-documentation-updates` when ready
- **Sochan task** — `https://www.notion.so/312e1901e36e8158a39fc17b8b79e9c4` — follow up on ECC setup

---

## Files Created This Session

```
docs/training/ecc-onboarding-windows.md    — Windows setup guide (T1/T2 reference)
docs/tools/zapier-integration.md           — Zapier stub (T18)
docs/tools/google-app-scripts.md           — App Scripts stub (T19)
docs/tools/tool-ecosystem-map.md           — Ecosystem map stub (T20)
docs/sessions/2026-02-25-rml-ecc-training-aaron-onboarding.md  — this file
```

## Notion Items Created This Session

- Project: RML ECC Training — `https://www.notion.so/312e1901e36e81feb00bd5d0a6145206`
- Tasks T0–T20 (21 tasks) — linked to RML ECC Training project
- Sochan ECC onboarding task — `https://www.notion.so/312e1901e36e8158a39fc17b8b79e9c4`
