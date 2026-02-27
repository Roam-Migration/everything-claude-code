# Session: Gull Force — Visual QA Pass

**Date:** 2026-02-28
**Repo:** gull-force-wp (master, no new commits)

---

## Result: All Clear

All 5 pages pass QA. Site is content-complete pending one outstanding field.

| Page | HTTP | Elementor | Content | Notes |
|------|------|-----------|---------|-------|
| Home | 200 | ✅ | ✅ | Hero heading "Gull Force 2/21st Battalion" live |
| Community | 200 | ✅ | ✅ | 53 headstone images, veteran content |
| Memorabilia | 200 | ✅ | ✅ | 4 WooCommerce products |
| Contact | 200 | ✅ | ✅ | Email, postal, membership info live |
| Pilgrimages | 200 | ✅ | ✅ | Timeline, 382 gallery images, 3 booklet PDFs |

---

## Outstanding

- `membership_form_pdf` (post 15 — Contact page) — EMPTY. Placeholder text "Membership form coming soon — please contact us for details." is displaying correctly. Waiting on client to supply PDF.

---

## Key Learning: Playwright + Elementor Lazy Loading

**Problem:** Initial QA script reported "broken images" on Community and Pilgrimages pages (5 broken each). All files existed on disk.

**Root cause:** Elementor sets `loading="lazy"` on every image by default (`total: 53, lazy: 53, eager: 0`). Playwright's `waitUntil: 'networkidle'` does not scroll the page, so below-fold lazy images are never requested. `img.naturalWidth === 0` returns true for unloaded lazy images — they look broken but aren't.

**Fix for future QA scripts:**
```js
// After page load, scroll to trigger lazy images
await pg.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await pg.waitForTimeout(3000);
// Now recheck naturalWidth
```

After scroll: zero broken images across all pages.

---

## Next Session

- Await membership form PDF from client → populate `membership_form_pdf` on post 15
- Export DDEV DB snapshot for handover / staging deployment
