# Gull Force — Phase 6: Member Portal Scope

**Date:** 2026-02-28
**Status:** Scoping — for client discussion and approval
**Prerequisite phases:** 0–5 complete (Phase 5 = single templates, maps, nav)
**Promotes from Phase 5 Won't Have:** "Members-only area / family submissions"

---

## 0. Context & Framing

### Two Distinct "Member" Concepts (Critical)

| Concept | Implementation | Description |
|---------|---------------|-------------|
| **Historical veteran** | `gf_member` CPT (1,191 posts) | The WWII servicemen — subjects of the site |
| **Association member** | WordPress User (custom role) | Living people: descendants, supporters, historians who join and pay |

These must never be conflated. The portal adds a WP User layer. A descendant who joins the Association may optionally link their account to an ancestor's `gf_member` post, but they are not the same entity.

### Confirmed Membership Model

| Product | Price | Type | Delivery |
|---------|-------|------|---------|
| **Life Membership** | **$50.00 AUD** | One-time, no renewal | Full member area + newsletter access + lapel pin |

Newsletter access is **included in life membership** — no separate subscription tier.

**Current process:** Manual — postal form, bank transfer. No online component.
**Confirmed decisions:**
- Single tier only (life membership)
- Auto-approval on payment receipt — no committee review step
- PayPal and direct bank deposit (BACS) payment options — no Stripe
- Multiple back-issue newsletters available as PDFs (ready to upload at launch)
- Potential Phase 7: forum, committee meeting notes, member voting

### What This Phase Adds

1. Online membership registration + payment (PayPal or bank deposit)
2. Branded member login portal
3. Newsletter archive (all back-issues as PDFs) — members-only
4. Membership status tracking in WP admin
5. Admin notification on new bank transfer orders (to prompt manual confirmation)
6. Optional: family story submission linked to veteran profiles

---

## 1. Scope Components

### A. Authentication Layer

#### A1. Custom Login Page (`/member-login/`)

Replace WP's default `/wp-login.php` with a branded page:

```
[Gull Force header]
[Login form]
  - Email / username
  - Password
  - Remember me
  - Forgot password →

[Not a member yet?]
  - Join the Association →
  - Subscribe to Newsletter →
```

**Implementation:** WordPress shortcode `[gf_member_login]` on a standard Elementor page. Use `wp_login_form()` as the base, styled to match the site. Redirect `/wp-login.php` to `/member-login/` for non-admin users.

**Post-login redirect:** `/member-area/` (the member dashboard)

#### A2. Nav Integration

The site header should conditionally show:
- **Logged out:** "Member Login" link (right side of nav)
- **Logged in:** "Member Area ▾" dropdown with: Dashboard | Newsletter | Logout

**Implementation:** Conditional display in the Elementor header template using `is_user_logged_in()` via dynamic visibility. Custom PHP in mu-plugin for the nav output.

#### A3. Password Reset

Use WP's built-in password reset flow, styled with the site theme. A custom "Forgot password" page at `/member-reset-password/` using `[gf_member_reset_password]` shortcode wraps the native WP email-based reset.

---

### B. Member Registration & Payment Flow

#### B1. Membership Product in WooCommerce

One new WooCommerce product (WooCommerce already active for Memorabilia):

| Product | Price | Type | WC Product Type |
|---------|-------|------|----------------|
| **Life Membership** | **$50.00 AUD** | One-time (includes lapel pin + full member access) | Simple product |

No subscription tiers, no renewal products, no WooCommerce Subscriptions plugin needed. Single purchase → permanent access. Admin manually notes lapel pin dispatch via the `gf_lapel_pin_sent` user meta flag.

#### B2. Registration Flow

```
/join/ page:

Step 1 — Summary
  "Life Membership — $50.00 AUD"
  "Full access to newsletter archive, member area, and lapel pin"
  [Join Now] button → WooCommerce checkout

Step 2 — Create account (at WC checkout)
  Full name | Email | Password
  (Already a member? Log in →)

Step 3 — Payment
  ( ) PayPal
  ( ) Bank Deposit (BSB + account shown on confirmation page)

  If PayPal → redirect to PayPal → return with payment confirmed → instant activation
  If Bank Deposit → order placed as "on-hold" → admin receives email notification →
    admin marks order "Complete" when transfer received → activation triggers

Step 4 — Confirmation
  "Welcome to Gull Force Association"
  Login details sent to [email]
  → [Go to Member Area]
```

