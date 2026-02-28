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

### Current Membership Model (from live site)

| Product | Price | Type | Delivery |
|---------|-------|------|---------|
| Life Membership | $35.00 (incl. lapel pin) | One-time | Physical pin + member status |
| Newsletter Subscription | $20.00 / 2 years | Recurring (2yr) | Posted physical copy |

**Current process:** Manual — postal form, bank transfer, committee approval. No online component.

### What This Phase Adds

1. Online membership registration + payment
2. Digital member login portal with access to member-only content
3. Newsletter archive (PDF) accessible to subscribers/members
4. Membership status and expiry tracking in WP admin
5. Automated renewal reminders (newsletter subscription)
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

#### B1. Membership Products in WooCommerce

Three new WooCommerce products (WooCommerce already active for Memorabilia):

| Product | Price | Type | WC Product Type |
|---------|-------|------|----------------|
| Life Membership | $35.00 | One-time (includes lapel pin) | Simple product |
| Newsletter Subscription | $20.00 | 2-year access | Simple product (manual renewal) |
| Life Membership + Newsletter | $50.00 | Bundle | Grouped/bundled product |

**Note on WC Subscriptions plugin:** Given the newsletter is 2-year (not monthly/annually auto-billing), WooCommerce Subscriptions ($199/yr) is overkill. Manage renewal manually or with a lightweight approach: set expiry date on purchase, send reminder email at 60 days before expiry via WP Cron.

#### B2. Registration Flow

```
/join/ page:

Step 1 — Choose membership type
  [ ] Life Membership — $35 (includes lapel pin + member area access)
  [ ] Newsletter Subscription — $20/2 years (newsletter archive + posted copy)
  [ ] Both — $50

Step 2 — Create account
  Full name | Email | Password
  (If already have account: "Log in instead →")

Step 3 — Payment
  WooCommerce checkout — Stripe or PayPal

Step 4 — Confirmation
  "Welcome to Gull Force Association"
  Check email for account details
  → [Go to Member Area]
```

**Account creation:** Hook into WooCommerce `woocommerce_order_status_completed` to:
1. Create WP user (if not existing) with role `gf_association_member`
2. Set membership meta fields (see Section D)
3. Send welcome email

#### B3. Payment Gateway

**Recommended: Stripe** via WooCommerce Stripe plugin (free)
- Lower transaction fees than PayPal in Australia
- Better UX (no PayPal redirect)
- Card details stay on checkout page
- Stripe dashboard for admin payment management

**Alternative: PayPal** — simpler setup, lower trust barrier for older demographics (target audience skews older)

**Decision for client:** Given the target demographic (descendants of WWII vets, likely older), PayPal may have higher conversion rate due to familiarity. Recommend offering both.

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
| `gf_membership_status` | string | `active` / `lapsed` / `pending` / `honorary` |
| `gf_membership_type` | string | `life` / `newsletter` / `both` / `honorary` |
| `gf_membership_joined` | date (Y-m-d) | Date membership was activated |
| `gf_newsletter_expiry` | date (Y-m-d) | NULL for life members; set for newsletter subscribers |
| `gf_newsletter_posted` | boolean | Whether they receive a physical posted copy |
| `gf_lapel_pin_sent` | boolean | Admin tracks physical delivery of membership pin |
| `gf_linked_veteran` | post ID | Optional: links to a `gf_member` post (ancestor) |
| `gf_member_number` | string | Sequential member number (e.g. GF-0247) |
| `gf_admin_notes` | text | Committee notes (admin-only) |

#### D2. Membership Status Logic

```
Life Member:
  gf_membership_status = 'active'
  gf_membership_type   = 'life'
  gf_newsletter_expiry = NULL
  → Never expires; always has member area access

Newsletter Subscriber:
  gf_membership_status = 'active'
  gf_membership_type   = 'newsletter'
  gf_newsletter_expiry = '2028-02-28' (2 years from purchase)
  → Expires; needs renewal; loses newsletter access on expiry

Both:
  gf_membership_status = 'active'
  gf_membership_type   = 'both'
  gf_newsletter_expiry = '2028-02-28'
  → Member area always accessible; newsletter access expires

Lapsed:
  gf_membership_status = 'lapsed'
  → Triggered by WP Cron when gf_newsletter_expiry < today()
  → Loses newsletter access; member area shows "Renew" prompt
```

