# Gull Force — Phase 6 Sprint 1: Member Portal Foundation

**Date:** 2026-03-01
**Repo:** gull-force-wp (`master`)
**Commit:** `eb911a3`

---

## Summary

Implemented the full foundation layer for the Gull Force Association member portal. All Sprint 1 items from PHASE6-MEMBER-PORTAL-SCOPE.md delivered in a single session.

---

## Delivered

### mu-plugin additions (`web/wp-content/mu-plugins/gull-force.php`)

232 lines added in a clearly-delimited `// Phase 6: Member Portal Foundation` section.

**Role registration**
- `gf_association_member` WP role registered on `init`
- Capabilities: `read`, `gf_view_newsletters`
- `add_role()` is idempotent — safe to re-run

**Helper functions**
- `gf_current_user_is_member(): bool` — checks `gf_membership_status` in user meta; `active` and `honorary` return true
- `gf_current_user_has_newsletter_access(): bool` — thin alias of the above (one tier = same gate)
- `gf_generate_member_number(): string` — sequential `GF-XXXX` via `gf_last_member_number` WP option counter
- `gf_order_has_membership(WC_Order $order): bool` — detects life membership by SKU `gf-life-membership`

**WC order hooks**
- `woocommerce_order_status_on-hold` → sets `gf_membership_status = pending` + sends admin notification email (BACS orders only — guarded by `$order->get_payment_method() === 'bacs'`)
- `woocommerce_order_status_completed` → idempotent activation: assigns role, sets `active`, records `gf_membership_joined`, generates member number, sends welcome email

**Login shortcode + filters**
- `[gf_member_login]` — renders `wp_login_form()` in branded wrapper; POSTs to `/wp-login.php`; redirects to `/member-area/` via `redirect_to` hidden input
- `login_url` filter — points all `wp_login_url()` calls to `/member-login/`; `/wp-login.php` itself unchanged (WP Admin unaffected)
- `login_redirect` filter — members → `/member-area/`, admins → wp-admin

### Scripts (run-once via `wp eval-file`)

| Script | What it does |
|--------|-------------|
| `scripts/create-membership-product.php` | Creates WC simple product: "Life Membership — Gull Force Association", $50 AUD, SKU `gf-life-membership`, virtual, sold individually, hidden from shop |
| `scripts/configure-wc-membership.php` | Currency AUD, guest checkout disabled, BACS gateway enabled with placeholder bank details |
| `scripts/create-member-login-page.php` | Creates `/member-login/` page (ID 3926) with `[gf_member_login]` shortcode, `elementor_header_footer` template |

### Executed results

- Life Membership product: **ID 3925**
- Member login page: **ID 3926** at `https://gull-force.ddev.site/member-login/`
- `gf_association_member` role: registered and confirmed in `wp role list`
- WC: AUD currency, no guest checkout, BACS enabled

---

## Architecture Notes

### Why custom PHP rather than a membership plugin

The scope explicitly chose custom WC + PHP over Paid Memberships Pro or MemberPress. Life membership only (no renewals) means two WC hooks do everything — no WP Cron, no expiry checking, no plugin licence cost.

### Idempotency on `woocommerce_order_status_completed`

The hook checks `get_user_meta($user_id, 'gf_membership_status', true) === 'active'` first and returns early if already activated. This prevents duplicate welcome emails and member number generation if an admin toggles order status.

### BACS vs PayPal hook paths

- **BACS**: checkout → `on-hold` → admin manually marks complete → `completed`
- **PayPal**: checkout → payment confirmed → `completed` (skips `on-hold`)

Both paths end at `woocommerce_order_status_completed`. The `on-hold` hook only sends the admin notification email for BACS orders.

### `wp_lostpassword_url()` — WooCommerce override

When WooCommerce is active, `wp_lostpassword_url()` returns `/my-account/lost-password/` not `/wp-login.php?action=lostpassword`. This is correct behaviour — WC provides its own styled lost password page. No extra work needed.

### `login_url` filter and WP Admin

Filtered `wp_login_url()` to return `/member-login/` for all frontend contexts. The filter receives `$login_url, $redirect, $force_reauth` — `$force_reauth` is passed through but we ignore it because our custom page always shows the login form anyway. WP Admin users reach `/wp-login.php` directly (they bookmark it or use the admin bar) so this doesn't block admin access.

---

## Pending (client-supplied before launch)

| Item | Where to configure |
|------|--------------------|
| BSB + account number | WC Admin > Payments > Direct Bank Transfer |
| PayPal Business account | WC Admin > Payments > PayPal Payments |
| Store address | WC Admin > Settings > General |

---

## Sprint 2 Scope (next session)

1. `gf_newsletter` CPT + ACF field group (issue, date, pdf, summary, thumbnail, member_only)
2. Newsletter archive page (`/newsletters/`) — public teaser + member download
3. `[gf_member_dashboard]` shortcode + `/member-area/` page (status badge, member number, joined date, quick links)