**Account creation:** Hook into WooCommerce `woocommerce_order_status_completed` to:
1. Create WP user (if not existing) with role `gf_association_member`
2. Set membership meta fields (see Section D)
3. Send welcome email with login link

**Auto-approval:** No committee review step. Payment receipt = instant membership activation (PayPal: automatic; bank deposit: when admin marks order complete).

#### B3. Payment Gateways

**Both use WooCommerce core or free plugins — no gateway plugin licence costs.**

| Gateway | Plugin | Transaction Cost | Notes |
|---------|--------|-----------------|-------|
| **PayPal Standard** | WooCommerce PayPal Payments (free) | ~2.6% + $0.30 AUD | Redirect to PayPal site; familiar to older demographic; auto-confirms payment |
| **Bank Deposit (BACS)** | Built into WooCommerce core | $0 — no fees | Manual: member transfers $50; admin marks order complete; activation triggers |

**Why not Stripe:** Higher setup friction (requires business ABN verification, credit card handling compliance). For a small heritage association processing a handful of memberships per year, the zero-fee bank deposit option will likely be most-used anyway.

**Bank deposit account details** (to display at WC checkout and confirmation email):
- BSB, Account Number, Account Name — supplied by client at implementation time
- Reference format: `GF-[order-number]` (allows admin to match transfers in banking app)

---

### C. Member Dashboard (`/member-area/`)

The authenticated dashboard — visible only to logged-in members with `gf_association_member` role.

```
/member-area/

[Header: "Welcome, [First Name]"]
[Membership status badge: Active / Newsletter Subscriber / Lapsed]

[Sidebar or tab nav]
  - Dashboard (overview)
  - Newsletters
  - My Account
  - [Family Ancestor] (optional — link to gf_member profile)

[Dashboard panel]
  - Membership type: Life Member / Newsletter Subscriber
  - Member since: [date]
  - Newsletter access expires: [date] (if applicable)
  - [Renew Newsletter] button (if within 60 days of expiry)

[Quick links]
  - Browse newsletters →
  - Update my details →
  - Contact the Association →
```

**Implementation:** Elementor page with content visibility conditionals OR a custom `[gf_member_dashboard]` shortcode that renders the relevant section based on `get_current_user_id()` and user meta lookup.

---

### D. Membership Status & Expiry Tracking

#### D1. User Meta Fields

All stored on the WP User object via `update_user_meta()`:

| Meta Key | Type | Description |
|----------|------|-------------|
| `gf_membership_status` | string | `active` / `pending` / `honorary` / `suspended` |
| `gf_membership_joined` | date (Y-m-d) | Date membership was activated (order completed) |
| `gf_wc_order_id` | int | WooCommerce order ID that activated the membership |
| `gf_lapel_pin_sent` | boolean | Admin checkbox: physical pin dispatched |
| `gf_linked_veteran` | post ID | Optional: links account to a `gf_member` CPT post (ancestor) |
| `gf_member_number` | string | Sequential member number (e.g. GF-0247) |
| `gf_admin_notes` | text | Committee notes (admin-only, not visible to member) |

No expiry date field — life membership never lapses. `pending` status is used only for bank deposit orders awaiting payment confirmation; `active` is set when the WC order reaches `completed`.

#### D2. Membership Status Logic

```
Active (life member):
  gf_membership_status = 'active'
  → Set on woocommerce_order_status_completed hook
  → Never expires; no WP Cron required

Pending (bank deposit not yet confirmed):
  gf_membership_status = 'pending'
  → Set on woocommerce_order_status_on-hold hook (BACS orders start here)
  → Admin receives email: "New bank transfer membership order #NNN — mark complete when payment received"
  → Admin marks WC order Complete → triggers 'active' transition

Honorary:
  gf_membership_status = 'honorary'
  → Set manually by admin (committee members, dignitaries)
  → Full access, $0 cost, no WC order required

Suspended:
  gf_membership_status = 'suspended'
  → Set manually by admin only
  → Loses member area access; sees "Contact the Association" message
```

#### D3. No Automated Expiry Required

