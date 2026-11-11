import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, statSync, cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const card = require(join(root, "assets/card.js"));

const ORIGIN = "https://www.checkedlab.com";
const START = "<!-- checkedlab:cards start -->";
const END = "<!-- checkedlab:cards end -->";
const DISCLOSURE = '<div class="disclosure"><strong>Affiliate disclosure.</strong> As an Amazon Associate I earn from qualifying purchases. Other store links earn us nothing.</div>';
const BIN_EMPTY = '<p class="empty">Nothing is on the BIN list. A product lands here only when a recall record matches its brand and model. An unconfirmed model is not a BIN.</p>';
const HUBS = ["winter", "car-garage", "air-water", "pet", "kitchen", "sleep", "personal-tech"];
const HUB_NAME = {
  winter: "Winter",
  "car-garage": "Car & garage",
  "air-water": "Air & water",
  pet: "Pet",
  kitchen: "Kitchen",
  sleep: "Sleep",
  "personal-tech": "Personal tech"
};
const ICONS = {
  winter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M4 8l16 8M20 8L4 16"/></svg>',
  "car-garage": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h16v4H4zM6 14l2-4h8l2 4"/><circle cx="7.5" cy="18" r="1.2"/><circle cx="16.5" cy="18" r="1.2"/></svg>',
  "air-water": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4c3 3 5 5.5 5 8.5a5 5 0 1 1-10 0C7 9.5 9 7 12 4z"/></svg>',
  pet: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="6.5" cy="13" r="1.6"/><circle cx="17.5" cy="13" r="1.6"/><path d="M9 16c.8 2 5.2 2 6 0"/></svg>',
  kitchen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10h12v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM9 10V7M15 10V7"/></svg>',
  sleep: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5a7 7 0 1 0 4 12 8 8 0 1 1-4-12z"/></svg>',
  "personal-tech": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 16 0"/><path d="M4 12v3a2 2 0 0 0 2 2h1v-5H4zM20 12v3a2 2 0 0 1-2 2h-1v-5h3z"/></svg>'
};
const NAV = [
  ["winter", "Winter"],
  ["car-garage", "Car & garage"],
  ["air-water", "Air & water"],
  ["pet", "Pet"],
  ["kitchen", "Kitchen"],
  ["sleep", "Sleep"],
  ["personal-tech", "Personal tech"]
];
const POPULAR_IDS = [
  "vitamix-e310",
  "kitchenaid-artisan",
  "instant-pot-duo-plus",
  "coway-ap-1512hh",
  "sony-wh-1000xm5",
  "gopro-hero13",
  "ninja-crispi-fn101",
  "breville-bes870xl"
];
/* Gift and seasonal models already in the catalogue, including every model a recall explainer names. */
const BF_PICKS = {
  winter: [
    "lasko-ct32150",
    "lasko-ct14401",
    "dreo-atom-316",
    "vornado-avh2",
    "delonghi-trd40615e",
    "levoit-classic-300s",
    "honeywell-hev615w",
    "sunbeam-tsl8ws",
    "stanley-classic-1-5",
    "pendleton-eco-wise"
  ],
  "car-garage": [
    "noco-gb40",
    "noco-gb50",
    "garmin-dash-mini-2",
    "fanttik-x8-apex",
    "dewalt-dcd771",
    "viair-88p",
    "ctek-mxs-5"
  ],
  "air-water": [
    "coway-ap-1512hh",
    "levoit-core-300s-p",
    "levoit-core-600s",
    "blueair-211i-max",
    "honeywell-hpa300",
    "winix-5500-2",
    "brita-tahoe-elite"
  ],
  pet: [
    "litter-robot-4",
    "furbo-360",
    "petlibro-plaf105",
    "whisker-feeder-robot",
    "petsafe-drinkwell-platinum",
    "kong-classic",
    "furminator-medium-short"
  ],
  kitchen: [
    "cosori-pro-5-8",
    "ninja-crispi-fn101",
    "ninja-foodi-10in1",
    "ninja-creami-nc301",
    "instant-pot-duo-plus",
    "vitamix-e310",
    "kitchenaid-artisan",
    "breville-bes870xl",
    "fellow-stagg-ekg",
    "cuisinart-dfp-14bcny"
  ],
  sleep: [
    "hatch-restore-3",
    "purple-harmony",
    "coop-original-pillow",
    "tempur-neck",
    "lectrofan-classic",
    "philips-hf3520",
    "manta-sleep-mask",
    "casper-original",
    "brooklinen-luxe-core"
  ],
  "personal-tech": [
    "sony-wh-1000xm5",
    "bose-qc-ultra",
    "airpods-pro-3",
    "anker-a1289",
    "anker-nano-30w",
    "gopro-hero13",
    "jbl-charge-5",
    "garmin-forerunner-265",
    "logitech-mx-master-3s",
    "shokz-openrun-pro-2",
    "oral-b-io-3"
  ]
};
const BF_PATH = "/black-friday/";
const BF_TITLE = "Black Friday 2026: check the model before you buy";
const BF_DESC = "Before you buy on Black Friday, confirm the model number and read the dated CPSC or Health Canada check. Catalogue cards for gifts and seasonal buys.";
const US_DATES = "Amazon announced that Black Friday Week and Cyber Monday deals on Amazon.com run November 19–30, 2026.";
const CA_DATES = "Amazon.ca’s Black Friday page, titled 2026 Black Friday, describes Black Friday Week as November 19–27.";
const US_DEALS = "https://www.amazon.com/blackfriday?tag=checkedlab01-20";
const CA_DEALS = "https://www.amazon.ca/blackfriday?tag=checkedlab-20";
const POP_START = "<!-- checkedlab:popular start -->";
const POP_END = "<!-- checkedlab:popular end -->";
const REC_START = "<!-- checkedlab:recalls start -->";
const REC_END = "<!-- checkedlab:recalls end -->";
const SOURCE_LABELS = {
  "https://www.saferproducts.gov/RestWebServices/Recall": "CPSC SaferProducts",
  "https://open.canada.ca/data/en/dataset/d38de914-c94c-429b-8ab1-8776c31643e3": "Health Canada open dataset"
};
const COMMERCE = /^(offers|price|priceCurrency|lowPrice|highPrice|aggregateRating|review|reviewRating|ratingValue|ratingCount|reviewCount)$/i;
const FONT_PRELOAD = '<link rel="preload" href="/assets/fonts/source-sans-3-latin.woff2" as="font" type="font/woff2" crossorigin fetchpriority="low">';
const HOME_START = "<!-- checkedlab:recall-home start -->";
const HOME_END = "<!-- checkedlab:recall-home end -->";
const RECALL_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8v4H8zM7 7h10v14H7z"/><path d="M9 12h6M9 16h4"/></svg>';
const REV_PATH = join(root, "data", "page-rev.json");
const FEED_LOG_PATH = join(root, "data", "recall-feed.json");
const CA_DATASET_PAGE = "https://open.canada.ca/data/en/dataset/d38de914-c94c-429b-8ab1-8776c31643e3";

const products = JSON.parse(readFileSync(join(root, "products.json"), "utf8"));
const recalls = JSON.parse(readFileSync(join(root, "recalls.json"), "utf8"));
const explainers = JSON.parse(readFileSync(join(root, "data", "explainers.json"), "utf8"));
const compares = JSON.parse(readFileSync(join(root, "data", "compares.json"), "utf8"));
assertProducts(products);
assertRenderer();

const byHub = new Map(HUBS.map((hub) => [hub, products.filter((product) => product.category === hub)]));

for (const hub of HUBS) {
  const file = join(root, hub, "index.html");
  let html = readFileSync(file, "utf8");
  html = fillMount(html, byHub.get(hub).map((product, index) => card.card(product, "US", index === 0 ? { eager: true } : {})).join("\n"));
  const lead = byHub.get(hub).find((product) => card.schemaImage(product));
  html = ensureImagePreload(html, lead);
  html = pointItemList(html, hub);
  html = ensureChrome(ensureFontPreload(ensureCardScript(html)), hub);
  const hubExtra = explainers.filter((entry) => entry.hub === hub).map((entry) =>
    '<a href="/recalls/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>"
  ).concat(compares.filter((entry) => entry.hub === hub).map((entry) =>
    '<a href="/compare/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>"
  )).join(" ");
  const hubBase = '<p class="lede"><a href="/recalls/">Recall checks</a> for ' + card.esc(HUB_NAME[hub]) + " models.</p>";
  const hubNext = '<p class="lede"><a href="/recalls/">Recall checks</a> for ' + card.esc(HUB_NAME[hub]) + " models." + (hubExtra ? " " + hubExtra + "." : "") + "</p>";
  if (html.includes(hubBase)) html = html.replace(hubBase, hubNext);
  else if (!html.includes("Recall checks</a> for " + HUB_NAME[hub])) {
    html = html.replace('<div class="wrap">\n<div id="product-mount"', '<div class="wrap">\n' + hubNext + '\n<div id="product-mount"');
  }
  for (const entry of compares.filter((item) => item.hub === hub)) {
    const href = "/compare/" + entry.slug + "/";
    if (html.includes(href)) continue;
    const needle = "Recall checks</a> for " + card.esc(HUB_NAME[hub]) + " models.";
    const at = html.indexOf(needle);
    if (at < 0) throw new Error("Hub lede missing for " + hub);
    const end = html.indexOf("</p>", at);
    html = html.slice(0, end) + ' <a href="' + href + '">' + card.esc(entry.linkLabel) + "</a>" + html.slice(end);
  }
  writeFileSync(file, html);
}

{
  const file = join(root, "index.html");
  let html = readFileSync(file, "utf8");
  const byId = new Map(products.map((product) => [product.id, product]));
  const popular = POPULAR_IDS.map((id) => byId.get(id)).filter(Boolean);
  const recallsOnHome = products.filter(isBin);
  html = fillMount(html, popular.map((product) => card.card(product, "US")).join("\n"), POP_START, POP_END);
  html = fillMount(html, recallsOnHome.length ? recallsOnHome.map((product) => card.card(product, "US")).join("\n") : '<p class="empty">No official model recall is on the list.</p>', REC_START, REC_END);
  html = fillHomePointer(html, recalls.checkedAt || "");
  html = ensureChrome(ensureFontPreload(ensureCardScript(html)), "home");
  writeFileSync(file, html);
}

{
  const file = join(root, "bin-list", "index.html");
  let html = readFileSync(file, "utf8");
  const shown = products.filter(isBin);
  html = fillMount(html, shown.length ? shown.map((product) => card.card(product, "US")).join("\n") : BIN_EMPTY);
  html = ensureChrome(ensureFontPreload(ensureCardScript(html)), "bin");
  writeFileSync(file, html);
}

const pages = [];
for (const product of products) {
  const dir = join(root, product.category, product.id);
  mkdirSync(dir, { recursive: true });
  const html = ensureChrome(ensureFontPreload(productPage(product)), product.category);
  writeFileSync(join(dir, "index.html"), html);
  pages.push(product);
}

for (const hub of HUBS) {
  for (const entry of readdirSync(join(root, hub))) {
    const full = join(root, hub, entry);
    if (!statSync(full).isDirectory()) continue;
    if (!products.some((product) => product.category === hub && product.id === entry)) {
      rmSync(full, { recursive: true, force: true });
    }
  }
}

for (const rel of ["how-we-check/index.html", "404.html"]) {
  const file = join(root, rel);
  const current = rel.startsWith("how-we-check") ? "how" : "missing";
  writeFileSync(file, ensureChrome(ensureFontPreload(readFileSync(file, "utf8")), current));
}

