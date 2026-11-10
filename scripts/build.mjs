import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, statSync, cpSync } from "node:fs";
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
const POP_START = "<!-- checkedlab:popular start -->";
const POP_END = "<!-- checkedlab:popular end -->";
const REC_START = "<!-- checkedlab:recalls start -->";
const REC_END = "<!-- checkedlab:recalls end -->";
const SOURCE_LABELS = {
  "https://www.saferproducts.gov/RestWebServices/Recall": "CPSC SaferProducts",
  "https://open.canada.ca/data/en/dataset/d38de914-c94c-429b-8ab1-8776c31643e3": "Health Canada open dataset"
};
const COMMERCE = /^(offers|price|priceCurrency|lowPrice|highPrice|aggregateRating|review|reviewRating|ratingValue|ratingCount|reviewCount)$/i;

const products = JSON.parse(readFileSync(join(root, "products.json"), "utf8"));
assertProducts(products);
assertRenderer();

const byHub = new Map(HUBS.map((hub) => [hub, products.filter((product) => product.category === hub)]));

for (const hub of HUBS) {
  const file = join(root, hub, "index.html");
  let html = readFileSync(file, "utf8");
  html = fillMount(html, byHub.get(hub).map((product) => card.card(product, "US")).join("\n"));
  html = pointItemList(html, hub);
  html = ensureCardScript(html);
  writeFileSync(file, html);
}

{
  const file = join(root, "index.html");
  let html = readFileSync(file, "utf8");
  const byId = new Map(products.map((product) => [product.id, product]));
  const popular = POPULAR_IDS.map((id) => byId.get(id)).filter(Boolean);
  const recalls = products.filter(isBin);
  html = fillMount(html, popular.map((product) => card.card(product, "US")).join("\n"), POP_START, POP_END);
  html = fillMount(html, recalls.length ? recalls.map((product) => card.card(product, "US")).join("\n") : '<p class="empty">No official model recall is on the list.</p>', REC_START, REC_END);
  html = ensureCardScript(html);
  writeFileSync(file, html);
}

{
  const file = join(root, "bin-list", "index.html");
  let html = readFileSync(file, "utf8");
  const shown = products.filter(isBin);
  html = fillMount(html, shown.length ? shown.map((product) => card.card(product, "US")).join("\n") : BIN_EMPTY);
  html = ensureCardScript(html);
  writeFileSync(file, html);
}

const pages = [];
for (const product of products) {
  const dir = join(root, product.category, product.id);
  mkdirSync(dir, { recursive: true });
  const html = productPage(product);
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

writeSitemap(pages);
verifyOutput(pages);
publishDist();
console.log(`Wrote ${pages.length} product pages and ${HUBS.length} hub card lists.`);

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
  for (const bit of ['data-category="kitchen"', "badge-bin", "recall-bin", "Recall notice"]) {
    if (!bin.includes(bit)) throw new Error("BIN card missing " + bit);
  }
  if (bin.includes("p-side") || bin.includes("no-photo")) throw new Error("Card without a photo rendered a photo column");
  if (/\$\d/.test(bin) || bin.includes("offers")) throw new Error("Renderer emitted a price");
  const plain = card.card(products[0], "US");
  if (!plain.includes("checkedlab01-20") || plain.includes("checkedlab-20")) {
    throw new Error("US card has the wrong Amazon tag");
  }
  const canada = card.card(products.find((product) => product.asin && product.asin.ca) || products[0], "CA");
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

function ensureCardScript(html) {
  if (html.includes('src="/assets/card.js"')) return html;
  const site = '<script src="/assets/site.js"></script>';
  if (!html.includes(site)) throw new Error("Missing site.js");
  return html.replace(site, '<script src="/assets/card.js"></script>\n' + site);
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
  return '<h2 class="check-title">Key specs</h2><dl class="specs">' + rows + "</dl>";
}

function sourceLine(rec) {
  if (!rec || !rec.url || rec.status === "bin") return "";
  const label = SOURCE_LABELS[rec.url] || rec.url;
  return '<p class="recall-other">Recall check source: <a href="' + card.esc(rec.url) + '" target="_blank" rel="noopener">' + card.esc(label) + "</a>.</p>";
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
  }).join("\n") + '\n<a class="cats-util" href="/how-we-check/">How we check</a>\n<a class="cats-util" href="/bin-list/">BIN list</a>\n</nav>';
}

