# Gull Force — Nominal Roll PDF Extraction & Comprehensive Veterans Database

**Date:** 2026-02-28
**Repo:** jtaylorcomplize/gull-force-wp (master)
**Commit:** (see below)

---

## Session Goals

1. Extract the Gull Force Nominal Roll from PDF → CSV
2. Cross-check nominal roll against the existing 362-member WP database
3. Correct service number errors in WP
4. Import all missing records to achieve a comprehensive veterans database

All four goals delivered.

---

## Part 1 — PDF Extraction

### Source

`https://gullforce.org.au/Gull%20Force%20-%20Nominal%20Roll..pdf`
Downloaded to `/tmp/gullforce-nominal-roll.pdf` (611 KB)

### Extraction Approach

```bash
sudo apt-get install -y poppler-utils
pdftotext -layout /tmp/gullforce-nominal-roll.pdf /tmp/gullforce-nominal-roll.txt
# → 18,047 lines
```

The `-layout` flag preserves column positioning with spaces. This is critical because:
- **Rank / name / service number** lines are visually centred (deep indent, ~14–26 leading spaces)
- **Field label** lines start near the left margin
- **Continuation lines** (multiline posting, WW2 honours) are indented to align with the value column (~20+ leading spaces)

### Parser Design (`/tmp/parse_nominal_roll.py`)

State machine with 4 states: `LOOKING → GOT_RANK → GOT_NAME → READING`

**Key priority order** (rank check MUST precede continuation check):
1. Known field label match
2. Known rank match → save current record, start new
3. Continuation line (≥20 leading spaces + active field) → append to current field
4. Service number regex match
5. Name line (in GOT_RANK state)
6. Second name line (in GOT_NAME state — override with last, handles "LES PRIVATE" alias noise)
7. Name with no preceding rank (PDF anomaly — start record without rank)

**Critical bug fixed:** Original code checked continuation before rank. Rank lines have ~20+ leading spaces and were being swallowed as continuations of the previous field. Moving rank check to priority 2 fixed 1,180+ records.

### Field coverage

| Field | Notes |
|---|---|
| rank | 19 distinct values incl. Acting Lance Sergeant, Chaplain |
| name | Last word = surname; remainder = given names |
| service_number | Prefixes: VX, NX, QX, WX, NGX, DX, Q; 2–8 digits |
| service | "AUSTRALIAN ARMY" for all |
| date_of_birth | Free text, e.g. "26 DECEMBER 1918" |
| place_of_birth | City, state/country |
| date_of_enlistment | Free text |
| locality_on_enlistment | |
| place_of_enlistment | |
| next_of_kin | "SURNAME, FIRSTNAME" format |
| date_of_death | Wartime death date (not post-war) |
| date_of_discharge | Civilians who survived |
| posting_on_death | Can span 2 lines (continuation) |
| posting_at_discharge | Can span 2 lines |
| prisoner_of_war | See normalisation below |
| also_known_as | |
| additional_service_numbers | Some have 2–3 (colon-joined or separate label) |
| ww2_honours | Can span 2 lines |

### Edge cases handled

| Case | Fix |
|---|---|
| `VX29415 THIS IT` — noise after service number | Extract first token matching regex |
| `NX42030:N27594` — colon-joined double svc | Split on colon, primary + additional |
| `ACTING LANCE SERGEANT`, `CHAPLAIN` | Added to RANKS set |
| `LES PRIVATE` then `WILLIAM ERNEST HODGEN` | Two name lines → override with last |
| `NGX95`, `NGX97` — 2-digit numbers | Changed `\d{3,8}` to `\d{2,8}` |
| `ALBERT CHARLES WEGNER` — no rank line | Detect name-like string in READING state, start new record |
| Clark, Horace — 3 service numbers (colon + label) | Concatenate with ", " separator |
| `POSTING O N DEATH` — typo in source | Added as alias to POSTING ON DEATH |

### prisoner_of_war normalisation

| Raw | Normalised |
|---|---|
| `AMBON/` (14 records) | `AMBON/?HAINAN` |
| `ESCAPED BEFORE CAPTUE` | `ESCAPED BEFORE CAPTURE` (typo fix) |
| `LAHA AMBON` (3) | `LAHA/AMBON` |
| `AMBON - ESCAPED` | `AMBON/ESCAPED` |
| YES / NO / KILLED IN ACTION | left as-is |

### Output

`scripts/gullforce-nominal-roll.csv` — **1,189 records**, 18 columns
- 798 with `date_of_death` (died in service)
- 393 with `date_of_discharge` (survived)
- 9 WW2 honours citations

