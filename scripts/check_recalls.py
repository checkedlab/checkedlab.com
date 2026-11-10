#!/usr/bin/env python3
"""Match Checked Lab products against public recall feeds.

US: CPSC Recalls API, https://www.saferproducts.gov/RestWebServices/Recall
CA: Health Canada Recalls & Safety Alerts open data, dataset
    d38de914-c94c-429b-8ab1-8776c31643e3

A BIN requires the brand and a model token in the same record.
A brand-only hit is not a BIN. A listing with no confirmed model is
"unconfirmed" when that brand has any recall, never "none" and never BIN.
Prices are not touched.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_PATH = ROOT / "products.json"
RECALLS_PATH = ROOT / "recalls.json"

HC_DATASET = "d38de914-c94c-429b-8ab1-8776c31643e3"
HC_URL = "https://recalls-rappels.canada.ca/sites/default/files/opendata-donneesouvertes/HCRSAMOpenData.json"
CPSC_ENDPOINT = "https://www.saferproducts.gov/RestWebServices/Recall"
TODAY = datetime.now(timezone.utc).date().isoformat()


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def token_present(haystack: str, token: str) -> bool:
    """Match a model token without hitting it inside a longer digit run.

    'e310' matches 'E310' and not the VIN fragment 'TE310' or 'E3100'.
    'dt201' matches 'DT201C' because a trailing letter is still that model.
    A token with ® must keep the mark, so the colour word 'purple' does not match.
    """
    if "®" in token:
        word = normalize(token)
        return re.search(rf"(?<![a-z0-9]){re.escape(word)}\s*®", haystack, re.I) is not None
    needle = normalize(token)
    if not needle:
        return False
    if " " in needle:
        return f" {needle} " in f" {normalize(haystack)} "
    pattern = rf"(?<![a-z0-9]){re.escape(needle)}(?![0-9])"
    return re.search(pattern, haystack.lower()) is not None


def record_text(parts: list) -> str:
    return "\n".join(str(part) for part in parts if part)


def cpsc_text(record: dict) -> str:
    products = record.get("Products") or []
    names = []
    for product in products:
        if isinstance(product, dict):
            names.extend([product.get("Name"), product.get("Description"), product.get("Model")])
    return record_text([record.get("Title"), record.get("Description"), record.get("URL"), *names])


def hc_text(record: dict) -> str:
    return record_text([
        record.get("Title"),
        record.get("Product"),
        record.get("Issue"),
        record.get("Category"),
        record.get("URL"),
    ])


def hit_from(record: dict, text: str, source: str) -> dict:
    title = record.get("Title") or "Recall"
    url = record.get("URL") or ""
    if source == "CPSC" and not url:
        number = record.get("RecallNumber")
        url = f"https://www.cpsc.gov/Recalls" if not number else record.get("URL") or ""
    date = record.get("RecallDate") or record.get("Last updated") or ""
    if isinstance(date, str) and "T" in date:
        date = date.split("T", 1)[0]
    return {
        "title": " ".join(str(title).split()),
        "url": url,
        "date": str(date)[:10],
        "source": source,
        "archived": bool(record.get("Archived") in (1, "1", True)),
        "text": text,
    }


def classify(product: dict, hits: list[dict]) -> dict:
    match = product.get("recallMatch") or {}
    brands = match.get("brand") or []
    models = match.get("models") or []
    family = match.get("family") or []
    confirmed = match.get("modelConfirmed", True)

    def has_any(tokens: list, text: str) -> bool:
        return any(token_present(text, token) for token in tokens)

    model_hits = []
    family_hits = []
    brand_hits = []
    for hit in hits:
        text = hit["text"]
        if not has_any(brands, text):
            continue
        brand_hits.append(hit)
        if models and has_any(models, text):
            model_hits.append(hit)
        elif family and has_any(family, text):
            family_hits.append(hit)

    def public(hit: dict) -> dict:
        return {
            "title": hit["title"],
            "url": hit["url"],
            "date": hit["date"],
            "source": hit["source"],
            "archived": hit["archived"],
        }

    if confirmed and model_hits:
        first = model_hits[0]
        archived = " Archived record." if first["archived"] else ""
        return {
            "status": "bin",
            "checkedAt": TODAY,
            "url": first["url"],
            "detail": f"{first['source']} recall matches this model: {first['title']}.{archived}",
            "other": [public(hit) for hit in model_hits[:3]],
        }

    if not confirmed and brand_hits:
        first = brand_hits[0]
        return {
            "status": "unconfirmed",
            "checkedAt": TODAY,
            "url": first["url"],
            "detail": "Model number for this listing is not confirmed, so this is not marked recalled or clear.",
            "other": [public(hit) for hit in brand_hits[:3]],
        }

    if not confirmed:
        return {
            "status": "none",
            "checkedAt": TODAY,
            "url": None,
            "detail": "No brand recall was found, and this listing's model number is still not confirmed.",
            "other": [],
        }

    return {
        "status": "none",
        "checkedAt": TODAY,
        "url": None,
        "detail": None,
        "other": [public(hit) for hit in family_hits[:3]],
    }


def fetch_json(url: str):
    request = urllib.request.Request(url, headers={"User-Agent": "checkedlab-recall-check/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response:
        return json.load(response)


def cpsc_hits(queries: list[str]) -> list[dict]:
    found = {}
    for query in queries:
        for field in ("RecallTitle", "RecallDescription"):
            url = f"{CPSC_ENDPOINT}?format=json&{field}={urllib.parse.quote(query)}"
            try:
                payload = fetch_json(url)
            except Exception as error:
                raise RuntimeError(f"CPSC query failed for {query!r}: {error}") from error
            if not isinstance(payload, list):
                raise RuntimeError(f"CPSC returned an unexpected payload for {query!r}")
            for record in payload:
                key = record.get("RecallID") or record.get("RecallNumber") or record.get("URL")
                text = cpsc_text(record)
                found[key] = hit_from(record, text, "CPSC")
    return list(found.values())


def hc_hits() -> list[dict]:
    try:
        payload = fetch_json(HC_URL)
    except Exception as error:
        raise RuntimeError(f"Health Canada open data download failed: {error}") from error
    if not isinstance(payload, list):
        raise RuntimeError("Health Canada open data was not a list")
    return [hit_from(record, hc_text(record), "Health Canada") for record in payload]


def apply(products: list, us_hits: list[dict], ca_hits: list[dict]) -> None:
    for product in products:
        us = classify(product, us_hits)
        ca = classify(product, ca_hits)
        if us["status"] == "none":
            us["url"] = CPSC_ENDPOINT
        if ca["status"] == "none":
            ca["url"] = f"https://open.canada.ca/data/en/dataset/{HC_DATASET}"
        product["recall"] = {"us": us, "ca": ca}
        kept = [item for item in (product.get("bin") or []) if item.get("sourceKind") != "recall"]
        for region, result in (("us", us), ("ca", ca)):
            if result["status"] != "bin":
                continue
            for hit in result["other"]:
                kept.append({
                    "region": region,
                    "reason": result["detail"],
                    "source": hit["source"],
                    "url": hit["url"],
                    "sourceKind": "recall",
                })
        product["bin"] = kept


def write_recalls(products: list) -> None:
    RECALLS_PATH.write_text(json.dumps({
        "checkedAt": TODAY,
        "sources": {
            "us": {"name": "CPSC SaferProducts Recall API", "url": CPSC_ENDPOINT},
            "ca": {
                "name": "Health Canada Recalls and Safety Alerts open data",
                "dataset": HC_DATASET,
                "url": HC_URL,
            },
        },
        "products": {
            product["id"]: product.get("recall")
            for product in products
        },
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def self_test() -> None:
    honda = hit_from({
        "Title": "CPSC, American Honda Motor Co. Announce Recall of ATVs",
        "Description": "TRX500FM Foreman 4x4 1HFTE310*54000015",
        "URL": "https://example.com/honda",
    }, "CPSC, American Honda Motor Co. Announce Recall of ATVs TRX500FM 1HFTE310*54000015", "CPSC")
    foodi = hit_from({
        "Title": "SharkNinja Recalls Foodi Multi-Function Pressure Cookers",
        "Description": "Model numbers OP300, OP301, OP302.",
        "URL": "https://example.com/op300",
        "RecallDate": "2025-05-01T00:00:00",
    }, "SharkNinja Recalls Foodi pressure cookers OP300 OP301", "CPSC")
    cosori = hit_from({
        "Title": "COSORI Air Fryers Recalled",
        "Description": "model numbers include CS158-AF",
        "URL": "https://example.com/cosori",
    }, "COSORI air fryers CS158-AF", "CPSC")
    exact = hit_from({
        "Title": "Example recalls the DT201C",
        "URL": "https://example.com/dt201",
    }, "Ninja Foodi DT201C air fry oven", "CPSC")

    vitamix = {"recallMatch": {"brand": ["vitamix"], "models": ["e310"], "family": ["e310"], "modelConfirmed": True}}
    assert classify(vitamix, [honda])["status"] == "none", classify(vitamix, [honda])

    ninja = {"recallMatch": {"brand": ["ninja", "sharkninja"], "models": ["dt201", "dt201c"], "family": ["foodi"], "modelConfirmed": True}}
    family = classify(ninja, [foodi])
    assert family["status"] == "none", family
    assert family["other"], family

    binned = classify(ninja, [exact])
    assert binned["status"] == "bin", binned

    unclear = {"recallMatch": {"brand": ["cosori"], "models": [], "family": ["air fryer"], "modelConfirmed": False}}
    result = classify(unclear, [cosori])
    assert result["status"] == "unconfirmed", result
    purple = {"recallMatch": {"brand": ["purple innovation", "purple®"], "models": ["harmony"], "family": ["pillow"], "modelConfirmed": True}}
    lounger = hit_from({
        "Title": "Wayfair recalls purple baby loungers",
        "URL": "https://example.com/lounger",
    }, "Wayfair recalls purple baby loungers", "CPSC")
    assert classify(purple, [lounger])["status"] == "none"
    assert classify(purple, [lounger])["other"] == []
    marked = hit_from({
        "Title": "Purple Innovation recalls the Purple® Harmony pillow",
        "URL": "https://example.com/harmony",
    }, "Purple Innovation recalls the Purple® Harmony pillow", "CPSC")
    assert classify(purple, [marked])["status"] == "bin"
    assert token_present("CS158-AF", "cs158")
    assert not token_present("CS158-AF", "cs358")
    assert not token_present("1HFTE310*54000015", "e310")
    assert not token_present("E3100", "e310")
    print("self-test ok")


def main() -> int:
    if "--self-test" in sys.argv:
        self_test()
        return 0
    products = json.loads(PRODUCTS_PATH.read_text(encoding="utf-8"))
    queries = []
    for product in products:
        match = product.get("recallMatch") or {}
        queries.extend(match.get("brand") or [])
        queries.extend(match.get("models") or [])
        queries.extend(match.get("family") or [])
    queries = sorted({query for query in queries if query})
    print(f"Checking {len(products)} products, {len(queries)} CPSC queries")
    us_hits = cpsc_hits(queries)
    ca_hits = hc_hits()
    print(f"CPSC records {len(us_hits)}, Health Canada records {len(ca_hits)}")
    apply(products, us_hits, ca_hits)
    PRODUCTS_PATH.write_text(json.dumps(products, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_recalls(products)
    for product in products:
        us = product["recall"]["us"]["status"]
        ca = product["recall"]["ca"]["status"]
        print(f"{product['id']}: US {us}, CA {ca}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1)