Since all memberships are lifetime, no WP Cron expiry checking is needed. The only automated hooks are:
- `woocommerce_order_status_on-hold` → set status `pending`, send admin notification
- `woocommerce_order_status_completed` → set status `active`, send member welcome email

This eliminates an entire class of complexity compared to subscription-based models.

---

### E. Member-Only Content

#### E1. Newsletter Archive (PDF)

The core member-only content. Association produces newsletters periodically.

**Proposed CPT: `gf_newsletter`**

| ACF Field | Type | Description |
|-----------|------|-------------|
| `newsletter_issue` | text | e.g. "Issue 47 — Summer 2024" |
| `newsletter_date` | date | Publication date |
| `newsletter_pdf` | file | Upload to WP media library |
| `newsletter_summary` | textarea | 2–3 sentence public teaser |
| `newsletter_thumbnail` | image | Cover page preview (optional) |
| `newsletter_member_only` | true_false | Default: true (some may be public) |

**Access control:** In `gf_newsletter` single template and archive, check:
```php
if (get_field('newsletter_member_only') && !gf_current_user_has_newsletter_access()) {
    // Show teaser + "Members: log in to read" / "Join to access"
    return;
}
```

**Newsletter archive page (`/newsletters/`):**
- Public view: list of issue dates + summaries + "Members only" lock icon
- Member view: same list + "Download PDF" button for each issue
- Issues are visible to ALL logged-in members (life member, newsletter subscriber, both)

#### E2. Access Gating Function

```php
function gf_current_user_is_member(): bool {
    if (!is_user_logged_in()) return false;
    $status = get_user_meta(get_current_user_id(), 'gf_membership_status', true);
    return in_array($status, ['active', 'honorary'], true);
}
```

Single function, single concept — active life member or honorary. `pending` and `suspended` are not granted access.

#### E3. Additional Protected Content (Optional — Phase 6+)

Content that could be member-gated:
- Family story submission form (see Section F)
- Member directory (opt-in: members can choose to list their contact details to other members)

Recommend keeping most content **public** — the site's mission is education and commemoration, not exclusivity. Gate only newsletters and family submissions.

#### E4. Newsletter Back-Issues at Launch

Multiple back-issues confirmed available as PDFs. At launch, these are batch-imported as `gf_newsletter` posts — one per issue. No scraping required; admin uploads each PDF via the WP media library and creates the post in WC admin. A bulk import script (`scripts/import-newsletters.php`) can ingest a folder of PDFs if the client supplies them as files rather than one-by-one.

---

### F. Family Story Submission (Optional — Phase 6+)

Association members can submit stories about their veteran ancestors to be attached to `gf_member` profiles.

**Flow:**
1. Logged-in member navigates to a veteran profile (e.g. `/veteran/harold-adams/`)
2. Clicks "Submit a family story about [Name]"
3. Form: Story title | Story text (textarea) | Photos (upload) | Your relationship to this veteran
4. Submission stored as a pending custom post type or ACF repeater entry
5. Committee reviews and approves — story appears on veteran profile

**Implementation:** `gf_family_story` CPT with `post_status = 'pending'` until admin approval. Or: Gravity Forms / CF7 form submitting to email for manual entry.

**Scope decision:** Recommend deferring to Phase 7. It requires a moderation workflow and committee buy-in. Flag as Phase 6+ option.

---

### G. Admin Management Interface

#### G1. Member List (WP Admin → Members)

Custom admin submenu under "Members" (or extend Users list table):
- Columns: Member #, Name, Email, Type, Status, Joined, Newsletter Expiry, Pin Sent
- Filter by: status (active / lapsed / pending), type (life / newsletter)
- Bulk action: "Send renewal reminder", "Mark as lapsed", "Export to CSV"

**Implementation:** Custom WP_List_Table extension in the mu-plugin.

#### G2. Individual Member Admin Screen

On each WP User's edit screen, add a custom meta box:
```
Gull Force Membership Details
  Member Number:    [GF-0247        ]
  Membership Type:  [Life Member ▾  ]
  Status:           [Active ▾       ]
  Joined:           [2026-02-28     ]
  Newsletter Expiry:[           ] (blank = life member / N/A)
  Lapel Pin Sent:   [x] Yes
  Linked Veteran:   [Adams, Harold George (VX 12345) - Search]
  Admin Notes:      [textarea                                 ]
  [Save Membership Details]
```

