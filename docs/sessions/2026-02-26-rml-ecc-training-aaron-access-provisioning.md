# Session: RML ECC Training — Aaron Access Provisioning (T0 Completion)

**Date:** 2026-02-26
**Branch:** fix/p1-documentation-updates
**Continuation of:** `docs/sessions/2026-02-25-rml-ecc-training-aaron-onboarding.md`

---

## What Was Accomplished

Completed T0 (Jackson provisions Aaron's access) from the RML ECC Training onboarding project.

### GCP Access (programmatic)

Added `a.taylor@roammigrationlaw.com` as project viewer on `rmlintranet`:

```bash
gcloud projects add-iam-policy-binding rmlintranet \
  --member="user:a.taylor@roammigrationlaw.com" \
  --role="roles/viewer"
```

Aaron can now browse Cloud Run services, view logs, and read all GCP resources in the `rmlintranet` project.

### IAP Access (programmatic)

Granted intranet IAP access:

```bash
gcloud iap web add-iam-policy-binding \
  --resource-type=backend-services \
  --service=roamintranet-backend \
  --member="user:a.taylor@roammigrationlaw.com" \
  --role="roles/iap.httpsResourceAccessor" \
  --project=rmlintranet
```

**Note:** The `domain:roammigrationlaw.com` binding already existed on the IAP policy, meaning all `@roammigrationlaw.com` users are implicitly authorised. The explicit user binding is redundant but harmless. Future `@roammigrationlaw.com` accounts will be pre-authorised without manual IAP steps.

### Google Workspace (manual)

Confirmed `a.taylor@roammigrationlaw.com` is Active in Google Admin Console. Account is ready for intranet sign-in via IAP OAuth flow.

---

## Technical Notes

### IAP domain binding discovery

The existing `domain:roammigrationlaw.com` IAP binding means the provisioning step for intranet access is not strictly required for any `@roammigrationlaw.com` user — only the GCP project viewer binding is needed for Console access. This simplifies future onboarding: new staff get intranet access automatically once their Workspace account is active.

### Principle of least privilege consideration

`roles/viewer` at project level is broad — it grants read access to most GCP resources. For a training scenario, scoped alternatives are:
- `roles/run.viewer` — Cloud Run only
- `roles/logging.viewer` — Logs only

For Aaron's onboarding (learning context), project viewer was acceptable. For production staff, consider scoped roles.

---

## Notion Updates

Tasks marked complete in Notion manually by Jackson:
- The GCP/Google Workspace task in the RML ECC Training project

---

## Outstanding Items (Next Actions)

- **Get Aaron's Notion user ID** — required to reassign T1–T20 Driver and project Driver to Aaron
- **Aaron to test access** — navigate to `https://intranet.roammigrationlaw.com` and GCP Console to confirm
- **Begin T1** — Windows environment setup (WSL2, Node, Git, Claude CLI, VS Code)
- **Push branch** — `git push team fix/p1-documentation-updates` when ready

---

## Files Created This Session

```
docs/sessions/2026-02-26-rml-ecc-training-aaron-access-provisioning.md  — this file
```
