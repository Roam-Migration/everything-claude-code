# Handover — Gull Force WP: Elementor & WordPress Improvements

**Date:** 2026-03-03
**Project:** Gull Force Association WordPress Site
**Purpose:** Next-session handover — Elementor/WP programmatic improvements
**Site:** https://jacksont.sg-host.com (SiteGround production)
**Local dev:** DDEV at `http://gull-force.100.115.92.195.nip.io`

---

## Current State Summary

Migration to SiteGround is **complete** as of 2026-03-03. Site is live and verified:

| Content | Count | Status |
|---------|-------|--------|
| gf_member CPT | 1,191 | OK (362 association + 829 nominal roll) |
| gf_headstone CPT | 607 | OK |
| gf_memorial CPT | 8 | OK |
| Pages | 25 | OK — all 19 content pages in Elementor builder mode |
| WC Products | 9 | OK (3 merchandise + 1 membership + 5 others) |
| Association members (WP users) | 324 | OK (GF-0001–GF-0324) |
| Elementor Pro | Active | Licence A-S02727353 |
| Design system | Active | Playfair Display + Source Serif 4, all kit tokens set |

---

## Connection Details

```
SSH:    ssh -i ~/.ssh/siteground_gullforce -p 18765 u2316-1fi6cxp40agu@ssh.jacksont.sg-host.com
WP root: /home/u2316-1fi6cxp40agu/www/jacksont.sg-host.com/public_html/
WP-CLI: wp eval-file /path/to/script.php --path=/home/u2316-1fi6cxp40agu/www/jacksont.sg-host.com/public_html/

Local repo:    /home/jtaylor/gull-force-wp
Script pattern: scp script to server → wp eval-file → delete script
Skill:         wordpress-elementor-patterns (installed, covers all WP-CLI + injection patterns)
```

---

## Priority Work for Next Session

### P1 — Audio Embedding (Ready to implement)

Three audio files are in WP media but **not embedded on any page**:

| ID | Title | File |
|----|-------|------|
| 3954 | Last Post | `uploads/gull-force/audio/Last Post.mp3` |
| 3955 | Ambon Last Post | `uploads/gull-force/audio/AmbonLastPost.mp3` |
| 3956 | Rouse | `uploads/gull-force/audio/Rouse.mp3` |

**Recommended placement:** Memorials page (ID 2650) — already has statistics +
world map + memorial grid. A "Ceremonial Music" section above or below the map
fits thematically.

**Alternative:** individual `single-gf_memorial.php` templates for Ambon/Laha
memorials specifically. Ambon War Cemetery is where most executed soldiers are
commemorated — Last Post + Ambon Last Post belong there.

**Implementation approach:** Elementor `sound-cloud` widget won't work (not
SoundCloud). Use HTML widget with native `<audio>` tag, or the Elementor
`html` widget. Inject via `update_widget_editor()` pattern (surgical — no
full rebuild needed on page 2650).

```php
// Audio block HTML to inject (example)
$audio_html = '
<div class="gf-audio-block" style="margin:2em 0;">
    <h3 style="font-family:\'Playfair Display\',serif;color:#1A2744;">Ceremonial Music</h3>
    <div style="display:flex;flex-direction:column;gap:1.5em;">
        <div>
            <p style="font-family:\'Source Serif 4\',serif;font-weight:600;margin:0 0 .5em;">Last Post</p>
            <audio controls style="width:100%;max-width:480px;">
                <source src="' . wp_get_attachment_url(3954) . '" type="audio/mpeg">
            </audio>
        </div>
        <div>
            <p style="font-family:\'Source Serif 4\',serif;font-weight:600;margin:0 0 .5em;">Ambon Last Post</p>
            <audio controls style="width:100%;max-width:480px;">
                <source src="' . wp_get_attachment_url(3955) . '" type="audio/mpeg">
            </audio>
        </div>
        <div>
            <p style="font-family:\'Source Serif 4\',serif;font-weight:600;margin:0 0 .5em;">Rouse</p>
            <audio controls style="width:100%;max-width:480px;">
                <source src="' . wp_get_attachment_url(3956) . '" type="audio/mpeg">
            </audio>
        </div>
    </div>
</div>';
```

**Note:** Audio attachment URLs on SiteGround will differ from DDEV. Resolve
dynamically via `wp_get_attachment_url($id)` — do not hardcode. IDs (3954–3956)
were set on DDEV; **verify IDs on SiteGround first**:
```bash
wp post list --post_type=attachment --post_status=any --search="Last Post" \
  --fields=ID,post_title --path=/home/u2316-1fi6cxp40agu/www/jacksont.sg-host.com/public_html/
```

---

### P2 — Post-Migration Verification Pass

