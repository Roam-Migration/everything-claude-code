# Session: Gull Force Membership Application Form
**Date:** 2026-03-01
**Repo:** gull-force-wp (`master`) — commit `56e68ce`

---

## What Was Accomplished

Reviewed the official Gull Force paper membership application form (`gullforce.org.au/Application for Membership of Gull Force.docx`) and implemented all its fields as WooCommerce checkout extensions.

### Paper Form → Online Mapping

| Paper field | Online implementation |
|---|---|
| Mr/Mrs/Ms salutation | `billing_salutation` select in WC billing section (priority 5) |
| Name, address, phone, email | Standard WC billing fields (already present) |
| "Relationship to Gull Force" | `gf_relationship` text field in WC `order` section |
| "Name of veteran if applicable" | `gf_veteran_name` text field in WC `order` section |
| Declaration (verbatim association text) | `gf_declaration` required checkbox in `order` section |
| Bank transfer details | WC BACS settings: Commonwealth Bank, BSB 063-138, Acc 1020 2007 |

### Key Discoveries

- **BACS bank details were in the form** — this resolved the pending Phase 6 client TODO.
  - BSB: 063-138 (formatted as `06 3138` in original)
  - Account: 1020 2007
  - Account name: Gull Force 2/21st Bn. Association Inc.
  - Bank: Commonwealth Bank
- The paper form shows **$35 membership fee** — already updated to $50 in a previous session.
- Newsletter postal surcharge ($20 for paper-only members) is not applicable online — all online members have email addresses.

---

## Technical Decisions

### WooCommerce Three-Hook Pattern
WC checkout field extension uses three hooks in sequence:
1. `woocommerce_checkout_fields` — add fields to the form UI
2. `woocommerce_checkout_process` — validate before order creation
3. `woocommerce_checkout_create_order` — persist to WC order meta

The `order` section fields (relationship, veteran, declaration) appear below billing on the checkout form. This is the correct WC extension point — not `woocommerce_checkout_update_order_meta` (deprecated).

### Salutation Field Placement
`billing_salutation` added with priority 5 (WC first name is priority 10), so it renders before the first name field. Only added when the life membership product (SKU `gf-life-membership`) is in the cart — existing WC checkout for other products is unaffected.

### Data Flow
Order meta (`_gf_salutation`, `_gf_relationship`, `_gf_veteran_name`) → user meta (`gf_salutation`, `gf_relationship`, `gf_veteran_name`) on order completion. All fields visible in:
- WC admin order screen (via `woocommerce_admin_order_data_after_billing_address`)
- User edit metabox (admin only)
- BACS notification email to admin

### Join Page Redesign
`[gf_join]` shortcode updated to:
- Show full bank transfer block with BSB/account prominently
- Explain two payment options (PayPal vs BACS) clearly
- Preview what fields checkout will ask for (reduces drop-off)
- Change CTA from "Join Now" → "Apply Now" (matches paper form language)

---

## Files Changed

- `web/wp-content/mu-plugins/gull-force.php` — checkout fields, validation, save hooks, admin display, join shortcode
- `scripts/set-bacs-details.php` — one-time script to set BACS bank account in WC settings (already run)

---

## Outstanding Items

- **Client still needed**: PayPal Business account details, WC store address
- **Client still needed**: Existing member CSV for bulk import
- **Client decision pending**: Newsletter public/private split
- Audio files (Last Post, Rouse) not yet embedded on any page
- 1983 pilgrimage participants — manual historical research
- Elementor Cloud migration — awaiting all client data before proceeding

---

## Lessons Learned

- Always check the paper/legacy form before building an online version — it often contains data (bank details, fee amounts, exact legal text) not captured elsewhere
- WC `order` section fields are the correct place for non-billing supplementary fields; they render cleanly below billing on the checkout form without conflicting with WC's core field layout