#### G3. Bulk Import (for existing members)

The Association almost certainly has an existing member list (spreadsheet or paper records). A one-time import script to create WP User accounts + set meta for all current members.

**Input format:** CSV with columns: `first_name, last_name, email, membership_type, joined_date, newsletter_expiry`

**Script:** `scripts/import-association-members.php` — run once via WP-CLI.

---

## 2. Technology Stack Decisions

### Membership Plugin vs Custom

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Paid Memberships Pro (free)** | Handles registration, restriction, expiry, WC integration | More than needed; opinionated UI | Viable if more features needed later |
| **MemberPress** | Full-featured, polished | $179–$399/yr | Overkill for small association |
| **Custom (WC + custom PHP)** | Lightweight, full control, no recurring cost | More dev effort | **Recommended** |
| **WooCommerce Subscriptions** | Handles recurring billing | $199/yr; newsletter is 2yr not monthly | Overkill given fee structure |

**Recommendation:** Custom implementation using:
- WooCommerce (already installed) for payment collection
- Custom WP User role (`gf_association_member`) for access control
- User meta for membership fields
- WP Cron for expiry checks
- Custom PHP in `gull-force.php` mu-plugin

This keeps the plugin count low, gives full control, has no ongoing plugin licence costs, and is the right size for a small heritage association.

### Payment Gateways

| Gateway | Plugin | Cost |
|---------|--------|------|
| **PayPal Standard** | WooCommerce PayPal Payments (free) | ~2.6% + $0.30 per transaction |
| **Bank Deposit (BACS)** | WooCommerce core (built-in, zero config) | $0 — no transaction fees |

No Stripe. WooCommerce's built-in BACS gateway handles bank transfer with zero plugin cost — admin receives email when a bank transfer order is placed and manually completes it when payment arrives. For a small association processing ~10–20 new memberships per year, this is the right cost structure.

### WP User Role

New role `gf_association_member` with capabilities:
```php
add_role('gf_association_member', 'Gull Force Member', [
    'read'              => true,  // Can read public content
    'gf_view_newsletters' => true, // Custom capability for newsletter access
    // No write capabilities (cannot edit posts)
]);
```

Committee/admin members use the standard `administrator` or `editor` role.

---

## 3. Content Architecture (New Pages)

| Page | URL | Access | Purpose |
|------|-----|--------|---------|
| Join the Association | `/join/` | Public | Membership registration + WC checkout |
| Member Login | `/member-login/` | Public | Branded login page |
| Member Area | `/member-area/` | Members only | Dashboard |
| Newsletter Archive | `/newsletters/` | Public (teaser) / Members (full) | Newsletter PDFs |
| My Account | `/member-area/account/` | Members only | Update details |

**Nav addition:** "Join / Login" link in header (right side). Once logged in: "Member Area" dropdown.

---

## 4. Data Model Summary

```
WordPress User (role: gf_association_member)
  ├── Standard WP fields: display_name, user_email, user_registered
  └── User meta:
       ├── gf_member_number          → "GF-0247"
       ├── gf_membership_status      → "active" | "pending" | "honorary" | "suspended"
       ├── gf_membership_joined      → "2026-02-28"
       ├── gf_wc_order_id            → 1042 (WooCommerce order reference)
       ├── gf_lapel_pin_sent         → true | false
       ├── gf_linked_veteran         → post ID (gf_member CPT) | NULL
       └── gf_admin_notes            → text

gf_newsletter CPT (new)
  ├── post_title      → "Issue 47 — Summer 2024"
  ├── post_status     → publish
  └── ACF fields:
       ├── newsletter_issue          → "Issue 47"
       ├── newsletter_date           → "2024-12-01"
       ├── newsletter_pdf            → attachment ID
       ├── newsletter_summary        → public teaser (SEO-visible)
       ├── newsletter_thumbnail      → attachment ID (cover page preview)
       └── newsletter_member_only    → true | false (some historical issues may be public)
```

---

## 5. Implementation Priorities (MoSCoW)

### Must Have (Phase 6 Core)