const ordered = catalogueOrder(products);
writeRecallsPage(ordered);
writeExplainers();
writeCompares();
writeRecallFeed(ordered);
writeBlackFriday();
const lastmods = stampPages(ordered);
writeSitemap(pages, lastmods);
verifyOutput(pages);
publishDist();
console.log(`Wrote ${pages.length} product pages, ${HUBS.length} hub card lists, /recalls/, and /black-friday/.`);

function assertProducts(list) {
  if (!Array.isArray(list) || !list.length) throw new Error("products.json is empty");
  const ids = new Set();
  for (const product of list) {
    if (!HUBS.includes(product.category)) throw new Error("Unknown category: " + product.category);
    if (!/^[a-z0-9-]+$/.test(product.id || "")) throw new Error("Unsafe product id: " + product.id);
    if (ids.has(product.id)) throw new Error("Duplicate product id: " + product.id);
    ids.add(product.id);
  }
}

function assertRenderer() {
  const bin = card.card({
    id: "example-bin",
    title: "Example bin model",
    category: "kitchen",
    model: "EX-1",
    meta: "EXAMPLE",
    evidence: [],
    checks: ["Read the recall line on this card before you buy."],
    recall: {
      us: { status: "bin", detail: "A recall matches this model.", url: "https://www.cpsc.gov/Recalls/example" }
    }
  }, "US");
  for (const bit of ['data-category="kitchen"', "badge-bin", "Official recall found", "See specs and stores"]) {
    if (!bin.includes(bit)) throw new Error("BIN card missing " + bit);
  }
  if (bin.includes("p-side") || bin.includes("store-btn") || bin.includes("check-title") || bin.includes("evidence")) {
    throw new Error("Hub card includes a product-page block");
  }
  if (/\$\d/.test(bin) || bin.includes("offers")) throw new Error("Renderer emitted a price");
  const usStores = card.storeButtons(products[0], "US");
  if (!usStores.includes("checkedlab01-20") || usStores.includes("checkedlab-20")) {
    throw new Error("US card has the wrong Amazon tag");
  }
  const canada = card.storeButtons(products.find((product) => product.asin && product.asin.ca) || products[0], "CA");
  if (!canada.includes("checkedlab-20") || canada.includes("checkedlab01-20")) {
    throw new Error("CA card has the wrong Amazon tag");
  }
}

function isBin(product) {
  const recall = product.recall || {};
  return (recall.us || {}).status === "bin" || (recall.ca || {}).status === "bin" || (product.bin && product.bin.length);
}

function fillMount(html, inner, start = START, end = END) {
  const block = start + "\n" + inner + "\n" + end;
  const pattern = new RegExp(start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\s\\S]*?" + end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (pattern.test(html)) return html.replace(pattern, block);
  if (start !== START) throw new Error("Missing mount markers " + start);
  const mount = '<div id="product-mount"></div>';
  if (!html.includes(mount)) throw new Error("Missing #product-mount");
  return html.replace(mount, '<div id="product-mount" data-rendered-region="US">\n' + block + "\n</div>");
}

function pointItemList(html, hub) {
  for (const product of byHub.get(hub)) {
    const from = ORIGIN + "/" + hub + "/#" + product.id;
    const to = ORIGIN + card.productPath(product);
    html = html.split(from).join(to);
  }
  return html;
}

function ensureFontPreload(html) {
  if (html.includes(FONT_PRELOAD)) return html;
  if (html.includes("/assets/fonts/source-sans-3-latin.woff2")) {
    return html.replace(/<link rel="preload" href="\/assets\/fonts\/source-sans-3-latin\.woff2"[^>]*>/, FONT_PRELOAD);
  }
  return html.replace('<link rel="stylesheet"', FONT_PRELOAD + '\n<link rel="stylesheet"');
}

function ensureImagePreload(html, product) {
  const src = product ? card.schemaImage(product) : "";
  const link = src && !/^https:\/\//.test(src)
    ? '<link rel="preload" as="image" href="' + src + '" fetchpriority="high">'
    : "";
  if (html.includes('rel="preload" as="image"')) {
    return link ? html.replace(/<link rel="preload" as="image"[^>]*>/, link) : html.replace(/\n?<link rel="preload" as="image"[^>]*>/, "");
  }
  return link ? html.replace('<link rel="stylesheet"', link + '\n<link rel="stylesheet"') : html;
}

function ensureCardScript(html) {
  if (html.includes('src="/assets/card.js"')) return html;
  const site = '<script src="/assets/site.js"></script>';
  const siteDefer = '<script src="/assets/site.js" defer></script>';
  if (html.includes('src="/assets/card.js"')) {
    return html
      .replace('<script src="/assets/card.js"></script>', '<script src="/assets/card.js" defer></script>')
      .replace(site, siteDefer);
  }
  if (html.includes(siteDefer)) return html.replace(siteDefer, '<script src="/assets/card.js" defer></script>\n' + siteDefer);
  if (!html.includes(site)) throw new Error("Missing site.js");
  return html.replace(site, '<script src="/assets/card.js" defer></script>\n' + siteDefer);
}

function specList(product) {
  const specs = Array.isArray(product.specs) ? product.specs : [];
  if (!specs.length) return "";
  const rows = specs.map((spec) => {
    if (!spec || !spec.label || !spec.value || !spec.url) throw new Error("Incomplete spec on " + product.id);
    if (!/^https:\/\//.test(spec.url)) throw new Error("Spec source is not https on " + product.id);
    if (/\$\d/.test(spec.label + spec.value)) throw new Error("Spec looks like a price on " + product.id);
    const link = ' <a href="' + card.esc(spec.url) + '" target="_blank" rel="noopener">Source</a>';
    return '<div class="spec"><dt>' + card.esc(spec.label) + "</dt><dd>" + card.esc(spec.value) + link + "</dd></div>";
  }).join("");
  return '<h2 class="check-title">Key specs</h2><p>' + card.esc(specsSentence(product)) + '</p><dl class="specs">' + rows + "</dl>";
}

function recallSentence(rec, place) {
  if (rec.status === "bin") return "A " + place + " recall matches this model.";
  if (rec.status === "none" && rec.checkedAt) return "No " + place + " recall found as of " + rec.checkedAt + ".";
  if (rec.status === "unconfirmed") return "The " + place + " recall status is not confirmed for this listing.";
  return "A " + place + " recall check has not been recorded for this listing.";
}

function descriptionFor(product) {
  const us = card.recallFor(product, "US");
  const ca = card.recallFor(product, "CA");
  return [
    product.title + ".",
    recallSentence(us, "US"),
    recallSentence(ca, "Canadian")
  ].join(" ");
}

function specsSentence(product) {
  return Array.isArray(product.specs) && product.specs.length ? "Specs from the maker, with a source link." : "";
}

function pageTitle(product) {
  return product.title + " — CPSC and Health Canada recall check | Checked Lab";
}

function metaDescription(product) {
  const extra = specsSentence(product);
  return extra ? descriptionFor(product) + " " + extra : descriptionFor(product);
}

function modelLabel(product) {
  return product.model || product.title;
}

function modelFindAnswer(product) {
  const named = modelLabel(product);
  if (product.sourceName && product.sourceUrl && /^https:\/\//.test(product.sourceUrl)) {
    return "The model name on this page is " + named + ". The maker page for that name is the " + product.sourceName + " page.";
  }
  return "The model name on this page is " + named + ".";
}

function canadaAsin(product) {
  const asin = product.asin && product.asin.ca;
  return typeof asin === "string" && /^[A-Z0-9]{10}$/.test(asin) ? asin : "";
}

function faqItems(product) {
  const us = card.recallFor(product, "US");
  const ca = card.recallFor(product, "CA");
  const items = [
    { q: "Is the " + product.title + " recalled in the US?", a: recallSentence(us, "US") },
    { q: "Is the " + product.title + " recalled in Canada?", a: recallSentence(ca, "Canadian") }
  ];
  const specs = specsSentence(product);
  if (specs) items.push({ q: "Where do the specs come from?", a: specs });
  items.push({ q: "How to find the model number?", a: modelFindAnswer(product) });
  return items;
}

function otherNotices(rec) {
  if (!rec || rec.status === "bin" || !Array.isArray(rec.other)) return [];
  return rec.other.filter((item) => item && item.url);
}

function otherLine(item) {
  const bits = [item.date, item.source].filter(Boolean).map((bit) => card.esc(bit)).join(", ");
  const when = bits ? " (" + bits + ")" : "";
  return '<p class="recall-other">This is a different model. <a href="' + href(item.url) + '" target="_blank" rel="noopener">' + card.esc(item.title || "Recall notice") + "</a>" + when + ".</p>";
}

function otherSection(product) {
  const lines = otherNotices(card.recallFor(product, "US")).concat(otherNotices(card.recallFor(product, "CA"))).map(otherLine);
  if (!lines.length) return "";
  return "<h3>Official recalls for other models in this brand</h3>" + lines.join("");
}

function datedParagraph(rec, place) {
  let source = "";
  if (rec.status === "bin" && rec.url) {
    source = ' and the <a href="' + href(rec.url) + '" target="_blank" rel="noopener">official notice</a>';
  } else if (rec.url) {
    const label = SOURCE_LABELS[rec.url] || "official source";
    source = ' and the <a href="' + href(rec.url) + '" target="_blank" rel="noopener">' + card.esc(label) + "</a> source";
  }
  const detail = rec.status === "bin" && rec.detail ? '<p class="recall recall-bin">' + card.esc(rec.detail) + "</p>" : "";
  return "<p><span>" + card.esc(recallSentence(rec, place)) + '</span> <a href="/recalls/">All recall checks</a>' + source + ".</p>" + detail;
}

function canadaBlock(product) {
  const sentence = recallSentence(card.recallFor(product, "CA"), "Canadian");
  const asin = canadaAsin(product);
  const asinLine = asin ? "<p>Amazon.ca ASIN " + card.esc(asin) + ".</p>" : "";
  return '<section class="canada-block"><h2>In Canada</h2><p>' + card.esc(sentence) + "</p>" + card.storeButtons(product, "CA") + asinLine + "</section>";
}

function faqHtml(product) {
  return '<section class="faq"><h2>Questions</h2>' + faqItems(product).map((item) =>
    "<h3>" + card.esc(item.q) + '</h3><p class="faq-a">' + card.esc(item.a) + "</p>"
  ).join("") + "</section>";
}

function modelFindHtml(product) {
  const link = product.sourceUrl && product.sourceName && /^https:\/\//.test(product.sourceUrl)
    ? '<p><a href="' + card.esc(product.sourceUrl) + '" target="_blank" rel="noopener">' + card.esc(product.sourceName) + "</a></p>"
    : "";
  return "<h3>How to find the model number</h3><p>" + card.esc(modelFindAnswer(product)) + "</p>" + link;
}

function siblingLinks(product) {
  const group = products.filter((item) => item.category === product.category);
  const index = group.findIndex((item) => item.id === product.id);
  const picks = [];
  if (group.length > 1) picks.push(group[(index + 1) % group.length]);
  if (group.length > 2) picks.push(group[(index + 2) % group.length]);
  const links = [
    '<a href="/' + product.category + '/">' + card.esc(HUB_NAME[product.category]) + "</a>",
    '<a href="/recalls/">Recall checks</a>',
    '<a href="/how-we-check/">How we check</a>',
    ...explainers.filter((entry) => entry.products.includes(product.id)).map((entry) =>
      '<a href="/recalls/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>"
    ),
    ...compares.filter((entry) => entry.products.includes(product.id)).map((entry) => {
      const other = products.find((item) => item.id === entry.products.find((id) => id !== product.id));
      return '<a href="/compare/' + entry.slug + '/">Compare with ' + card.esc(other.model || other.title) + "</a>";
    }),
    ...picks.map((item) => '<a href="' + card.productPath(item) + '">' + card.esc(item.title) + "</a>")
  ];
  return '<p class="lede">' + links.join(" ") + "</p>";
}

function jsonLd(product) {
  const hub = product.category;
  const url = ORIGIN + card.productPath(product);
  const productNode = {
    "@type": "Product",
    "@id": url + "#product",
    name: product.title,
    description: descriptionFor(product),
    url: url,
    category: HUB_NAME[hub]
  };
  const image = card.schemaImage(product);
  if (image && !/amazon\.com/i.test(image)) {
    productNode.image = /^https:\/\//.test(image) ? image : ORIGIN + image;
  }
  if (product.model) productNode.model = product.model;
  if (product.sourceName) productNode.brand = { "@type": "Brand", name: product.sourceName };
  const specs = Array.isArray(product.specs) ? product.specs : [];
  if (specs.length) {
    productNode.additionalProperty = specs.map((spec) => ({
      "@type": "PropertyValue",
      name: spec.label,
      value: spec.value,
      url: spec.url
    }));
  }
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
          { "@type": "ListItem", position: 2, name: HUB_NAME[hub], item: ORIGIN + "/" + hub + "/" },
          { "@type": "ListItem", position: 3, name: product.title, item: url }
        ]
      },
      productNode
    ]
  };
  const faqs = faqItems(product);
  graph["@graph"].push({
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a }
    }))
  });
  assertNoCommerce(graph);
  return JSON.stringify(graph, null, 2).replace(/</g, "\\u003c");
}

