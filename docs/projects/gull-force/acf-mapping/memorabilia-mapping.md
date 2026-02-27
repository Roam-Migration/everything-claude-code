# ACF Field Mapping — Memorabilia Page

*Status: Complete — ACF field group `group_gf_memorabilia` (ID 1976), 3 page-level fields populated on post ID 14. WooCommerce active, 5 products (IDs 1453–1457) have product images assigned. Order form PDF at attachment ID 1975.*

---

## Products from Legacy Site (Merchandise.html)

### 1. Gull Force Bag
- Description: Depicts the colour patch of Gull Force and the battle honours of the 2/21st Battalion. Can be worn over the shoulder or across the body, has a drink bottle holder and two secure zip pockets.
- Price: $30.00 (includes postage within Australia)
- Image candidate: `images/Gull Force bag pic.JPG`

### 2. Gull Force Black or White Cap
- Description: Size adjustable. Depicts the colour patch of Gull Force and the 2/21st Battalion name.
- Price: $25.00 (includes postage within Australia)
- Image candidates: `images/New b+w caps web.jpg`

### 3. Gull Force Black Visor
- Description: Size adjustable. Depicts the colour patch of Gull Force and the 2/21st Battalion name.
- Price: $25.00 (includes postage within Australia)
- Image candidate: `images/New visor web.jpg`

### 4. Ambon – Hainan Remembrance Pin
- Description: Depicts the colour patch of Gull Force with the Gull overlaid. Wording: "Gull Force 2/21Bn Ambon - Hainan Service and sacrifice remembered." Size 3cm across. Back has bar clip and plain gold finish (can engrave veteran's name/service number).
- Price: 1–3 units: $12.00 each; 4+ units: $10.00 each (includes postage within Australia)
- Image candidates: `images/Pin 1.jpg`, `images/Pin 2.jpg`, `images/Pin 3.jpg`

### 5. Gull Force White Bucket Hat
- Description: Size medium. Depicts the colour patch of Gull Force and the 2/21st Battalion name.
- Price: Check against current stock — not confirmed from legacy text
- Image candidate: `images/Gull Force bucket hat.JPG`

### Order Method (Legacy)
- Download order form and post cheque/money order to:
  Gull Force Association, P.O.Box 233, Wendouree 3355

---

## WooCommerce Status — MUST CONFIRM

The Memorabilia page has an e-commerce product carousel. Before populating:

```bash
# Confirm WooCommerce is active
wp plugin status woocommerce --url=vmoeoorvf.elementor.cloud
```

**If WooCommerce active:** Create products via WP-CLI, link to carousel.
**If WooCommerce inactive:** Use ACF repeater field as static product list instead.

---

## Proposed ACF Mapping (if no WooCommerce)

| ACF Field (expected)       | Type     | Content                                |
|----------------------------|----------|----------------------------------------|
| `products` (repeater)      | repeater | 5 product rows                         |
| `products.name`            | text     | Product name                           |
| `products.description`     | textarea | Product description                    |
| `products.price`           | text     | Price string (e.g., "$30.00")          |
| `products.image`           | image    | Product photo from `images/`           |
| `products.note`            | text     | e.g., "includes postage within Australia" |
| `order_instructions`       | wysiwyg  | How to order (form + postal address)   |
| `order_form_pdf`           | file     | `documents-historical/Gull Force Order Form.pdf` |

## Proposed WooCommerce Population (if active)

```bash
# Create product via WP-CLI
wp wc product create \
  --name="Gull Force Bag" \
  --regular_price="30.00" \
  --description="Depicts the colour patch..." \
  --url=vmoeoorvf.elementor.cloud
```
