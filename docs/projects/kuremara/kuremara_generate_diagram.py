"""
Kuremara Care Pty Ltd — NDIS Self-Funding Growth Model Diagram
A3 landscape, 300dpi PNG + PDF export
"""

from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas as rl_canvas
import os

# ---------------------------------------------------------------------------
# Canvas setup
# ---------------------------------------------------------------------------

DPI = 300
MM_TO_PX = DPI / 25.4


def px(mm):
    """Convert mm to pixels."""
    return int(mm * MM_TO_PX)


# A3 landscape: 420 x 297 mm
W_MM, H_MM = 420, 297
W = px(W_MM)   # 4960 px
H = px(H_MM)   # 3507 px

MARGIN = px(20)  # 20mm margins all sides

# Verify layout fits before we start
_s = px(22) + px(46) + px(41) + px(80) + px(48)
_g = 4 * px(3)
_f = px(6)
assert MARGIN + _s + _g + _f + MARGIN <= H, "Layout overflow"

# ---------------------------------------------------------------------------
# Colour palette
# ---------------------------------------------------------------------------

BG          = (13, 27, 42)
CARD_BG     = (22, 32, 48)
TEAL        = (0, 180, 166)
GOLD        = (232, 197, 71)
WHITE       = (245, 245, 240)
MUTED       = (136, 153, 170)
DARK_TEAL   = (0, 80, 74)
ROW_ALT     = (17, 27, 40)
BORDER      = (0, 50, 46)

# ---------------------------------------------------------------------------
# Font loader
# ---------------------------------------------------------------------------

FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")


def load_font(name, size_mm):
    path = os.path.join(FONT_DIR, name)
    try:
        return ImageFont.truetype(path, px(size_mm))
    except Exception:
        return ImageFont.load_default()


F = {
    "display_xl":    load_font("PlayfairDisplay-Bold.ttf",    8.0),
    "display_sm":    load_font("PlayfairDisplay-Regular.ttf", 2.3),
    "mono_lg":       load_font("IBMPlexMono-Bold.ttf",        5.8),
    "mono_md":       load_font("IBMPlexMono-Bold.ttf",        3.2),
    "mono_sm":       load_font("IBMPlexMono-Regular.ttf",     2.1),
    "mono_xs":       load_font("IBMPlexMono-Regular.ttf",     1.75),
    "sans_md":       load_font("IBMPlexSans-Regular.ttf",     2.1),
    "sans_sm":       load_font("IBMPlexSans-Regular.ttf",     1.75),
    "sans_bold_sm":  load_font("IBMPlexSans-Bold.ttf",        1.85),
    "sans_light_sm": load_font("IBMPlexSans-Light.ttf",       1.75),
    "sans_xs":       load_font("IBMPlexSans-Regular.ttf",     1.5),
}

# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)


