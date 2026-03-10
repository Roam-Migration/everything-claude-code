---
name: wordpress-elementor-patterns
description: >
  Proven patterns for programmatic WordPress and Elementor development —
  postmeta JSON storage, Elementor page/kit injection, WooCommerce hooks,
  custom roles/capabilities, ACF field groups, WP-CLI scripts, custom post
  types, and SiteGround SSH deployment. Distilled from the Gull Force WP
  project. Activate when writing PHP scripts that interact with WordPress
  core, Elementor builder data, or WooCommerce checkout/order flows.
origin: ECC
---

# WordPress & Elementor Programmatic Patterns

Verified patterns for scripted WordPress development. All patterns have been
validated in production (Gull Force WP, SiteGround hosting).

---

## 1. Postmeta JSON — wp_slash() is REQUIRED

`update_post_meta()` calls `wp_unslash()` internally, which strips `\"` from
JSON strings and corrupts the data. Always pre-escape with `wp_slash()`.

```php
// ✅ CORRECT
update_post_meta( $post_id, '_my_key', wp_slash( wp_json_encode( $data ) ) );

// ❌ WRONG — JSON will be corrupted silently
update_post_meta( $post_id, '_my_key', json_encode( $data ) );
update_post_meta( $post_id, '_my_key', wp_json_encode( $data ) );
```

**Diagnosis:** `json_decode( get_post_meta($id, $key, true) )` returns NULL →
`json_last_error_msg()` returns "Syntax error". Fix: add `wp_slash()`.

**Note:** Elementor's `_elementor_page_settings` (Global Kit) stores a **PHP
array** (NOT JSON). Use plain `update_post_meta()` for that key — no
`wp_slash` or `json_encode` required.

---

## 2. Elementor Page — Full Build Pattern

Use these helpers to construct Elementor page data programmatically.

### Core helpers

```php
function gf_uid(): string {
    return substr( md5( uniqid( '', true ) ), 0, 8 );
}

function gf_container( array $settings, array $elements, bool $inner = false ): array {
    return [
        'id'       => gf_uid(),
        'elType'   => 'container',
        'settings' => $settings,
        'elements' => $elements,
        'isInner'  => $inner,
    ];
}

function gf_widget( string $type, array $settings ): array {
    return [
        'id'         => gf_uid(),
        'elType'     => 'widget',
        'widgetType' => $type,
        'settings'   => $settings,
        'elements'   => [],
    ];
}

/**
 * Write finished Elementor data to a post.
 * Always call this — sets all required postmeta in one place.
 */
function gf_inject( int $post_id, array $elements ): void {
    update_post_meta( $post_id, '_elementor_data',      wp_slash( wp_json_encode( $elements ) ) );
    update_post_meta( $post_id, '_elementor_edit_mode', 'builder' );
    update_post_meta( $post_id, '_elementor_version',   '3.35.5' );
    wp_update_post( [ 'ID' => $post_id, 'post_status' => 'publish' ] );
}
```

### JSON data structure (per official Elementor spec)

```json
{
    "id": "12345678",
    "elType": "container",
    "isInner": false,
    "settings": {
        "padding": { "unit": "px", "top": "80", "right": "40", "bottom": "80", "left": "40", "isLinked": false }
    },
    "elements": [
        {
            "id": "abcd1234",
            "elType": "widget",
            "widgetType": "heading",
            "isInner": false,
            "settings": { "title": "My Heading", "align": "center" },
            "elements": []
        }
    ]
}
```

### Legacy section-column-widget vs modern container

```php
// Modern (Elementor 3.6+): container → widgets directly
$page = [ gf_container( $settings, [ gf_widget('heading', $h_settings) ] ) ];

// Legacy: section → column → widget (use only if importing legacy data)
$legacy = [
    [ 'id' => gf_uid(), 'elType' => 'section', 'settings' => [], 'elements' => [
        [ 'id' => gf_uid(), 'elType' => 'column', 'settings' => [], 'elements' => [
            gf_widget('heading', $h_settings)
        ]]
    ]]
];
```

### Common widget settings reference