| Feature | Effort | Impact |
|---------|--------|--------|
| WC membership products (3 products) | 2 | Enables online payment |
| WC order hook → create WP user + set meta | 3 | Core registration automation |
| Custom login page + redirect | 2 | Branded entry point |
| `gf_association_member` user role | 1 | Access control foundation |
| Newsletter CPT + ACF fields | 3 | Content to protect |
| Newsletter archive page (public teaser / member full) | 3 | Core member benefit |
| Member dashboard page | 3 | Logged-in home |
| Membership admin UI (User list columns + meta box) | 5 | Committee management |
| WP Cron expiry check + status update | 2 | Automated status maintenance |

### Should Have

| Feature | Effort | Impact |
|---------|--------|--------|
| Renewal reminder emails (60 day / 7 day / expiry) | 3 | Retention |
| Bulk member import script (CSV → WP users) | 3 | Onboard existing members |
| PayPal + Stripe both offered at checkout | 2 | Conversion (older demographic) |
| "Renew Newsletter" prompt on dashboard | 2 | Self-service renewal |
| Nav login/logout conditional | 2 | UX completeness |

### Could Have

| Feature | Effort | Impact |
|---------|--------|--------|
| Member directory (opt-in, members view each other's details) | 5 | Community building |
| Linked veteran on member profile | 2 | Personal connection to history |
| Family story submission form | 5 | Community content contribution |
| Member number auto-generation (sequential GF-XXXX) | 2 | Admin QOL |
| Lapel pin dispatch notification email (with postal address) | 2 | Admin QOL |
| Bulk newsletter import script (folder of PDFs → CPT posts) | 3 | Launch efficiency |

### Won't Have (Phase 6) — Flagged for Phase 7

| Feature | Reason / Phase 7 Notes |
|---------|------------------------|
| Member forum / discussion board | **Phase 7** — bbPress (free) integrates cleanly with WP User roles; members-only board gated by `gf_association_member` role |
| Committee meeting notes section | **Phase 7** — protected page or `gf_meeting_notes` CPT; restricted to `gf_committee` role |
| Member voting | **Phase 7** — requires defining vote scope (AGM motions? Content decisions?). Plugin: WP-Polls or custom ACF repeater vote form |
| Annual membership tier | By design decision — life membership only |
| Automated physical mail dispatch | Requires fulfilment integration |
| Mobile app | Not justified for membership size |

---

## 6. Effort Estimates

| Feature | Story Points | Notes |
|---------|-------------|-------|
| Single WC membership product ($50) | 1 | Simpler than 3-tier model |
| WC order hooks → user creation + meta (PayPal + BACS paths) | 3 | Two status transitions to handle |
| Custom login page + WP redirects | 2 | `/member-login/` branded page |
| User role + capability registration | 1 | `gf_association_member` role |
| `gf_newsletter` CPT + ACF field group | 3 | |
| Newsletter archive page + `gf_current_user_is_member()` gate | 3 | Public teaser / member download |
| Member dashboard shortcode | 3 | Status, joined date, newsletter link |
| Admin user list columns + membership meta box | 5 | User table + edit screen meta box |
| Admin notification email for BACS orders | 1 | WC order email hook |
| Welcome email on activation | 1 | Login link + membership details |
| Bulk member import script (CSV) | 3 | For existing member list |
| Nav login/logout conditional display | 2 | |

**Phase 6 Core (Must Have):** ~24 points
**Phase 6 Full (+ bulk import, nav, welcome email):** ~28 points

**Complexity reduction vs original scope:** ~9 points saved by removing newsletter expiry, renewal emails, WP Cron, and subscription tier logic.

---

## 7. Questions for Client (Pre-Implementation)

Resolved decisions are noted. Only open items remain.

### Resolved
- ~~Life or annual membership?~~ → **Life membership only, $50 AUD**
- ~~Stripe?~~ → **No Stripe — PayPal + bank deposit**
- ~~Auto-approval or committee review?~~ → **Auto-approval on payment**
- ~~Back-issues available?~~ → **Yes — multiple PDFs ready to upload**

### Still Open

1. **Existing member list** — Is there a spreadsheet of current members? If yes, supply CSV (`first_name, last_name, email, joined_date`) for bulk import as WP users with `active` status. Avoids asking existing members to re-register.

2. **Membership number series** — Does the Association have existing sequential member numbers (GF-XXXX format)? If so, supply with the member CSV above to preserve continuity. If not, auto-generate from next available number.

3. **Honorary members** — Are there committee members or dignitaries who should have free access? If yes, list their emails — admin will set `gf_membership_status = 'honorary'` manually.

4. **Newsletter public/private split** — Should any back-issues be made publicly accessible (e.g. oldest issues for research purposes)? Or all member-only?

5. **Bank deposit account details** — BSB, account number, account name for display at checkout.

6. **PayPal account** — Does the Association have an existing PayPal Business account, or does one need to be created?

7. **Who manages members in WP admin?** Standard `administrator` role, or should a restricted `gf_committee` role be created with access only to membership management (not full site admin)?

8. **Lapel pin fulfilment** — When a new member orders, who packages and sends the pin? Does the admin need a "new membership orders" notification email with the postal address?

---

## 8. Implementation Order (Suggested Sprint)

### Sprint 1 — Foundation (Day 1)
1. Register `gf_association_member` WP role + `gf_view_newsletters` capability (1pt)
2. Single WC Life Membership product — $50 AUD (1pt)
3. Configure WC PayPal Payments + BACS gateway with bank details (1pt)
4. WC order hooks: `on-hold` → set `pending` + admin email; `completed` → set `active` + welcome email (3pt)
5. Custom login page at `/member-login/` + redirect from `/wp-login.php` (2pt)

### Sprint 2 — Member Content (Day 2)
6. `gf_newsletter` CPT + ACF field group (issue, date, pdf, summary, thumbnail, member_only) (3pt)
7. Newsletter archive page (`/newsletters/`) — public teaser / member download (3pt)
8. Member dashboard page + `[gf_member_dashboard]` shortcode (3pt)

### Sprint 3 — Admin (Day 3)
9. Admin user list extra columns (member number, status, joined, pin sent) (2pt)
10. Membership meta box on User edit screen (5pt)
11. Nav header: conditional login / member area dropdown (2pt)

### Sprint 4 — Content & Import (Day 4)
12. Bulk newsletter import script: folder of PDFs → `gf_newsletter` posts (3pt)
13. Bulk member import script: CSV → WP users with `active` status + meta (3pt)

---

## 9. Open Items

| Item | Status | Action Required |
|------|--------|----------------|
| Existing member list / spreadsheet | Unknown | Client to supply CSV for bulk import (prevents re-registration) |
| Existing member numbers (GF-XXXX) | Unknown | Include in CSV if they exist |
| Honorary members list | Unknown | Client to supply names/emails |
| Newsletter public/private split | Decision | Which back-issues (if any) should be public? |
| Bank account BSB + account number | Needed | Client to supply for BACS gateway config |
| PayPal Business account | Unknown | Confirm existing account or need to create |
| Who manages members in WP admin | Decision | Full admin vs restricted committee role |
| Lapel pin postal address in order email | Decision | Does admin need member's postal address captured at registration? |
| Membership form PDF (Phase 4 open item) | Superseded | Online registration replaces paper form |

---

## 10. Phase 7 Preview (Not In Scope)

Flagged for scoping after Phase 6 goes live:

| Feature | Probable Approach |
|---------|------------------|
| **Member forum** | bbPress (free WP plugin); board restricted to `gf_association_member` role; sub-boards: General, Research, Family Connections |
| **Committee meeting notes** | `gf_meeting_notes` CPT; restricted to `gf_committee` role; not visible to general members |
| **Member voting** | AGM motions or content decisions; WP-Polls or custom ACF form; one-vote-per-user enforcement via user meta |
| **Member directory** | Opt-in; members list their name + connection to a veteran; searchable by other members only |

Phase 7 architecture relies on Phase 6's `gf_association_member` role and user meta infrastructure — Phase 6 must be complete first.

---

*Prepared: 2026-02-28 | Updated with confirmed decisions: $50 life membership, PayPal + BACS, auto-approval, newsletter included*
*Builds on: Phase 5 SCOPE.md + contact-mapping.md + UI-UX-ANALYSIS.md*
*Phase 5 "Won't Have" reason: "Requires authentication, moderation workflow, client buy-in" — all three now addressed in this scope.*
