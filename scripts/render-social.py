#!/usr/bin/env python3
"""Render Checked Lab social cards for November 2026.

Source of truth for the comparison covers and Shorts that were using a
lookalike photo. A product photo is allowed only when it is the exact model.
These posts do not have an exact licensed photo for every model they name, so
the frames are typographic cards. Spec lines are copied from products.json
and, for AirPods Pro 2, from the guest block in data/compares.json.

Photo decisions recorded here:

- Sony / Bose. The cover credited Aleksandar Spasojevic on Pexels (wired
  headphones). products.json marks the Sony file Headphones_1.jpg as
  imageMatch "generic" and the Bose file as QuietComfort 35 II, imageMatch
  "related". Neither is the model in the post.
- Dyson. The cover credited Vedat Öncelik on Pexels, which data/photos.json
  files as cat-stick.webp, "Cordless stick vacuum category"
  (pexels.com/photo/12167650/). That is not a V15 Detect or a V8. The V15
  product image is a V10 (imageMatch "same_line").
- Levoit / Winix. The cover credited Cats Coming on Pexels, a category
  purifier. Winix 5500-2 has an exact Commons photo, and the Levoit file is a
  Core 300 (imageMatch "same_line"). One exact photo cannot stand in for both.
- Litter-Robot / ScoopFree. The cover is a dog (Amar Preciado on Pexels).
  Neither product image is an exact model photo.
- AirPods. The credit matches File:Airpods_Modell_Pro_3.jpg. The Commons
  description of that file is "Airpods Pro 1, 2, und 3 ohne und mit Case":
  one comparison of three generations, not a labeled photo of a single
  generation. The crop does not say which pair it is, so it is not kept.
- Recall steps. Kindel Media's robot vacuum is the category photo
  cat-robot.webp, not a named model. The shopping-bag cover is a person, not
  a product. The cover is the headline only. The three steps are on the
  steps slide, and the Short shows that list once.

Week 3 (cards 08-13, one Short each, captions-week3.md) is typographic for
the same reason. Dyson V8 and the KitchenAid Artisan have an exact licensed
photo. The other model in each of those pairs does not, so a photo is not
used. Every number is copied from that compare page's HTML table.

The site build does not run this script. A normal `node scripts/build.mjs`
leaves /social untouched. Regenerate with:

    RENDER_SOCIAL=1 node scripts/build.mjs

Week 3 only, without rewriting the earlier cards:

    SOCIAL_WEEK=3 python3 scripts/render-social.py
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOCIAL = ROOT / "social"
FONT_SRC = ROOT / "assets" / "fonts"
W, H_IG, H_SHORT = 1080, 1350, 1920

BG = (247, 242, 234)
INK = (30, 27, 23)
MUTED = (94, 92, 87)
GREEN = (31, 116, 93)
HAIR = (228, 226, 220)
CARD = (255, 255, 255)
PILL = (232, 241, 234)

BAN = re.compile(
    r"not a verdict|catalogue check|stay(?:s)? off (?:this|the) table|"
    r"maker specs|we didn't test|we did not test|MAKER SPECS|"
    r"\bwe tested\b|\bverdict\b|\bcatalogue\b|\bmaker lines\b|\$\d",
    re.I,
)

# Same order as productType() in assets/card.js for the models these posts name.
TYPE_RULES = [
    (re.compile(r"air purifier|core 600|5500-2|hpa300", re.I), "Air purifier"),
    (re.compile(r"vacuum", re.I), "Cordless vacuum"),
    (re.compile(r"headphone|airpod|bose|wh-1000", re.I), "Headphones"),
    (re.compile(r"blender|vitamix", re.I), "Blender"),
    (re.compile(r"litter", re.I), "Litter box"),
    (re.compile(r"stand mixer|kitchenaid|artisan", re.I), "Stand mixer"),
    (re.compile(r"rice cooker|zojirushi", re.I), "Rice cooker"),
    (re.compile(r"fry pan|all-clad|allclad", re.I), "Fry pan"),
    (re.compile(r"heater|mh9bx|mh18b", re.I), "Heater"),
]


def product_type(entity):
    text = " ".join(str(entity.get(key) or "") for key in ("title", "id"))
    for rule, label in TYPE_RULES:
        if rule.search(text):
            return label
    raise SystemExit("No product type for " + str(entity.get("id") or entity.get("title")))


def load_entities():
    products = json.loads((ROOT / "products.json").read_text())
    compares = json.loads((ROOT / "data" / "compares.json").read_text())
    by_id = {item["id"]: item for item in products}
    for entry in compares:
        for guest in entry.get("guests") or []:
            by_id.setdefault(guest["id"], guest)
    return by_id


def spec_value(entity, label):
    for spec in entity.get("specs") or []:
        if spec.get("label") == label and spec.get("value"):
            return spec["value"]
    raise SystemExit(entity.get("id", "?") + " has no spec " + label)


def model_name(entity, override):
    if entity.get("model"):
        return entity["model"]
    title = entity.get("title") or ""
    if not override or override not in title:
        raise SystemExit("Model name is not in the title for " + str(entity.get("id")))
    return override


class Fonts:
    def __init__(self):
        self.dir = Path(tempfile.mkdtemp(prefix="checkedlab-fonts-"))
        self.news_path = self._ttf("newsreader-latin.woff2")
        self.sans_path = self._ttf("source-sans-3-latin.woff2")
        self._cache = {}

    def _ttf(self, name):
        dest = self.dir / name.replace(".woff2", ".ttf")
        font = TTFont(FONT_SRC / name)
        font.flavor = None
        font.save(str(dest))
        return dest

    def news(self, size, weight=560):
        opsz = max(6, min(72, float(size)))
        return self._font(self.news_path, size, [float(weight), opsz])

    def sans(self, size, weight=480):
        return self._font(self.sans_path, size, [float(weight)])

    def _font(self, path, size, axes):
        key = (str(path), size, tuple(axes))
        if key not in self._cache:
            font = ImageFont.truetype(str(path), size)
            font.set_variation_by_axes(axes)
            self._cache[key] = font
        return self._cache[key]


def wrap(text, font, width):
    words = text.split()
    lines, cur = [], ""
    for word in words:
        trial = (cur + " " + word).strip()
        if font.getlength(trial) <= width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    if len(lines) >= 2 and font.getlength(lines[-1]) < width * 0.22:
        prev = lines[-2].split()
        if len(prev) >= 2:
            moved = prev[-1] + " " + lines[-1]
            kept = " ".join(prev[:-1])
            if font.getlength(moved) <= width and font.getlength(kept) >= width * 0.35:
                lines[-2] = kept
                lines[-1] = moved
    return lines or [""]


def leading(font, extra=0.18):
    ascent, descent = font.getmetrics()
    return int(ascent + descent + font.size * extra)


def draw_tracked(draw, xy, text, font, fill, tracking):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += font.getlength(ch) + tracking
    return x


def checked(text):
    if BAN.search(text):
        raise SystemExit("Banned phrase in social card: " + text)
    return text


def new_canvas(height):
    image = Image.new("RGB", (W, height), BG)
    return image, ImageDraw.Draw(image)


def chrome(draw, fonts, height, url):
    brand = fonts.sans(28, 640)
    draw.text((64, 52), "Checked Lab", font=brand, fill=INK)
    rule_y = height - 112
    draw.rounded_rectangle((64, rule_y, 64 + 56, rule_y + 6), radius=3, fill=GREEN)
    foot = fonts.sans(26, 650)
    draw.text((64, rule_y + 20), "Checked Lab", font=foot, fill=INK)
    url_font = fonts.sans(22, 450)
    url_w = url_font.getlength(url)
    draw.text((W - 64 - url_w, rule_y + 24), url, font=url_font, fill=MUTED)
    return 118, rule_y - 28


def title_lines_for(text, font, width):
    text = checked(text)
    if " or " in text and font.getlength(text) > width:
        left, right = text.split(" or ", 1)
        left = left + " or"
        if font.getlength(left) <= width and font.getlength(right) <= width:
            return [left, right]
    return wrap(text, font, width)


def fit_block(text, fonts, width, size, weight, max_lines, kind="news"):
    while size >= 32:
        font = fonts.news(size, weight) if kind == "news" else fonts.sans(size, weight)
        lines = title_lines_for(text, font, width) if kind == "news" else wrap(checked(text), font, width)
        if len(lines) <= max_lines:
            return font, lines, leading(font, 0.12)
        size -= 4
    font = fonts.news(32, weight) if kind == "news" else fonts.sans(32, weight)
    lines = title_lines_for(text, font, width) if kind == "news" else wrap(checked(text), font, width)
    return font, lines, leading(font, 0.12)


def draw_lines(draw, x, y, lines, font, fill, step):
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += step
    return y


def measure_value(value, value_font, width):
    lines = wrap(checked(value), value_font, width)
    value_step = leading(value_font, 0.06)
    return lines, value_step


def fit_spec_cards(fonts, sides, text_w, card_h):
    """Largest phone-readable type that fills the card without a loose gap.

    Labels stay at least 30px and values at least 38px. Brand and type lines
    stay at least 30px. Leftover space is a few pixels, not a hole between rows.
    """
    count = len(sides[0]["specs"])
    best = None
    for value_size in range(96, 37, -1):
        label_size = max(30, min(56, int(round(value_size * 0.78))))
        brand_size = 32 if value_size >= 48 else 30
        type_size = 34 if value_size >= 52 else 30
        # Largest model name that still leaves room for the spec block.
        # Two lines are fine. Drop toward 36px only when a long name would
        # push the values under the phone-readable floor.
        for model_size in range(max(48, value_size), 35, -2):
            model_font = fonts.news(model_size, 620)
            wrapped = [wrap(checked(side["model"]), model_font, text_w) for side in sides]
            if any(len(lines) > 2 for lines in wrapped):
                continue
            brand_font = fonts.sans(brand_size, 700)
            type_font = fonts.sans(type_size, 480)
            label_font = fonts.sans(label_size, 650)
            value_font = fonts.sans(value_size, 600)
            lines_n = max(len(lines) for lines in wrapped)
            model_step = leading(model_font, 0.04)
            brand_h = leading(brand_font, 0.0)
            type_h = leading(type_font, 0.0)
            label_h = leading(label_font, 0.0)
            between = max(4, int(label_size * 0.14))
            top_pad = 22
            head = top_pad + brand_h + 6 + lines_n * model_step + 6 + type_h + 12
            blocks = []
            too_long = False
            for side, model_lines in zip(sides, wrapped):
                row = []
                for label, value in side["specs"]:
                    lines, value_step = measure_value(value, value_font, text_w)
                    if len(lines) > 5 or any(value_font.getlength(line) > text_w + 0.5 for line in lines):
                        too_long = True
                    height = label_h + between + len(lines) * value_step
                    row.append({
                        "label": label,
                        "lines": lines,
                        "height": height,
                        "value_step": value_step,
                    })
                blocks.append(row)
                side["model_lines"] = model_lines
            if too_long:
                continue
            row_h = [max(blocks[side_i][i]["height"] for side_i in range(len(sides))) for i in range(count)]
            line_counts = [max(len(blocks[side_i][i]["lines"]) for side_i in range(len(sides))) for i in range(count)]
            gap = max(14, min(26, int(value_size * 0.26)))
            bottom_pad = 18
            used = head + sum(row_h) + gap * count + bottom_pad
            if used <= card_h:
                best = {
                    "brand_font": brand_font,
                    "brand_size": brand_size,
                    "brand_h": brand_h,
                    "model_font": model_font,
                    "model_size": model_size,
                    "model_step": model_step,
                    "lines_n": lines_n,
                    "type_font": type_font,
                    "type_size": type_size,
                    "type_h": type_h,
                    "label_font": label_font,
                    "label_size": label_size,
                    "label_h": label_h,
                    "value_font": value_font,
                    "value_size": value_size,
                    "between": between,
                    "blocks": blocks,
                    "row_h": row_h,
                    "line_counts": line_counts,
                    "gap": gap,
                    "top_pad": top_pad,
                    "head": head,
                    "bottom_pad": bottom_pad,
                    "used": used,
                }
                break
        if best is not None:
            break
    if best is None:
        raise SystemExit("Spec type does not fit in a %dpx card" % card_h)
    slack = card_h - best["used"]
    extra_step = 0
    step_cap = max(8, int(best["value_size"] * 0.22))
    while slack > 32 and extra_step < step_cap:
        grow = sum(best["line_counts"])
        if grow <= 0 or slack < grow:
            break
        extra_step += 1
        slack -= grow
        best["row_h"] = [h + best["line_counts"][i] for i, h in enumerate(best["row_h"])]
    gap = best["gap"]
    while slack > 40 and gap < 32:
        gap += 2
        slack -= 2 * count
    # Tall Short frames can still have a hole under short spec lists.
    # The 4:5 cards already leave this loop with little slack, so they stay put.
    if slack > 64:
        room = int(slack // count)
        gap += room
        slack -= room * count
    best["gap"] = gap
    best["extra_step"] = extra_step
    best["slack"] = max(0, slack)
    return best


def draw_pair(path, height, fonts, post, entities):
    image, draw = new_canvas(height)
    top, bottom = chrome(draw, fonts, height, post["url"])
    inner_w = W - 128
    y = top + (12 if height > 1500 else 4)
    eye = fonts.sans(18, 700)
    draw_tracked(draw, (64, y), post["eyebrow"], eye, GREEN, 3.2)
    y += 40
    title_font, title_lines, title_step = fit_block(post["title"], fonts, inner_w, 72 if height < 1600 else 84, 620, 3)
    y = draw_lines(draw, 64, y, title_lines, title_font, INK, title_step)
    y += 8
    if post.get("deck"):
        deck_font, deck_lines, deck_step = fit_block(post["deck"], fonts, inner_w, 34, 500, 3)
        y = draw_lines(draw, 64, y, deck_lines, deck_font, INK, deck_step)
    y += 28
    gap = 24
    card_w = (inner_w - gap) // 2
    card_h = bottom - y
    if card_h < 420:
        raise SystemExit("Card area is too short for " + path.name)
    pad_x = 30
    text_w = card_w - pad_x - 26
    if post.get("sides_ready"):
        sides = post["sides_ready"]
    else:
        sides = []
        for side in post["sides"]:
            entity = entities[side["id"]]
            specs = [(label, spec_value(entity, label)) for label in side["labels"]]
            sides.append({
                "brand": entity["sourceName"],
                "model": model_name(entity, side.get("model")),
                "type": product_type(entity),
                "specs": specs,
                "file": "products.json" if side["id"] != "airpods-pro-2" else "data/compares.json",
            })
    layout = fit_spec_cards(fonts, sides, text_w, card_h)
    for index, side in enumerate(sides):
        left = 64 + index * (card_w + gap)
        box = (left, y, left + card_w, y + card_h)
        draw_spec_card(draw, box, side, layout, index)
    image.save(path, "PNG", optimize=True)
    print(
        path.name,
        "label", layout["label_size"],
        "value", layout["value_size"],
        "brand", layout["brand_size"],
        "type", layout["type_size"],
        "model", layout["model_size"],
        "gap", layout["gap"],
        "slack", layout["slack"],
    )
    return sides


def draw_spec_card(draw, box, side, layout, index):
    x0, y0, x1, y1 = box
    draw.rounded_rectangle(box, radius=20, fill=CARD, outline=HAIR, width=2)
    draw.rectangle((x0 + 2, y0 + 22, x0 + 8, y1 - 22), fill=GREEN)
    tx = x0 + 30
    blocks = layout["blocks"][index]
    y = y0 + layout["top_pad"]
    draw_tracked(draw, (tx, y), checked(side["brand"]).upper(), layout["brand_font"], GREEN, 2.2)
    y += layout["brand_h"] + 6
    y = draw_lines(draw, tx, y, side["model_lines"], layout["model_font"], INK, layout["model_step"])
    y += (layout["lines_n"] - len(side["model_lines"])) * layout["model_step"]
    y += 6
    draw.text((tx, y), checked(side["type"]), font=layout["type_font"], fill=MUTED)
    y += layout["type_h"] + 12
    draw.line((tx, y, x1 - 26, y), fill=HAIR, width=2)
    y += layout["gap"]
    value_step = blocks[0]["value_step"] + layout["extra_step"]
    for row_index, block in enumerate(blocks):
        start = y
        draw.text((tx, y), block["label"], font=layout["label_font"], fill=MUTED)
        draw_lines(
            draw,
            tx,
            y + layout["label_h"] + layout["between"],
            block["lines"],
            layout["value_font"],
            INK,
            value_step,
        )
        y = start + layout["row_h"][row_index]
        if row_index != len(blocks) - 1:
            y += layout["gap"]
    if y > y1 + 8:
        raise SystemExit("Spec card overflow for " + side["model"])


def draw_steps(path, height, fonts, post):
    image, draw = new_canvas(height)
    top, bottom = chrome(draw, fonts, height, post["url"])
    inner_w = W - 128
    y = top + 8
    eye = fonts.sans(18, 700)
    draw_tracked(draw, (64, y), post["eyebrow"], eye, GREEN, 3.2)
    y += 42
    title_font, title_lines, title_step = fit_block(post["title"], fonts, inner_w, 76 if height < 1600 else 88, 620, 4)
    y = draw_lines(draw, 64, y, title_lines, title_font, INK, title_step)
    if post.get("deck"):
        y += 12
        deck_font, deck_lines, deck_step = fit_block(post["deck"], fonts, inner_w, 34, 500, 3)
        y = draw_lines(draw, 64, y, deck_lines, deck_font, INK, deck_step)
    y += 32
    steps = [checked(step) for step in post["steps"]]
    card_h = bottom - y
    draw.rounded_rectangle((64, y, W - 64, y + card_h), radius=20, fill=CARD, outline=HAIR, width=2)
    num_font = fonts.news(42, 620)
    body_font = fonts.sans(28, 480)
    body_w = inner_w - 140
    bodies = [wrap(step, body_font, body_w) for step in steps]
    body_step = leading(body_font, 0.22)
    slot = card_h / len(steps)
    for number, lines in enumerate(bodies, start=1):
        cursor = y + int((number - 1) * slot) + 28
        draw.text((96, cursor), str(number), font=num_font, fill=GREEN)
        draw_lines(draw, 176, cursor + 4, lines, body_font, INK, body_step)
        if number != len(bodies):
            rule = y + int(number * slot)
            draw.line((96, rule, W - 96, rule), fill=HAIR, width=2)
    image.save(path, "PNG", optimize=True)


def poster_lines(text, font, width, preferred):
    text = checked(text)
    if preferred and " ".join(preferred) == text and all(font.getlength(line) <= width for line in preferred):
        return list(preferred)
    return wrap(text, font, width)


def largest_poster_size(fonts, lines, width, weight, start, floor):
    size = start
    font = fonts.news(size, weight)
    while size > floor and any(font.getlength(line) > width for line in lines):
        size -= 2
        font = fonts.news(size, weight)
    if any(font.getlength(line) > width for line in lines):
        return None, None
    return size, font


def draw_headline(path, height, fonts, post):
    """Headline, kicker, and subline. No step list."""
    if post.get("steps"):
        raise SystemExit("Headline card must not repeat the steps")
    image, draw = new_canvas(height)
    top, bottom = chrome(draw, fonts, height, post["url"])
    x = 64
    inner_w = W - 128
    tall = height >= 1600
    well_h = bottom - top
    kicker_size = 34 if tall else 30
    kicker_font = fonts.sans(kicker_size, 700)
    kicker = checked(post["eyebrow"])
    kicker_h = leading(kicker_font, 0.02)

    title_pref = ["A sale listing", "is not a", "recall check."]
    title_size, title_font = largest_poster_size(fonts, title_pref, inner_w, 620, 170, 96)
    if title_font is None:
        title_font, title_lines, _ = fit_block(post["title"], fonts, inner_w, 96, 620, 4)
        title_size = title_font.size
    else:
        title_lines = poster_lines(post["title"], title_font, inner_w, title_pref)

    # One full line on the 4:5 card. On the tall Short, two lines so the
    # subline has the same weight as the headline.
    if tall:
        sub_pref = ["Match the model number", "before you pay."]
        sub_size, sub_font = largest_poster_size(fonts, sub_pref, inner_w, 520, 96, 56)
    else:
        sub_pref = ["Match the model number before you pay."]
        sub_size, sub_font = largest_poster_size(fonts, sub_pref, inner_w, 520, 64, 40)
    if sub_font is None:
        sub_font, sub_lines, _ = fit_block(post["deck"], fonts, inner_w, 44, 500, 3)
        sub_size = sub_font.size
    else:
        sub_lines = poster_lines(post["deck"], sub_font, inner_w, sub_pref)
    sub_step = leading(sub_font, 0.06)
    sub_block = sub_step * len(sub_lines)

    # Open the headline leading until the lockup fills the well, and stop
    # before the lines drift apart. The quiet gap under the headline stays
    # a pause, not an empty field.
    lead = 0.05
    lead_cap = 0.28 if tall else 0.12
    rule_h = 6
    while True:
        title_step = leading(title_font, lead)
        title_block = title_step * len(title_lines)
        gap_kicker = int(kicker_size * 0.9)
        gap_rule = int(max(28, title_size * 0.22))
        gap_sub = int(max(22, sub_size * 0.42))
        stack = kicker_h + gap_kicker + title_block + gap_rule + rule_h + gap_sub + sub_block
        spare = well_h - stack
        if spare <= well_h * (0.22 if tall else 0.16) or lead >= lead_cap:
            break
        lead += 0.02
    if spare < 20:
        raise SystemExit("Headline does not fit " + path.name)
    top_air = int(spare * 0.48)
    y = top + top_air
    draw_tracked(draw, (x, y), kicker, kicker_font, GREEN, 3.4)
    y += kicker_h + gap_kicker
    y = draw_lines(draw, x, y, title_lines, title_font, INK, title_step)
    y += gap_rule
    draw.rounded_rectangle((x, y, x + 88, y + rule_h), radius=3, fill=GREEN)
    y += rule_h + gap_sub
    draw_lines(draw, x, y, sub_lines, sub_font, INK, sub_step)
    image.save(path, "PNG", optimize=True)
    print(path.name, "headline", title_size, "sub", sub_size, "lead", round(lead, 2), "spare", spare)


RECALL_STEPS = [
    "Confirm the model number on the box, in the manual, and on the listing. A family name is not the model number.",
    "Search that model on CPSC Recalls and on Health Canada recalls and safety alerts.",
    "Read the return window on the store page before you pay.",
]


STRIPE = (239, 231, 218)
NUM_TOKEN = re.compile(r"\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+-\d+/\d+|\d+\.\d+|\d+")


def unescape(text):
    return (
        text.replace("&amp;", "&")
        .replace("&quot;", '"')
        .replace("&#39;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
    )


def parse_compare_table(slug):
    html = (ROOT / "compare" / slug / "index.html").read_text()
    body = re.search(r"<tbody>(.*?)</tbody>", html, re.S)
    if not body:
        raise SystemExit("Compare page has no spec table: " + slug)
    rows = {}
    for label, left, right in re.findall(r"<tr><th>(.*?)</th><td>(.*?)</td><td>(.*?)</td></tr>", body.group(1)):
        rows[label] = (html_cell(left), html_cell(right))
    if not rows:
        raise SystemExit("Compare table is empty: " + slug)
    return rows, html


def html_cell(raw):
    url = ""
    found = re.search(r'href="([^"]+)"', raw)
    if found:
        url = unescape(found.group(1))
    text = re.sub(r"<a\b[^>]*>.*?</a>", " ", raw, flags=re.S)
    text = unescape(re.sub(r"<[^>]+>", " ", text))
    text = re.sub(r"\s+", " ", text).strip()
    if not text or not url:
        raise SystemExit("Spec cell is missing text or a source link: " + raw[:80])
    return text, url


def repeats(token, blob):
    token = " ".join(token.lower().split())
    if not token or token not in blob:
        return False
    if any(ch.isdigit() for ch in token):
        return len(token) >= 3
    return len(token) >= 12


def assert_distinct(slug, cover_values, table_values, deck, table_title):
    table_blob = " ".join(table_values + [table_title]).lower()
    cover_blob = " ".join(cover_values + [deck]).lower()
    for value in cover_values + [deck]:
        if repeats(value, table_blob):
            raise SystemExit(slug + " repeats cover text on the table: " + value)
    for value in table_values:
        if repeats(value, cover_blob):
            raise SystemExit(slug + " repeats table text on the cover: " + value)


def assert_caption_numbers(slug, caption, html):
    checked(caption)
    body = re.sub(r"https://\S+", "", caption)
    for token in NUM_TOKEN.findall(body):
        if token not in html:
            raise SystemExit(slug + " caption uses a number that is not on the page: " + token)


def assert_filled(path, rule_y):
    image = Image.open(path).convert("RGB")
    pixels = image.load()
    last = 0
    for y in range(rule_y - 8, 80, -1):
        hits = 0
        for x in range(72, W - 72, 7):
            if pixels[x, y] != BG:
                hits += 1
                if hits > 12:
                    last = y
                    break
        if last:
            break
    if rule_y - last > 56:
        raise SystemExit("Empty lower half on " + path.name + " (" + str(rule_y - last) + "px)")


def load_named():
    products = json.loads((ROOT / "products.json").read_text())
    compares = json.loads((ROOT / "data" / "compares.json").read_text())
    by_id = {item["id"]: item for item in products}
    for entry in compares:
        for guest in entry.get("guests") or []:
            by_id.setdefault(guest["id"], guest)
    return by_id


def display_model(entity, name):
    title = entity.get("title") or ""
    if entity.get("model") == name or name in title:
        return name
    raise SystemExit("Display name is not on the model: " + name)


def ready_sides(named, post, rows, labels):
    sides = []
    for index, pid in enumerate(post["ids"]):
        entity = named[pid]
        specs = []
        for label in labels:
            if label not in rows:
                raise SystemExit(post["slug"] + " has no shared row " + label)
            value, url = rows[label][index]
            specs.append((label, value, url))
        sides.append({
            "brand": entity["sourceName"],
            "model": display_model(entity, post["models"][index]),
            "type": product_type(entity),
            "specs": [(label, value) for label, value, _url in specs],
            "sources": specs,
            "file": "compare/" + post["slug"] + "/index.html",
        })
    return sides


def draw_centered_lines(draw, center, y, lines, font, fill, step):
    for line in lines:
        width = font.getlength(line)
        draw.text((center - width / 2, y), checked(line), font=font, fill=fill)
        y += step
    return y


def fit_table(fonts, rows, heads, inner_w, area):
    """Largest phone-readable table type that fills the band down to the footer."""
    best = None
    for value_size in range(78, 35, -1):
        label_size = max(34, min(46, int(round(value_size * 0.72))))
        head_size = max(36, min(52, int(round(value_size * 0.78))))
        label_font = fonts.sans(label_size, 650)
        value_font = fonts.sans(value_size, 650)
        head_font = fonts.sans(head_size, 700)
        label_w = max(label_font.getlength(row["label"]) for row in rows) + 28
        if label_w > inner_w * 0.42:
            continue
        col_w = (inner_w - label_w - 20) / 2
        if col_w < 240:
            continue
        if any(head_font.getlength(checked(head)) > col_w - 12 for head in heads):
            continue
        value_step = leading(value_font, 0.08)
        too_wide = False
        measured = []
        for row in rows:
            cells = []
            height = 0
            for value in row["values"]:
                # Keep a real gutter between the two centered columns.
                lines = wrap(checked(value), value_font, col_w - 72)
                if any(value_font.getlength(line) > col_w - 68 for line in lines) or len(lines) > 8:
                    too_wide = True
                height = max(height, len(lines) * value_step)
                cells.append(lines)
            label_lines = wrap(checked(row["label"]), label_font, label_w - 8)
            if any(label_font.getlength(line) > label_w - 4 for line in label_lines):
                too_wide = True
            height = max(height, len(label_lines) * leading(label_font, 0.06))
            measured.append({"lines": cells, "label_lines": label_lines, "height": height})
        if too_wide:
            continue
        pad = 22
        natural = sum(item["height"] + pad * 2 for item in measured)
        gaps = 12 * (len(rows) - 1)
        header_h = leading(head_font, 0.2) + 18
        used = header_h + natural + gaps
        if used <= area:
            best = {
                "label_font": label_font,
                "label_size": label_size,
                "value_font": value_font,
                "value_size": value_size,
                "head_font": head_font,
                "head_size": head_size,
                "label_w": label_w,
                "col_w": col_w,
                "value_step": value_step,
                "label_step": leading(label_font, 0.06),
                "measured": measured,
                "pad": pad,
                "header_h": header_h,
                "gaps": gaps,
                "used": used,
            }
            break
    if best is None:
        raise SystemExit("Table type does not fit")
    slack = area - best["used"]
    weights = [max(1, item["height"]) for item in best["measured"]]
    share = sum(weights)
    extra = [0] * len(weights)
    left = slack
    if share:
        for index, weight in enumerate(weights):
            give = int(slack * weight / share)
            extra[index] = give
            left -= give
        extra[-1] += max(0, left)
    for item, give in zip(best["measured"], extra):
        item["box"] = item["height"] + best["pad"] * 2 + give
    best["slack"] = 0
    return best


def draw_table(path, height, fonts, post):
    image, draw = new_canvas(height)
    top, bottom = chrome(draw, fonts, height, post["url"])
    inner_w = W - 128
    y = top + (8 if height < 1600 else 16)
    eye = fonts.sans(18, 700)
    draw_tracked(draw, (64, y), post["eyebrow"], eye, GREEN, 3.2)
    y += 40
    title_size = 68 if height < 1600 else 78
    title_font, title_lines, title_step = fit_block(post["table_title"], fonts, inner_w, title_size, 620, 2)
    y = draw_lines(draw, 64, y, title_lines, title_font, INK, title_step)
    y += 18
    note_font = fonts.sans(30 if height < 1600 else 34, 500)
    note = checked(post["source_line"])
    note_h = leading(note_font, 0.08)
    area_bottom = bottom - note_h - 8
    layout = fit_table(fonts, post["rows"], post["heads"], inner_w, area_bottom - y - 14)
    head_y = y + 4
    for index, head in enumerate(post["heads"]):
        center = 64 + layout["label_w"] + 10 + layout["col_w"] * index + layout["col_w"] / 2
        width = layout["head_font"].getlength(checked(head))
        draw.text((center - width / 2, head_y), checked(head), font=layout["head_font"], fill=GREEN)
    rule = y + layout["header_h"] - 10
    draw.line((64, rule, W - 64, rule), fill=HAIR, width=2)
    y = y + layout["header_h"]
    for index, item in enumerate(layout["measured"]):
        box_h = item["box"]
        fill = CARD if index % 2 == 0 else STRIPE
        draw.rounded_rectangle((64, y, W - 64, y + box_h), radius=18, fill=fill)
        label_h = len(item["label_lines"]) * layout["label_step"]
        label_y = y + (box_h - label_h) / 2
        draw_lines(draw, 64 + 22, label_y, item["label_lines"], layout["label_font"], MUTED, layout["label_step"])
        for col, lines in enumerate(item["lines"]):
            block_h = len(lines) * layout["value_step"]
            text_y = y + (box_h - block_h) / 2
            center = 64 + layout["label_w"] + 10 + layout["col_w"] * col + layout["col_w"] / 2
            draw_centered_lines(draw, center, text_y, lines, layout["value_font"], INK, layout["value_step"])
        y += box_h
        if index != len(layout["measured"]) - 1:
            y += 12
    draw.text((64, area_bottom), note, font=note_font, fill=MUTED)
    image.save(path, "PNG", optimize=True)
    print(
        path.name,
        "table value", layout["value_size"],
        "label", layout["label_size"],
        "head", layout["head_size"],
    )
    assert_filled(path, bottom + 28)
    return layout


def fit_explicit(fonts, lines, width, start, floor, weight=620):
    size = start
    while size >= floor:
        font = fonts.news(size, weight)
        if all(font.getlength(checked(line)) <= width for line in lines):
            return font, leading(font, 0.08)
        size -= 2
    raise SystemExit("CTA line does not fit: " + " / ".join(lines))


def draw_cta(path, height, fonts, post):
    image, draw = new_canvas(height)
    top, bottom = chrome(draw, fonts, height, "checkedlab.com")
    inner_w = W - 128
    tall = height >= 1600
    claim_font, claim_step = fit_explicit(
        fonts, post["claim"], inner_w, 108 if tall else 84, 60, 620
    )
    claim_h = claim_step * len(post["claim"])
    sub_font = fonts.sans(36 if tall else 32, 500)
    sub = checked(post["sub"])
    sub_h = leading(sub_font, 0.1)
    link_label = fonts.sans(28, 700)
    url_size = 34 if tall else 30
    url_font = fonts.sans(url_size, 600)
    while url_size > 26 and url_font.getlength(post["path"]) > inner_w - 80:
        url_size -= 1
        url_font = fonts.sans(url_size, 600)
    if url_font.getlength(post["path"]) > inner_w - 80:
        raise SystemExit("CTA url does not fit " + post["path"])
    pill_h = leading(link_label, 0.05) + leading(url_font, 0.05) + 36
    rule_h = 6
    stack = claim_h + 28 + rule_h + 28 + sub_h + 32 + pill_h
    spare = (bottom - top) - stack
    if spare < 16:
        raise SystemExit("CTA does not fit " + path.name)
    top_air = int(spare * (0.18 if tall else 0.08))
    y = top + top_air
    y = draw_lines(draw, 64, y, [checked(line) for line in post["claim"]], claim_font, INK, claim_step)
    y += 28
    draw.rounded_rectangle((64, y, 64 + 88, y + rule_h), radius=3, fill=GREEN)
    y += rule_h + 28
    draw.text((64, y), sub, font=sub_font, fill=INK)
    y += sub_h + 32
    pill = (64, y, W - 64, y + pill_h)
    draw.rounded_rectangle(pill, radius=22, fill=PILL)
    draw.text((92, y + 16), "Link in bio", font=link_label, fill=GREEN)
    draw.text((92, y + 16 + leading(link_label, 0.05)), post["path"], font=url_font, fill=INK)
    image.save(path, "PNG", optimize=True)
    print(path.name, "cta", claim_font.size, "url", url_size)


def encode_silent(frames, durations, dest):
    total = sum(durations)
    cmd = ["ffmpeg", "-y"]
    for frame, length in zip(frames, durations):
        cmd += ["-loop", "1", "-t", f"{length:.3f}", "-i", str(frame)]
    cmd += ["-f", "lavfi", "-t", f"{total:.3f}", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"]
    parts = "".join(f"[{i}:v]" for i in range(len(frames)))
    cmd += [
        "-filter_complex",
        parts + f"concat=n={len(frames)}:v=1:a=0,format=yuv420p,fps=30[v]",
        "-map", "[v]",
        "-map", f"{len(frames)}:a:0",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-c:a", "aac",
        "-b:a", "64k",
        "-movflags", "+faststart",
        "-shortest",
        str(dest),
    ]
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def week3_posts():
    """Cover and table use different rows from the same compare table.

    The caption may restate both, because it is the post text rather than a
    second copy of one slide.
    """
    common_sub = "Full side-by-side and recall check at checkedlab.com"
    return [
        {
            "slug": "dyson-v8-vs-dyson-v10",
            "stem": "08-dyson-v8-v10",
            "short": "dyson-v8-vs-v10.mp4",
            "ids": ["dyson-v8", "dyson-v10-absolute"],
            "models": ["V8", "V10 Absolute"],
            "heads": ["V8", "V10"],
            "title": "Dyson V8 or V10?",
            "deck": "The V8 is the lighter one.",
            "table_title": "Charge, bin, and cyclones",
            "source_line": "By Dyson's own numbers.",
            "cover_labels": ["Weight", "Run time", "Suction"],
            "table_labels": ["Charge time", "Bin volume", "Power modes", "Cyclones", "Height"],
            "claim": ["V8: 5.58 lb.", "V10: up to 60 minutes."],
            "hashtag": "#Cleaning",
            "heading": "Dyson V8 vs V10",
            "yt": "Dyson V8 or V10? Weight and run time",
            "caption": (
                "Dyson V8 or V10? The V8 is the lighter one.\n\n"
                "By Dyson's own numbers, the V8 is 5.58 lb, with 115 air watts in MAX mode and a 40-minute maximum. "
                "The Cyclone V10 Absolute is 5.71 lb, with 150 air watts in Boost mode and up to 60 minutes.\n\n"
                "The charge is 5 hours on the V8 and 3.5 hours on the V10 Absolute. Bins are 0.14 gallon and 0.2 gallon. "
                "Power modes are two and three. Cyclones are 15 and 14.\n\n"
                "The same V10 page also says up to 35 minutes with a Torque drive head in Suction mode I and up to 40 minutes with a Soft roller head in Suction mode I."
            ),
        },
        {
            "slug": "sony-wh-1000xm5-vs-xm6",
            "stem": "09-sony-xm",
            "short": "sony-xm5-vs-xm6.mp4",
            "ids": ["sony-wh-1000xm5", "sony-wh-1000xm6"],
            "models": ["XM5", "XM6"],
            "heads": ["XM5", "XM6"],
            "title": "Sony XM5 or XM6?",
            "deck": "The music-hour line matches.",
            "table_title": "Battery and call time",
            "source_line": "By Sony's own numbers.",
            "cover_labels": ["Weight", "Bluetooth", "Noise cancelling"],
            "table_labels": ["Battery", "Charge time", "Call time", "Audio formats"],
            "claim": ["XM5: about 8.82 oz.", "XM6: 12 microphones."],
            "hashtag": "#PersonalTech",
            "heading": "Sony XM5 vs XM6",
            "yt": "Sony XM5 or XM6? The hours match",
            "caption": (
                "Sony XM5 or XM6? The music-hour line matches.\n\n"
                "By Sony's own numbers, both list max 30 hours with noise cancelling on and max 40 hours with it off. "
                "Both charge in about 3.5 hours.\n\n"
                "The XM5 is about 8.82 oz, with Bluetooth 5.2 and a QN1 processor with 8 microphones. "
                "The XM6 is about 8.96 oz, with Bluetooth 5.3 and a QN3 processor with 12 microphones.\n\n"
                "Call time with noise cancelling off is max 32 hours on the XM5 and max 28 hours on the XM6. "
                "The XM6 codec list adds LC3."
            ),
        },
        {
            "slug": "kitchenaid-artisan-vs-classic",
            "stem": "10-kitchenaid",
            "short": "kitchenaid-artisan-vs-classic.mp4",
            "ids": ["kitchenaid-artisan", "kitchenaid-classic-k45ss"],
            "models": ["Artisan", "Classic"],
            "heads": ["Artisan", "Classic"],
            "title": "Artisan or Classic?",
            "deck": "A larger bowl and a stronger motor.",
            "table_title": "Colors, cookies, warranty",
            "source_line": "By KitchenAid's own numbers.",
            "cover_labels": ["Capacity", "Motor", "Model"],
            "table_labels": ["Colors", "Cookies", "Speeds", "Warranty"],
            "claim": ["Artisan: 5 quart, 325 watts.", "Classic: 4.5 quart, 275 watts."],
            "hashtag": "#Kitchen",
            "heading": "KitchenAid Artisan vs Classic",
            "yt": "Artisan or Classic? 5 quart or 4.5",
            "caption": (
                "KitchenAid Artisan or Classic? A larger bowl and a stronger motor.\n\n"
                "By KitchenAid's own numbers, the Artisan is a 5 quart mixer at 325 watts. "
                "The Classic is a 4.5 quart mixer at 275 watts.\n\n"
                "The Artisan comes in more than 20 colors. The Classic comes in white and onyx black. "
                "Cookies are up to 9 dozen on the Artisan and up to 8 dozen on the Classic, using the flat beater and 28g of dough each. "
                "Both list 10 speeds and a one-year limited warranty. Model codes are KSM150PSER and K45SS."
            ),
        },
        {
            "slug": "allclad-d3-vs-d5",
            "stem": "11-allclad",
            "short": "allclad-d3-vs-d5.mp4",
            "ids": ["allclad-d3-4112", "allclad-d5-sd55112"],
            "models": ["D3", "D5"],
            "heads": ["D3", "D5"],
            "title": "All-Clad D3 or D5?",
            "deck": "The ply count is the split.",
            "table_title": "What both pans share",
            "source_line": "By All-Clad's own numbers.",
            "cover_labels": ["Model", "Construction", "Made in"],
            "table_labels": ["Size", "Oven", "Stovetop", "Care", "Warranty"],
            "claim": ["D3 is 3-ply.", "D5 is 5-ply. Both to 600 F."],
            "hashtag": "#Kitchen",
            "heading": "All-Clad D3 vs D5",
            "yt": "All-Clad D3 or D5? 3-ply or 5-ply",
            "caption": (
                "All-Clad D3 or D5? The ply count is the split.\n\n"
                "By All-Clad's own numbers, model 4112 is 3-ply: five metal layers in three functional layers. "
                "Model SD55112 is 5-ply bonded. All-Clad calls the D5 its premier range.\n\n"
                "Both are 12 inch stainless pans, oven and broiler safe up to 600 F, for any stovetop including induction. "
                "Both say handwash only and a limited lifetime warranty. Both say made in the USA with global components."
            ),
        },
        {
            "slug": "zojirushi-vs-tiger-rice-cooker",
            "stem": "12-rice",
            "short": "zojirushi-vs-tiger.mp4",
            "ids": ["zojirushi-ns-zcc10", "tiger-jbv-a10u"],
            "models": ["NS-ZCC10", "JBV-A10U"],
            "heads": ["Zojirushi", "Tiger"],
            "title": "Zojirushi or Tiger?",
            "deck": "Two cookers, two watt figures.",
            "table_title": "Cabinet and menus",
            "source_line": "By each maker's own numbers.",
            "cover_labels": ["Electrical", "Origin", "Capacity"],
            "table_labels": ["Dimensions", "Menus"],
            "claim": ["680 watts, made in Japan.", "672 watts, made in China."],
            "hashtag": "#Kitchen",
            "heading": "Zojirushi vs Tiger",
            "yt": "Zojirushi or Tiger? 680 watts or 672",
            "caption": (
                "Zojirushi or Tiger? Two cookers in the 5.5-cup class.\n\n"
                "By Zojirushi's own numbers, the NS-ZCC10 is up to 5.5 cups / 1.0 liter, at 120 volts / 680 watts, made in Japan. "
                "By Tiger's own numbers, the JBV-A10U is a 5.5-cup cooker at 120 V, 60 Hz, 672 W, and the producing country is China. "
                "Tiger's volume line is 1 L (34 oz).\n\n"
                "Cabinets are 10-1/8 x 13 x 8-1/8 inches and 10.6 x 13.9 x 8.4 inches.\n\n"
                "Zojirushi's menus are white, sushi, softer or harder, mixed, porridge, sweet, semi-brown, brown, rinse-free, and quick. "
                "Tiger's menus are plain, brown, slow cooking, and synchro-cooking."
            ),
        },
        {
            "slug": "mr-heater-buddy-vs-big-buddy",
            "stem": "13-buddy",
            "short": "mr-heater-buddy-vs-big-buddy.mp4",
            "ids": ["mr-heater-mh9bx", "mr-heater-mh18b"],
            "models": ["Buddy", "Big Buddy"],
            "heads": ["Buddy", "Big Buddy"],
            "title": "Buddy or Big Buddy?",
            "deck": "One bottle, or two.",
            "table_title": "Settings and the indoor line",
            "source_line": "By Mr. Heater's own numbers.",
            "cover_labels": ["Heat", "Area", "Cylinders"],
            "table_labels": ["Model", "Settings", "Indoor", "Tip-over", "Oxygen sensor"],
            "claim": ["Buddy: up to 225 sq ft.", "Big Buddy: up to 450 sq ft."],
            "hashtag": "#Winter",
            "heading": "Mr Heater Buddy vs Big Buddy",
            "yt": "Buddy or Big Buddy? 225 or 450 sq ft",
            "caption": (
                "Buddy or Big Buddy? One bottle, or two.\n\n"
                "By Mr. Heater's own numbers, the Portable Buddy MH9BX is 4,000 or 9,000 BTU per hour, up to 225 sq ft, on one 1 lb propane cylinder. "
                "The Big Buddy MH18B is 4,000, 9,000, or 18,000 BTU per hour, up to 450 sq ft, on two 1 lb propane cylinders.\n\n"
                "The Buddy settings are hi and low. The Big Buddy settings are hi, med, and low. "
                "Both standard listings mark indoor safe as yes, and both list Massachusetts and Canada restrictions. "
                "The separate Massachusetts and Canada Big Buddy listing marks indoor safe as no.\n\n"
                "The Buddy page says 3 hours at the maximum BTU and 6 hours at the minimum. "
                "A bullet on that page also says up to 5.4 hours. The Big Buddy page says up to 11 hours with dual tanks. "
                "Elevation is 7000 ft on the Buddy and 7,000 feet on the Big Buddy. "
                "Both list a tip-over shutoff and an oxygen depletion sensor."
            ),
            "sub": common_sub,
        },
    ]


def write_week3_captions(posts, html_by_slug):
    parts = [
        "# Week 3 captions",
        "",
        "Paste the block under each heading. The specs are the maker's own words.",
        "",
    ]
    for post in posts:
        url = "https://www.checkedlab.com/compare/" + post["slug"] + "/"
        if len(post["yt"]) > 60:
            raise SystemExit("Social title is " + str(len(post["yt"])) + " characters: " + post["yt"])
        block = (
            post["caption"].rstrip()
            + "\n\n"
            + url
            + "\n\n"
            + "#CheckedLab "
            + post["hashtag"]
        )
        assert_caption_numbers(post["slug"], block, html_by_slug[post["slug"]])
        parts.append("## " + post["heading"])
        parts.append("")
        parts.append("Page: " + url)
        parts.append("")
        parts.append("### Instagram")
        parts.append("")
        parts.append(block)
        parts.append("")
        parts.append("### YouTube Short")
        parts.append("")
        parts.append("Title: " + post["yt"])
        parts.append("")
        parts.append("Description:")
        parts.append(block)
        parts.append("")
    text = "\n".join(parts).rstrip() + "\n"
    checked(text)
    dest = SOCIAL / "2026-11" / "captions-week3.md"
    dest.write_text(text)
    print("captions", dest.relative_to(ROOT))


def render_week3(fonts):
    named = load_named()
    html_by_slug = {}
    jobs = []
    for post in week3_posts():
        rows, html = parse_compare_table(post["slug"])
        html_by_slug[post["slug"]] = html
        post["sub"] = post.get("sub") or "Full side-by-side and recall check at checkedlab.com"
        post["eyebrow"] = "SIDE BY SIDE"
        post["url"] = "checkedlab.com"
        post["path"] = "checkedlab.com/compare/" + post["slug"] + "/"
        cover = ready_sides(named, post, rows, post["cover_labels"])
        table = ready_sides(named, post, rows, post["table_labels"])
        cover_values = [value for side in cover for _label, value in side["specs"]]
        table_values = [value for side in table for _label, value in side["specs"]]
        assert_distinct(post["slug"], cover_values, table_values, post["deck"], post["table_title"])
        post["sides_ready"] = cover
        post["rows"] = []
        for label in post["table_labels"]:
            post["rows"].append({
                "label": label,
                "values": [rows[label][0][0], rows[label][1][0]],
            })
        print(post["stem"], post["slug"])
        for side in cover + table:
            print(" ", side["brand"], side["model"], side["type"], "from", side["file"])
            for label, value, url in side["sources"]:
                print("   ", label + ":", value)
                print("     ", url)
        jobs.append(post)
    ig_dir = SOCIAL / "2026-11" / "ig"
    short_dir = SOCIAL / "2026-11" / "shorts"
    durations = [7.0, 7.0, 6.0]
    for post in jobs:
        cover_path = ig_dir / (post["stem"] + "-cover.png")
        table_path = ig_dir / (post["stem"] + "-table.png")
        cta_path = ig_dir / (post["stem"] + "-cta.png")
        draw_pair(cover_path, H_IG, fonts, post, None)
        assert_filled(cover_path, H_IG - 112)
        draw_table(table_path, H_IG, fonts, post)
        draw_cta(cta_path, H_IG, fonts, post)
        with tempfile.TemporaryDirectory(prefix="checkedlab-week3-") as tmp:
            work = Path(tmp)
            frames = []
            for index, kind in enumerate(("cover", "table", "cta")):
                frame = work / f"{kind}.png"
                tall = dict(post)
                if kind == "cover":
                    draw_pair(frame, H_SHORT, fonts, tall, None)
                    assert_filled(frame, H_SHORT - 112)
                elif kind == "table":
                    draw_table(frame, H_SHORT, fonts, tall)
                else:
                    draw_cta(frame, H_SHORT, fonts, tall)
                frames.append(frame)
            dest = short_dir / post["short"]
            encode_silent(frames, durations, dest)
        length = duration_of(dest)
        if abs(length - 20.0) > 0.05:
            raise SystemExit(post["short"] + " is " + str(length) + "s, not 20s")
        print("short", post["short"], round(length, 3))
    write_week3_captions(jobs, html_by_slug)
    print("Week 3 cards rendered.")


def posts():
    return [
        {
            "kind": "pair",
            "ig": "2026-11/ig/01-sony-bose-cover.png",
            "short": "2026-11/shorts/sony-xm5-vs-bose-qc-ultra.mp4",
            "short_i": 0,
            "eyebrow": "SIDE BY SIDE",
            "title": "Sony XM5 or Bose QC Ultra?",
            "deck": "Which one lasts longer on a charge?",
            "url": "checkedlab.com",
            "sides": [
                {"id": "sony-wh-1000xm5", "labels": ["Battery", "Weight", "Charge time"]},
                {"id": "bose-qc-ultra", "model": "QuietComfort Ultra", "labels": ["Battery", "Weight", "Charge time"]},
            ],
        },
        {
            "kind": "headline",
            "ig": "2026-11/ig/02-recall-cover.png",
            "short": "2026-11/shorts/black-friday-recall-check.mp4",
            "short_i": 0,
            "eyebrow": "BLACK FRIDAY 2026",
            "title": "A sale listing is not a recall check.",
            "deck": "Match the model number before you pay.",
            "url": "checkedlab.com/black-friday/",
        },
        {
            "kind": "steps",
            "ig": "2026-11/ig/02-recall-steps.png",
            "short": "2026-11/shorts/black-friday-recall-check.mp4",
            "short_i": 1,
            "eyebrow": "BEFORE YOU BUY",
            "title": "Three things to match first.",
            "deck": "",
            "url": "checkedlab.com/black-friday/",
            "steps": RECALL_STEPS,
        },
        {
            "kind": "pair",
            "ig": "2026-11/ig/03-dyson-cover.png",
            "short": "2026-11/shorts/dyson-v15-vs-v8.mp4",
            "short_i": 0,
            "eyebrow": "SIDE BY SIDE",
            "title": "Dyson V15 or V8?",
            "deck": "The V15 runs longer. The V8 weighs less.",
            "url": "checkedlab.com",
            "sides": [
                {"id": "dyson-v15-detect", "labels": ["Weight", "Run time", "Charge time"]},
                {"id": "dyson-v8", "labels": ["Weight", "Run time", "Charge time"]},
            ],
        },
        {
            "kind": "pair",
            "ig": "2026-11/ig/04-levoit-winix-cover.png",
            "eyebrow": "SIDE BY SIDE",
            "title": "Levoit 600S or Winix 5500-2?",
            "deck": "Which one uses less power?",
            "url": "checkedlab.com",
            "sides": [
                {"id": "levoit-core-600s", "model": "Core 600S-P", "labels": ["Power", "CADR", "Weight"]},
                {"id": "winix-5500-2", "model": "5500-2", "labels": ["Power", "CADR", "Weight"]},
            ],
        },
        {
            "kind": "pair",
            "ig": "2026-11/ig/05-litter-cover.png",
            "eyebrow": "SIDE BY SIDE",
            "title": "Litter-Robot 4 or ScoopFree Plus?",
            "deck": "How long before you empty it?",
            "url": "checkedlab.com",
            "sides": [
                {"id": "litter-robot-4", "labels": ["Cleaning", "Household", "Power"]},
                {"id": "petsafe-scoopfree-plus", "model": "ScoopFree Crystal Plus", "labels": ["Cleaning", "Household", "Power"]},
            ],
        },
        {
            "kind": "pair",
            "ig": "2026-11/ig/06-airpods-cover.png",
            "short": "2026-11/shorts/airpods-pro-3-vs-pro-2.mp4",
            "short_i": 0,
            "eyebrow": "SIDE BY SIDE",
            "title": "AirPods Pro 3 or Pro 2?",
            "deck": "The 3 differences that matter",
            "url": "checkedlab.com",
            "sides": [
                {"id": "airpods-pro-3", "model": "AirPods Pro 3", "labels": ["Listening", "Rating", "Hearing"]},
                {"id": "airpods-pro-2", "labels": ["Listening", "Rating", "Hearing"]},
            ],
        },
    ]


def duration_of(path):
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        text=True,
    )
    return float(out.strip())


def extract_frame(video, seconds, dest):
    subprocess.check_call(
        ["ffmpeg", "-y", "-ss", f"{seconds:.3f}", "-i", str(video), "-frames:v", "1", str(dest)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def encode_short(frames, durations, audio_from, dest):
    if abs(sum(durations) - duration_of(audio_from)) > 0.05:
        raise SystemExit("Short duration drift for " + dest.name)
    cmd = ["ffmpeg", "-y"]
    for frame, length in zip(frames, durations):
        cmd += ["-loop", "1", "-t", f"{length:.3f}", "-i", str(frame)]
    cmd += ["-i", str(audio_from)]
    parts = "".join(f"[{i}:v]" for i in range(len(frames)))
    cmd += [
        "-filter_complex",
        parts + f"concat=n={len(frames)}:v=1:a=0,format=yuv420p,fps=30[v]",
        "-map", "[v]",
        "-map", f"{len(frames)}:a:0",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-c:a", "aac",
        "-b:a", "64k",
        "-movflags", "+faststart",
        "-shortest",
        str(dest),
    ]
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def render_shorts(fonts, jobs, work):
    grouped = {}
    for job in jobs:
        if job.get("short"):
            grouped.setdefault(job["short"], []).append(job)
    for rel, items in grouped.items():
        src = SOCIAL / rel
        total = duration_of(src)
        spans = [5, 5, 5, round(total - 15, 3)]
        frames = []
        for index, length in enumerate(spans):
            start = sum(spans[:index])
            frame = work / f"{src.stem}-{index}.png"
            # Sample the middle of the hold. The source videos dissolve for
            # about half a second at each cut, so the edges are two slides at once.
            extract_frame(src, start + length / 2, frame)
            frames.append(frame)
        for job in items:
            vertical = work / f"{src.stem}-new-{job['short_i']}.png"
            if job["kind"] == "pair":
                draw_pair(vertical, H_SHORT, fonts, job, job["_entities"])
            elif job["kind"] == "headline":
                draw_headline(vertical, H_SHORT, fonts, job)
            else:
                draw_steps(vertical, H_SHORT, fonts, job)
            frames[job["short_i"]] = vertical
        out = work / src.name
        encode_short(frames, spans, src, out)
        shutil.move(out, src)
        print("short", rel)


def main():
    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        raise SystemExit("ffmpeg and ffprobe are required")
    week = os.environ.get("SOCIAL_WEEK", "")
    fonts = Fonts()
    if week in ("", "1"):
        entities = load_entities()
        jobs = posts()
        for job in jobs:
            job["_entities"] = entities
            ig = SOCIAL / job["ig"]
            if job["kind"] == "pair":
                sides = draw_pair(ig, H_IG, fonts, job, entities)
                for side in sides:
                    print(" ", side["brand"], side["model"], side["type"], "from", side["file"])
                    for label, value in side["specs"]:
                        print("   ", label + ":", value)
            elif job["kind"] == "headline":
                draw_headline(ig, H_IG, fonts, job)
            else:
                draw_steps(ig, H_IG, fonts, job)
                print(ig.name, "steps, no photo")
        if os.environ.get("SOCIAL_STILLS_ONLY"):
            print("Stills only.")
        else:
            with tempfile.TemporaryDirectory(prefix="checkedlab-shorts-") as tmp:
                render_shorts(fonts, jobs, Path(tmp))
            print("Social cards rendered.")
    if week in ("", "3"):
        render_week3(fonts)


if __name__ == "__main__":
    main()
