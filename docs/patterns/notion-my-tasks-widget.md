# Pattern: Notion My Tasks Widget

**App:** RML Intranet
**File:** `src/app/components/MyWorkspace/MyTasksWidget.tsx`
**Backend:** `backend/src/routes/notion.ts` → `GET /api/notion/my-tasks`
**Service:** `backend/src/services/notion.ts` → `getTasksByUser(email)`

---

## How It Works

1. **IAP email → Notion user ID lookup**
   `getTasksByUser(email)` calls `notion.users.list()` and finds the workspace user by `person.email`. Returns `[]` if the user is not in the workspace (no error — useful for contractors).

2. **Tasks DB query (filtered)**
   Uses `dataSources.query({ data_source_id: TASKS_DB_ID })` — the v5 Notionhq SDK renamed `databases.query` to `dataSources.query`.
   Filter: `Driver contains notionUser.id` AND `Status != Done` AND `Status != Deprecated`.

3. **Property names are exact and case-sensitive**
   | Notion Property | API Key | Notes |
   |----------------|---------|-------|
   | Task title | `p.Task?.title` (falls back to `p.Name?.title`) | v5 uses `title` array |
   | Status | `p.Status?.status?.name` | "status" type, not "select" |
   | Priority | `p.Priority?.select?.name` | Strip leading emoji: `"🔴 Urgent"` → `"Urgent"` |
   | Due date | `p['Completion Date']?.date?.start` | Property is "Completion Date", NOT "Due" |

4. **No server-side sort** — the Tasks DB has no "Due" property to sort on. The widget sorts client-side via `sortTasks()`.

5. **Priority emoji stripping**
   ```ts
   rawPriority.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim()
   ```

---

## Nginx Routing

The `/api/notion/my-tasks` path is proxied to backend, NOT to `api.notion.com`. The nginx `location` block must include `my-tasks` explicitly:

```nginx
location ~ ^/api/notion/(documents|cache|my-tasks) {
    proxy_pass http://backend;
}
```

Without this, `/api/notion/my-tasks` falls through to the Notion API proxy and returns 404 (Notion's API has no `/my-tasks` endpoint).

---

## Client-Side Sort Logic (`sortTasks`)

Priority in the widget: Status (In progress > Not started > Proposed) + Priority (Urgent > High > Normal > Low) + Due date (overdue first, then soonest, then no date).

---

## Common Gotchas

| Issue | Root cause | Fix |
|-------|-----------|-----|
| Tasks return empty array | User not found in Notion workspace (email mismatch) | Verify Notion account email = Google Workspace email |
| `Status` filter breaks | Using `select: { does_not_equal }` instead of `status: { does_not_equal }` | Status type properties use `status` filter, not `select` |
| Due dates always null | Reading `p.Due?.date?.start` — property doesn't exist | Use `p['Completion Date']?.date?.start` |
| Priority shows emoji prefix | Raw value is `"🔴 Urgent"` | Strip with Unicode emoji regex before display |
| 403 from nginx | `/api/notion/my-tasks` not in nginx allowlist | Add `my-tasks` to the Notion proxy location regex |
