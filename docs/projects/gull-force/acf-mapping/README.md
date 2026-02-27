# ACF Field Mapping — Gull Force

This directory holds per-page mapping tables between scraped content and ACF Pro field schema.

---

## Methodology

1. Audit ACF field groups via WP-CLI or ACF admin
2. Identify available scraped content per page
3. Map scraped fields → ACF fields in a table (see template below)
4. Get user confirmation before executing population scripts
5. Document final mapping here for future reference

---

## Files

| File                      | Page         | Status                                     |
|---------------------------|--------------|---------------------------------------------|
| `home-mapping.md`         | Home         | Draft — awaiting ACF audit                 |
| `community-mapping.md`    | Community    | Draft — awaiting ACF audit                 |
| `memorabilia-mapping.md`  | Memorabilia  | Draft — awaiting ACF audit + WooCommerce check |
| `contact-mapping.md`      | Contact      | Draft — **client verification required**   |
| `pilgrimages-mapping.md`  | Pilgrimages  | Draft — awaiting ACF audit                 |

---

## Mapping Table Template

Use this structure in each page mapping file:

```markdown
## ACF Field Audit — [Page Name]

### Registered Field Groups
| Group Name | Key | Location Rule |
|------------|-----|---------------|
| ...        | ... | ...           |

### Field-to-Content Mapping
| ACF Field Name | ACF Field Key | Field Type | Source File/Column | Notes |
|----------------|---------------|------------|-------------------|-------|
| hero_title     | field_abc123  | text       | scraped/home.json > title | ... |
| hero_image     | field_abc124  | image      | content/images/hero.jpg   | ... |

### Unmapped ACF Fields (need content)
- field_name: description of what's needed

### Unmapped Content (no ACF field)
- content item: proposed action (create new field / discard / manual entry)
```

---

## WP-CLI Audit Command

```bash
# List all field groups
wp post list --post_type=acf-field-group --url=vmoeoorvf.elementor.cloud

# List fields in a group (replace GROUP_ID)
wp post list --post_type=acf-field --post_parent=GROUP_ID --url=vmoeoorvf.elementor.cloud

# Or via eval
wp eval '
  $groups = acf_get_field_groups();
  foreach ($groups as $g) {
    echo $g["title"] . " (" . $g["key"] . ")\n";
    $fields = acf_get_fields($g["key"]);
    foreach ($fields as $f) {
      echo "  - " . $f["name"] . " [" . $f["type"] . "] " . $f["key"] . "\n";
    }
  }
' --url=vmoeoorvf.elementor.cloud
```