#### D3. Automated Expiry (WP Cron)

```php
// Scheduled daily: check all newsletter subscribers for expiry
function gf_check_membership_expiry() {
    $users = get_users([
        'meta_key'     => 'gf_membership_type',
        'meta_value'   => ['newsletter', 'both'],
        'compare'      => 'IN',
        'meta_compare' => 'IN',
    ]);
    foreach ($users as $user) {
        $expiry = get_user_meta($user->ID, 'gf_newsletter_expiry', true);
        if ($expiry && strtotime($expiry) < time()) {
            update_user_meta($user->ID, 'gf_membership_status', 'lapsed');
        }
    }
}
add_action('gf_daily_membership_check', 'gf_check_membership_expiry');
if (!wp_next_scheduled('gf_daily_membership_check')) {
    wp_schedule_event(time(), 'daily', 'gf_daily_membership_check');
}
```

#### D4. Renewal Reminder Emails

Two automated emails via `wp_mail()`:
- **60 days before expiry:** "Your Gull Force newsletter subscription expires in 60 days"
- **7 days before expiry:** "Your Gull Force newsletter subscription expires in 7 days"
- **Day of expiry:** "Your subscription has expired — renew to continue access"

All styled with WP's email framework or a simple HTML template.

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
function gf_current_user_has_newsletter_access(): bool {
    if (!is_user_logged_in()) return false;
    $user_id = get_current_user_id();
    $status  = get_user_meta($user_id, 'gf_membership_status', true);
    $type    = get_user_meta($user_id, 'gf_membership_type', true);
    if ($status !== 'active') return false;
    return in_array($type, ['life', 'newsletter', 'both', 'honorary'], true);
}
```

#### E3. Additional Protected Content (Optional)

Content that could be member-gated in future:
- Historical documents / full-length PDFs (currently public)
- Family story submission form (see Section F)
- Member directory (opt-in: members can choose to list their contact details to other members)

Recommend keeping most content **public** — the site's mission is education and commemoration, not exclusivity. Gate only newsletters and family submissions.

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

### Payment Gateway

| Gateway | Transaction Fee | Setup | UX |
|---------|----------------|-------|-----|
| **Stripe** | 1.7% + 30c (AUD) | Medium — business verification | Inline form, best UX |
| **PayPal** | ~2.6% + 30c | Easier — existing account | Redirect to PayPal site |
| **Square** | 1.9% + 10c | Medium | Less known |

**Recommendation:** Offer both Stripe and PayPal. Stripe as primary (lower fees). PayPal as fallback (higher comfort for older demographic). Both have free WooCommerce plugins.

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
       ├── gf_membership_status      → "active" | "lapsed" | "pending" | "honorary"
       ├── gf_membership_type        → "life" | "newsletter" | "both" | "honorary"
       ├── gf_membership_joined      → "2026-02-28"
       ├── gf_newsletter_expiry      → "2028-02-28" | NULL
       ├── gf_newsletter_posted      → true | false
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
       ├── newsletter_summary        → public teaser
       ├── newsletter_thumbnail      → attachment ID
       └── newsletter_member_only    → true | false
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
| Postal copy tracking (lapel pin, newsletters) | 3 | Admin QOL |

### Won't Have (Out of Scope)

| Feature | Reason |
|---------|--------|
| Automated physical mail dispatch | Requires fulfilment integration |
| Online discussion forum | Moderation cost too high for small team |
| Mobile app | Not justified for membership size |
| CWGC / external data sync | External dependency |

---

## 6. Effort Estimates

| Feature | Story Points |
|---------|-------------|
| WC membership products + checkout | 2 |
| WC order hook → user creation + meta | 3 |
| Custom login page + WP redirects | 2 |
| User role + capability registration | 1 |
| `gf_newsletter` CPT + ACF field group | 3 |
| Newsletter archive page + access gating | 3 |
| Member dashboard shortcode | 3 |
| Admin user list columns + meta box | 5 |
| WP Cron expiry + status automation | 2 |
| Renewal reminder email triggers | 3 |
| Bulk import script | 3 |
| Nav login/logout integration | 2 |

**Phase 6 Core (Must Have):** ~27 points
**Phase 6 Full (Must + Should):** ~37 points

---

## 7. Questions for Client (Pre-Implementation)

Before development begins, these decisions must be made by the Association committee:

### Membership Model
1. **Life membership only, or introduce annual membership?** The current $35 life structure is simple to implement. Annual ($20–$25/yr) creates recurring revenue but requires subscription handling.
2. **Honorary membership** — do committee members or dignitaries get free access? If yes, admin can manually set `gf_membership_type = 'honorary'`.
3. **Existing members** — is there a current member list (spreadsheet) to import? Names, emails, joining dates?

### Registration Process
4. **Open registration or admin approval?** Self-service (pay → instant access) is simpler. Committee-approved (pay → pending → committee approves → access) is safer but adds admin overhead.
5. **Membership number series** — does the Association have existing member numbers to preserve?

### Newsletter
6. **How many back-issues exist as PDFs?** All uploaded as `gf_newsletter` posts on launch.
7. **Should some newsletters be public?** E.g. oldest issues (pre-2000) could be freely available for researchers.
8. **Posted physical copies** — does the Association still mail physical copies to subscribers? If so, admin needs to track `gf_newsletter_posted` per member and generate a mailing list.

### Payment
9. **Does the Association have a Stripe account?** If not, they need to create one (requires ABN). PayPal is simpler if they have an existing account.
10. **AUD pricing** — confirm $35 / $20 are still current (from legacy site, possibly outdated).

### Content Governance
11. **Who uploads new newsletters?** Needs training on the `gf_newsletter` admin screen.
12. **Committee management** — who can manage the member list in WP admin? Standard `administrator` role, or a restricted `membership_admin` role?

---

## 8. Implementation Order (Suggested Sprint)

### Sprint 1 — Foundation (Day 1)
1. Register `gf_association_member` WP role + capabilities (1pt)
2. Create 3 WC membership products (2pt)
3. WC order completion hook → create user + set membership meta (3pt)
4. Custom login page at `/member-login/` (2pt)

### Sprint 2 — Member Content (Day 2)
5. `gf_newsletter` CPT + ACF field group (3pt)
6. Newsletter archive page with public teaser / member full access gating (3pt)
7. Member dashboard page + shortcode (3pt)

### Sprint 3 — Admin & Automation (Day 3)
8. Admin user list columns + membership meta box (5pt)
9. WP Cron daily expiry check (2pt)
10. Renewal reminder emails (3pt)

### Sprint 4 — Polish & Import (Day 4)
11. Bulk member import script from CSV (3pt)
12. Nav login/logout conditional display (2pt)
13. "Renew Newsletter" prompt on dashboard (2pt)

---

## 9. Open Items

| Item | Status | Action |
|------|--------|--------|
| Current AUD membership fees | Unverified | Confirm $35 / $20 with client |
| Existing member list / spreadsheet | Unknown | Ask client to supply CSV for bulk import |
| Stripe account | Unknown | Client to create if preferred over PayPal |
| Back-issue newsletters (PDFs) | Unknown | How many? In what format? |
| Open vs approved registration | Decision needed | Client committee to decide |
| Annual vs life-only membership tiers | Decision needed | Client committee to decide |
| Membership form PDF (Phase 4 open item) | Awaiting | Probably superseded by online registration |

---

*Prepared: 2026-02-28 | Builds on: Phase 5 SCOPE.md + contact-mapping.md + UI-UX-ANALYSIS.md*
*Phase 5 "Won't Have" reason: "Requires authentication, moderation workflow, client buy-in" — all three now addressed in this scope.*
