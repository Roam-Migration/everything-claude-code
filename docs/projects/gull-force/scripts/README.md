# Scripts — Gull Force

WP-CLI and utility scripts for content population.

---

## Script Index

| Script                          | Purpose                              | Status  |
|---------------------------------|--------------------------------------|---------|
| `audit-acf-fields.sh`           | List all ACF groups/fields on site   | Pending |
| `import-images.sh`              | Batch import images to media library | Pending |
| `populate-home.sh`              | Populate Home page ACF fields        | Pending |
| `populate-community.sh`         | Populate Community page ACF fields   | Pending |
| `populate-memorabilia.sh`       | Populate Memorabilia page ACF fields | Pending |
| `populate-contact.sh`           | Populate Contact page ACF fields     | Pending |
| `populate-pilgrimages.sh`       | Populate Pilgrimages page ACF fields | Pending |

---

## Usage

All scripts assume WP-CLI is available and the site URL is vmoeoorvf.elementor.cloud.

```bash
# Run audit
bash docs/projects/gull-force/scripts/audit-acf-fields.sh

# Dry-run image import (check paths before committing)
bash docs/projects/gull-force/scripts/import-images.sh --dry-run
```

---

## WP-CLI Connection

If running WP-CLI remotely, confirm SSH access to the staging environment or use the
Elementor Cloud CLI connector if available.

```bash
# Test connection
wp core version --url=vmoeoorvf.elementor.cloud
```