function assertNoCommerce(value) {
  if (Array.isArray(value)) {
    value.forEach(assertNoCommerce);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) {
    if (COMMERCE.test(key)) throw new Error("Product JSON-LD includes " + key);
    assertNoCommerce(value[key]);
  }
}

function nav(current) {
  return '<nav class="cats" aria-label="Hubs">\n' + NAV.map(([hub, label]) => {
    const currentAttr = hub === current ? ' aria-current="page"' : "";
    return '<a href="/' + hub + '/"' + currentAttr + ">" + ICONS[hub] + "<span>" + label + "</span></a>";
  }).join("\n") + "\n" + recallCatsLink(current) + '\n<a class="cats-util" href="/how-we-check/">How we check</a>\n<a class="cats-util" href="/bin-list/">BIN list</a>\n</nav>';
}

function productPage(product) {
  const hub = product.category;
  const name = HUB_NAME[hub];
  const url = ORIGIN + card.productPath(product);
  const title = pageTitle(product);
  const desc = metaDescription(product);
  const us = card.recallFor(product, "US");
  const ca = card.recallFor(product, "CA");
  const why = (product.evidence || []).length
    ? "Checked Lab lists this model so the recall check and the maker page are in one place. The lines below are what that maker page states."
    : "Checked Lab lists this model so the recall check and the maker page are in one place. No maker spec line is on this page yet.";
  return `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${card.esc(url)}">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.esc(title)}</title>
<meta name="description" content="${card.esc(desc)}">
${indexable(product) ? "" : '<meta name="robots" content="noindex">\n'}
<meta property="og:title" content="${card.esc(title)}">
<meta property="og:description" content="${card.esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${card.esc(url)}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Checked Lab. Checked before you buy.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${card.esc(title)}">
<meta name="twitter:description" content="${card.esc(desc)}">
<meta name="twitter:image" content="${ORIGIN}/assets/og.png">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/source-sans-3-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#F5F5F7">
<script type="application/ld+json">
${jsonLd(product)}
</script>
</head>
<body data-page="product" data-category="${card.esc(hub)}">
${DISCLOSURE}
<div class="topbar"><span>● CHECKED LAB • EST 2026 • NO SPONSORS</span><span>hello@checkedlab.com • press@checkedlab.com • legal@checkedlab.com</span></div>
<div class="masthead">
<header>
<a class="logo" href="/">CHECKED LAB <i>CHECKED BEFORE YOU BUY</i></a>
<div class="header-actions">
<div class="country-switch">
<button type="button" data-region-set="US">US</button>
<button type="button" data-region-set="CA">CA</button>
</div>
<nav>
<a href="/recalls/">RECALL CHECKS</a>
<a href="/how-we-check/">HOW WE CHECK</a>
<a href="/bin-list/">BIN LIST</a>
</nav>
</div>
</header>
${nav(hub)}
</div>

<main>
<div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<a href="/${hub}/">${card.esc(name)}</a>
<span aria-hidden="true">/</span>
<span aria-current="page">${card.esc(product.title)}</span>
</nav>
<article class="product-grid${card.schemaImage(product) ? "" : " no-photo"}" id="${card.esc(product.id)}" data-category="${card.esc(hub)}">
<div class="p-main">
<span class="only-us">${card.badgeHtml(us)}</span>
<span class="only-ca">${card.badgeHtml(ca)}</span>
<h1 class="p-title">${card.visibleTitle(product.title)}</h1>
<p class="p-meta">${card.esc(product.meta || "")}</p>
<h2 class="recall-q" id="is-it-recalled">Is the ${card.esc(product.title)} recalled?</h2>
${datedParagraph(us, "US")}
${datedParagraph(ca, "Canadian")}
${otherSection(product)}
${modelFindHtml(product)}
${canadaBlock(product)}
${faqHtml(product)}
<p class="p-note only-us">${card.esc(card.honestLine(product, us))}</p>
<p class="p-note only-ca">${card.esc(card.honestLine(product, ca))}</p>
<div class="only-us">${card.storeButtons(product, "US")}</div>
<div class="only-ca">${card.storeButtons(product, "CA")}</div>
<h2 class="check-title">Why it's listed</h2>
<p class="why-note">${card.esc(why)}</p>
${specList(product)}
${card.evidenceList(product)}
${card.checkList(product)}
<p class="price-note">Prices change often, check the current price at the store.</p>
<p class="affiliate-note">Amazon link is an affiliate link</p>
<div class="only-us">${card.storeButtons(product, "US")}</div>
<div class="only-ca">${card.storeButtons(product, "CA")}</div>
</div>
${card.imageColumn(product)}
</article>
${siblingLinks(product)}
</div>
</main>

<footer>
<div class="foot">
<p>As an Amazon Associate I earn from qualifying purchases.</p>
<p>© 2026 CHECKED LAB<br>Winnipeg, MB</p>
<p class="foot-mail"><a href="/recalls/">Recall checks</a><a href="/how-we-check/">How we check</a><a href="/bin-list/">BIN list</a><a href="mailto:hello@checkedlab.com">hello@</a><a href="mailto:support@checkedlab.com">support@</a><a href="mailto:press@checkedlab.com">press@</a><a href="mailto:legal@checkedlab.com">legal@</a></p>
</div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

function loadJson(file, fallback) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function recallCatsLink(current) {
  const currentAttr = current === "recalls" ? ' aria-current="page"' : "";
  return '<a href="/recalls/"' + currentAttr + ">" + RECALL_ICON + "<span>Recall checks</span></a>";
}

function ensureChrome(html, current) {
  const headerAnchor = "</div>\n<nav>\n<a href=\"/how-we-check/";
  if (html.includes(headerAnchor)) {
    const header = current === "recalls"
      ? '<a href="/recalls/" aria-current="page">RECALL CHECKS</a>'
      : '<a href="/recalls/">RECALL CHECKS</a>';
    html = html.replace(headerAnchor, "</div>\n<nav>\n" + header + "\n<a href=\"/how-we-check/");
  }
  const catsAnchor = '<a class="cats-util" href="/how-we-check/">';
  if (html.includes(catsAnchor) && !html.includes("<span>Recall checks</span>")) {
    html = html.replace(catsAnchor, recallCatsLink(current) + "\n" + catsAnchor);
  }
  const footAnchor = '<p class="foot-mail"><a href="/how-we-check/">How we check</a>';
  if (html.includes(footAnchor)) {
    html = html.replace(footAnchor, '<p class="foot-mail"><a href="/recalls/">Recall checks</a><a href="/how-we-check/">How we check</a>');
  }
  return html;
}

function homePointer(checkedAt) {
  const date = checkedAt || "";
  return '<p class="recall-pointer">Catalogue recall checks are dated <time datetime="' + card.esc(date) + '">' + card.esc(date) + '</time> (UTC). <a href="/recalls/">Recall checks</a> lists every model for the United States and Canada.</p>';
}

function fillHomePointer(html, checkedAt) {
  if (!html.includes(HOME_START)) {
    const anchor = '<h2 id="recall-title">Latest official recalls</h2>';
    if (!html.includes(anchor)) throw new Error("Homepage is missing the recall band");
    html = html.replace(anchor, anchor + "\n" + HOME_START + "\n" + HOME_END);
  }
  return fillMount(html, homePointer(checkedAt), HOME_START, HOME_END);
}

function catalogueOrder(list) {
  const ordered = [];
  for (const hub of HUBS) {
    for (const product of list) {
      if (product.category === hub) ordered.push(product);
    }
  }
  return ordered;
}

function recallRecord(product, region) {
  const fromProduct = product.recall && product.recall[region];
  const fromFile = recalls.products && recalls.products[product.id] && recalls.products[product.id][region];
  return fromProduct || fromFile || { status: "not_recorded" };
}

function href(url) {
  const value = String(url || "");
  if (!/^https:\/\//.test(value)) return "";
  return card.esc(value.replace(/ /g, "%20"));
}

function binEmptyHtml(date) {
  return '<p class="empty">No catalogue model is binned as of ' + card.esc(date) + ".</p>";
}

function otherLines(rec) {
  if (!rec || rec.status === "bin" || !Array.isArray(rec.other)) return "";
  return rec.other.map((item) => {
    if (!item || !item.url) return "";
    const bits = [item.date, item.source].filter(Boolean).map((bit) => card.esc(bit)).join(", ");
    const when = bits ? " (" + bits + ")" : "";
    return '<p class="recall-other">This is a different model. <a href="' + href(item.url) + '" target="_blank" rel="noopener">' + card.esc(item.title || "Recall notice") + "</a>" + when + ".</p>";
  }).join("");
}

function regionBody(rec, place) {
  if (rec.status === "bin") {
    const link = rec.url ? ' <a href="' + href(rec.url) + '" target="_blank" rel="noopener">Official notice</a>' : "";
    return '<p class="recall recall-bin"><strong>Official recall found.</strong> ' + card.esc(rec.detail || "A recall matches this model.") + link + "</p>";
  }
  const tone = rec.status === "none" ? "recall recall-clear" : "recall recall-wait";
  return '<p class="' + tone + '">' + card.esc(recallSentence(rec, place)) + "</p>" + otherLines(rec);
}

function modelArticle(product, region, place) {
  const rec = recallRecord(product, region);
  const model = product.model ? '<p class="p-meta">' + card.esc(product.model) + "</p>" : "";
  return '<article class="recall-model" id="' + card.esc(product.id) + "-" + region + '">' +
    card.badgeHtml(rec) +
    '<h3><a href="' + card.productPath(product) + '">' + card.visibleTitle(product.title) + "</a></h3>" +
    model + regionBody(rec, place) + "</article>";
}

function regionColumn(ordered, region, place) {
  return HUBS.map((hub) => {
    const group = ordered.filter((product) => product.category === hub);
    if (!group.length) return "";
    const articles = group.map((product) => modelArticle(product, region, place)).join("\n");
    return '<section class="recall-hub"><h3><a href="/' + hub + '/">' + card.esc(HUB_NAME[hub]) + "</a></h3>" + articles + "</section>";
  }).join("\n");
}

function binSection(ordered, date) {
  const binned = ordered.filter((product) => recallRecord(product, "us").status === "bin" || recallRecord(product, "ca").status === "bin");
  if (!binned.length) return "<h2>BIN</h2>\n" + binEmptyHtml(date);
  const items = binned.map((product) => {
    const where = [
      recallRecord(product, "us").status === "bin" ? "United States" : "",
      recallRecord(product, "ca").status === "bin" ? "Canada" : ""
    ].filter(Boolean).join(" and ");
    return "<li><a href=\"" + card.productPath(product) + "\">" + card.visibleTitle(product.title) + '</a> <span class="p-meta">' + card.esc(where) + "</span></li>";
  }).join("");
  return "<h2>BIN</h2>\n<p>These catalogue models match an official notice.</p>\n<ul>" + items + "</ul>";
}

function noticeList(items) {
  if (!items || !items.length) return '<p class="empty">No notice is stored for this side.</p>';
  return '<ul class="notice-list">' + items.map((item) => {
    const model = item.models ? '<p class="recall-models">' + card.esc(item.models) + "</p>" : "";
    const product = item.product ? '<p class="p-meta">Product: ' + card.esc(item.product) + "</p>" : "";
    const archived = item.archived ? ' <span class="p-meta">Archived record.</span>' : "";
    const when = [item.date, item.source].filter(Boolean).map((bit) => card.esc(bit)).join(" · ");
    return "<li><a href=\"" + href(item.url) + '" target="_blank" rel="noopener">' + card.esc(item.title || "Recall notice") + "</a>" + archived +
      '<p class="p-meta">' + when + "</p>" + product + model + "</li>";
  }).join("") + "</ul>";
}

function categorySection(date) {
  const list = Array.isArray(recalls.categories) ? recalls.categories : [];
  const any = list.some((cat) => (cat.us && cat.us.length) || (cat.ca && cat.ca.length));
  if (!any) {
    return '<section id="category-notices"><h2>Official notices in these categories</h2><p class="empty">No air fryer, heater, or power bank notices are stored with the ' + card.esc(date) + " check.</p></section>";
  }
  const blocks = list.map((cat) => {
    const hubName = HUB_NAME[cat.hub] || cat.title;
    const hubHref = HUBS.includes(cat.hub) ? "/" + cat.hub + "/" : "/recalls/";
    return '<section class="recall-cat" id="category-' + card.esc(cat.id || "notices") + '"><h3>' + card.esc(cat.title || "Notices") + '</h3><p class="lede"><a href="' + hubHref + '">' + card.esc(hubName) + " models</a></p><div class=\"recall-columns\"><div><h4>United States</h4>" + noticeList(cat.us) + "</div><div><h4>Canada</h4>" + noticeList(cat.ca) + "</div></div></section>";
  }).join("\n");
  return '<section id="category-notices"><h2>Official notices in these categories</h2><p>These lines are titles, dates, and model text copied from CPSC and Health Canada notices for air fryers, space heaters, and power banks. A notice can name models that are outside this catalogue. The link opens the official page.</p>' + blocks + "</section>";
}

function recallsDescription(date) {
  return "US and Canada recall status for every catalogue model, checked " + date + " (UTC). Official CPSC and Health Canada notices are linked.";
}

function recallsJsonLd(ordered, date) {
  const url = ORIGIN + "/recalls/";
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
          { "@type": "ListItem", position: 2, name: "Recall checks", item: url }
        ]
      },
      {
        "@type": "CollectionPage",
        "@id": url,
        name: "Recall checks",
        url: url,
        dateModified: date,
        inLanguage: "en",
        description: recallsDescription(date),
        mainEntity: {
          "@type": "ItemList",
          name: "Catalogue recall checks",
          numberOfItems: ordered.length,
          itemListElement: ordered.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: product.title,
            url: ORIGIN + card.productPath(product)
          }))
        }
      }
    ]
  };
  assertNoCommerce(graph);
  return JSON.stringify(graph, null, 2).replace(/</g, "\\u003c");
}

function explainerIndex() {
  return '<section id="explainers"><h2>Official notice explainers</h2><ul>' + explainers.map((entry) =>
    '<li><a href="/recalls/' + entry.slug + '/">' + card.esc(entry.title) + "</a></li>"
  ).join("") + "</ul></section>";
}

function explainerJsonLd(entry) {
  const url = ORIGIN + "/recalls/" + entry.slug + "/";
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
          { "@type": "ListItem", position: 2, name: "Recall checks", item: ORIGIN + "/recalls/" },
          { "@type": "ListItem", position: 3, name: entry.title, item: url }
        ]
      },
      {
        "@type": "Article",
        headline: entry.title,
        description: entry.description,
        dateModified: recalls.checkedAt,
        inLanguage: "en",
        mainEntityOfPage: url
      }
    ]
  };
  assertNoCommerce(graph);
  const types = graph["@graph"].map((node) => node["@type"]);
  if (types.join(",") !== "BreadcrumbList,Article") throw new Error("Explainer schema on " + entry.slug);
  return JSON.stringify(graph, null, 2).replace(/</g, "\\u003c");
}

function noticeHtml(notice) {
  if (!notice.url || !/^https:\/\//.test(notice.url)) throw new Error("Explainer notice needs an https URL");
  if (!Array.isArray(notice.models) || !notice.models.length) throw new Error("Explainer notice needs model text");
  const models = '<ul class="model-list">' + notice.models.map((model) => "<li>" + card.esc(model) + "</li>").join("") + "</ul>";
  return '<section class="notice"><h2>' + card.esc(notice.agency) + " · " + card.esc(notice.date) + "</h2>" +
    '<p><a href="' + href(notice.url) + '" target="_blank" rel="noopener">' + card.esc(notice.title) + "</a></p>" +
    "<h3>What the notice says</h3><p>" + card.esc(notice.says) + "</p>" +
    "<h3>" + card.esc(notice.modelsLabel) + "</h3>" + models +
    "<h3>How to check your model</h3><p>" + card.esc(notice.howToCheck) + "</p>" +
    "<h3>What the notice tells owners to do</h3><p>" + card.esc(notice.remedy) + "</p></section>";
}

function catalogueHtml(entry) {
  const rows = entry.products.map((id) => {
    const product = products.find((item) => item.id === id);
    if (!product) throw new Error("Explainer is missing catalogue id " + id);
    const us = recallSentence(card.recallFor(product, "US"), "US");
    const ca = recallSentence(card.recallFor(product, "CA"), "Canadian");
    return '<li><a href="' + card.productPath(product) + '">' + card.esc(product.title) + "</a>. " + card.esc(us) + " " + card.esc(ca) + "</li>";
  }).join("");
  return "<h2>Checked Lab catalogue</h2><p>" + card.esc(entry.catalogue) + "</p><ul>" + rows + "</ul>" +
    '<p class="lede"><a href="/recalls/">All recall checks</a> <a href="/' + entry.hub + '/">' + card.esc(HUB_NAME[entry.hub]) + "</a> <a href=\"/how-we-check/\">How we check</a></p>";
}

function sharedSpecRows(left, right) {
  const rows = [];
  for (const spec of left.specs || []) {
    const other = (right.specs || []).find((item) => item && item.label === spec.label);
    if (!other || !spec.value || !spec.url || !other.value || !other.url) continue;
    if (!/^https:\/\//.test(spec.url) || !/^https:\/\//.test(other.url)) {
      throw new Error("Compare spec source is not https for " + spec.label);
    }
    rows.push({ label: spec.label, left: spec, right: other });
  }
  if (!rows.length) throw new Error("Compare has no shared sourced specs: " + left.id);
  return rows;
}

function specCell(spec) {
  return card.esc(spec.value) + ' <a href="' + card.esc(spec.url) + '" target="_blank" rel="noopener">Source</a>';
}

function compareJsonLd(entry, pair) {
  const url = ORIGIN + "/compare/" + entry.slug + "/";
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
          { "@type": "ListItem", position: 2, name: entry.title, item: url }
        ]
      },
      {
        "@type": "Article",
        headline: entry.title,
        description: entry.description,
        dateModified: recalls.checkedAt,
        inLanguage: "en",
        mainEntityOfPage: url
      },
      {
        "@type": "ItemList",
        name: entry.title,
        numberOfItems: 2,
        itemListElement: pair.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: product.title,
          url: ORIGIN + card.productPath(product)
        }))
      }
    ]
  };
  assertNoCommerce(graph);
  return JSON.stringify(graph, null, 2).replace(/</g, "\\u003c");
}

function writeCompares() {
  if (compares.length !== 4) throw new Error("Expected four compare pages");
  for (const entry of compares) {
    if (!/^[a-z0-9-]+$/.test(entry.slug)) throw new Error("Bad compare slug");
    const pair = entry.products.map((id) => {
      const product = products.find((item) => item.id === id);
      if (!product) throw new Error("Compare is missing " + id);
      return product;
    });
    const rows = sharedSpecRows(pair[0], pair[1]);
    const head = pair.map((product) => "<th>" + card.esc(product.model || product.title) + "</th>").join("");
    const body = rows.map((row) =>
      "<tr><th>" + card.esc(row.label) + "</th><td>" + specCell(row.left) + "</td><td>" + specCell(row.right) + "</td></tr>"
    ).join("");
    const recallsHtml = pair.map((product) => {
      const us = recallSentence(card.recallFor(product, "US"), "US");
      const ca = recallSentence(card.recallFor(product, "CA"), "Canadian");
      return "<p><a href=\"" + card.productPath(product) + "\">" + card.esc(product.title) + "</a>. " + card.esc(us) + " " + card.esc(ca) + "</p>";
    }).join("");
    const stores = (region, heading) => "<h2>" + heading + "</h2>" + pair.map((product) =>
      "<h3>" + card.esc(product.model || product.title) + "</h3>" + card.storeButtons(product, region)
    ).join("");
    const fit = (entry.fit || []).map((paragraph) => "<p>" + card.esc(paragraph) + "</p>").join("");
    const url = ORIGIN + "/compare/" + entry.slug + "/";
    const html = `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${url}">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.esc(entry.title)} — Checked Lab</title>
<meta name="description" content="${card.esc(entry.description)}">
<meta property="og:title" content="${card.esc(entry.title)} — Checked Lab">
<meta property="og:description" content="${card.esc(entry.description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<link rel="icon" type="image/png" href="/favicon.png">
${FONT_PRELOAD}
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#F5F5F7">
<script type="application/ld+json">
${compareJsonLd(entry, pair)}
</script>
</head>
<body data-page="recalls">
${DISCLOSURE}
<div class="topbar"><span>● CHECKED LAB • EST 2026 • NO SPONSORS</span><span>hello@checkedlab.com • press@checkedlab.com • legal@checkedlab.com</span></div>
<div class="masthead">
<header>
<a class="logo" href="/">CHECKED LAB <i>CHECKED BEFORE YOU BUY</i></a>
<div class="header-actions">
<div class="country-switch">
<button type="button" data-region-set="US">US</button>
<button type="button" data-region-set="CA">CA</button>
</div>
<nav>
<a href="/recalls/">RECALL CHECKS</a>
<a href="/how-we-check/">HOW WE CHECK</a>
<a href="/bin-list/">BIN LIST</a>
</nav>
</div>
</header>
${nav(entry.hub)}
</div>
<main>
<div class="wrap prose">
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<a href="/${entry.hub}/">${card.esc(HUB_NAME[entry.hub])}</a>
<span aria-hidden="true">/</span>
<span aria-current="page">${card.esc(entry.title)}</span>
</nav>
<h1>${card.esc(entry.title)}</h1>
<p class="lede">${card.esc(entry.description)}</p>
<p>Each line below is copied from that model’s maker page. The Source link opens that page. A spec that only one card lists is left out of the table. Recall lines use the ${card.esc(recalls.checkedAt)} (UTC) catalogue check.</p>
<div class="compare-wrap">
<table class="compare">
<thead><tr><th>Spec</th>${head}</tr></thead>
<tbody>${body}</tbody>
</table>
</div>
<h2>Which specs to read</h2>
${fit}
<h2>Recall check</h2>
${recallsHtml}
<p class="lede"><a href="/recalls/">All recall checks</a> <a href="/${entry.hub}/">${card.esc(HUB_NAME[entry.hub])}</a> <a href="/how-we-check/">How we check</a> <a href="${card.productPath(pair[0])}">${card.esc(pair[0].title)}</a> <a href="${card.productPath(pair[1])}">${card.esc(pair[1].title)}</a></p>
${stores("US", "United States stores")}
${stores("CA", "Canadian stores")}
</div>
</main>
<footer>
<div class="foot">
<p>As an Amazon Associate I earn from qualifying purchases.</p>
<p>© 2026 CHECKED LAB<br>Winnipeg, MB</p>
<p class="foot-mail"><a href="/recalls/">Recall checks</a><a href="/how-we-check/">How we check</a><a href="/bin-list/">BIN list</a><a href="mailto:hello@checkedlab.com">hello@</a><a href="mailto:support@checkedlab.com">support@</a><a href="mailto:press@checkedlab.com">press@</a><a href="mailto:legal@checkedlab.com">legal@</a></p>
</div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
    if (/\$\d/.test(html) || /we tested|we bought|does not test|\bwinner\b|\bscore\b/i.test(html)) {
      throw new Error("Compare page has a disallowed claim: " + entry.slug);
    }
    if (!html.includes("checkedlab01-20") || !html.includes("checkedlab-20")) {
      throw new Error("Compare page is missing Amazon tags: " + entry.slug);
    }
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const types = ld["@graph"].map((node) => node["@type"]).sort().join(",");
    if (types !== "Article,BreadcrumbList,ItemList") throw new Error("Compare schema on " + entry.slug);
    mkdirSync(join(root, "compare", entry.slug), { recursive: true });
    writeFileSync(join(root, "compare", entry.slug, "index.html"), html);
  }
}