```php
// heading widget
$heading_settings = [
    'title'                  => 'My Heading',
    'header_size'            => 'h1',         // h1–h6, div, span, p
    'align'                  => 'center',     // left, center, right
    'title_color'            => '#1A2744',
    'typography_typography'  => 'custom',
    'typography_font_family' => 'Playfair Display',
    'typography_font_size'   => [ 'unit' => 'px', 'size' => 48, 'sizes' => [] ],
    'typography_font_weight' => '700',
];

// text-editor widget
$text_settings = [
    'editor' => '<p>HTML content here.</p>',
];

// image widget
$image_settings = [
    'image' => [ 'id' => $attachment_id, 'url' => wp_get_attachment_url( $attachment_id ) ],
    'image_size' => 'large',
];

// button widget
$button_settings = [
    'text'                   => 'Click Me',
    'link'                   => [ 'url' => home_url('/page/'), 'is_external' => false ],
    'button_text_color'      => '#ffffff',
    'background_color'       => '#1A2744',
];

// spacer widget
$spacer_settings = [ 'space' => [ 'size' => 40, 'unit' => 'px' ] ];

// html widget (raw HTML/shortcodes)
$html_settings = [ 'html' => '<p>Raw HTML or [shortcode]</p>' ];
```

### Container background settings

```php
// Solid colour background
$container_settings = [
    'background_background' => 'classic',
    'background_color'      => '#1A2744',
    'padding' => [ 'unit' => 'px', 'top' => '80', 'right' => '40', 'bottom' => '80', 'left' => '40', 'isLinked' => false ],
];

// Image background
$container_settings = [
    'background_background' => 'classic',
    'background_image'      => [ 'id' => $img_id, 'url' => wp_get_attachment_url( $img_id ) ],
    'background_size'       => 'cover',
    'background_position'   => 'center center',
    'padding'               => [ 'unit' => 'px', 'top' => '100', 'right' => '40', 'bottom' => '100', 'left' => '40', 'isLinked' => false ],
];
```

---

## 3. Elementor Widget Update — Surgical Injection (No Full Rebuild)

When you need to update a specific widget's content on an existing page
without rebuilding the entire page from scratch:

```php
/**
 * Recursively find a widget by ID and update its editor/html content.
 * Returns true on success.
 */
function update_widget_editor( array &$elements, string $widget_id, string $new_content ): bool {
    foreach ( $elements as &$el ) {
        if ( isset( $el['id'] ) && $el['id'] === $widget_id ) {
            // text-editor widgets use 'editor'; html widgets use 'html'
            $el['settings']['editor'] = $new_content;
            return true;
        }
        if ( ! empty( $el['elements'] ) && update_widget_editor( $el['elements'], $widget_id, $new_content ) ) {
            return true;
        }
    }
    return false;
}

// Usage
$el_raw = get_post_meta( $post_id, '_elementor_data', true );
$el     = json_decode( $el_raw, true );

if ( update_widget_editor( $el, 'abc12345', '<p>New content here.</p>' ) ) {
    update_post_meta( $post_id, '_elementor_data', wp_slash( wp_json_encode( $el ) ) );
    WP_CLI::success( "Widget updated." );
} else {
    WP_CLI::warning( "Widget ID not found — check with Elementor editor (element > Advanced > CSS ID or use browser inspector on _elementor_data)." );
}
```

**Finding widget IDs:** Open page in Elementor editor → right-click widget →
Edit → Advanced tab → check HTML ID field. Or read the `_elementor_data`
postmeta directly via WP-CLI:
```bash
wp post meta get <post_id> _elementor_data --path=/var/www/html/web | python3 -m json.tool | grep '"id"'
```

---

## 4. Elementor Global Kit — Colours & Typography

The Global Kit stores a **PHP array** in `_elementor_page_settings`. Do NOT
JSON-encode it.