---

## Part 2 — Cross-Check vs WP Database

### Method

Exported all `gf_member` posts (362) with `service_number` via SQL, normalised both sets (strip spaces, uppercase), compared.

**Initial match:** 349 / 361 (service numbers present)

**12 mismatches found** — all service number data errors in WP:

| WP entry | WP svc# | Correct svc# | Error type |
|---|---|---|---|
| Hillian, Samuel | NX 73045 | NX 7305 | Spurious digit |
| Green, Ronald | VX 20212 3/37685 | VX 20212 | Format noise |
| Williamson, George | VX 23346 | VX 23336 | Transposition |
| Howard, Roy | VX 27007 | VX 27067 | Transposition |
| Dihood, Fred | VX 32413 | VX 32431 | Transposition |
| Larkin, Barnet | VX 37340 | VX 37430 | Transposition |
| Braeter, Henry | VX 39732 | VX 39738 | Digit error |
| Russell, George | VX 40435 | VX 46435 | Digit error |
| Purvis, Henry | VX 41310 | NX 41310 | Wrong state prefix |
| Porter, Barney | VX 43456 | VX 700324 | Wrong number entirely |
| Adamson, Ken | VX 9564 | WX 9564 | Wrong state prefix |
| Wills, Milton | VX 57981 | — | Not in nominal roll (unresolved) |

Corrections applied via `scripts/fix-service-numbers.php`.

**After corrections:** 360 matched, 1 unresolved (Wills, Milton).

---

## Part 3 — Import 829 Missing Records

### Mapping: prisoner_of_war → war_history

| NR `prisoner_of_war` | WP `war_history` |
|---|---|
| AMBON | Ambon |
| LAHA | Laha *(new value)* |
| LAHA/AMBON | Laha |
| AMBON/HAINAN | Hainan |
| AMBON/?HAINAN | Hainan |
| ESCAPED BEFORE CAPTURE | Escaped |
| AMBON/ESCAPED | Escaped |
| KILLED IN ACTION / NO / YES | *(blank)* |
| *(blank)* | Unknown |

**Note:** `Laha` is a new `war_history` value. Any filter UI enumerating `war_history` options needs updating.

### Name parsing

Nominal roll format: `HAROLD GEORGE ADAMS`
WP title format: `Adams, Harold George`

Algorithm: last word = surname, rest = given names. Title-cased with space/hyphen preservation.

**Bug fixed:** Initial `nr_title_case()` regex consumed the space separator but didn't replace it (`" george"` → `"George"`, dropping the space). Fixed by capturing separator group separately and prepending it in replacement.

### Import script

`scripts/import-nominal-roll.php` — idempotent (skips existing service numbers)

Fields written per post:
- `service_number` (formatted: `VX 52771`)
- `member_surname`, `member_given_names`, `member_initials`
- `member_rank`
- `war_history`
- `member_unit` (from posting_on_death or posting_at_discharge)
- `date_of_death` (wartime — distinct from post-war civilian death in existing records)
- `source = nominal_roll` (provenance tag)

Name fix applied separately via `scripts/fix-nominal-roll-names.php`.

### Result

| | Count |
|---|---|
| Pre-import `gf_member` posts | 362 |
| Imported from nominal roll | 829 |
| **Total** | **1,191** |

Final `war_history` distribution:

| value | count |
|---|---|
| Ambon | 529 |
| Laha | 293 |
| Hainan | 270 |
| Escaped | 40 |
| Unknown | 35 |
| Escaped (uncertain) | 11 |
| Returned to Australia | 4 |

---

## Files Added

| File | Purpose |
|---|---|
| `scripts/gullforce-nominal-roll.csv` | Extracted nominal roll — 1,189 records |
| `scripts/fix-service-numbers.php` | One-time WP service number corrections |
| `scripts/fix-nominal-roll-names.php` | One-time title-case name fix |
| `scripts/import-nominal-roll.php` | Idempotent nominal roll importer |

---

## Follow-up Items

- **Wills, Milton (VX 57981)** — in WP association database but not in nominal roll. Needs manual verification.
- **`Laha` war_history value** — new; check any shortcode filter UIs that enumerate war_history options.
- **`date_of_death` field semantics** — for association member records this is post-war civilian death; for nominal_roll records it is wartime death. Consider adding a separate `date_of_death_wartime` field in future to disambiguate.
- **member_unit values** — imported from posting text (e.g. "2/21 AUSTRALIAN INFANTRY BATTALION"). Existing association records use abbreviated forms ("2/21 Bn"). No normalisation applied — may want to standardise.
