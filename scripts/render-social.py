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
  a product; it is still reset to type so the 4:5 frame is a card, not a
  photo over an empty lower half.

Run: python3 scripts/render-social.py
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
    r"maker specs|we didn't test|we did not test|MAKER SPECS",
    re.I,
)

# Same order as productType() in assets/card.js for the models these posts name.
TYPE_RULES = [
    (re.compile(r"air purifier|core 600|5500-2|hpa300", re.I), "Air purifier"),
    (re.compile(r"vacuum", re.I), "Cordless vacuum"),
    (re.compile(r"headphone|airpod|bose|wh-1000", re.I), "Headphones"),
    (re.compile(r"blender|vitamix", re.I), "Blender"),
    (re.compile(r"litter", re.I), "Litter box"),
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


def spec_block_height(fonts, value, width):
    label_font = fonts.sans(16, 650)
    value_font = fonts.sans(26, 520)
    lines = wrap(checked(value), value_font, width)
    return 22 + len(lines) * leading(value_font, 0.16) + 8, label_font, value_font, lines


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
    text_w = card_w - 60
    measured = []
    for side in sides:
        blocks = []
        for label, value in side["specs"]:
            height, label_font, value_font, lines = spec_block_height(fonts, value, text_w)
            blocks.append((label, height, label_font, value_font, lines))
        side["blocks"] = blocks
        measured.append(blocks)
    row_h = [max(pair[i][1] for pair in measured) for i in range(len(measured[0]))]
    for index, side in enumerate(sides):
        box = (64 + index * (card_w + gap), y, 64 + index * (card_w + gap) + card_w, y + card_h)
        draw_spec_card(draw, fonts, box, side, row_h)
    image.save(path, "PNG", optimize=True)
    return sides


def draw_spec_card(draw, fonts, box, side, row_h):
    x0, y0, x1, y1 = box
    draw.rounded_rectangle(box, radius=20, fill=CARD, outline=HAIR, width=2)
    draw.rectangle((x0 + 2, y0 + 22, x0 + 8, y1 - 22), fill=GREEN)
    pad_x = 32
    text_w = (x1 - x0) - pad_x - 28
    tx = x0 + pad_x
    brand_font = fonts.sans(16, 700)
    model_font = fonts.news(44, 620)
    type_font = fonts.sans(22, 450)
    model_lines = wrap(checked(side["model"]), model_font, text_w)
    blocks = side["blocks"]
    model_step = leading(model_font, 0.08)
    model_h = 2 * model_step
    type_h = 36
    head = 36 + 28 + 10 + model_h + 8 + type_h + 28
    specs_h = sum(row_h)
    extra = max(0, (y1 - y0) - head - specs_h - 36)
    gap = extra // (len(blocks) + 1)
    y = y0 + 32
    draw_tracked(draw, (tx, y), side["brand"].upper(), brand_font, GREEN, 2.4)
    y += 36
    y = draw_lines(draw, tx, y, model_lines, model_font, INK, model_step)
    y += (2 - len(model_lines)) * model_step
    y += 8
    draw.text((tx, y), side["type"], font=type_font, fill=MUTED)
    y += type_h
    draw.line((tx, y, x1 - 28, y), fill=HAIR, width=2)
    y += 8 + gap
    for index, (label, height, label_font, value_font, lines) in enumerate(blocks):
        start = y
        draw.text((tx, y), label, font=label_font, fill=MUTED)
        draw_lines(draw, tx, y + 24, lines, value_font, INK, leading(value_font, 0.16))
        y = start + row_h[index] + gap
    if y > y1 + 4:
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


RECALL_STEPS = [
    "Confirm the model number on the box, in the manual, and on the listing. A family name is not the model number.",
    "Search that model on CPSC Recalls and on Health Canada recalls and safety alerts.",
    "Read the return window on the store page before you pay.",
]


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
            "kind": "steps",
            "ig": "2026-11/ig/02-recall-cover.png",
            "short": "2026-11/shorts/black-friday-recall-check.mp4",
            "short_i": 0,
            "eyebrow": "BLACK FRIDAY 2026",
            "title": "A sale listing is not a recall check.",
            "deck": "Match the model number before you pay.",
            "url": "checkedlab.com/black-friday/",
            "steps": RECALL_STEPS,
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
    entities = load_entities()
    fonts = Fonts()
    jobs = posts()
    for job in jobs:
        job["_entities"] = entities
        ig = SOCIAL / job["ig"]
        if job["kind"] == "pair":
            sides = draw_pair(ig, H_IG, fonts, job, entities)
            print(ig.name)
            for side in sides:
                print(" ", side["brand"], side["model"], side["type"], "from", side["file"])
                for label, value in side["specs"]:
                    print("   ", label + ":", value)
        else:
            draw_steps(ig, H_IG, fonts, job)
            print(ig.name, "steps, no photo")
    if os.environ.get("SOCIAL_STILLS_ONLY"):
        print("Stills only.")
        return
    with tempfile.TemporaryDirectory(prefix="checkedlab-shorts-") as tmp:
        render_shorts(fonts, jobs, Path(tmp))
    print("Social cards rendered.")


if __name__ == "__main__":
    main()