function writeExplainers() {
  if (explainers.length !== 6) throw new Error("Expected six explainer pages");
  const slugs = new Set();
  for (const entry of explainers) {
    if (!/^[a-z0-9-]+$/.test(entry.slug) || slugs.has(entry.slug)) throw new Error("Bad explainer slug");
    slugs.add(entry.slug);
    const url = ORIGIN + "/recalls/" + entry.slug + "/";
    const html = `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${url}">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.esc(entry.title)} — Checked Lab</title>
<meta name="description" content="${card.esc(entry.description)}">
<meta property="og:title" content="${card.esc(entry.title)} — Checked Lab">
<meta property="og:description" content="${card.esc(entry.description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<link rel="icon" type="image/png" href="/favicon.png">
${FONT_PRELOAD}
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#F5F5F7">
<script type="application/ld+json">
${explainerJsonLd(entry)}
</script>
</head>
<body data-page="recalls">
${DISCLOSURE}
<div class="topbar"><span>● CHECKED LAB • EST 2026 • NO SPONSORS</span><span>hello@checkedlab.com • press@checkedlab.com • legal@checkedlab.com</span></div>
<div class="masthead">
<header>
<a class="logo" href="/">CHECKED LAB <i>CHECKED BEFORE YOU BUY</i></a>
<div class="header-actions">
<div class="country-switch">
<button type="button" data-region-set="US">US</button>
<button type="button" data-region-set="CA">CA</button>
</div>
<nav>
<a href="/recalls/" aria-current="page">RECALL CHECKS</a>
<a href="/how-we-check/">HOW WE CHECK</a>
<a href="/bin-list/">BIN LIST</a>
</nav>
</div>
</header>
${nav("recalls")}
</div>
<main>
<div class="wrap prose">
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<a href="/recalls/">Recall checks</a>
<span aria-hidden="true">/</span>
<span aria-current="page">${card.esc(entry.title)}</span>
</nav>
<h1>${card.esc(entry.title)}</h1>
<p class="lede">${card.esc(entry.description)} Catalogue lines below use the ${card.esc(recalls.checkedAt)} (UTC) check.</p>
${entry.notices.map(noticeHtml).join("\n")}
${catalogueHtml(entry)}
</div>
</main>
<footer>
<div class="foot">
<p>As an Amazon Associate I earn from qualifying purchases.</p>
<p>© 2026 CHECKED LAB<br>Winnipeg, MB</p>
<p class="foot-mail"><a href="/recalls/">Recall checks</a><a href="/how-we-check/">How we check</a><a href="/bin-list/">BIN list</a><a href="mailto:hello@checkedlab.com">hello@</a><a href="mailto:support@checkedlab.com">support@</a><a href="mailto:press@checkedlab.com">press@</a><a href="mailto:legal@checkedlab.com">legal@</a></p>
</div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
    if (/\$\d/.test(html) || /we tested|we bought|does not test/i.test(html)) {
      throw new Error("Explainer has a disallowed claim: " + entry.slug);
    }
    mkdirSync(join(root, "recalls", entry.slug), { recursive: true });
    writeFileSync(join(root, "recalls", entry.slug, "index.html"), html);
  }
}

function writeRecallsPage(ordered) {
  const date = recalls.checkedAt || "";
  const usSource = (recalls.sources && recalls.sources.us && recalls.sources.us.url) || "https://www.saferproducts.gov/RestWebServices/Recall";
  const url = ORIGIN + "/recalls/";
  const desc = recallsDescription(date);
  const html = `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${url}">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Recall checks — Checked Lab</title>
<meta name="description" content="${card.esc(desc)}">
<meta property="og:title" content="Recall checks — Checked Lab">
<meta property="og:description" content="${card.esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Checked Lab. Checked before you buy.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Recall checks — Checked Lab">
<meta name="twitter:description" content="${card.esc(desc)}">
<meta name="twitter:image" content="${ORIGIN}/assets/og.png">
<link rel="alternate" type="application/rss+xml" title="Checked Lab recall checks" href="/recalls/feed.xml">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${FONT_PRELOAD}
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#F5F5F7">
<script type="application/ld+json">
${recallsJsonLd(ordered, date)}
</script>
</head>
<body data-page="recalls">
${DISCLOSURE}
<div class="topbar"><span>● CHECKED LAB • EST 2026 • NO SPONSORS</span><span>hello@checkedlab.com • press@checkedlab.com • legal@checkedlab.com</span></div>
<div class="masthead">
<header>
<a class="logo" href="/">CHECKED LAB <i>CHECKED BEFORE YOU BUY</i></a>
<div class="header-actions">
<div class="country-switch">
<button type="button" data-region-set="US">US</button>
<button type="button" data-region-set="CA">CA</button>
</div>
<nav>
<a href="/recalls/" aria-current="page">RECALL CHECKS</a>
<a href="/how-we-check/">HOW WE CHECK</a>
<a href="/bin-list/">BIN LIST</a>
</nav>
</div>
</header>
${nav("recalls")}
</div>
<main>
<div class="wrap prose">
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<span aria-current="page">Recall checks</span>
</nav>
<h1>Recall checks</h1>
<p class="lede">Checked <time datetime="${card.esc(date)}">${card.esc(date)}</time> (UTC). Every catalogue model has a United States line from the <a href="${href(usSource)}" target="_blank" rel="noopener">CPSC SaferProducts</a> source and a Canada line from the <a href="${CA_DATASET_PAGE}" target="_blank" rel="noopener">Health Canada open dataset</a>.</p>
<p>A date is the day that check ran. Open a model for the maker specs. Read <a href="/how-we-check/">how we check</a> and the <a href="/bin-list/">BIN list</a>. <a href="/black-friday/">Black Friday 2026: check the model before you buy</a>. <a href="/recalls/feed.xml">RSS</a> updates when a recall record changes.</p>
<p class="recall-filters"><a href="#united-states">United States</a><a href="#canada">Canada</a></p>
${binSection(ordered, date)}
<div class="recall-columns">
<section id="united-states">
<h2>United States</h2>
${regionColumn(ordered, "us", "US")}
</section>
<section id="canada">
<h2>Canada</h2>
${regionColumn(ordered, "ca", "Canadian")}
</section>
</div>
${explainerIndex()}
${categorySection(date)}
</div>
</main>
<footer>
<div class="foot">
<p>As an Amazon Associate I earn from qualifying purchases.</p>
<p>© 2026 CHECKED LAB<br>Winnipeg, MB</p>
<p class="foot-mail"><a href="/recalls/">Recall checks</a><a href="/how-we-check/">How we check</a><a href="/bin-list/">BIN list</a><a href="mailto:hello@checkedlab.com">hello@</a><a href="mailto:support@checkedlab.com">support@</a><a href="mailto:press@checkedlab.com">press@</a><a href="mailto:legal@checkedlab.com">legal@</a></p>
</div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
  if (/not tested/i.test(html) || /does not test/i.test(html)) throw new Error("Recall page uses a test negation");
  if (/\$\d/.test(html)) throw new Error("Recall page has a price");
  mkdirSync(join(root, "recalls"), { recursive: true });
  writeFileSync(join(root, "recalls", "index.html"), html);
}

function blackFridayPicks() {
  const byId = new Map(products.map((product) => [product.id, product]));
  const picked = [];
  const seen = new Set();
  for (const hub of HUBS) {
    const ids = BF_PICKS[hub];
    if (!ids || !ids.length) throw new Error("Black Friday section missing for " + hub);
    for (const id of ids) {
      const product = byId.get(id);
      if (!product) throw new Error("Black Friday pick is not in the catalogue: " + id);
      if (product.category !== hub) throw new Error("Black Friday pick is in the wrong hub: " + id);
      if (seen.has(id)) throw new Error("Duplicate Black Friday pick: " + id);
      seen.add(id);
      picked.push(product);
    }
  }
  for (const entry of explainers) {
    for (const id of entry.products) {
      if (!seen.has(id)) throw new Error("Explainer model missing from Black Friday: " + id);
    }
  }
  return picked;
}

function blackFridayFaqs() {
  return [
    {
      q: "What should I check before buying on Black Friday?",
      a: "Confirm the exact model number on the box and on the listing. Check that model with CPSC for a US purchase and with Health Canada for a Canadian purchase. A look-alike listing or a third-party seller can use the brand name for a different model. Read the return window on the store page before you pay."
    },
    {
      q: "When is Black Friday 2026 on Amazon?",
      a: US_DATES + " " + CA_DATES
    },
    {
      q: "What should an air fryer shopper match before buying?",
      a: "Match the model number on the unit to the listing. The Cosori 2023 notices and the Ninja Foodi OP300 notices name specific models. The catalogue cards for the COSORI Pro II, the Ninja Foodi 10-in-1 oven, and the Ninja Crispi link those explainers."
    },
    {
      q: "Does a Black Friday listing check the recall?",
      a: "A sale listing is not a recall check. Each model on this page repeats the catalogue status and date from the CPSC and Health Canada match. A notice for another model in the same brand can still exist."
    },
    {
      q: "Where is the price?",
      a: "Prices stay on the store. This page links the Checked Lab card for the model."
    }
  ];
}

function bfStatusHtml(rec, place) {
  let sentence = recallSentence(rec, place);
  if (rec.checkedAt && !sentence.includes(rec.checkedAt)) {
    sentence = sentence.replace(/\.$/, "") + ". Checked " + rec.checkedAt + ".";
  }
  const notice = rec.status === "bin" && rec.url && /^https:\/\//.test(rec.url)
    ? ' <a href="' + href(rec.url) + '" target="_blank" rel="noopener">Official notice</a>'
    : "";
  return card.badgeHtml(rec) + " " + card.esc(sentence) + notice;
}

function bfModel(product) {
  const meta = product.meta || product.model || "";
  return '<article class="bf-model" id="' + card.esc(product.id) + '">' +
    '<h3><a href="' + card.productPath(product) + '">' + card.visibleTitle(product.title) + "</a></h3>" +
    (meta ? '<p class="p-meta">' + card.esc(meta) + "</p>" : "") +
    '<p class="only-us">' + bfStatusHtml(card.recallFor(product, "US"), "US") + "</p>" +
    '<p class="only-ca">' + bfStatusHtml(card.recallFor(product, "CA"), "Canadian") + "</p>" +
    "</article>";
}

function blackFridayJsonLd(picked) {
  const url = ORIGIN + BF_PATH;
  const faqs = blackFridayFaqs();
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
          { "@type": "ListItem", position: 2, name: "Black Friday", item: url }
        ]
      },
      {
        "@type": "CollectionPage",
        "@id": url,
        name: BF_TITLE,
        headline: "Before you buy on Black Friday, check the model.",
        url: url,
        dateModified: recalls.checkedAt,
        inLanguage: "en",
        description: BF_DESC,
        mainEntity: {
          "@type": "ItemList",
          name: "Catalogue models to check before Black Friday",
          numberOfItems: picked.length,
          itemListElement: picked.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: product.title,
            url: ORIGIN + card.productPath(product)
          }))
        }
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a }
        }))
      }
    ]
  };
  assertNoCommerce(graph);
  const types = graph["@graph"].map((node) => node["@type"]);
  if (types.join(",") !== "BreadcrumbList,CollectionPage,FAQPage") throw new Error("Black Friday schema types");
  return JSON.stringify(graph, null, 2).replace(/</g, "\\u003c");
}