function productPage(product) {
  const hub = product.category;
  const name = HUB_NAME[hub];
  const url = ORIGIN + card.productPath(product);
  const desc = descriptionFor(product);
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
<title>${card.esc(product.title)} — Checked Lab</title>
<meta name="description" content="${card.esc(desc)}">
${indexable(product) ? "" : '<meta name="robots" content="noindex">\n'}
<meta property="og:title" content="${card.esc(product.title)} — Checked Lab">
<meta property="og:description" content="${card.esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${card.esc(url)}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Checked Lab. Checked before you buy.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${card.esc(product.title)} — Checked Lab">
<meta name="twitter:description" content="${card.esc(desc)}">
<meta name="twitter:image" content="${ORIGIN}/assets/og.png">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/newsreader-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/source-sans-3-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#101114">
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
<article class="product-grid" id="${card.esc(product.id)}" data-category="${card.esc(hub)}">
<div class="p-main">
<span class="only-us">${card.badgeHtml(us)}</span>
<span class="only-ca">${card.badgeHtml(ca)}</span>
<h1 class="p-title">${card.visibleTitle(product.title)}</h1>
<p class="p-meta">${card.esc(product.meta || "")}</p>
<p class="p-note only-us">${card.esc(card.honestLine(product, us))}</p>
<p class="p-note only-ca">${card.esc(card.honestLine(product, ca))}</p>
<h2 class="check-title">Why it's listed</h2>
<p class="why-note">${card.esc(why)}</p>
${specList(product)}
${card.evidenceList(product)}
<h2 class="check-title">Recall check</h2>
<p class="p-meta">United States</p>
${card.recallBlock(us)}
${sourceLine(us)}
<p class="p-meta">Canada</p>
${card.recallBlock(ca)}
${sourceLine(ca)}
${card.checkList(product)}
<p class="price-note">Prices change often, check the current price at the store.</p>
<p class="affiliate-note">Amazon link is an affiliate link</p>
<div class="only-us">${card.storeButtons(product, "US")}</div>
<div class="only-ca">${card.storeButtons(product, "CA")}</div>
</div>
${card.imageColumn(product)}
</article>
<p class="lede"><a href="/${hub}/">All ${card.esc(name)} models</a></p>
</div>
</main>

<footer>
<div class="foot">
<p>As an Amazon Associate I earn from qualifying purchases.</p>
<p>© 2026 CHECKED LAB<br>Winnipeg, MB</p>
<p class="foot-mail"><a href="mailto:hello@checkedlab.com">hello@</a><a href="mailto:support@checkedlab.com">support@</a><a href="mailto:press@checkedlab.com">press@</a><a href="mailto:legal@checkedlab.com">legal@</a></p>
</div>
</footer>
<script src="/assets/site.js"></script>
</body>
</html>
`;
}

function lastmod(product) {
  const dates = ["us", "ca"]
    .map((key) => (product.recall && product.recall[key] && product.recall[key].checkedAt) || "")
    .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    .sort();
  return dates.length ? dates[dates.length - 1] : "2026-11-10";
}

function writeSitemap(pages) {
  const staticUrls = [
    ORIGIN + "/",
    ...HUBS.map((hub) => ORIGIN + "/" + hub + "/"),
    ORIGIN + "/how-we-check/",
    ORIGIN + "/bin-list/"
  ];
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  ];
  for (const loc of staticUrls) {
    lines.push("  <url><loc>" + loc + "</loc><lastmod>2026-11-10</lastmod></url>");
  }
  for (const product of pages.filter(indexable)) {
    lines.push("  <url><loc>" + ORIGIN + card.productPath(product) + "</loc><lastmod>" + lastmod(product) + "</lastmod></url>");
  }
  lines.push("</urlset>", "");
  writeFileSync(join(root, "sitemap.xml"), lines.join("\n"));
}

function publishDist() {
  const dist = join(root, "dist");
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist);
  const skip = new Set([".git", ".github", "dist", "node_modules", "scripts", "vercel.json"]);
  for (const entry of readdirSync(root)) {
    if (entry.startsWith(".") || skip.has(entry) || entry.endsWith(".md")) continue;
    cpSync(join(root, entry), join(dist, entry), { recursive: true });
  }
  if (!statSync(join(dist, "index.html")).isFile()) throw new Error("dist is missing index.html");
  if (!statSync(join(dist, "kitchen", "ninja-crispi-fn101", "index.html")).isFile()) {
    throw new Error("dist is missing a product page");
  }
  if (!statSync(join(dist, "404.html")).isFile()) throw new Error("dist is missing 404.html");
  if (readdirSync(dist).some((entry) => entry.endsWith(".md"))) throw new Error("dist copied a markdown file");
}

function verifyOutput(pages) {
  for (const hub of HUBS) {
    const html = readFileSync(join(root, hub, "index.html"), "utf8");
    const found = [...html.matchAll(/<article class="product-grid"[\s\S]*?<\/article>/g)].map((match) => match[0]);
    const expected = byHub.get(hub).map((product) => card.card(product, "US"));
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
  }
  const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
  const indexed = pages.filter(indexable);
  if ((sitemap.match(/<loc>/g) || []).length !== 10 + indexed.length) {
    throw new Error("Sitemap URL count");
  }
  for (const product of pages) {
    const loc = ORIGIN + card.productPath(product);
    if (indexable(product) !== sitemap.includes("<loc>" + loc + "</loc>")) {
      throw new Error("Sitemap listing mismatch on " + product.id);
    }
  }
}

function indexable(product) {
  return Array.isArray(product.specs) && product.specs.length >= 3;
}
