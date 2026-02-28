# Session Notes — Gull Force Phase 6 Member Portal Scope

**Date:** 2026-02-28
**Project:** Gull Force Association WordPress Site
**Repo:** `/home/jtaylor/gull-force-wp` (jtaylorcomplize/gull-force-wp)
**Scope doc:** `docs/projects/gull-force/PHASE6-MEMBER-PORTAL-SCOPE.md`

---

## What Was Accomplished

Scoped the Phase 6 member portal from scratch, iterating through two rounds of client input to lock confirmed decisions.

### Initial Scope Draft
- Full feature set across 6 components: authentication, registration/payment, member dashboard, membership status/expiry tracking, protected content, admin management
- Three payment tiers explored: $35 life / $20 newsletter / $50 bundle
- Considered Stripe, PayPal, WooCommerce Subscriptions

### Client Clarifications (Round 1)
User confirmed:
- Life membership only ($50 AUD) — no separate newsletter tier
- PayPal + direct bank deposit (no Stripe — cost structure too high for small association)
- Auto-approval (no committee review workflow)
- Multiple back-issue newsletters available as PDFs
- Phase 7 future use: forum, committee meeting notes, voting

### Client Clarifications (Round 2)
Confirmed WooCommerce BACS (bank transfer) works in Australia — the "BACS" label is UK-derived but the gateway is purely instructional (displays BSB + account number, order held until admin confirms). Also confirmed PayID is compatible: add PayID email to BACS instructions field; payment still arrives in same bank account; admin flow unchanged, just faster confirmation.

### Final Scope (Locked)

**Architecture:**
- `gf_association_member` WP user role (distinct from `gf_member` CPT which holds WWII veterans)
- WooCommerce: 1 product ($50 life membership), PayPal Standard + BACS gateways
- `gf_newsletter` CPT with ACF fields (issue, date, PDF, summary, thumbnail, member_only)
- 7 user meta fields: status, joined, wc_order_id, lapel_pin_sent, linked_veteran, member_number, admin_notes
- Two WC order hooks: `on-hold` → pending + admin email; `completed` → active + welcome email
- Single access gate: `gf_current_user_is_member()` — checks status in ['active', 'honorary']
- No WP Cron required (no expiry dates)

**Estimate:** ~24–28 story points across 4 sprints

---

## Technical Decisions

### Why Not Stripe
Stripe requires Australian business ABN verification + card handling compliance setup. For a heritage association processing ~10–20 memberships per year, the bank deposit option (zero transaction fees) will likely be the dominant payment method. No justification for the Stripe setup overhead.

### Why Not a Membership Plugin (MemberPress / PMPro)
Life membership is a one-time payment with no subscription complexity. A membership plugin designed for recurring SaaS billing is the wrong abstraction. 50 lines of PHP on top of existing WooCommerce is the right size.

### Why Not WooCommerce Subscriptions
The $20/2yr newsletter was the original trigger for considering subscriptions. Client confirmed newsletter is included in the $50 life membership — no recurring billing needed.

### WooCommerce BACS + PayID
BACS is WooCommerce core (no plugin). PayID is added as a text instruction in the bank details fields. Near-instant NPP payment = admin can confirm faster, but the manual order-completion step remains. For ~10–20 orders/year this is fine.

### Phase 7 Architecture Dependency
Forum (bbPress), meeting notes, and voting all depend on the `gf_association_member` user role that Phase 6 establishes. Phase 6 must be complete before Phase 7 can begin.

---

## Key Files

| File | Description |
|------|-------------|
| `docs/projects/gull-force/PHASE6-MEMBER-PORTAL-SCOPE.md` | Full approved scope document |
| `docs/projects/gull-force/PHASE5-SCOPE.md` | Phase 5 scope (Sprint 2 now complete in gull-force-wp) |

---

## Open Items for Client (8 Items)

1. Existing member list CSV (for bulk import)
2. Existing member numbers (GF-XXXX series)
3. Honorary members list
4. Newsletter public/private split (which back-issues, if any, are public)
5. Bank BSB + account number for BACS gateway
6. PayPal Business account confirmation
7. Who manages members in WP admin (full admin vs restricted committee role)
8. Lapel pin postal address: does admin need member's postal address captured at registration

---

## Phase 5 Status Update

gull-force-wp commit log shows `single-gf_member.php` (Sprint 2) already committed (`4b0c528`). Portrait matching improvements also committed this session (`9676eac`). MEMORY.md updated accordingly.

**Phase 5 remaining:** Sprint 3 (world memorial map shortcode, memorial↔headstone linking, statistics charts) + Sprint 4 (articles page, nominal roll download, single-gf_headstone.php).

---

## Lessons Learned

- **Ask about fee structure first** — the $35/$20 legacy pricing drove the initial 3-tier design. A single clarifying question ("is the newsletter separate from membership?") would have saved one iteration.
- **BACS naming confusion** — "BACS" is WooCommerce's internal name for bank transfer but non-UK users don't recognise it. In WC admin, the gateway label shown to customers is customisable — set it to "Direct Bank Transfer / PayID" for Australian context.
- **PayID = BSB with better UX** — no infrastructure change needed; just add PayID to the display fields. Don't overcomplicate it.
- **Life membership = no cron** — single-tier lifetime membership eliminates expiry logic, renewal emails, and WP Cron scheduling entirely. ~9 story points saved vs subscription model.
