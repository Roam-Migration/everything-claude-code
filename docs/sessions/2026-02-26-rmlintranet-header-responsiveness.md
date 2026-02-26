# RML Intranet Header Responsiveness Fix

**Date:** 2026-02-26
**Branch:** troubleshoot/notion-integration
**File:** `/tmp/Rmlintranetdesign/src/app/components/Header.tsx`

## Problems Addressed

1. Header content overflowing off-screen at sub-full-window widths
2. Search and avatar overlapping nav links at intermediate viewport sizes
3. Hamburger menu not showing user avatar
4. Hamburger menu not including search
5. Logo was plain text — replace with brand image

## Root Causes

### Overlap: `flex-1 justify-center` + `whitespace-nowrap` overflow
The nav used `flex-1 justify-center`, giving it an oversized flex container.
Nav items had `whitespace-nowrap` and don't shrink themselves.
When the overall row became tight, items overflowed the nav container boundary
and visually collided with the search/avatar buttons in the adjacent flex item.

**Fix:** Replace `flex-1 justify-center` on the nav with a `<div className="flex-1" />`
spacer placed *after* the nav. The spacer absorbs remaining space; the nav stays
naturally sized to its content and can never overflow into adjacent elements.

### Avatar/search invisible on mobile
Search and `<UserDropdown />` were inside `hidden md:flex`, so they disappeared
below the `md` (768px) breakpoint. The hamburger button was the only thing visible.

**Fix:** Moved search and `<UserDropdown />` outside the conditional wrapper into
an always-visible right section. The hamburger toggle sits alongside them.

### Breakpoint too early (md = 768px)
A half-window on a 1440px display is 720px — below `md`, so hamburger correctly
showed. But on larger monitors (1920px+) at half-window (960px), the desktop nav
was forced to display in a cramped 960px container.

**Fix:** Moved desktop nav threshold from `md` (768px) to `lg` (1024px).

## Changes Made

| Before | After |
|---|---|
| `px-8` rigid padding | `px-4 sm:px-6 lg:px-8` responsive padding |
| `hidden md:flex` desktop nav | `hidden lg:flex` desktop nav |
| `flex-1 justify-center` on nav | Natural flow nav + `flex-1` spacer div after it |
| `hidden md:flex` wrapping search+avatar | Both always rendered, `flex-shrink-0` |
| `md:hidden` hamburger | `lg:hidden` hamburger, styled consistently |
| Text logo (`siteConfig.branding.companyName`) | `<img src="/logo.png" alt="..." className="h-9 w-auto" />` |
| Mobile menu: nav links only | Nav links + search button at bottom |

## Logo

- Source: `/home/jtaylor/everything-claude-code/docs/logo.png`
- Copied to: `/tmp/Rmlintranetdesign/public/logo.png` (served as `/logo.png`)
- Sizing: `h-9 w-auto` (36px tall, proportional width) within 70px header

## Pattern to Reuse

When building a header with logo / nav / actions:
- Use `flex-shrink-0` on logo and action group
- Let nav items flow naturally (no `flex-1` on nav itself)
- Use a `<div className="flex-1" />` spacer between nav and right actions
- Add `whitespace-nowrap` to nav items to prevent mid-word wrapping
- Keep user avatar + key actions (search) outside any responsive hide wrapper

## Deployments

- Build 1: `c9071d3e` — initial responsive fix (avatar still missing from mobile)
- Build 2: `b578421b` — logo image + overlap fix + search in mobile menu
- Service: `rml-intranet`, region `us-central1`, project `rmlintranet`
