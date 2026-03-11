# RML Intranet — Deploy Phases 3–5 + Shared Component Adoption
**Date:** 2026-03-11
**Repo:** /tmp/Rmlintranetdesign
**Commits:** 95d8bce, 3d306a4

---

## Work done

### Task 1 — Deploy Phases 3–5 to production
- `gcloud builds submit --config=cloudbuild.yaml --project=rmlintranet` from `/tmp/Rmlintranetdesign`
- Build ID: `5c2125a9-d96c-4398-8328-3d095756ce88`; duration 2m16s
- Live at intranet.roammigrationlaw.com

### Task 2 — Adopt StatusBadge + ExternalLinkRow across intranet
Two commits, 15 files total, 207 lines removed → 91 lines added.

#### Wave 1 (commit 95d8bce)
| File | Change |
|---|---|
| KPISubmissionsCard | `getStatusBadge()` fn → StatusBadge variants; support_needed badge |
| RoleNode | Vacant (warning) + Leadership (purple className) → StatusBadge |
| MyWIPWidget | Both external links → ExternalLinkRow (row + inline) |
| MyKPIsWidget | Notion placeholder link → ExternalLinkRow inline |
| AdminFormsPage | Form type + status badges → StatusBadge; Notion link → ExternalLinkRow |
| AdminSettingsPage | Layer legend + matrix column → StatusBadge via LAYER_STYLES |

#### Wave 2 (commit 3d306a4)
| File | Change |
|---|---|
| MyTasksWidget | Count badge (muted), status badges (className); both Notion links → ExternalLinkRow |
| ActiveMattersPage | Header Metabase link → ExternalLinkRow inline |
| BusinessIntelligencePage | Header + help section Metabase links → ExternalLinkRow inline |
| DocumentHubCard | Header count badge + category row badges → StatusBadge |
| PriorityCard | Count badge → StatusBadge |
| PlatformMapPage | DATA_SOURCE legend + FeatureRow grid + table view badges → StatusBadge via CONFIG |

---

## Patterns learned

### StatusBadge config-driven adoption
When a page already has a `CONFIG` object with a `badgeClass` string per variant, adoption is a one-line change per render site — just pass `className={cfg.badgeClass}`. The config itself doesn't need to change.

```typescript
// Before
<span className={cn('text-xs px-2 py-0.5 rounded font-medium', statusCfg.badgeClass)}>
  {statusCfg.label}
</span>

// After
<StatusBadge label={statusCfg.label} className={statusCfg.badgeClass} />
```

### What NOT to adopt (skip criteria)
- **Icon-inside-badge**: StatusBadge renders only a string label. If a badge contains a `<Shield>` or other icon alongside text, skip it.
- **Custom hover inversion**: Button-style action links (`hover:bg-[#522241] hover:text-white`) don't map to ExternalLinkRow.
- **Internal SPA links**: ExternalLinkRow always adds `target="_blank"`. Never use it for `/path` hrefs.
- **`href="#"` placeholders**: Skip until the real URL exists.
- **Prop-typed links**: If `href` is a prop that could be internal or external, leave as-is.

### STATUS_COLORS border pattern
When using StatusBadge with `className={statusColor}`, the base class includes `border`. Add border colors to the color map:
```typescript
const STATUS_COLORS = {
  'In progress': 'bg-blue-100 text-blue-800 border-blue-200',
  // ...
};
```

---

## Remaining work
- Triage 4 Dependabot high vulnerabilities on Rmlintranetdesign (GitHub security tab)
- MyRoleWidget footer link uses `<a href={internalPath}>` with ExternalLink icon — misleading UX, should swap icon for ChevronRight
- DocumentHubCard "Browse all" and "Open" action links could adopt shared components once URL types are confirmed
