# RML Form Integration Skill

## Purpose

Systematic workflow for adding new forms to the RML Intranet. Enforces the mandatory sync obligations across AdminPage.tsx, nginx, FORMS-REGISTER.md, and the Notion Platform Map — preventing the most common integration gaps.

## When to Use

- Adding any new form to the RML Intranet (training requests, approvals, HR forms, ops forms)
- When a user says "add a form for X" in the Rmlintranetdesign repo
- Migrating an existing ad-hoc form to the standard pattern

## Prerequisites

- Working in `/tmp/Rmlintranetdesign`
- Notion MCP active (run preflight: fetch any known Notion page to confirm token)
- Understanding of whether this is a simple HR/ops form (Pattern A) or approval workflow (Pattern B)

## Form Pattern Decision

**Ask before starting:** Does this form need an approval workflow or complex backend logic?

| Pattern | Use When | Backend | Notion |
|---------|----------|---------|--------|
| **A — Direct Notion** | Simple HR/ops forms, no approval needed | Express route → Notion API | Data Source: Notion |
| **B — Supabase FormBuilder** | Approval workflows, multi-step, conditional fields | `form_definitions` row → `forms.ts` auto-handles | Data Source: Supabase |

---

## Workflow

### Phase 1: Plan the Integration

1. **Determine form type** (Pattern A or B — see decision table above)
2. **Identify the Notion database** the form writes to (or confirm Supabase table)
3. **Confirm the route path** — follow existing convention: `/api/forms/[noun]` or `/api/[noun]-requests`
4. **Review an existing form** for structural reference:
   - Pattern A reference: `backend/src/routes/training.ts` + `RequestTrainingModal.tsx`
   - Pattern B reference: `form_definitions` table in Supabase

**Gate:** Confirm pattern, route, and target database before writing code.

---

### Phase 2: Backend Route (Pattern A only)

Skip this phase for Pattern B — Supabase FormBuilder handles backend automatically.

1. **Create Express route file** in `backend/src/routes/[noun].ts`:
   ```typescript
   import { Router } from 'express'
   import { Client } from '@notionhq/client'

   const router = Router()
   const notion = new Client({ auth: process.env.NOTION_API_KEY })

   router.post('/', async (req, res) => {
     try {
       const { field1, field2 } = req.body
       // Validate inputs
       if (!field1) return res.status(400).json({ error: 'field1 required' })

       await (notion as any).pages.create({
         parent: { database_id: process.env.NOTION_[DB_NAME]_DB },
         properties: {
           // Use exact property names from Notion schema
           'Title': { title: [{ text: { content: field1 } }] },
         }
       })
       res.json({ success: true })
     } catch (err) {
       console.error('[form-name]', err)
       res.status(500).json({ error: 'Submission failed' })
     }
   })

   export default router
   ```

2. **Register route** in `backend/src/index.ts`:
   ```typescript
   import nounRouter from './routes/noun'
   app.use('/api/noun-requests', nounRouter)
   ```

3. **Add NOTION_DB env var** to `backend/cloudbuild.yaml` under `--set-env-vars` or `--update-secrets`

**Gate:** Route responds correctly to a test POST before proceeding.

---

### Phase 3: Add nginx Location Block

**CRITICAL: Missing nginx routes cause silent 404s — the frontend receives no error, form appears to submit but nothing happens.**

In `nginx.conf.template`, add inside the `server {}` block:

```nginx
location /api/noun-requests {
    proxy_pass http://backend:3001/api/noun-requests;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Verify the pattern matches surrounding location blocks exactly.

**Gate:** Confirm location block added before building frontend.

---

### Phase 4: Frontend Modal Component

Create `src/app/components/forms/NounRequestModal.tsx`:

```typescript
import { useState } from 'react'
import { Dialog } from '@headlessui/react'

interface NounRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NounRequestModal({ isOpen, onClose }: NounRequestModalProps) {
  const [field1, setField1] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/noun-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field1 }),
      })
      if (!res.ok) throw new Error(await res.text())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Modal content */}
    </Dialog>
  )
}
```

---

### Phase 5: Register in AdminPage.tsx

**MANDATORY — no exceptions.**

Open `src/app/pages/AdminPage.tsx` and add a row to the Direct Integration Forms table:

```typescript
// In the forms array:
{
  form: 'Noun Request',
  route: '/api/noun-requests',
  backend: 'backend/src/routes/noun.ts',
  notionDb: 'Noun Requests DB',
  status: 'Active',
},
```

Match the exact column structure of surrounding rows.

**Gate:** AdminPage builds without TypeScript errors.

---

### Phase 6: Update FORMS-REGISTER.md

Open `docs/FORMS-REGISTER.md` and add an entry:

```markdown
### Noun Request Form
- **Route:** POST /api/noun-requests
- **Frontend:** src/app/components/forms/NounRequestModal.tsx
- **Backend:** backend/src/routes/noun.ts
- **Notion DB:** [DB name] (ID: `NOTION_NOUN_REQUESTS_DB`)
- **Pattern:** A (Direct Notion)
- **Added:** YYYY-MM-DD
```

---

### Phase 7: Create Platform Map Notion Entry

**MANDATORY — the Platform Map is the authoritative record of all intranet features.**

1. **Verify Notion token is active** (fetch the Core Data page: `2ece1901e36e806e8d7ac3ebf84b9b73`)

2. **Get the Platform Map collection UUID:**
   - Fetch: `https://www.notion.so/69eba1aab2ba46578130db2b74dd686d`
   - Find: `<data-source url="collection://e38debd2-2692-4e42-ae29-5b5a13fff724">`
   - Use: `e38debd2-2692-4e42-ae29-5b5a13fff724` as `data_source_id`