def text_sz(text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def tw(text, font):
    return text_sz(text, font)[0]


def th(text, font):
    return text_sz(text, font)[1]


def draw_text(x, y, text, font, color=WHITE, anchor="lt"):
    w, h = text_sz(text, font)
    if anchor in ("ct", "cm"):
        x = x - w // 2
    elif anchor == "rt":
        x = x - w
    if anchor in ("lm", "cm"):
        y = y - h // 2
    draw.text((x, y), text, font=font, fill=color)


def rr(x, y, x2, y2, fill=None, outline=None, outline_w=2, radius=0):
    if fill:
        draw.rounded_rectangle([x, y, x2, y2], radius=radius, fill=fill)
    if outline:
        draw.rounded_rectangle([x, y, x2, y2], radius=radius, outline=outline, width=outline_w)


def hline(x1, x2, y, color=BORDER, width=2):
    draw.line([(x1, y), (x2, y)], fill=color, width=width)


def vline(x, y1, y2, color=BORDER, width=2):
    draw.line([(x, y1), (x, y2)], fill=color, width=width)


def arrow(x1, y, x2, color=TEAL, hs=None):
    if hs is None:
        hs = px(2.2)
    draw.line([(x1, y), (x2 - hs, y)], fill=color, width=max(1, px(0.4)))
    draw.polygon([(x2, y), (x2 - hs, y - hs // 2), (x2 - hs, y + hs // 2)], fill=color)


# ---------------------------------------------------------------------------
# Vertical section layout (all in mm → px)
# Total layout height: 22+3+45+3+40+3+78+3+45 + 6footer + 40margins = 288mm < 297mm
# ---------------------------------------------------------------------------

UW = W - 2 * MARGIN   # usable width

S1_Y = MARGIN
S1_H = px(22)    # Header

GAP = px(3)

S2_Y = S1_Y + S1_H + GAP
S2_H = px(46)    # Unit economics cards

S3_Y = S2_Y + S2_H + GAP
S3_H = px(41)    # Flow diagram

S4_Y = S3_Y + S3_H + GAP
S4_H = px(80)    # Cohort table

S5_Y = S4_Y + S4_H + GAP
S5_H = px(48)    # Key callouts

FOOTER_Y = H - MARGIN - px(4)

# ============================================================================
# SECTION 1 — HEADER
# ============================================================================

# Teal top edge rule
draw.rectangle([0, 0, W, px(1.0)], fill=TEAL)

title = "NDIS Self-Funding Growth Model"
draw_text(W // 2, S1_Y + px(3), title, F["display_xl"], WHITE, anchor="ct")

subtitle = "Kuremara Care Pty Ltd  —  Company Specific Labour Agreement"
draw_text(W // 2, S1_Y + px(12.5), subtitle, F["sans_md"], MUTED, anchor="ct")

# Worst-case badge — top right
bt = "Worst Case: Full CSIT  $76,515 p.a."
bw = tw(bt, F["mono_xs"]) + px(5)
bh = px(5)
bx = W - MARGIN - bw
by = S1_Y + px(2)
rr(bx, by, bx + bw, by + bh, fill=(40, 10, 10), outline=(200, 80, 60), outline_w=px(0.3), radius=px(1.2))
draw_text(bx + px(2.5), by + px(1.2), bt, F["mono_xs"], (230, 130, 110))

# Divider
hline(MARGIN, W - MARGIN, S1_Y + S1_H - px(1), DARK_TEAL, width=px(0.3))

# ============================================================================
# SECTION 2 — UNIT ECONOMICS CARDS
# ============================================================================

draw_text(MARGIN, S2_Y + px(1), "UNIT ECONOMICS  ·  PER PERSONAL CARE ASSISTANT (PCA)", F["sans_xs"], MUTED)

CARD_TOP = S2_Y + px(6)
CARD_BOT = S2_Y + S2_H - px(2)
CARD_H   = CARD_BOT - CARD_TOP
CARD_GAP = px(3)
NCARDS   = 4
CARD_W   = (UW - CARD_GAP * (NCARDS - 1)) // NCARDS

cards = [
    {
        "label": "NDIS Billing Rate",
        "sub":   "NDIS PAPL 2025-26",
        "value": "$70.23",
        "unit":  "per hour",
        "accent": TEAL,
        "fg":    WHITE,
    },
    {
        "label": "Annual Revenue Per PCA",
        "sub":   "35 hrs × 50 wks × $70.23",
        "value": "$127,619",
        "unit":  "per year",
        "accent": TEAL,
        "fg":    WHITE,
    },
    {
        "label": "Total Employment Cost",
        "sub":   "Salary + Super + Oncosts",
        "value": "$89,140",
        "unit":  "per year (CSIT full rate)",
        "accent": MUTED,
        "fg":    WHITE,
    },
    {
        "label": "Gross Margin Per PCA",
        "sub":   "30% margin — self-funding",
        "value": "$38,479",
        "unit":  "per year",
        "accent": GOLD,
        "fg":    GOLD,
        "highlight": True,
    },
]

for i, card in enumerate(cards):
    cx  = MARGIN + i * (CARD_W + CARD_GAP)
    cy  = CARD_TOP
    cx2 = cx + CARD_W
    cy2 = CARD_BOT
    hi  = card.get("highlight", False)
    bg  = (28, 38, 18) if hi else CARD_BG
    bo  = GOLD if hi else DARK_TEAL
    bw2 = px(0.5) if hi else px(0.3)

    rr(cx, cy, cx2, cy2, fill=bg, outline=bo, outline_w=bw2, radius=px(2))
    draw.rectangle([cx, cy, cx2, cy + px(0.9)], fill=card["accent"])   # accent bar

    ix = cx + px(4)
    iy = cy + px(4)

    draw_text(ix, iy,           card["label"], F["sans_bold_sm"], card["accent"])
    draw_text(ix, iy + px(6),   card["value"], F["mono_md"],      card["fg"])
    draw_text(ix, iy + px(14),  card["unit"],  F["sans_xs"],      MUTED)
    draw_text(ix, iy + px(19),  card["sub"],   F["sans_xs"],      MUTED)

# ============================================================================
# SECTION 3 — FLOW DIAGRAM
# ============================================================================

draw_text(MARGIN, S3_Y + px(1), "FEE-FOR-SERVICE REVENUE CYCLE", F["sans_xs"], MUTED)

NODE_TOP = S3_Y + px(6)
NODE_H   = px(30)
NODE_MID = NODE_TOP + NODE_H // 2

steps = [
    ("PCA Deployed",     ["NDIS participant",  "approved plan",       "active support"]),
    ("NDIA Pays",        ["Fee-for-service",   "invoiced weekly",     "$70.23/hr guaranteed"]),
    ("Employment Cost",  ["$89,140 total",     "salary + super",      "+ oncosts covered"]),
    ("Surplus Generated",["$38,479 gross",     "margin per PCA",      "per year"]),
    ("Funds Next Cohort",["Surplus reinvested","to sponsor &",        "deploy next 10 PCAs"]),
]

NSTEPS  = len(steps)
ARR_W   = px(5)
STEP_W  = (UW - ARR_W * (NSTEPS - 1)) // NSTEPS

for i, (title, lines) in enumerate(steps):
    sx  = MARGIN + i * (STEP_W + ARR_W)
    sy  = NODE_TOP
    sx2 = sx + STEP_W
    sy2 = sy + NODE_H

    is_last  = (i == NSTEPS - 1)
    is_first = (i == 0)
    bg  = (0, 38, 35) if is_last else CARD_BG
    bo  = TEAL if (is_last or is_first) else DARK_TEAL
    bw2 = px(0.5) if (is_last or is_first) else px(0.3)
    rr(sx, sy, sx2, sy2, fill=bg, outline=bo, outline_w=bw2, radius=px(2))

    # Step number chip
    chip_r = px(2.5)
    chip_cx = sx + px(4) + chip_r
    chip_cy = sy + px(4.5) + chip_r
    chip_c  = TEAL if is_last else DARK_TEAL
    draw.ellipse([chip_cx - chip_r, chip_cy - chip_r,
                  chip_cx + chip_r, chip_cy + chip_r], fill=chip_c)
    ns = str(i + 1)
    draw_text(chip_cx - tw(ns, F["sans_xs"]) // 2,
              chip_cy - th(ns, F["sans_xs"]) // 2,
              ns, F["sans_xs"], WHITE)

    # Title — centred
    tc = TEAL if (is_last or is_first) else WHITE
    draw_text(sx + STEP_W // 2, sy + px(10), title, F["sans_bold_sm"], tc, anchor="ct")

    # Description lines — centred
    for j, line in enumerate(lines):
        draw_text(sx + STEP_W // 2, sy + px(16) + j * px(4.5), line, F["sans_xs"], MUTED, anchor="ct")

    # Arrow
    if i < NSTEPS - 1:
        ax1 = sx2 + px(0.8)
        ax2 = sx2 + ARR_W - px(0.8)
        arrow(ax1, NODE_MID, ax2, TEAL)

# ============================================================================
# SECTION 4 — COHORT GROWTH TABLE
# ============================================================================

draw_text(MARGIN, S4_Y + px(1), "4-YEAR COHORT GROWTH MODEL  ·  10 SPONSORED PCAs PER YEAR", F["sans_xs"], MUTED)

TBL_TOP = S4_Y + px(6)

# Column widths as fractions of UW
COLS = [
    ("Year",            0.07,  "center"),
    ("New Cohort",      0.12,  "center"),
    ("Total Workforce", 0.12,  "center"),
    ("Gross Margin",    0.16,  "right"),
    ("Cohort Cost",     0.14,  "right"),
    ("Annual Surplus",  0.16,  "right"),
    ("Surplus (visual)","0",   "left"),   # remainder
]

# Compute actual pixel x positions
col_xs = []
_x = MARGIN
for j, (_, frac, _) in enumerate(COLS):
    col_xs.append(_x)
    if frac != "0":
        _x += int(UW * float(frac))
    else:
        pass  # bar column fills remainder

BAR_COL_X = col_xs[6]
BAR_MAX_W = (MARGIN + UW) - BAR_COL_X - px(2)

HDR_H = px(8)
ROW_H = px(9)

rows_data = [
    # year     cohort           wf   margin        cost        surplus       val       base   y4
    ("Year 0", "Base (23 AU/PR)","23","$884,817",  "—",        "$884,817",   884817,   True,  False),
    ("Year 1", "+10 sponsored",  "33","$1,269,417","$891,400", "$378,017",   378017,   False, False),
    ("Year 2", "+10 sponsored",  "43","$1,654,017","$891,400", "$762,617",   762617,   False, False),
    ("Year 3", "+10 sponsored",  "53","$2,038,617","$891,400", "$1,147,217", 1147217,  False, False),
    ("Year 4", "+10 sponsored",  "63","$2,423,217","$891,400", "$1,531,817", 1531817,  False, True),
]

MAX_SURPLUS = 1531817

# Header row
draw.rectangle([MARGIN, TBL_TOP, MARGIN + UW, TBL_TOP + HDR_H], fill=(18, 34, 46))
for j, (hdr, frac, align) in enumerate(COLS[:-1]):
    cw = int(UW * float(frac))
    if align == "right":
        hx = col_xs[j] + cw - px(2) - tw(hdr, F["sans_xs"])
    elif align == "center":
        hx = col_xs[j] + (cw - tw(hdr, F["sans_xs"])) // 2
    else:
        hx = col_xs[j] + px(2)
    draw_text(hx, TBL_TOP + px(1.8), hdr, F["sans_xs"], TEAL)

bar_hdr = "ANNUAL SURPLUS"
draw_text(BAR_COL_X + px(2), TBL_TOP + px(1.8), bar_hdr, F["sans_xs"], TEAL)
hline(MARGIN, MARGIN + UW, TBL_TOP + HDR_H, DARK_TEAL, width=px(0.4))

for ri, row in enumerate(rows_data):
    year, cohort, wf, margin, cost, surplus, sval, is_base, is_y4 = row
    ry = TBL_TOP + HDR_H + ri * ROW_H

    if is_base:
        row_bg = (28, 26, 8)
        boc    = GOLD
    elif is_y4:
        row_bg = (0, 26, 24)
        boc    = TEAL
    elif ri % 2 == 0:
        row_bg = ROW_ALT
        boc    = None
    else:
        row_bg = CARD_BG
        boc    = None

    draw.rectangle([MARGIN, ry, MARGIN + UW, ry + ROW_H], fill=row_bg)
    if boc:
        draw.rectangle([MARGIN, ry, MARGIN + UW, ry + ROW_H], outline=boc, width=max(1, px(0.18)))

    cell_vals   = [year, cohort, wf, margin, cost, surplus]
    cell_colors = [WHITE, MUTED, WHITE, WHITE, MUTED,
                   GOLD if is_base else (TEAL if is_y4 else WHITE)]

    for j, (val, cc) in enumerate(zip(cell_vals, cell_colors)):
        cw    = int(UW * float(COLS[j][1]))
        align = COLS[j][2]
        font  = F["mono_sm"] if j >= 3 else F["sans_sm"]
        if align == "right":
            vx = col_xs[j] + cw - px(2) - tw(val, font)
        elif align == "center":
            vx = col_xs[j] + (cw - tw(val, font)) // 2
        else:
            vx = col_xs[j] + px(2)
        vy = ry + (ROW_H - th(val, font)) // 2
        draw_text(vx, vy, val, font, cc)

    # Horizontal bar
    bar_frac = sval / MAX_SURPLUS
    bar_w    = int(BAR_MAX_W * bar_frac)
    bar_c    = GOLD if is_base else ((0, 180, 166) if is_y4 else (0, 130, 122))
    bar_h    = ROW_H - px(2)
    bar_y    = ry + (ROW_H - bar_h) // 2
    if bar_w > 0:
        draw.rounded_rectangle(
            [BAR_COL_X + px(2), bar_y, BAR_COL_X + px(2) + bar_w, bar_y + bar_h],
            radius=px(0.6), fill=bar_c
        )
    # Value label: after bar if space allows, otherwise inside bar right-aligned
    lbl_w  = tw(surplus, F["mono_xs"])
    right_edge = MARGIN + UW
    after_x = BAR_COL_X + px(2) + bar_w + px(2)
    bl_y = ry + (ROW_H - th(surplus, F["mono_xs"])) // 2
    if after_x + lbl_w <= right_edge - px(1):
        draw_text(after_x, bl_y, surplus, F["mono_xs"], MUTED)
    else:
        # Inside bar, right-aligned, dark text for legibility on coloured bar
        inside_x = BAR_COL_X + px(2) + bar_w - lbl_w - px(2)
        draw_text(inside_x, bl_y, surplus, F["mono_xs"], BG)

    hline(MARGIN, MARGIN + UW, ry + ROW_H, BORDER, width=px(0.15))

# Column dividers
for j in range(1, 7):
    vline(col_xs[j], TBL_TOP, TBL_TOP + HDR_H + ROW_H * len(rows_data), BORDER, width=px(0.15))

# Outer border
draw.rectangle([MARGIN, TBL_TOP, MARGIN + UW, TBL_TOP + HDR_H + ROW_H * len(rows_data)],
               outline=DARK_TEAL, width=px(0.3))

# Footnote
fn_y = TBL_TOP + HDR_H + ROW_H * len(rows_data) + px(1.5)
fn = "Cohort cost: 10 workers × ($76,515 + $8,799 + $3,826) + ($10,000 sponsorship ÷ 4 yrs amortised) = $891,400/yr"
draw_text(MARGIN, fn_y, fn, F["sans_xs"], MUTED)

# ============================================================================
# SECTION 5 — THREE KEY CALLOUTS
# ============================================================================

draw_text(MARGIN, S5_Y + px(1), "KEY FINANCIAL INDICATORS", F["sans_xs"], MUTED)

C_TOP = S5_Y + px(6)
C_BOT = S5_Y + S5_H - px(2)
C_H   = C_BOT - C_TOP
C_GAP = px(4)
C_W   = (UW - C_GAP * 2) // 3

callouts = [
    {
        "value":  "3.8×",
        "label":  "Sponsorship Coverage Ratio",
        "detail": [
            "Year 1 gross margin ($38,479) exceeds",
            "the estimated 4-year sponsorship cost",
            "($10,000) within 3.1 months of deployment.",
        ],
        "accent": TEAL,
        "bg":     CARD_BG,
    },
    {
        "value":  "$0",
        "label":  "Capital Injection Required",
        "detail": [
            "Existing 23 AU/PR PCAs generate $884,817",
            "gross margin — fully covering all new",
            "cohort employment costs. No external capital.",
        ],
        "accent": GOLD,
        "bg":     (28, 26, 8),
    },
    {
        "value":  "$1.53M",
        "label":  "Annual Surplus by Year 4",
        "detail": [
            "63 total PCAs (23 existing + 40 sponsored):",
            "$2,423,217 gross margin minus $891,400",
            "cohort costs = $1,531,817 net annual surplus.",
        ],
        "accent": TEAL,
        "bg":     CARD_BG,
    },
]

for i, co in enumerate(callouts):
    cx  = MARGIN + i * (C_W + C_GAP)
    cy  = C_TOP
    cx2 = cx + C_W
    cy2 = C_BOT

    rr(cx, cy, cx2, cy2, fill=co["bg"], outline=co["accent"], outline_w=px(0.5), radius=px(2))
    draw.rectangle([cx, cy, cx2, cy + px(1.2)], fill=co["accent"])

    ctr = cx + C_W // 2

    # Large value
    vfont = F["mono_lg"]
    draw_text(ctr, cy + px(5), co["value"], vfont, co["accent"], anchor="ct")

    # Label
    draw_text(ctr, cy + px(18), co["label"], F["display_sm"], WHITE, anchor="ct")

    # Detail lines
    for di, line in enumerate(co["detail"]):
        draw_text(ctr, cy + px(24) + di * px(4.5), line, F["sans_xs"], MUTED, anchor="ct")

# ============================================================================
# FOOTER
# ============================================================================

hline(MARGIN, W - MARGIN, FOOTER_Y - px(2.5), DARK_TEAL, width=px(0.3))

footer = (
    "Roam Migration Law  LPN 5511086   |   Application ID: 1660698806   |   "
    "NDIS PAPL 2025-26   |   All figures verified.   Worst-case: Full CSIT $76,515 p.a. applied throughout."
)
fw_ = tw(footer, F["sans_xs"])
draw_text(W // 2 - fw_ // 2, FOOTER_Y, footer, F["sans_xs"], MUTED)

# ============================================================================
# EXPORT
# ============================================================================

out_dir = os.path.dirname(__file__)
png_path = os.path.join(out_dir, "kuremara_ndis_model_diagram.png")
pdf_path = os.path.join(out_dir, "kuremara_ndis_model_diagram.pdf")

img.save(png_path, dpi=(DPI, DPI), quality=95)
print(f"PNG saved: {png_path}  ({W}x{H} px)")

# PDF — embed PNG at exact A3 landscape dimensions (points)
A3_W_PT = W_MM / 25.4 * 72
A3_H_PT = H_MM / 25.4 * 72
c = rl_canvas.Canvas(pdf_path, pagesize=(A3_W_PT, A3_H_PT))
c.drawImage(png_path, 0, 0, width=A3_W_PT, height=A3_H_PT)
c.save()
print(f"PDF saved: {pdf_path}")
print("Done.")
