# Session: Gull Force Phase 6 Sprint 2

**Date:** 2026-03-01
**Repo:** jtaylorcomplize/gull-force-wp (master)
**Key commit:** 1c47b3a (feat: Phase 6 Sprint 2)

---

## Delivered

### 1. `gf_newsletter` CPT

Registered in `gull-force.php` mu-plugin:
- `post_type: gf_newsletter`
- `rewrite: { slug: newsletter }` — individual post URLs at `/newsletter/{slug}/`
- `has_archive: false` — archive is a custom page at `/newsletters/`
- `menu_icon: dashicons-media-document`

### 2. ACF Field Group (`group_gf_newsletter`)

Script: `scripts/create-newsletter-fields.php` — registers via `acf_import_field_group()`.

| Field key | Field name | Type | Notes |
|-----------|-----------|------|-------|
| `field_gf_nl_issue` | `newsletter_issue` | text | Issue name, required |
| `field_gf_nl_date` | `newsletter_date` | date_picker | Return: Y-m-d (ISO — sorts lexicographically) |
| `field_gf_nl_pdf` | `newsletter_pdf` | file | Return: array; mime: pdf |
| `field_gf_nl_summary` | `newsletter_summary` | textarea | Public teaser visible to all |
| `field_gf_nl_thumbnail` | `newsletter_thumbnail` | image | Return: array; cover page preview |
| `field_gf_nl_member_only` | `newsletter_member_only` | true_false | Default: 1 (member-only) |

Location rule: `post_type == gf_newsletter`.

### 3. `[gf_newsletter_archive]` Shortcode

Renders the full newsletter grid on `/newsletters/`.

**Query:** `get_posts(['post_type' => 'gf_newsletter', 'meta_key' => 'newsletter_date', 'orderby' => 'meta_value', 'order' => 'DESC'])` — ISO date sorting works without `meta_value_num`.

**States:**
- **Unauthenticated:** Shows membership notice banner with "Join" and "Log in" links. All issues visible. Member-only issues show 🔒 lock icon and "log in or join to download" instead of a download button.
- **Pending member:** Issues show "Available on membership activation".
- **Active/honorary member:** "Download PDF ↓" button visible for all accessible issues.

**`newsletter_member_only = 0`:** Issue is public; anyone sees download button (for historical issues the client may want freely available).

### 4. `[gf_member_dashboard]` Shortcode

Three-state rendering on `/member-area/`:

| State | Condition | Renders |
|-------|-----------|---------|
| Logged out | `!is_user_logged_in()` | Login prompt card with "Log In →" and "Join" link |
| Pending BACS | `gf_membership_status === 'pending'` | Order reference + payment instructions |
| Access restricted | Logged in but not `active`/`honorary` | "Access Restricted" with join link |
| Full dashboard | `gf_current_user_is_member()` | Welcome header, membership details, access panel, quick links |

**Dashboard quick links:** Browse Newsletters → `/newsletters/`, My Account → `wc_get_page_permalink('myaccount')`, Contact → `/contact/`, Log out → `wp_logout_url('/')`.

**Design:** Consistent with site design system — Playfair Display headings, Source Serif 4 body, `--gf-navy` / `--gf-gold` / `--gf-cream` CSS vars.

### 5. Pages Created

| Page | ID | URL | Template |
|------|----|-----|---------|
| Newsletters | 3934 | `/newsletters/` | `elementor_header_footer` |
| Member Area | 3935 | `/member-area/` | `elementor_header_footer` |

Script: `scripts/build-sprint2-pages.php` — idempotent (checks by slug).

### 6. Test Fixture

`scripts/create-test-newsletter.php` — creates 2 test `gf_newsletter` posts:
- Issue 1 — Inaugural Newsletter (2023-06-01)
- Issue 2 — Remembrance Day 2023 (2023-11-01)

Both member-only. Verified archive renders correctly.

---

## Technical Notes

### ISO date ordering
`orderby=meta_value` (string comparison) works correctly for `Y-m-d` date format because ISO 8601 dates sort lexicographically = chronologically. No `meta_value_num` or SQL casting needed.

### Shortcode auth gating vs page-level restriction
`/member-area/` has no WP page-level restriction. The shortcode handles all states explicitly. This is intentional: WC's `login_redirect` filter sends users to `/member-area/` post-login, and the shortcode renders the correct state without redirect races. `/newsletters/` is fully public; PDFs are gated by the shortcode's `$can_download` check on each card.

### wc_get_page_permalink() in dashboard
Dashboard uses `wc_get_page_permalink('myaccount')` for the "My Account" link. This returns the correct WC my-account URL dynamically, regardless of what page slug the client has chosen.

---

## Verification

Both pages curl-tested from DDEV container:
- `/newsletters/`: renders `gf-newsletter-archive` div, both test issues shown with 🔒 lock icons and join/login links — no PHP errors
- `/member-area/`: renders "Please log in to access your member area" with login button — no PHP errors

---

## Phase 6 Status

| Sprint | Status |
|--------|--------|
| Sprint 1 — Foundation (role, WC product, hooks, login page) | COMPLETE ✅ |
| Sprint 2 — Newsletter CPT + archive + member dashboard | **COMPLETE ✅** |
| Sprint 3 — Admin management UI + nav conditional | Next |
| Sprint 4 — Bulk import scripts (newsletters CSV, member CSV) | Planned |

**Next: Phase 6 Sprint 3**
- Admin user list columns: member number, status, joined, pin sent
- Membership meta box on User edit screen
- Nav header: conditional login / "Member Area ▾" dropdown
