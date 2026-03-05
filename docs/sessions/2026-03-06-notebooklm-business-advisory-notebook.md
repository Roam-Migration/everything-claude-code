# Session: NotebookLM Business Advisory Notebook Setup

**Date:** 2026-03-06
**Duration:** ~10:30am – ~3:30pm (approx)
**Project:** Business Advisory / NotebookLM
**Outcome:** Business Advisory notebook registered, 2 synthesis documents created and uploaded, gap analysis completed

---

## What We Did

### 1. Session Recovery
Resumed from a prior session (morning, 10:30am–1pm) in which NotebookLM MCP auth had been set up and work begun on sourcing content for a Roam strategy notebook. Session notes had not been written. Reconstructed context from:
- NotebookLM notebook URL provided by user (`69182205-2518-4a88-ae1c-04731190a8c2`)
- Google Doc (Strategy 2026) downloaded via Google Drive MCP
- NotebookLM MCP library was empty — notebook re-registered as "Business Advisory"

### 2. NotebookLM MCP Patch (New Issue)
`ask_question` failed with `channel: "chrome" not found` — this time originating from `shared-context-manager.js`, not `auth-manager.js`. Both files now need patching. Applied fix to both npx cache dirs:
- Removed `channel: "chrome"` from `shared-context-manager.js`
- Added `--disable-gpu` and `--no-sandbox` to args

**Note:** MCP server still requires a Claude Code restart to pick up the new patch. The auth-manager.js patches from the previous session were still in place — only shared-context-manager.js was new.

### 3. Google Drive & Notion Source Scan
Scanned both Google Drive and Notion for content relevant to the Business Advisory notebook purpose:
- Documenting current state of the business (value proposition, market, competitors, tech stack, org structure, financial position, automation opportunities)
- Found ~25+ candidate sources across both platforms
- Presented as plain text list for user annotation

### 4. Web Research Synthesis
Researched best practice for professional services business optimisation. Selected top 2 sources per category:
- Professional services digital transformation frameworks
- Operations & automation for SMBs
- Law firm operations & automation
- Change management & culture

Fetched and synthesised 5 of 6 selected URLs into a single markdown document.

### 5. Documents Created & Uploaded to Google Drive

**Document 1: Professional Services Optimisation Synthesis**
- File: `professional-services-optimisation-synthesis.md`
- Drive ID: `1oaCutF_Zs6v0CGn9cvefKWMgFSLczc1J`
- Content: ~2,500 words covering OC&C 5-lesson framework, Cherry Bekaert 4-step roadmap, Lean+AI for SMBs, PSA capabilities and benchmarks, law firm automation priorities, change management architecture, integrated operating model, key statistics table, and Australian fixed-fee immigration firm applicability notes
- Added to notebook: Yes (manually by user via Google Drive)

**Document 2: RML — IT Systems, Current Projects & KPI Framework**
- File: `rml-systems-projects-kpis.md`
- Drive ID: `1Yeha0AlCHlx1N13Xfa_NOT_wj_d77MVU`
- Content: Full IT systems inventory (Actionstep, Google Workspace, Notion, HubSpot, Zapier, Make, Claude, Metabase/SPQR, GCP, Supabase, Complize stack), current project register (10 active projects with scope), and complete KPI framework by role level (1.1 through 3.2 + Systems Administrator)
- Added to notebook: Yes (manually by user via Google Drive)
- Sources: Notion (Tech & Automations, Projects DB, KPI Framework, Systems Admin PD, Ops & Systems project), ECC (CLAUDE.md, memory, session docs), Google Drive (RML & Complize Summary, AI Agents doc)

### 6. Gap Analysis
Queried NotebookLM (via MCP — failed due to patch issue; completed from knowledge). Identified 7 critical gaps in notebook coverage:
1. Financial position (revenue, margins, cost structure, trend)
2. Service catalogue & pricing (visa types, fixed fee schedule)
3. Client profile & revenue concentration (anchor clients, sectors, retention)
4. Competitive & market landscape (positioning vs named competitors)
5. People & organisational reality (headcount, locations, leadership transition)
6. Complize strategic context (group structure, relationship to RML)
7. Australian regulatory context (OMARA, Migration Act, key visa streams)

---

## Key Learnings

### NotebookLM MCP — Two Files Need Patching
The `channel: "chrome"` issue now appears in TWO files:
1. `dist/auth/auth-manager.js` — patched in previous session, still applied
2. `dist/session/shared-context-manager.js` — NEW, discovered this session

Both npx cache dirs need both patches applied after any cache refresh:
- `/home/jtaylor/.npm/_npx/0d29dd9f4e472da9/node_modules/notebooklm-mcp/dist/`
- `/home/jtaylor/.npm/_npx/16baa19dd5d31de6/node_modules/notebooklm-mcp/dist/`

Patch commands:
```bash
for dir in 0d29dd9f4e472da9 16baa19dd5d31de6; do
  f="/home/jtaylor/.npm/_npx/$dir/node_modules/notebooklm-mcp/dist/session/shared-context-manager.js"
  sed -i 's/            channel: "chrome",//' "$f"
  sed -i 's/"--disable-blink-features=AutomationControlled",/"--disable-blink-features=AutomationControlled",\n                "--disable-gpu",\n                "--no-sandbox",/' "$f"
done
```

After patching, a Claude Code restart is required for the MCP server to reload.

### NotebookLM Source Strategy
- One well-synthesised document > multiple raw documents
- 50-source limit means quality over quantity
- NotebookLM ingests markdown files from Google Drive well
- Refresh cadence: monthly for systems/projects/KPI doc; after major decisions for strategy docs

### Google Drive MCP
- `downloadFile` with `exportMimeType: "text/plain"` works for Google Docs
- `readGoogleDoc` / `getGoogleDocContent` require Google Docs API to be enabled on the MCP project — not currently enabled
- `uploadFile` with `mimeType: "text/markdown"` works cleanly

### Integration Model: Claude + NotebookLM
- Claude: live data collection, synthesis, document creation, system updates
- NotebookLM: persistent knowledge base, grounded Q&A, cross-document synthesis, audio briefings
- The loop: Claude fetches live data → synthesises → uploads to Drive → user adds to NotebookLM → Claude queries notebook to ground advisory responses

---

## Outstanding Work

- Complete gap documents (financial snapshot, service catalogue, Complize context, regulatory context)
- Resolve NotebookLM MCP restart requirement (durable fix still pending)
- Update MEMORY.md: add shared-context-manager.js to the patch list
