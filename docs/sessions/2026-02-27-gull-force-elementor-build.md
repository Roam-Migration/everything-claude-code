# Session: WordPress Elementor Programmatic Build + DDEV ChromeOS Networking

**Date:** 2026-02-27
**Project:** Gull Force Association WordPress site
**Branch:** master (gull-force-wp repo)

---

## Transferable Learnings

Two independent bugs resolved in this session — both have broad applicability beyond this project.

---

## 1. wp_slash() Is Required When Storing JSON in WordPress postmeta

**The trap:** `update_post_meta()` internally calls `wp_unslash()` on the value before writing.
If you pass raw JSON containing escaped quotes (`\"`), the unslash strips the backslashes and
corrupts the JSON. `json_decode()` then returns NULL. Any plugin or script that reads the JSON
(Elementor, ACF, etc.) silently fails — often rendering nothing rather than showing an error.

**The fix:**

```php
// WRONG — JSON will be corrupted in the DB
update_post_meta( $post_id, '_elementor_data', wp_json_encode( $elements ) );

// CORRECT — wp_slash() pre-escapes so wp_unslash() cancels out
update_post_meta( $post_id, '_elementor_data', wp_slash( wp_json_encode( $elements ) ) );
```

This is the canonical WordPress pattern. `wp_slash()` doubles all backslashes; `update_post_meta()`
then strips one layer via `wp_unslash()`, leaving the JSON intact.

**Applies to:** Any code that stores JSON strings in `wp_postmeta`, `wp_options`, or `wp_usermeta`
via the WordPress meta API. This includes ACF programmatic updates, Elementor build scripts,
custom plugin data, etc.

**Diagnosis path:** If postmeta-backed content silently doesn't render:
1. Check `json_decode( get_post_meta( $id, '_your_key', true ) )` — is it NULL?
2. Check `json_last_error_msg()` — "Syntax error" confirms the slashing bug
3. Fix with `wp_slash()` and re-save

---

## 2. DDEV on ChromeOS Crostini — Accessing from Chrome Browser

**The problem:** Chrome runs in ChromeOS. DDEV runs in the Crostini Linux container.
`*.ddev.site` resolves to `127.0.0.1` via public DNS — this hits ChromeOS's loopback,
not the Linux container. Result: ERR_CONNECTION_REFUSED.

**The fix — three parts:**

### Part A: Bind DDEV router to all interfaces

```bash
sg docker -c "ddev config global --router-bind-all-interfaces=true"
```

This makes Traefik listen on `0.0.0.0:80/443` instead of `127.0.0.1` only. The Crostini
Linux container's IP (`100.115.92.195` on this machine) becomes reachable.

### Part B: Add a nip.io hostname

In `.ddev/config.yaml`:

```yaml
additional_fqdns:
  - my-site.100.115.92.195.nip.io
```

`nip.io` is a free wildcard DNS service. `*.100.115.92.195.nip.io` resolves to `100.115.92.195`
everywhere — no `/etc/hosts` edits, no corporate DNS required. DDEV registers the FQDN with
Traefik automatically on `ddev restart`.

Find Crostini's IP: `ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1`

### Part C: Dynamic WP_HOME to prevent redirect loops

WordPress stores `siteurl` in the DB. When accessed via the nip.io hostname, WordPress
redirects to the stored URL (the `.ddev.site` domain) — an infinite redirect.

Fix: Override WP_HOME and WP_SITEURL dynamically from HTTP_HOST in `wp-config.php`,
*before* DDEV's `wp-config-ddev.php` is included (which uses `defined() || define()`):

```php
if ( getenv( 'IS_DDEV_PROJECT' ) === 'true' && ! empty( $_SERVER['HTTP_HOST'] ) ) {
    $_gf_scheme = ( ! empty( $_SERVER['HTTPS'] ) && $_SERVER['HTTPS'] !== 'off' ) ? 'https' : 'http';
    define( 'WP_HOME',    $_gf_scheme . '://' . $_SERVER['HTTP_HOST'] );
    define( 'WP_SITEURL', WP_HOME . '/' );
}
```

Place this block in `wp-config.php` immediately before `require_once __DIR__ . '/wp-config-ddev.php'`.

**Note:** Both `.ddev/config.yaml` and `wp-config.php` are gitignored in the DDEV WordPress
scaffold — these changes are environment-specific and should remain untracked.

---

## Elementor Programmatic Build Pattern (Reference)

When building Elementor page data via PHP scripts (e.g. with WP-CLI `eval-file`):

```php
// Element ID — 8 lowercase hex chars
function gf_uid() { return substr( md5( uniqid( '', true ) ), 0, 8 ); }

// ACF Dynamic Tag — URL-encoded JSON settings string
function gf_tag( $tag_name, $acf_key, $acf_field ) {
    $s = urlencode( json_encode( ['key' => "{$acf_key}:{$acf_field}"], JSON_FORCE_OBJECT ) );
    return '[elementor-tag id="' . gf_uid() . '" name="' . $tag_name . '" settings="' . $s . '"]';
}

// Flex Container (Elementor 3.x — no legacy section/column)
function gf_container( $settings, $elements, $inner = false ) {
    return ['id' => gf_uid(), 'elType' => 'container', 'settings' => $settings,
            'elements' => $elements, 'isInner' => $inner];
}

// Widget
function gf_widget( $type, $settings ) {
    return ['id' => gf_uid(), 'elType' => 'widget', 'widgetType' => $type,
            'settings' => $settings, 'elements' => []];
}

// Inject — note wp_slash() is REQUIRED
function gf_inject( $post_id, $elements ) {
    update_post_meta( $post_id, '_elementor_data',      wp_slash( wp_json_encode( $elements ) ) );
    update_post_meta( $post_id, '_elementor_edit_mode', 'builder' );
    update_post_meta( $post_id, '_elementor_version',   '3.35.5' );
    wp_update_post( ['ID' => $post_id, 'post_status' => 'publish'] );
}
```

Dynamic tag name values: `acf-text`, `acf-wysiwyg`, `acf-image`, `acf-url`.
Place tag string in `__dynamic__` → `'editor'` (text-editor), `'title'` (heading), `'image'` (image).

ACF repeaters are not supported by Elementor's Loop Builder — use `shortcode` widgets backed
by mu-plugin shortcodes that render repeater data as styled HTML.

---

## Playwright Content Audit Pattern

Quick headless audit across multiple WordPress pages:

```js
const { chromium } = require('/home/jtaylor/.npm-global/lib/node_modules/@playwright/test');

const BASE = 'http://my-site.100.115.92.195.nip.io';
const pages = [
  { slug: '/', name: 'Home' },
  { slug: '/contact/', name: 'Contact' },
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();

  for (const { slug, name } of pages) {
    const pg = await ctx.newPage();
    await pg.goto(BASE + slug, { waitUntil: 'networkidle', timeout: 20000 });

    const widgets    = await pg.locator('[data-widget_type]').count();
    const textFilled = await pg.evaluate(() =>
      [...document.querySelectorAll('[data-widget_type="text-editor.default"]')]
        .filter(el => el.innerText.trim().length > 5).length
    );

    console.log(`\n=== ${name} ===`);
    console.log(`  Widgets: ${widgets}, Text filled: ${textFilled}`);
    await pg.close();
  }

  await browser.close();
})();
```

Run: `node /tmp/my-audit.js`