```php
$kit_id = (int) get_option( 'elementor_active_kit' );

// Read existing settings (merge — don't overwrite keys you don't intend to change)
$existing = get_post_meta( $kit_id, '_elementor_page_settings', true );
if ( ! is_array( $existing ) ) { $existing = []; }

$new_settings = array_merge( $existing, [
    // System colours (_id must be: primary, secondary, text, accent)
    'system_colors' => [
        [ '_id' => 'primary',   'title' => 'Primary',   'color' => '#1A2744' ],
        [ '_id' => 'secondary', 'title' => 'Secondary',  'color' => '#C4A35A' ],
        [ '_id' => 'text',      'title' => 'Text',       'color' => '#2C2C2C' ],
        [ '_id' => 'accent',    'title' => 'Accent',     'color' => '#8B1A1A' ],
    ],
    // Custom colours (any _id slug)
    'custom_colors' => [
        [ '_id' => 'brand-cream', 'title' => 'Cream', 'color' => '#F5F0EB' ],
    ],
    // System typography (_id must be: primary, secondary, text, accent)
    'system_typography' => [
        [
            '_id'                    => 'primary',
            'title'                  => 'Headings',
            'typography_typography'  => 'custom',
            'typography_font_family' => 'Playfair Display',
            'typography_font_weight' => '700',
            'typography_line_height' => [ 'unit' => 'em', 'size' => 1.25, 'sizes' => [] ],
        ],
        [
            '_id'                    => 'text',
            'title'                  => 'Body',
            'typography_typography'  => 'custom',
            'typography_font_family' => 'Source Serif 4',
            'typography_font_weight' => '400',
            'typography_font_size'   => [ 'unit' => 'px', 'size' => 17, 'sizes' => [] ],
            'typography_line_height' => [ 'unit' => 'em', 'size' => 1.75, 'sizes' => [] ],
        ],
    ],
] );

// PHP array — plain update_post_meta (no wp_slash, no json_encode)
update_post_meta( $kit_id, '_elementor_page_settings', $new_settings );

// CRITICAL: regenerate CSS after kit changes
\Elementor\Plugin::$instance->files_manager->clear_cache();
WP_CLI::success( "Kit updated and CSS cache cleared." );
```

**Google Fonts blocking:** Use a filter to prevent Elementor loading kit
typography fonts via its own CDN call (use when self-hosting fonts instead):
```php
add_filter( 'elementor/frontend/print_google_fonts', '__return_false' );
```
Note: `elementor/fonts/excluded_fonts` filter does **not** prevent kit fonts
from loading — use the above filter only.

---

## 5. WP-CLI Script Execution

Always use `eval-file` with a script on disk — never `wp eval` with inline PHP
(shell `$` variable expansion breaks on ChromeOS/Crostini and is generally
fragile).

```bash
# DDEV local
ddev exec wp eval-file scripts/my-script.php --path=/var/www/html/web

# SiteGround SSH
ssh -i ~/.ssh/siteground_gullforce -p 18765 u2316-1fi6cxp40agu@ssh.jacksont.sg-host.com \
  "wp eval-file /home/u2316-1fi6cxp40agu/www/jacksont.sg-host.com/public_html/wp-content/scripts/my-script.php \
   --path=/home/u2316-1fi6cxp40agu/www/jacksont.sg-host.com/public_html"

# Copy script to SiteGround then run
scp -i ~/.ssh/siteground_gullforce -P 18765 scripts/my-script.php \
  u2316-1fi6cxp40agu@ssh.jacksont.sg-host.com:/home/u2316-1fi6cxp40agu/www/jacksont.sg-host.com/public_html/wp-content/scripts/
```

**WP-CLI output in scripts:**
```php
WP_CLI::success( "Done." );   // green [success]
WP_CLI::log( "Info..." );     // plain output
WP_CLI::warning( "Hmm..." );  // yellow [warning]
WP_CLI::error( "Fatal." );    // red [error] + exits
```

---

## 6. Custom Post Types (CPT)

```php
add_action( 'init', function (): void {
    register_post_type( 'gf_member', [
        'labels'            => [
            'name'          => 'Members',
            'singular_name' => 'Member',
        ],
        'public'            => true,
        'has_archive'       => true,
        'supports'          => [ 'title', 'thumbnail', 'custom-fields' ],
        'capability_type'   => 'post',
        'map_meta_cap'      => true,
        'rewrite'           => [ 'slug' => 'veteran' ],
        'show_in_rest'      => false,  // disable Gutenberg for this CPT
        'menu_icon'         => 'dashicons-groups',
    ] );
} );
```

After registering new CPTs, flush rewrite rules:
```bash
wp rewrite flush --path=/var/www/html/web
```