function writeBlackFriday() {
  const picked = blackFridayPicks();
  const url = ORIGIN + BF_PATH;
  const date = recalls.checkedAt || "";
  const faqs = blackFridayFaqs();
  const jumps = HUBS.map((hub) => '<a href="#' + hub + '">' + card.esc(HUB_NAME[hub]) + "</a>").join("");
  const notices = explainers.map((entry) =>
    '<li><a href="/recalls/' + entry.slug + '/">' + card.esc(entry.title) + "</a>. " + card.esc(entry.description) + "</li>"
  ).join("");
  const sections = HUBS.map((hub) => {
    const group = picked.filter((product) => product.category === hub);
    return '<section id="' + hub + '"><h2><a href="/' + hub + '/">' + card.esc(HUB_NAME[hub]) + "</a></h2>" +
      "<p>Gift and seasonal models from this catalogue. Open the card and match the model number on the listing.</p>" +
      group.map(bfModel).join("\n") +
      '<p class="lede"><a href="/' + hub + '/">All ' + card.esc(HUB_NAME[hub]) + " models</a></p></section>";
  }).join("\n");
  const faqHtml = faqs.map((item) =>
    "<h3>" + card.esc(item.q) + '</h3><p class="faq-a">' + card.esc(item.a) + "</p>"
  ).join("");
  const html = `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${url}">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.esc(BF_TITLE)} — Checked Lab</title>
<meta name="description" content="${card.esc(BF_DESC)}">
<meta property="og:title" content="${card.esc(BF_TITLE)} — Checked Lab">
<meta property="og:description" content="${card.esc(BF_DESC)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Checked Lab. Checked before you buy.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${card.esc(BF_TITLE)} — Checked Lab">
<meta name="twitter:description" content="${card.esc(BF_DESC)}">
<meta name="twitter:image" content="${ORIGIN}/assets/og.png">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${FONT_PRELOAD}
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#F5F5F7">
<script type="application/ld+json">
${blackFridayJsonLd(picked)}
</script>
</head>
<body data-page="black-friday">
${DISCLOSURE}
<div class="topbar"><span>● CHECKED LAB • EST 2026 • NO SPONSORS</span><span>hello@checkedlab.com • press@checkedlab.com • legal@checkedlab.com</span></div>
<div class="masthead">
<header>
<a class="logo" href="/">CHECKED LAB <i>CHECKED BEFORE YOU BUY</i></a>
<div class="header-actions">
<div class="country-switch">
<button type="button" data-region-set="US">US</button>
<button type="button" data-region-set="CA">CA</button>
</div>
<nav>
<a href="/recalls/">RECALL CHECKS</a>
<a href="/how-we-check/">HOW WE CHECK</a>
<a href="/bin-list/">BIN LIST</a>
</nav>
</div>
</header>
${nav("black-friday")}
</div>
<main>
<div class="wrap prose">
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<span aria-current="page">Black Friday</span>
</nav>
<h1>Before you buy on Black Friday, check the model.</h1>
<p class="lede">Confirm the model number, then read the recall check for that model. The status under each card is the catalogue check dated <time datetime="${card.esc(date)}">${card.esc(date)}</time> (UTC).</p>
<p class="only-us">${card.esc(US_DATES)} <a href="${US_DEALS}" target="_blank" rel="sponsored nofollow noopener">Amazon.com Black Friday</a>.</p>
<p class="only-ca">${card.esc(CA_DATES)} <a href="${CA_DEALS}" target="_blank" rel="sponsored nofollow noopener">Amazon.ca Black Friday</a>.</p>
<h2>Before you pay</h2>
<ol class="checklist">
<li>Confirm the exact model number on the box, in the manual, and on the listing. A family name such as Foodi or Cosori can point at a different model.</li>
<li>Check that model on <a href="https://www.cpsc.gov/Recalls" target="_blank" rel="noopener">CPSC Recalls</a> for a US purchase and on <a href="https://recalls-rappels.canada.ca/en" target="_blank" rel="noopener">Health Canada recalls and safety alerts</a> for a Canadian purchase. <a href="/recalls/">Recall checks</a> is the catalogue match. <a href="/how-we-check/">How we check</a> says what the date means.</li>
<li>Beware look-alike listings and third-party sellers. The brand in the title is not the model number.</li>
<li>Read the return window on the listing before you pay. The window is printed on the store page.</li>
</ol>
<h2>Notices to open before you buy</h2>
<p>These pages quote the official notice and name the catalogue card.</p>
<ul>${notices}</ul>
<p class="recall-filters">${jumps}</p>
${sections}
<section class="faq" id="questions">
<h2>Questions</h2>
${faqHtml}
</section>
</div>
</main>
<footer>
<div class="foot">
<p>As an Amazon Associate I earn from qualifying purchases.</p>
<p>© 2026 CHECKED LAB<br>Winnipeg, MB</p>
<p class="foot-mail"><a href="/black-friday/">Black Friday</a><a href="/recalls/">Recall checks</a><a href="/how-we-check/">How we check</a><a href="/bin-list/">BIN list</a><a href="mailto:hello@checkedlab.com">hello@</a><a href="mailto:support@checkedlab.com">support@</a><a href="mailto:press@checkedlab.com">press@</a><a href="mailto:legal@checkedlab.com">legal@</a></p>
</div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
  if (/\$\d/.test(html) || /\d+\s*%/.test(html)) throw new Error("Black Friday page has a price or a percent");
  if (/we tested|we bought|does not test|did not test/i.test(html)) throw new Error("Black Friday page has a test claim");
  mkdirSync(join(root, "black-friday"), { recursive: true });
  writeFileSync(join(root, "black-friday", "index.html"), html);
}

function assertBlackFriday(html) {
  if (!html.includes(DISCLOSURE)) throw new Error("Black Friday disclosure missing");
  if (!html.includes('<link rel="canonical" href="' + ORIGIN + BF_PATH + '">')) throw new Error("Black Friday canonical");
  if (!html.includes("<title>" + BF_TITLE + " — Checked Lab</title>")) throw new Error("Black Friday title");
  if (!html.includes('name="description" content="' + BF_DESC + '"')) throw new Error("Black Friday description");
  if (!html.includes("<h1>Before you buy on Black Friday, check the model.</h1>")) throw new Error("Black Friday H1");
  if (!html.includes('data-region-set="US"') || !html.includes('data-region-set="CA"')) throw new Error("Black Friday region switch");
  if (/\$\d/.test(html) || /\d+\s*%/.test(html)) throw new Error("Black Friday page has a price or a percent");
  if (/we tested|we bought|does not test|did not test|lab-tested|lab tested/i.test(html)) {
    throw new Error("Black Friday page has a test claim");
  }
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  const dealHits = visible.match(/deal/gi) || [];
  if (dealHits.length !== 2) throw new Error("Black Friday page uses deal " + dealHits.length + " times");
  if (/discount|percent off|stars|out of 5/i.test(visible)) throw new Error("Black Friday page has a rating or discount claim");
  const picked = blackFridayPicks();
  for (const product of picked) {
    if (!html.includes('href="' + card.productPath(product) + '"')) throw new Error("Black Friday misses " + product.id);
    const us = recallSentence(card.recallFor(product, "US"), "US");
    const ca = recallSentence(card.recallFor(product, "CA"), "Canadian");
    if (!html.includes(card.esc(us)) || !html.includes(card.esc(ca))) {
      throw new Error("Black Friday status drifted on " + product.id);
    }
    for (const rec of [card.recallFor(product, "US"), card.recallFor(product, "CA")]) {
      if (rec.checkedAt && !html.includes(rec.checkedAt)) throw new Error("Black Friday date missing on " + product.id);
    }
  }
  for (const entry of explainers) {
    if (!html.includes('href="/recalls/' + entry.slug + '/"')) throw new Error("Black Friday misses explainer " + entry.slug);
  }
  const usBits = [...html.matchAll(/<p class="only-us">([\s\S]*?)<\/p>/g)].map((match) => match[1]).join("\n");
  const caBits = [...html.matchAll(/<p class="only-ca">([\s\S]*?)<\/p>/g)].map((match) => match[1]).join("\n");
  const usTags = [...usBits.matchAll(/[?&]tag=([a-z0-9-]+)/g)].map((match) => match[1]);
  const caTags = [...caBits.matchAll(/[?&]tag=([a-z0-9-]+)/g)].map((match) => match[1]);
  if (usTags.length !== 1 || usTags[0] !== "checkedlab01-20") throw new Error("US Amazon tag on Black Friday");
  if (caTags.length !== 1 || caTags[0] !== "checkedlab-20") throw new Error("CA Amazon tag on Black Friday");
  if (!usBits.includes("November 19–30, 2026")) throw new Error("Amazon.com dates missing");
  if (!caBits.includes("November 19–27")) throw new Error("Amazon.ca dates missing");
  const faqs = blackFridayFaqs();
  if (faqs.length < 3 || faqs.length > 5) throw new Error("Black Friday FAQ count");
  for (const item of faqs) {
    if (!html.includes("<h3>" + card.esc(item.q) + "</h3>")) throw new Error("Black Friday FAQ question");
    if (!html.includes('<p class="faq-a">' + card.esc(item.a) + "</p>")) throw new Error("Black Friday FAQ answer");
  }
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (blocks.length !== 1) throw new Error("Black Friday JSON-LD count");
  const data = JSON.parse(blocks[0][1]);
  assertNoCommerce(data);
  const flat = JSON.stringify(data);
  for (const type of ["CollectionPage", "ItemList", "BreadcrumbList", "FAQPage"]) {
    if (!flat.includes(type)) throw new Error("Black Friday JSON-LD missing " + type);
  }
  if (/"@type":"Product"|offers|aggregateRating/i.test(flat)) throw new Error("Black Friday JSON-LD has a commerce type");
  const faq = (data["@graph"] || []).find((node) => node["@type"] === "FAQPage");
  if (!faq || faq.mainEntity.length !== faqs.length) throw new Error("Black Friday FAQPage");
  faq.mainEntity.forEach((node, index) => {
    if (node.name !== faqs[index].q || !node.acceptedAnswer || node.acceptedAnswer.text !== faqs[index].a) {
      throw new Error("Black Friday FAQ JSON-LD mismatch");
    }
  });
  const list = (data["@graph"] || []).find((node) => node["@type"] === "CollectionPage");
  if (!list || !list.mainEntity || list.mainEntity["@type"] !== "ItemList" || list.mainEntity.numberOfItems !== picked.length) {
    throw new Error("Black Friday ItemList count");
  }
}

function productSignature(product) {
  const side = (region) => {
    const rec = recallRecord(product, region);
    const other = (rec.other || []).map((item) => [item.title, item.url, item.date, item.source, item.archived ? "1" : "0"].join("\u001f")).join("\u001e");
    return [rec.status || "", rec.url || "", rec.detail || "", other].join("\u001f");
  };
  return side("us") + "\u001d" + side("ca");
}

function rfc822(isoDate) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(isoDate || "") ? new Date(isoDate + "T00:00:00Z") : new Date();
  return date.toUTCString();
}

function feedItem(product, signature) {
  const us = recallRecord(product, "us");
  const ca = recallRecord(product, "ca");
  const parts = [product.title + ".", recallSentence(us, "US"), recallSentence(ca, "Canadian")];
  if ([us, ca].some((rec) => rec.status !== "bin" && rec.other && rec.other.length)) {
    parts.push("An official notice for a different model is linked from the recall checks page.");
  }
  const dates = [us.checkedAt, ca.checkedAt, recalls.checkedAt].filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "")).sort();
  return {
    guid: ORIGIN + card.productPath(product) + "#" + createHash("sha256").update(signature).digest("hex").slice(0, 12),
    title: product.title,
    link: ORIGIN + card.productPath(product),
    date: dates.length ? dates[dates.length - 1] : recalls.checkedAt,
    description: parts.join(" ")
  };
}

function writeRecallFeed(ordered) {
  const log = loadJson(FEED_LOG_PATH, { signatures: {}, categories: "", items: [] });
  if (!log.signatures || typeof log.signatures !== "object" || Array.isArray(log.signatures)) log.signatures = {};
  if (!Array.isArray(log.items)) log.items = [];
  const fresh = Object.keys(log.signatures).length === 0;
  const additions = [];
  for (const product of ordered) {
    const signature = productSignature(product);
    const prev = log.signatures[product.id];
    log.signatures[product.id] = signature;
    if (fresh || prev === signature) continue;
    additions.push(feedItem(product, signature));
  }
  const ids = new Set(ordered.map((product) => product.id));
  for (const id of Object.keys(log.signatures)) {
    if (!ids.has(id)) delete log.signatures[id];
  }
  const catSig = JSON.stringify(recalls.categories || []);
  if (!fresh && log.categories && log.categories !== catSig) {
    additions.push({
      guid: ORIGIN + "/recalls/#category-" + createHash("sha256").update(catSig).digest("hex").slice(0, 12),
      title: "Category notices on the recall checks page changed",
      link: ORIGIN + "/recalls/#category-notices",
      date: recalls.checkedAt,
      description: "The air fryer, heater, and power bank notice lists changed. Titles and model text on the recall checks page are copied from the official notices."
    });
  }
  log.categories = catSig;
  log.items = additions.concat(log.items).slice(0, 80);
  mkdirSync(dirname(FEED_LOG_PATH), { recursive: true });
  writeFileSync(FEED_LOG_PATH, JSON.stringify(log, null, 2) + "\n");
  const items = log.items.map((item) => [
    "  <item>",
    "    <title>" + card.esc(item.title) + "</title>",
    "    <link>" + card.esc(item.link) + "</link>",
    "    <guid isPermaLink=\"false\">" + card.esc(item.guid) + "</guid>",
    "    <pubDate>" + card.esc(rfc822(item.date)) + "</pubDate>",
    "    <description>" + card.esc(item.description) + "</description>",
    "  </item>"
  ].join("\n")).join("\n");
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    "  <title>Checked Lab recall checks</title>",
    "  <link>" + ORIGIN + "/recalls/</link>",
    '  <atom:link href="' + ORIGIN + '/recalls/feed.xml" rel="self" type="application/rss+xml"/>',
    "  <description>Items are added when a catalogue model's United States or Canada recall record changes. A new check date alone does not add an item.</description>",
    "  <language>en</language>",
    items,
    "</channel>",
    "</rss>",
    ""
  ].join("\n");
  if (/google\.com\/ping/i.test(xml)) throw new Error("Feed contains a sitemap ping");
  writeFileSync(join(root, "recalls", "feed.xml"), xml);
}

function stampPages(ordered) {
  const rev = loadJson(REV_PATH, {});
  const paths = [
    ["/", join(root, "index.html")],
    ...HUBS.map((hub) => ["/" + hub + "/", join(root, hub, "index.html")]),
    ["/how-we-check/", join(root, "how-we-check", "index.html")],
    ["/bin-list/", join(root, "bin-list", "index.html")],
    ["/recalls/", join(root, "recalls", "index.html")],
    [BF_PATH, join(root, "black-friday", "index.html")],
    ...explainers.map((entry) => ["/recalls/" + entry.slug + "/", join(root, "recalls", entry.slug, "index.html")]),
    ...compares.map((entry) => ["/compare/" + entry.slug + "/", join(root, "compare", entry.slug, "index.html")]),
    ...ordered.filter(indexable).map((product) => [card.productPath(product), join(root, product.category, product.id, "index.html")])
  ];
  const today = new Date().toISOString().slice(0, 10);
  const next = {};
  const lastmods = {};
  for (const [path, file] of paths) {
    const hash = createHash("sha256").update(readFileSync(file)).digest("hex");
    const prev = rev[path];
    const lastmod = prev && prev.hash === hash && /^\d{4}-\d{2}-\d{2}$/.test(prev.lastmod || "") ? prev.lastmod : today;
    next[path] = { hash, lastmod };
    lastmods[path] = lastmod;
  }
  const stable = {};
  for (const key of Object.keys(next).sort()) stable[key] = next[key];
  mkdirSync(dirname(REV_PATH), { recursive: true });
  writeFileSync(REV_PATH, JSON.stringify(stable, null, 2) + "\n");
  return lastmods;
}

function writeSitemap(pages, lastmods) {
  const staticPaths = [
    "/",
    ...HUBS.map((hub) => "/" + hub + "/"),
    "/how-we-check/",
    "/bin-list/",
    "/recalls/",
    BF_PATH,
    ...explainers.map((entry) => "/recalls/" + entry.slug + "/"),
    ...compares.map((entry) => "/compare/" + entry.slug + "/")
  ];
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];
  for (const path of staticPaths) {
    lines.push("  <url><loc>" + ORIGIN + path + "</loc><lastmod>" + lastmods[path] + "</lastmod></url>");
  }
  for (const product of pages.filter(indexable)) {
    const path = card.productPath(product);
    lines.push("  <url><loc>" + ORIGIN + path + "</loc><lastmod>" + lastmods[path] + "</lastmod></url>");
  }
  lines.push("</urlset>", "");
  const xml = lines.join("\n");
  if (xml.includes("http://checkedlab.com") || xml.includes("https://checkedlab.com/")) {
    throw new Error("Sitemap left the www host");
  }
  writeFileSync(join(root, "sitemap.xml"), xml);
}

function walkFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

function webPath(file, assetsRoot) {
  return "/assets/" + file.slice(assetsRoot.length + 1).split("\\").join("/");
}

function hashedWebPath(web, hash) {
  const dot = web.lastIndexOf(".");
  return web.slice(0, dot) + "." + hash + web.slice(dot);
}

function fingerprintAssets(dist) {
  const assetsRoot = join(dist, "assets");
  const files = walkFiles(assetsRoot);
  const hashOf = (file) => createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 8);
  const map = new Map();
  const pairs = () => [...map.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const file of files.filter((item) => !item.endsWith(".css"))) {
    const web = webPath(file, assetsRoot);
    map.set(web, hashedWebPath(web, hashOf(file)));
  }
  for (const file of files.filter((item) => item.endsWith(".css"))) {
    let css = readFileSync(file, "utf8");
    for (const [from, to] of pairs()) css = css.split(from).join(to);
    writeFileSync(file, css);
    const web = webPath(file, assetsRoot);
    map.set(web, hashedWebPath(web, hashOf(file)));
  }
  for (const [from, to] of map) {
    const dest = join(dist, to.slice(1));
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(join(dist, from.slice(1)), dest);
  }
  for (const [from] of map) rmSync(join(dist, from.slice(1)));
  for (const file of walkFiles(dist).filter((item) => item.endsWith(".html"))) {
    let html = readFileSync(file, "utf8");
    for (const [from, to] of pairs()) html = html.split(from).join(to);
    writeFileSync(file, html);
  }
}

function publishDist() {
  const dist = join(root, "dist");
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist);
  const skip = new Set([".git", ".github", "dist", "node_modules", "scripts", "vercel.json", "data"]);
  for (const entry of readdirSync(root)) {
    if (entry.startsWith(".") || skip.has(entry) || entry.endsWith(".md")) continue;
    cpSync(join(root, entry), join(dist, entry), { recursive: true });
  }
  fingerprintAssets(dist);
  if (!statSync(join(dist, "index.html")).isFile()) throw new Error("dist is missing index.html");
  if (!statSync(join(dist, "kitchen", "ninja-crispi-fn101", "index.html")).isFile()) {
    throw new Error("dist is missing a product page");
  }
  if (!statSync(join(dist, "recalls", "index.html")).isFile()) throw new Error("dist is missing /recalls/");
  if (!statSync(join(dist, "black-friday", "index.html")).isFile()) throw new Error("dist is missing /black-friday/");
  if (!statSync(join(dist, "recalls", "feed.xml")).isFile()) throw new Error("dist is missing the recall feed");
  if (!statSync(join(dist, "404.html")).isFile()) throw new Error("dist is missing 404.html");
  if (existsSync(join(dist, "scripts")) || existsSync(join(dist, ".git")) || existsSync(join(dist, ".github"))) {
    throw new Error("dist copied scripts or git metadata");
  }
  if (readdirSync(dist).some((entry) => entry.endsWith(".md"))) throw new Error("dist copied a markdown file");
  const css = readdirSync(join(dist, "assets")).filter((name) => /^site\.[0-9a-f]{8}\.css$/.test(name));
  if (css.length !== 1 || existsSync(join(dist, "assets", "site.css"))) {
    throw new Error("Versioned CSS was not published");
  }
  const home = readFileSync(join(dist, "index.html"), "utf8");
  if (!home.includes("/assets/" + css[0])) throw new Error("Homepage still points at unversioned CSS");
  if (!home.includes('content="kXQhYQ7uln9_absjhx8CyleHSYT49KM0dyop2xJy_nQ"')) {
    throw new Error("Homepage verification meta changed");
  }
  if (!home.includes("d378016a-660d-4175-9161-3f0a87a655a4")) {
    throw new Error("Impact verification meta changed");
  }
  const key = readFileSync(join(root, "data", "indexnow-key"), "utf8").trim();
  const keyBody = readFileSync(join(dist, key + ".txt"), "utf8").trim();
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key) || keyBody !== key) throw new Error("IndexNow key file mismatch");
  const styled = readFileSync(join(dist, "assets", css[0]), "utf8");
  const font = styled.match(/\/assets\/fonts\/source-sans-3-latin\.[0-9a-f]{8}\.woff2/);
  if (!font || !home.includes(font[0])) throw new Error("Font is not versioned with the stylesheet");
}

function verifyOutput(pages) {
  for (const hub of HUBS) {
    const html = readFileSync(join(root, hub, "index.html"), "utf8");
    const found = [...html.matchAll(/<article class="(?:product-grid hub-card|product-row)"[\s\S]*?<\/article>/g)].map((match) => match[0]);
    const expected = byHub.get(hub).map((product, index) => card.card(product, "US", index === 0 ? { eager: true } : {}));
    if (found.length !== expected.length) throw new Error(hub + " card count " + found.length);
    expected.forEach((markup, index) => {
      if (found[index] !== markup) throw new Error(hub + " card " + index + " does not match card()");
    });
    if (!html.includes(DISCLOSURE)) throw new Error(hub + " disclosure changed");
    if (/not tested/i.test(html)) throw new Error(hub + " still says not tested");
    if (/older cards/i.test(html)) throw new Error(hub + " still mentions older cards");
  }
  const coway = readFileSync(join(root, "air-water", "coway-ap-1512hh", "index.html"), "utf8");
  if (!coway.includes("https://cowaymega.com/products/mighty-ap-1512hh")) {
    throw new Error("Coway URL changed");
  }
  for (const product of pages) {
    const html = readFileSync(join(root, product.category, product.id, "index.html"), "utf8");
    if (/\$\d/.test(html)) throw new Error("Price-like text on " + product.id);
    if (!html.includes("checkedlab01-20") || !html.includes("checkedlab-20")) {
      throw new Error("Amazon tags missing on " + product.id);
    }
    const blocks = (cls) => html.match(new RegExp(`<(span|div|a) class="${cls}"[^>]*>[\\s\\S]*?<\\/\\1>`, "g")) || [];
    const us = blocks("only-us").join("\n");
    const ca = blocks("only-ca").join("\n");
    if (us.includes("checkedlab-20") || ca.includes("checkedlab01-20")) {
      throw new Error("Amazon tags crossed regions on " + product.id);
    }
    if (!html.includes("<h1 class=\"p-title\">" + card.visibleTitle(product.title) + "</h1>")) {
      throw new Error("H1 mismatch on " + product.id);
    }
    if (/media-amazon\.com|images-amazon\.com/i.test(html)) {
      throw new Error("Amazon image on " + product.id);
    }
    const noindex = html.includes('<meta name="robots" content="noindex">');
    if (indexable(product) === noindex) throw new Error("Index flag mismatch on " + product.id);
    assertProductSeo(html, product);
  }
  const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
  const indexed = pages.filter(indexable);
  const locCount = (sitemap.match(/<loc>/g) || []).length;
  if (locCount !== 12 + explainers.length + compares.length + indexed.length || locCount !== 140) {
    throw new Error("Sitemap URL count");
  }
  for (const entry of compares) {
    if (!sitemap.includes("<loc>" + ORIGIN + "/compare/" + entry.slug + "/</loc>")) {
      throw new Error("Sitemap is missing /compare/" + entry.slug + "/");
    }
  }
  for (const entry of explainers) {
    if (!sitemap.includes("<loc>" + ORIGIN + "/recalls/" + entry.slug + "/</loc>")) {
      throw new Error("Sitemap is missing /recalls/" + entry.slug + "/");
    }
  }
  if (!sitemap.includes("<loc>" + ORIGIN + "/recalls/</loc>")) throw new Error("Sitemap is missing /recalls/");
  if (!sitemap.includes("<loc>" + ORIGIN + BF_PATH + "</loc>")) throw new Error("Sitemap is missing /black-friday/");
  for (const loc of sitemap.match(/<loc>[^<]+<\/loc>/g) || []) {
    if (!loc.includes(ORIGIN + "/") || !loc.endsWith("/</loc>")) throw new Error("Sitemap URL is not canonical: " + loc);
  }
  for (const product of pages) {
    const loc = ORIGIN + card.productPath(product);
    if (indexable(product) !== sitemap.includes("<loc>" + loc + "</loc>")) {
      throw new Error("Sitemap listing mismatch on " + product.id);
    }
    const page = readFileSync(join(root, product.category, product.id, "index.html"), "utf8");
    if (!page.includes(">RECALL CHECKS<") || !page.includes('<a href="/recalls/">Recall checks</a>')) {
      throw new Error("Recall checks link missing on " + product.id);
    }
  }
  const recallPage = readFileSync(join(root, "recalls", "index.html"), "utf8");
  if (!recallPage.includes('id="united-states"') || !recallPage.includes('id="canada"')) {
    throw new Error("Recall page is missing a country section");
  }
  if (!recallPage.includes("This is a different model.")) throw new Error("Different-model line missing");
  if (!binEmptyHtml("2026-11-10").includes("No catalogue model is binned as of 2026-11-10.")) {
    throw new Error("Empty BIN state is not readable");
  }
  if (!recallPage.includes("No catalogue model is binned as of") && !recallPage.includes("These catalogue models match an official notice.")) {
    throw new Error("BIN section is blank");
  }
  for (const product of pages) {
    if (!recallPage.includes('href="' + card.productPath(product) + '"')) {
      throw new Error("Recall page misses " + product.id);
    }
  }
  const ldMatch = recallPage.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!ldMatch) throw new Error("Recall page is missing JSON-LD");
  const ld = JSON.parse(ldMatch[1]);
  assertNoCommerce(ld);
  const flat = JSON.stringify(ld);
  if (!flat.includes("ItemList") || !flat.includes("CollectionPage") || !flat.includes("BreadcrumbList")) {
    throw new Error("Recall JSON-LD is missing a required type");
  }
  if (/"@type":"Product"|offers|aggregateRating|price/i.test(flat)) throw new Error("Recall JSON-LD has a commerce type");
  const home = readFileSync(join(root, "index.html"), "utf8");
  if (!home.includes('content="kXQhYQ7uln9_absjhx8CyleHSYT49KM0dyop2xJy_nQ"')) {
    throw new Error("Homepage verification meta changed");
  }
  if (!home.includes("d378016a-660d-4175-9161-3f0a87a655a4")) throw new Error("Impact verification meta changed");
  if (!home.includes('href="/recalls/"') || !home.includes("<time datetime=\"" + (recalls.checkedAt || "") + "\">")) {
    throw new Error("Homepage is missing the recall check pointer");
  }
  if (!home.includes('href="/black-friday/"')) throw new Error("Homepage is missing the Black Friday link");
  if (!recallPage.includes('href="/black-friday/"')) throw new Error("Recall page is missing the Black Friday link");
  assertBlackFriday(readFileSync(join(root, "black-friday", "index.html"), "utf8"));
  if (!home.includes('fetchpriority="low"')) throw new Error("Font preload is still high priority");
  const robots = readFileSync(join(root, "robots.txt"), "utf8");
  if (!robots.includes("Sitemap: https://www.checkedlab.com/sitemap.xml")) throw new Error("robots.txt lost the sitemap");
  if (/disallow:\s*\/assets/i.test(robots)) throw new Error("robots.txt blocks assets");
  const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
  const pets = (vercel.redirects || []).find((rule) => rule.source === "/pets" && rule.destination === "/pet/" && rule.permanent === true);
  if (!pets) throw new Error("The /pets redirect changed");
  const feed = readFileSync(join(root, "recalls", "feed.xml"), "utf8");
  const log = JSON.parse(readFileSync(FEED_LOG_PATH, "utf8"));
  if ((feed.match(/<item>/g) || []).length !== log.items.length) throw new Error("Feed item count drifted");
  if (Object.keys(log.signatures).length !== pages.length) throw new Error("Feed is not tracking every catalogue model");
  if (/google\.com\/ping/i.test(readFileSync(join(root, "scripts", "indexnow.mjs"), "utf8"))) {
    throw new Error("IndexNow script calls the Google sitemap ping");
  }
  for (const hub of HUBS) {
    const html = readFileSync(join(root, hub, "index.html"), "utf8");
    if (!html.includes(">RECALL CHECKS<") || !html.includes('<a href="/recalls/">Recall checks</a>')) {
      throw new Error("Recall checks link missing on " + hub);
    }
  }
}

function assertProductSeo(html, product) {
  const title = pageTitle(product);
  if (!html.includes("<title>" + card.esc(title) + "</title>")) throw new Error("Title template on " + product.id);
  if (!html.includes(DISCLOSURE)) throw new Error("Disclosure missing on " + product.id);
  if (!html.includes('<h2 class="recall-q" id="is-it-recalled">Is the ' + card.esc(product.title) + " recalled?</h2>")) {
    throw new Error("Recall H2 missing on " + product.id);
  }
  if (!html.includes("<h2>In Canada</h2>")) throw new Error("Canada block missing on " + product.id);
  if (!html.includes('href="/recalls/"') || !html.includes('href="/how-we-check/"')) {
    throw new Error("Internal links missing on " + product.id);
  }
  const asin = canadaAsin(product);
  if (asin && !html.includes("Amazon.ca ASIN " + asin)) throw new Error("Verified CA ASIN missing on " + product.id);
  if (!asin && html.includes("Amazon.ca ASIN")) throw new Error("Unverified CA ASIN on " + product.id);
  const faqs = faqItems(product);
  for (const item of faqs) {
    if (!html.includes("<h3>" + card.esc(item.q) + "</h3>")) throw new Error("FAQ question missing on " + product.id);
    if (!html.includes('<p class="faq-a">' + card.esc(item.a) + "</p>")) throw new Error("FAQ answer mismatch on " + product.id);
  }
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (blocks.length !== 1) throw new Error("JSON-LD count on " + product.id);
  const data = JSON.parse(blocks[0][1]);
  assertNoCommerce(data);
  const faq = (data["@graph"] || []).find((node) => node["@type"] === "FAQPage");
  if (!faq || !Array.isArray(faq.mainEntity) || faq.mainEntity.length !== faqs.length) {
    throw new Error("FAQPage missing on " + product.id);
  }
  faq.mainEntity.forEach((node, index) => {
    if (node.name !== faqs[index].q || !node.acceptedAnswer || node.acceptedAnswer.text !== faqs[index].a) {
      throw new Error("FAQ JSON-LD text mismatch on " + product.id);
    }
  });
  const others = otherNotices(card.recallFor(product, "US")).length + otherNotices(card.recallFor(product, "CA")).length;
  const heading = "Official recalls for other models in this brand";
  if (others && !html.includes("<h3>" + heading + "</h3>")) throw new Error("Other-model heading missing on " + product.id);
  if (!others && html.includes(heading)) throw new Error("Other-model heading without notices on " + product.id);
  if (/we tested|we bought|does not test/i.test(html)) throw new Error("Disallowed claim on " + product.id);
}

function indexable(product) {
  return Array.isArray(product.specs) && product.specs.length >= 3;
}