3. **Create entry** with these properties (exact names, case-sensitive):
   ```
   Name: "[Noun] Request Form"
   Status: "Functional"
   Section: "[correct section — HR, Operations, Legal, etc.]"
   Route: "/[page-where-form-lives]"
   Data Source: "Notion" (Pattern A) or "Supabase" (Pattern B)
   Description: "Form for submitting [noun] requests. Writes to [DB name]."
   ```

4. **Link new Notion DB** to Core Data page if a new DB was created for this form

**Gate:** Platform Map entry visible in Notion UI before deploying.

---

### Phase 8: Deploy and Verify

**Frontend (includes nginx changes):**
```bash
cd /tmp/Rmlintranetdesign
gcloud builds submit --config=cloudbuild.yaml --project=rmlintranet
```

**Backend (if route was added/changed):**
```bash
cd /tmp/Rmlintranetdesign/backend
gcloud builds submit --config=cloudbuild.yaml --project=rmlintranet
```

**Verify:**
- [ ] Form renders correctly on the page
- [ ] Successful submission creates Notion page (or Supabase record)
- [ ] Error state shows correct message
- [ ] Admin page table shows new form row
- [ ] Platform Map entry visible in Notion

---

## Pre-Deployment Checklist

- [ ] Pattern decision made (A or B)
- [ ] Backend route created and registered (Pattern A)
- [ ] nginx location block added
- [ ] Frontend modal component created
- [ ] Form registered in `AdminPage.tsx`
- [ ] `FORMS-REGISTER.md` updated
- [ ] Platform Map Notion entry created
- [ ] New Notion DB linked to Core Data page (if applicable)
- [ ] Frontend deployed
- [ ] Backend deployed (if changed)
- [ ] End-to-end submission tested in production

---

## Error Recovery

| Error | Cause | Fix |
|-------|-------|-----|
| Form submits but nothing happens | nginx location block missing | Add `location /api/[route]` to `nginx.conf.template` and redeploy |
| `401 Unauthorized` from Notion API | Notion token expired or wrong secret | Check `--update-secrets=NOTION_API_KEY=notion-api-key:latest` in cloudbuild.yaml |
| `Cannot POST /api/noun-requests` | Route not registered in `index.ts` | Add `app.use('/api/noun-requests', nounRouter)` |
| Property name error from Notion | Case mismatch in property names | Fetch DB schema and verify exact casing |
| TypeScript error in AdminPage.tsx | Forms array shape changed | Match exact column types from surrounding rows |
| Platform Map entry shows wrong section | Section value didn't match enum | Fetch existing Platform Map entries to see valid section values |

---

## Key IDs (do not hardcode — use env vars)

| Resource | Env Var | Value (for reference only) |
|----------|---------|---------------------------|
| Platform Map DB | — | `collection://e38debd2-2692-4e42-ae29-5b5a13fff724` |
| Platform Map page | `VITE_NOTION_PLATFORM_FEATURES_DB` | `69eba1aab2ba46578130db2b74dd686d` |
| Core Data page | — | `2ece1901e36e806e8d7ac3ebf84b9b73` |
| Training Requests DB | `NOTION_TRAINING_DB` | `148b84f17ff14a4d9fffa44dda43b40f` |

---

## Anti-Patterns to Avoid

❌ **Skipping the Platform Map entry** — it's mandatory, not optional; the map is the source of truth for all intranet features

❌ **Hardcoding the collection UUID** — always discover it via `notion-fetch` on the database page; the UUID differs from the page ID

❌ **Adding a route without the nginx location block** — form will silently fail with no visible error

❌ **Skipping AdminPage.tsx registration** — the admin dashboard becomes stale and can't be used for access audits

❌ **Using `--set-env-vars` for the Notion API key** — use `--update-secrets` to avoid silent key rotation divergence