---

## 7. Custom Roles & Capabilities

```php
// Register once (stores in DB — use register_activation_hook or run once via WP-CLI)
function gf_register_roles(): void {
    // Build capability array from an existing role, then add custom caps
    $editor_caps = get_role( 'editor' )->capabilities;

    add_role( 'gf_committee_admin', 'Committee Admin', array_merge( $editor_caps, [
        'list_users'        => true,
        'edit_users'        => true,
        'create_users'      => true,
        'gf_manage_members' => true,
    ] ) );
}

// Guard admin menus for the role
add_action( 'admin_menu', function (): void {
    if ( ! current_user_can( 'manage_options' ) ) {
        remove_menu_page( 'plugins.php' );
        remove_menu_page( 'themes.php' );
        remove_menu_page( 'options-general.php' );
    }
}, 999 );

// Redirect committee admins to wp-admin (not front-end member area)
add_filter( 'login_redirect', function ( string $redirect, string $requested, WP_User $user ): string {
    if ( in_array( 'gf_committee_admin', (array) $user->roles, true ) ) {
        return admin_url();
    }
    return $redirect;
}, 10, 3 );
```

**Custom capability check pattern:**
```php
// In save handlers — accept either manage_options OR your custom cap
if ( ! current_user_can( 'manage_options' ) && ! current_user_can( 'gf_manage_members' ) ) {
    return;
}
```

---

## 8. WooCommerce — Checkout & Order Hooks

Three-hook pattern for capturing custom checkout fields and saving them on
order + user:

```php
// 1. ADD FIELDS — filter runs before checkout form renders
add_filter( 'woocommerce_checkout_fields', function ( array $fields ): array {
    $fields['billing']['billing_salutation'] = [
        'label'    => 'Salutation',
        'type'     => 'select',
        'options'  => [ '' => 'Select...', 'Mr' => 'Mr', 'Mrs' => 'Mrs', 'Ms' => 'Ms', 'Dr' => 'Dr' ],
        'priority' => 5,
        'class'    => [ 'form-row-first' ],
        'required' => false,
    ];
    $fields['order']['gf_relationship'] = [
        'label'    => 'Membership Category',
        'type'     => 'select',
        'options'  => [ '' => 'Select...', 'Life' => 'Life Member', 'Associate' => 'Associate' ],
        'priority' => 10,
        'required' => true,
    ];
    return $fields;
} );

// 2. VALIDATE — action runs on form submission before order creation
add_action( 'woocommerce_checkout_process', function (): void {
    if ( ! WC()->cart || ! gf_cart_has_membership() ) { return; }
    if ( empty( $_POST['gf_declaration'] ) ) {
        wc_add_notice( 'Please confirm the declaration to proceed.', 'error' );
    }
} );

// 3. SAVE TO ORDER — action runs during order object creation
add_action( 'woocommerce_checkout_create_order', function ( WC_Order $order ): void {
    $field_map = [
        'billing_salutation' => '_gf_salutation',
        'gf_relationship'    => '_gf_relationship',
        'gf_declaration'     => '_gf_declaration',
    ];
    foreach ( $field_map as $post_key => $meta_key ) {
        if ( ! empty( $_POST[ $post_key ] ) ) {
            $order->update_meta_data( $meta_key, sanitize_text_field( wp_unslash( $_POST[ $post_key ] ) ) );
        }
    }
} );
```

### Order status hooks (WooCommerce lifecycle)