Run the following verification checks on the live SiteGround site. Some may
have broken silently post-import.

**Critical checks:**

| Item | Check | Likely issue if broken |
|------|-------|------------------------|
| Elementor Theme Builder header/footer | Load any page — is branded header showing? | `_elementor_conditions` may have reset on import |
| Fonts loading | Inspect page — are Playfair Display + Source Serif 4 rendering? | SG Optimizer may be blocking external fonts |
| Chart.js statistics | `/memorials/` — do donut + bar charts render? | CDN URL in shortcode code may be blocked by CSP |
| Leaflet map | `/memorials/` — does the world memorial map load? | Same — CDN tiles |
| Fancybox galleries | `/veteran-photos/`, `/plaques-memorials/` | Enqueue priority issue on SiteGround PHP version |
| WooCommerce shop | `/shop/` — 3 products visible? | Cart/checkout page IDs may have changed |
| BACS details | Checkout page — BSB 063-138, Acc 1020 2007 shown? | WC settings survived import |
| Member portal shortcodes | `/member-login/`, `/newsletters/`, `/member-area/`, `/join/` | mu-plugin loading correctly |
| ACF fields | WP Admin > Custom Fields — field groups visible? | ACF Pro licence needs reactivation on new domain |

**WP-CLI verification commands (run on SiteGround):**
```bash
# Check ACF is active + licensed
wp plugin status advanced-custom-fields-pro --path=...

# Verify Elementor Theme Builder templates exist
wp post list --post_type=elementor_library --fields=ID,post_title,post_status --path=...

# Check Theme Builder conditions are set
wp post meta get <header_post_id> _elementor_conditions --path=...

# Flush Elementor CSS (run if any visual issues)
wp elementor flush-css --path=...

# Check SG Optimizer is not aggressively caching member pages
wp option get sg_optimizer_params --path=...
```

---

### P3 — SiteGround Caching Configuration

SiteGround's **SG Optimizer** (SuperCacher) can interfere with:
- Dynamic shortcode output (member portal — renders differently per login state)
- WooCommerce cart/checkout pages
- Elementor CSS regeneration

**Required exclusions from page cache:**
```
/member-login/
/member-area/
/newsletters/
/join/
/cart/
/checkout/
/my-account/
/wp-admin/
```

Configure via: WP Admin > SG Optimizer > Caching > Exclude URLs from cache

**Asset optimisation settings to verify:**
- CSS/JS minification: OK for front-end pages, but test after enabling
- Lazy loading: OK, but verify Fancybox gallery thumbnails still trigger correctly
- WebP conversion: OFF for now — headstone/portrait images need quality preservation

---

### P4 — Header/Footer Elementor Conditions (if broken)

If the branded header/footer is not displaying on SiteGround, the Theme Builder
conditions likely reset during migration. Fix via WP-CLI:

```php
// scripts/fix-elementor-conditions.php
// Find the header and footer template IDs first:
// wp post list --post_type=elementor_library --path=...

$header_id = YOUR_HEADER_POST_ID;
$footer_id = YOUR_FOOTER_POST_ID;

// Apply global "include all" condition
$conditions = [ 'include/general' ];
update_post_meta( $header_id, '_elementor_conditions', $conditions );
update_post_meta( $footer_id, '_elementor_conditions', $conditions );

\Elementor\Plugin::$instance->files_manager->clear_cache();
WP_CLI::success( "Conditions restored." );
```

---

### P5 — WooCommerce PayPal (Client-blocked)

**Blocked on:** client providing PayPal Business account credentials.

When account is provided:
1. WP Admin > WooCommerce > Payments > PayPal Standard (or PayPal Payments)
2. Set `paypal_email` to business account email
3. Enable sandbox for testing first
4. Test with a $1 test product before enabling live $50 membership
5. Verify `woocommerce_order_status_completed` hook fires correctly (both BACS
   manual and PayPal auto-complete paths)

**Note:** PayPal skips `on-hold` status entirely — goes straight to `completed`.
The BACS guard `$order->get_payment_method() === 'bacs'` in the `on-hold` hook
is already in place. No code changes needed once PayPal is configured.

---

### P6 — CPT Templates → Elementor Theme Builder (Phase 7, future)

Currently `single-gf_member.php`, `single-gf_headstone.php`,
`single-gf_memorial.php` are raw PHP templates in `hello-elementor` theme.
They work but can't be edited visually in Elementor.

**Converting to Elementor Theme Builder** (for Phase 7):
- Requires Elementor Pro Theme Builder + Loop Builder
- Create a "Single Post" template, set condition to `gf_member` post type
- Use Elementor Pro Dynamic Tags to pull ACF fields
- The current PHP templates serve as spec for what each template must display

