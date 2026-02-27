# ACF Field Mapping — Contact Page

*Status: Complete — ACF field group `group_gf_contact` (ID 2008), 5 of 6 fields populated on post ID 15. `membership_form_pdf` left blank — client to upload PDF via WP admin. No Ambon office (confirmed). Email gullforce@hotmail.com is from legacy site — client to verify if still current.*

---

## Content from Legacy Site (About_us.html)

### Australian Office (confirmed from legacy site)
- **Email:** gullforce@hotmail.com
- **Postal:** P.O. Box 233, Wendouree 3355
- **Membership:** $35.00 (life membership, includes lapel pin)
- **Newsletter subscription:** $20.00 for 2 years (posted copy)

### Ambon, Indonesia Office
**CRITICAL:** The handover brief notes the Contact page shows an Ambon, Indonesia office
location. This was NOT found in the legacy HTML. This detail must be confirmed directly
with the Association before populating.

Do NOT guess or use any address found in admin documents.

---

## Proposed ACF Mapping (pending field audit + client verification)

| ACF Field (expected)         | Type     | Content                                          |
|------------------------------|----------|--------------------------------------------------|
| `office_australia_email`     | email    | gullforce@hotmail.com                            |
| `office_australia_postal`    | textarea | P.O. Box 233, Wendouree VIC 3355                |
| `office_ambon_address`       | textarea | VERIFY WITH CLIENT BEFORE POPULATING             |
| `office_ambon_contact_name`  | text     | VERIFY WITH CLIENT BEFORE POPULATING             |
| `membership_fee`             | text     | $35.00                                           |
| `membership_info`            | wysiwyg  | Full membership details from About_us.html       |
| `newsletter_fee`             | text     | $20.00 for 2 years                               |
| `contact_form_recipient`     | email    | gullforce@hotmail.com (or updated address)       |
| `membership_form_pdf`        | file     | Membership form PDF (check if in documents/)     |

---

## Action Required Before Populating

1. **Confirm current email** — gullforce@hotmail.com may be outdated. Ask client for active contact.
2. **Confirm Ambon office details** — address and contact name for Indonesia office.
3. **Confirm mailing address** — P.O. Box 233, Wendouree 3355 still current?
4. **Check membership form PDF** — not found in extracted documents; client may need to provide.