```php
// BACS: fires immediately on checkout submit (awaiting bank transfer)
add_action( 'woocommerce_order_status_on-hold', function ( int $order_id ): void {
    $order = wc_get_order( $order_id );
    if ( ! $order || $order->get_payment_method() !== 'bacs' ) { return; }
    if ( ! gf_order_has_membership( $order ) ) { return; }
    // Set membership to pending, send admin notification
    update_user_meta( $order->get_customer_id(), 'gf_membership_status', 'pending' );
} );

// Fires for BOTH PayPal (auto) and BACS (manual admin trigger)
// Must be idempotent — may run more than once on same order
add_action( 'woocommerce_order_status_completed', function ( int $order_id ): void {
    $order = wc_get_order( $order_id );
    if ( ! $order || ! gf_order_has_membership( $order ) ) { return; }

    $user_id = $order->get_customer_id();
    if ( ! $user_id ) { return; }

    $user = new WP_User( $user_id );

    // Idempotency guard
    if ( get_user_meta( $user_id, 'gf_membership_status', true ) === 'active' ) { return; }

    $user->add_role( 'gf_association_member' );
    update_user_meta( $user_id, 'gf_membership_status', 'active' );
    update_user_meta( $user_id, 'gf_membership_date', current_time( 'Y-m-d' ) );

    // Generate sequential member number if not already set
    if ( ! get_user_meta( $user_id, 'gf_member_number', true ) ) {
        $last   = (int) get_option( 'gf_last_member_number', 0 );
        $next   = $last + 1;
        update_option( 'gf_last_member_number', $next, false );
        update_user_meta( $user_id, 'gf_member_number', 'GF-' . str_pad( $next, 4, '0', STR_PAD_LEFT ) );
    }
} );
```

---

## 9. ACF Field Groups — Import vs. Register

```php
// ✅ CORRECT: acf_import_field_group() writes to DB
// Fields persist across requests. Other scripts can use update_field() on these keys.
$field_group = [
    'key'      => 'group_gf_member',
    'title'    => 'Gull Force Member',
    'fields'   => [
        [
            'key'   => 'field_gf_service_number',
            'label' => 'Service Number',
            'name'  => 'service_number',
            'type'  => 'text',
        ],
    ],
    'location' => [ [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'gf_member' ] ] ],
];
acf_import_field_group( $field_group );

// ❌ WRONG: acf_add_local_field_group() is runtime-only
// Fields exist only during the current PHP request.
// update_field() in any separate script will fail silently.
acf_add_local_field_group( $field_group ); // DO NOT USE for persistent data
```

**Reading ACF fields after import:**
```php
$value = get_field( 'service_number', $post_id );   // ACF helper
$value = get_post_meta( $post_id, 'service_number', true );  // raw WP (same result)
```

**Relationship fields** (ACF stores as serialised array of post IDs):
```php
// Read
$related_ids = get_field( 'tagged_members', $attachment_id ); // returns array of WP_Post

// Reverse lookup (find attachments that tag a given member ID)
global $wpdb;
$results = $wpdb->get_col( $wpdb->prepare(
    "SELECT post_id FROM {$wpdb->postmeta}
     WHERE meta_key = 'gf_tagged_members'
     AND meta_value LIKE %s",
    '%"' . $member_id . '"%'
) );
```

---

## 10. WordPress Attachments — Programmatic Import

```php
function gf_import_media( string $abs_path, string $title, string $relative_upload_path ): int {
    // Check for existing attachment (idempotency)
    $existing = get_posts( [
        'post_type'   => 'attachment',
        'post_status' => 'any',
        'meta_key'    => '_wp_attached_file',
        'meta_value'  => $relative_upload_path,
        'numberposts' => 1,
    ] );
    if ( ! empty( $existing ) ) {
        return $existing[0]->ID;
    }

    // Ensure upload dir exists
    wp_mkdir_p( dirname( $abs_path ) );

    $attachment = [
        'post_title'     => $title,
        'post_mime_type' => wp_check_filetype( $abs_path )['type'],
        'post_status'    => 'inherit',
    ];
    $attachment_id = wp_insert_attachment( $attachment, $abs_path );
    if ( is_wp_error( $attachment_id ) ) {
        WP_CLI::warning( "Failed: {$title} — " . $attachment_id->get_error_message() );
        return 0;
    }

    // Generate metadata (thumbnails etc.)
    require_once ABSPATH . 'wp-admin/includes/image.php';
    wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, $abs_path ) );

    return $attachment_id;
}
```

---

## 11. wp_insert_user — Email Collision Guard

`wp_insert_user()` returns `WP_Error( 'existing_user_email' )` if the email
already exists. Always check first:

```php
function gf_upsert_user( string $email, array $user_data ): int {
    $existing = get_user_by( 'email', $email );
    if ( $existing ) {
        // Update existing user
        $user_data['ID'] = $existing->ID;
        wp_update_user( $user_data );
        return $existing->ID;
    }
    $user_id = wp_insert_user( $user_data );
    if ( is_wp_error( $user_id ) ) {
        WP_CLI::warning( "User insert failed ({$email}): " . $user_id->get_error_message() );
        return 0;
    }
    return $user_id;
}
```

---

## 12. Custom Login URL Filter

Redirect `wp_login_url()` to a branded page without breaking `/wp-login.php`
itself (WP Admin still works):

```php
add_filter( 'login_url', function ( string $login_url, string $redirect, bool $force_reauth ): string {
    $custom = home_url( '/member-login/' );
    if ( $redirect ) {
        $custom = add_query_arg( 'redirect_to', rawurlencode( $redirect ), $custom );
    }
    return $custom;
}, 10, 3 );
```

---

## 13. SiteGround SSH & Deployment

```bash
# SSH connection
ssh -i ~/.ssh/siteground_gullforce -p 18765 u2316-1fi6cxp40agu@ssh.jacksont.sg-host.com

# WP root (all WP-CLI commands need this --path)
WP_ROOT=/home/u2316-1fi6cxp40agu/www/jacksont.sg-host.com/public_html

# Copy script to server
scp -i ~/.ssh/siteground_gullforce -P 18765 scripts/my-script.php \
  u2316-1fi6cxp40agu@ssh.jacksont.sg-host.com:${WP_ROOT}/wp-content/scripts/

# Run it
ssh -i ~/.ssh/siteground_gullforce -p 18765 u2316-1fi6cxp40agu@ssh.jacksont.sg-host.com \
  "wp eval-file ${WP_ROOT}/wp-content/scripts/my-script.php --path=${WP_ROOT}"

# Rsync media directory (exclude pilgrimages — 3.3GB)
rsync -avz --progress \
  -e "ssh -i ~/.ssh/siteground_gullforce -p 18765" \
  --exclude='gull-force/pilgrimages/' \
  web/wp-content/uploads/ \
  u2316-1fi6cxp40agu@ssh.jacksont.sg-host.com:${WP_ROOT}/wp-content/uploads/

# After All-in-One WP Migration import — DELETE storage dir to reclaim disk
ssh -i ~/.ssh/siteground_gullforce -p 18765 u2316-1fi6cxp40agu@ssh.jacksont.sg-host.com \
  "rm -rf ${WP_ROOT}/wp-content/plugins/all-in-one-wp-migration/storage/"
```

---

## 14. Common Gotchas

| Gotcha | Fix |
|--------|-----|
| `update_post_meta()` corrupts JSON | Wrap value in `wp_slash( wp_json_encode( $data ) )` |
| `_elementor_page_settings` (Kit) | Store as PHP array — no JSON encoding |
| `acf_add_local_field_group()` only lasts one request | Use `acf_import_field_group()` instead |
| `wp eval` breaks on ChromeOS/DDEV | Use `wp eval-file scripts/foo.php` always |
| `wp_insert_user()` fails silently on dupe email | Always `get_user_by('email', ...)` first |
| WooCommerce `on-hold` hook for PayPal | PayPal skips `on-hold` → goes straight to `completed`. Guard BACS logic with `$order->get_payment_method() === 'bacs'` |
| Elementor page not showing builder output | Ensure `_elementor_edit_mode` = `'builder'` is set on the post |
| All-in-One WP Migration leaves full `.wpress` backup in plugin storage | Delete `wp-content/plugins/all-in-one-wp-migration/storage/` after each import |
| Elementor CSS not reflecting kit changes | Call `\Elementor\Plugin::$instance->files_manager->clear_cache()` after any kit update |
| Self-hosted fonts not overriding Elementor CDN load | Use `add_filter('elementor/frontend/print_google_fonts', '__return_false')` |

---

## References

- Elementor developer docs: <https://developers.elementor.com/docs/>
- WordPress Plugin Handbook: <https://developer.wordpress.org/plugins/>
- WooCommerce hooks: <https://woocommerce.com/document/woocommerce-hooks/>
- Gull Force project notes: `docs/sessions/` in ECC repo
- Gull Force WP repo: `/home/jtaylor/gull-force-wp` (jtaylorcomplize/gull-force-wp)