**Considerations before attempting:**
- ACF Dynamic Tags require Elementor Pro → ACF Pro integration (already have both)
- Loop Builder for grids (service photos, related memorials) needs Loop Item template
- High complexity — schedule as a dedicated session with full PHP-to-Elementor mapping

---

## Pages Quick Reference (SiteGround IDs may differ — verify via WP-CLI)

| Page | Local ID | Slug | Builder | Shortcode(s) |
|------|----------|------|---------|--------------|
| Home | 12 | `/` | Elementor | — |
| Community | 13 | `/community/` | Elementor | — |
| Memorabilia | 14 | `/memorabilia/` | Elementor | — |
| Contact | 15 | `/contact/` | Elementor | — |
| Pilgrimages | 16 | `/pilgrimages/` | Elementor | — |
| Veterans Directory | 2554 | `/veterans-directory/` | Elementor | `[gf_member_grid]` |
| 2/21st History | 2556 | `/2-21st-battalion-history/` | Elementor | — |
| 1/21st History | 2558 | `/1-21st-battalion-history/` | Elementor | — |
| Veteran Photos | 2569 | `/veteran-photos/` | Elementor | `[gf_photo_gallery]` |
| Plaques & Memorials | 2610 | `/plaques-memorials/` | Elementor | `[gf_headstone_grid]` etc. |
| Memorials | 2650 | `/memorials/` | Elementor | `[gf_statistics]` `[gf_memorial_map]` `[gf_memorial_grid]` |
| Further Resources | 3943 | `/further-reading/` | Elementor | — |
| Nominal Roll | 3922 | `/nominal-roll/` | Elementor | PDF download |
| Member Login | 3926 | `/member-login/` | Elementor | `[gf_member_login]` |
| Newsletters | 3934 | `/newsletters/` | Elementor | `[gf_newsletter_archive]` |
| Member Area | 3935 | `/member-area/` | Elementor | `[gf_member_dashboard]` |
| Join | 3938 | `/join/` | Elementor | `[gf_join]` |

**IMPORTANT:** Page IDs on SiteGround are likely the same (import preserves them),
but verify before injecting `_elementor_data` by post ID:
```bash
wp post get <ID> --fields=ID,post_title,post_status --path=...
```

---

## Key Files Reference

| File | Location | Purpose |
|------|----------|---------|
| mu-plugin | `web/wp-content/mu-plugins/gull-force.php` | All CPT, shortcodes, member portal, WC hooks |
| Member template | `web/wp-content/themes/hello-elementor/single-gf_member.php` | Veteran profile |
| Headstone template | `web/wp-content/themes/hello-elementor/single-gf_headstone.php` | Headstone + CWGC panel |
| Memorial template | `web/wp-content/themes/hello-elementor/single-gf_memorial.php` | Memorial + Fancybox |
| Build scripts | `scripts/build-*.php` | All Elementor page builds (DDEV only — re-run on SG if needed) |
| Skill | `~/.claude/skills/wordpress-elementor-patterns/` | All WP/Elementor/WC/ACF patterns |

---

## Outstanding Client Actions (blocks go-live)

| Item | Owner | Notes |
|------|-------|-------|
| PayPal Business account | Client | Configure in WC > Payments when received |
| Custom domain (e.g. gullforce.org.au) | Client | DNS cutover to SiteGround after confirmed |
| Pilgrimages photo review | Client | Contact sheet: `jacksont.sg-host.com/wp-content/uploads/gull-force/pilgrimages-review.html` |
| Approve password reset emails to 324 members | Client / Dev | WP Admin > Users > bulk "Send password reset" |

---

## Not Blocking Go-Live (parked)

- 1983 pilgrimage participants — manual historical research, no automated solution
- CPT → Elementor Theme Builder conversion — Phase 7
- bbPress forum / committee meeting notes — Phase 7
- Voting functionality — Phase 7

---

## Session Start Checklist

1. Activate `wordpress-elementor-patterns` skill context
2. Verify SiteGround SSH connection: `ssh -i ~/.ssh/siteground_gullforce -p 18765 u2316-1fi6cxp40agu@ssh.jacksont.sg-host.com`
3. Run P2 verification checks — establish what's broken before building new features
4. Tackle P1 (audio embedding) — most concrete, lowest risk
5. Address any P2 failures found in step 3

---

## Reference Sessions

- `docs/sessions/2026-03-03-gull-force-siteground-migration.md` — migration details
- `docs/sessions/2026-03-01-gull-force-elementor-migration-plan.md` — pre-migration plan + verification checklist
- `docs/sessions/2026-03-01-gull-force-phase6-sprint4.md` — member portal final sprint
- `docs/sessions/2026-02-28-gull-force-design-system.md` — typography + colour tokens
