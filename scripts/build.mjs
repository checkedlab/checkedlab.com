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
const DISCLOSURE = '<p class="foot-disclosure">As an Amazon Associate, Checked Lab earns from qualifying purchases.</p>';
const FOOTER = `<footer>
<div class="foot">
${DISCLOSURE}
<p>© 2026 Checked Lab<br>Winnipeg, MB</p>
<p class="foot-mail"><a href="/thanksgiving/">Thanksgiving</a><a href="/toy-safety/">Toy safety</a><a href="/winter-safety/">Winter safety</a><a href="/gifts/">Gift guides</a><a href="/best/">Best of</a><a href="/black-friday/">Black Friday</a><a href="/compare/">Spec comparisons</a><a href="/recalls/">Recall checks</a><a href="/how-we-check/">How we check</a><a href="/bin-list/">BIN list</a><a href="/photo-credits/">Photo credits</a><a href="mailto:hello@checkedlab.com">hello@</a><a href="mailto:support@checkedlab.com">support@</a><a href="mailto:press@checkedlab.com">press@</a><a href="mailto:legal@checkedlab.com">legal@</a></p>
</div>
</footer>`;
const BIN_EMPTY = '<p class="empty">Nothing is on the BIN list. A product lands here only when a recall record matches its brand and model. An unconfirmed model is not a BIN.</p>';
const HUBS = ["winter", "car-garage", "air-water", "pet", "kitchen", "cleaning", "sleep", "personal-tech"];
const HUB_NAME = {
  winter: "Winter",
  "car-garage": "Car & garage",
  "air-water": "Air & water",
  pet: "Pet",
  kitchen: "Kitchen",
  cleaning: "Cleaning",
  sleep: "Sleep",
  "personal-tech": "Personal tech"
};
const ICONS = {
  winter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M4 8l16 8M20 8L4 16"/></svg>',
  "car-garage": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14h16v4H4zM6 14l2-4h8l2 4"/><circle cx="7.5" cy="18" r="1.2"/><circle cx="16.5" cy="18" r="1.2"/></svg>',
  "air-water": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4c3 3 5 5.5 5 8.5a5 5 0 1 1-10 0C7 9.5 9 7 12 4z"/></svg>',
  pet: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="6.5" cy="13" r="1.6"/><circle cx="17.5" cy="13" r="1.6"/><path d="M9 16c.8 2 5.2 2 6 0"/></svg>',
  kitchen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10h12v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM9 10V7M15 10V7"/></svg>',
  cleaning: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16h9a3 3 0 0 0 3-3V8"/><circle cx="17" cy="7" r="2"/><path d="M19 7h2M7 16v3h6"/></svg>',
  sleep: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5a7 7 0 1 0 4 12 8 8 0 1 1-4-12z"/></svg>',
  "personal-tech": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 16 0"/><path d="M4 12v3a2 2 0 0 0 2 2h1v-5H4zM20 12v3a2 2 0 0 1-2 2h-1v-5h3z"/></svg>'
};
const NAV = [
  ["winter", "Winter"],
  ["car-garage", "Car & garage"],
  ["air-water", "Air & water"],
  ["pet", "Pet"],
  ["kitchen", "Kitchen"],
  ["cleaning", "Cleaning"],
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
    "pendleton-eco-wise",
    "toro-power-clear-38753",
    "ego-snt2110",
    "snowjoe-24v-ss10"
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
  cleaning: [
    "irobot-roomba-combo-j9-plus",
    "shark-av2501s",
    "shark-av2820ae",
    "roborock-qrevo-s",
    "eufy-x10-pro-omni",
    "dyson-v15-detect",
    "dyson-v8",
    "shark-ip3251",
    "tineco-pure-one-s15",
    "bissell-iconpet-2288"
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
const GIFT_PATH = "/gifts/";
const WINTER_PATH = "/winter-safety/";
const TOY_PATH = "/toy-safety/";
const THANKS_PATH = "/thanksgiving/";
const SEASON_FOOT = '<p class="foot-mail"><a href="/thanksgiving/">Thanksgiving</a><a href="/toy-safety/">Toy safety</a><a href="/winter-safety/">Winter safety</a><a href="/gifts/">Gift guides</a><a href="/best/">Best of</a><a href="/black-friday/">Black Friday</a><a href="/compare/">Spec comparisons</a><a href="/recalls/">Recall checks</a><a href="/how-we-check/">How we check</a><a href="/bin-list/">BIN list</a><a href="mailto:hello@checkedlab.com">hello@</a><a href="mailto:support@checkedlab.com">support@</a><a href="mailto:press@checkedlab.com">press@</a><a href="mailto:legal@checkedlab.com">legal@</a></p>';
const TOY_HOSTS = new Set(["cpsc.gov", "saferproducts.gov", "recalls-rappels.canada.ca", "canada.ca", "shopulstandards.com"]);
const THANKS_HOSTS = new Set(["fsis.usda.gov", "usda.gov", "nfpa.org", "usfa.fema.gov"]);
const CPSC_SEARCH = "https://www.cpsc.gov/Recalls";
const HC_SEARCH = "https://recalls-rappels.canada.ca/en";
const WINTER_CHECK = "How we check describes the dated CPSC and Health Canada match on a catalogue card. The date is the day that match was recorded. These guides add the label lines to read and the official search to open, including for a model that is not on a card. A clear line on one card does not cover a different model number.";
const GIFT_BAN = /\$\d|\bwe tested\b|\btested by us\b|\bwe bought\b|\bdoes not test\b|\bdid not test\b|\bnot tested\b|hands-on|lab-tested|lab tested|out of 5|star rating|review count|\bdiscount\b|\bstars?\b|\d+\s*%\s*off\b/i;
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
const editorial = JSON.parse(readFileSync(join(root, "data", "editorial.json"), "utf8"));
const giftsDoc = JSON.parse(readFileSync(join(root, "data", "gifts.json"), "utf8"));
const winterDoc = JSON.parse(readFileSync(join(root, "data", "winter-safety.json"), "utf8"));
const toyDoc = JSON.parse(readFileSync(join(root, "data", "toy-safety.json"), "utf8"));
const thanksDoc = JSON.parse(readFileSync(join(root, "data", "thanksgiving.json"), "utf8"));
const hubGuides = JSON.parse(readFileSync(join(root, "data", "hub-guides.json"), "utf8"));
const bestDoc = JSON.parse(readFileSync(join(root, "data", "best.json"), "utf8"));
const hubWordCounts = {};
const GUIDE_START = "<!-- checkedlab:guide start -->";
const GUIDE_END = "<!-- checkedlab:guide end -->";
const GUIDE_KEYS = ["home", "black-friday", "gifts", "compare", ...HUBS];
const COPY_BAN = /\$\d|\bwe tested\b|\btested by us\b|\bwe bought\b|\bdoes not test\b|\bdid not test\b|\bnot tested\b|\bnot(?: a)? measured\b|\bfrom this site\b|\bnot tested by\b|\bwe did not\b|\bwe didn['’]t\b|\bwe haven['’]t\b|hands-on|lab-tested|lab tested|out of 5|star rating|best overall|\bwinner\b|\bscore\b/i;
assertProducts(products);
assertRenderer();

const byHub = new Map(HUBS.map((hub) => [hub, products.filter((product) => product.category === hub)]));
assertHubGuides();

for (const hub of HUBS) {
  const file = join(root, hub, "index.html");
  let html = readFileSync(file, "utf8");
  card.beginPage();
  html = fillMount(html, byHub.get(hub).map((product, index) => card.card(product, "US", index === 0 ? { eager: true } : {})).join("\n"));
  const lead = byHub.get(hub).find((product) => card.schemaImage(product));
  html = ensureImagePreload(html, lead);
  html = pointItemList(html, hub);
  html = ensureScene(html);
  html = ensureChrome(ensureFontPreload(ensureCardScript(html)), hub);
  const hubExtra = explainers.filter((entry) => entry.hub === hub).map((entry) =>
    '<a href="/recalls/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>"
  ).concat(compares.filter((entry) => entry.hub === hub).map((entry) =>
    '<a href="/compare/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>"
  )).concat(editorialHubLinks(hub)).join(" ");
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
  const hubAnchors = explainers.filter((entry) => entry.hub === hub).map((entry) => ["/recalls/" + entry.slug + "/", entry.linkLabel])
    .concat(editorial.alternatives.filter((entry) => entry.hub === hub).map((entry) => ["/alternatives/" + entry.slug + "/", entry.linkLabel]))
    .concat(editorial.worth.filter((entry) => entry.hub === hub).map((entry) => ["/worth-it/" + entry.slug + "/", entry.linkLabel]))
    .concat(editorial.season.filter((entry) => entry.hub === hub).map((entry) => ["/black-friday/" + entry.slug + "/", entry.linkLabel]));
  for (const [href, label] of hubAnchors) {
    if (html.includes('href="' + href + '"')) continue;
    const needle = "Recall checks</a> for " + card.esc(HUB_NAME[hub]) + " models.";
    const at = html.indexOf(needle);
    if (at < 0) throw new Error("Hub lede missing for " + hub + " " + href);
    const end = html.indexOf("</p>", at);
    html = html.slice(0, end) + ' <a href="' + href + '">' + card.esc(label) + "</a>" + html.slice(end);
  }
  html = appendBestLinks(html, "Recall checks</a> for " + card.esc(HUB_NAME[hub]) + " models.", byHub.get(hub).map((product) => product.id));
  if (hub === "winter" && !html.includes('href="/winter-safety/"')) {
    const needle = "Recall checks</a> for Winter models.";
    const at = html.indexOf(needle);
    if (at < 0) throw new Error("Winter hub lede missing");
    const end = html.indexOf("</p>", at);
    html = html.slice(0, end) + '. <a href="/winter-safety/">Winter home safety</a>' + html.slice(end);
  }
  if (hub === "kitchen" && !html.includes('href="/thanksgiving/"')) {
    const needle = "Recall checks</a> for Kitchen models.";
    const at = html.indexOf(needle);
    if (at < 0) throw new Error("Kitchen hub lede missing");
    const end = html.indexOf("</p>", at);
    html = html.slice(0, end) + ' <a href="/thanksgiving/">Thanksgiving and holiday hosting</a>' + html.slice(end);
  }
  html = applyCategoryHub(html, hub);
  writeFileSync(file, html);
}

{
  const file = join(root, "index.html");
  let html = readFileSync(file, "utf8");
  const byId = new Map(products.map((product) => [product.id, product]));
  const popular = POPULAR_IDS.map((id) => byId.get(id)).filter(Boolean);
  const recallsOnHome = products.filter(isBin);
  card.beginPage();
  html = fillMount(html, popular.map((product, index) => card.card(product, "US", index === 0 ? { eager: true } : {})).join("\n"), POP_START, POP_END);
  html = fillMount(html, recallsOnHome.length ? recallsOnHome.map((product) => card.card(product, "US")).join("\n") : '<p class="empty">No official model recall is on the list.</p>', REC_START, REC_END);
  html = fillHomePointer(html, recalls.checkedAt || "");
  html = html.replace(/<section class="hub-tiles"[\s\S]*?<\/section>\n?/g, "");
  html = ensureScene(html);
  if (!html.includes('id="is-it-recalled-search"')) {
    html = html.replace('<section class="recall-band"', recallWidget() + "\n" + giftQuiz() + '\n<section class="recall-band"');
  }
  html = ensureChrome(ensureFontPreload(ensureCardScript(html)), "home");
  html = applyHomeGuide(html);
  writeFileSync(file, html);
}

{
  const file = join(root, "bin-list", "index.html");
  let html = readFileSync(file, "utf8");
  const shown = products.filter(isBin);
  card.beginPage();
  html = fillMount(html, shown.length ? shown.map((product) => card.card(product, "US")).join("\n") : BIN_EMPTY);
  html = ensureScene(html);
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
writeEditorial();
writeRecallFeed(ordered);
writeBlackFriday();
writeGifts();
writeBest();
writeWinterSafety();
writeToySafety();
writeThanksgiving();
writePhotoCredits();
const lastmods = stampPages(ordered);
writeSitemap(pages, lastmods);
verifyOutput(pages);
publishDist();
console.log(`Wrote ${pages.length} product pages, ${HUBS.length} hub card lists, /recalls/, /black-friday/, ${giftPaths().length} gift pages, ${winterPaths().length} winter safety pages, ${toyPaths().length} toy safety pages, and ${thanksPaths().length} Thanksgiving pages.`);
console.log("Hub intro words: " + Object.entries(hubWordCounts).map(([key, count]) => key + "=" + count).join(", "));

function assertProducts(list) {
  if (!Array.isArray(list) || !list.length) throw new Error("products.json is empty");
  const ids = new Set();
  for (const product of list) {
    if (!HUBS.includes(product.category)) throw new Error("Unknown category: " + product.category);
    if (!/^[a-z0-9-]+$/.test(product.id || "")) throw new Error("Unsafe product id: " + product.id);
    if (ids.has(product.id)) throw new Error("Duplicate product id: " + product.id);
    ids.add(product.id);
  }
  assertUniqueModelPhotos(list);
}

function assertUniqueModelPhotos(list) {
  const seen = new Map();
  for (const product of list) {
    if (product.imageKind !== "model") continue;
    const src = String(product.image || "");
    if (!src.startsWith("/images/")) throw new Error("Model photo path: " + product.id);
    const users = seen.get(src) || [];
    users.push(product.id);
    if (users.length > 3) {
      throw new Error("Photo file used as hero on more than 3 product pages: " + src + " (" + users.join(", ") + ")");
    }
    seen.set(src, users);
    if (!existsSync(join(root, src.slice(1)))) throw new Error("Missing product photo: " + src);
    const small = product.image_source && product.image_source.src400;
    if (small && !existsSync(join(root, String(small).replace(/^\//, "")))) {
      throw new Error("Missing product photo: " + small);
    }
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
  if (bin.includes("store-btn") || bin.includes("check-title") || bin.includes("evidence")) {
    throw new Error("Hub card includes a product-page block");
  }
  if (!bin.includes('class="spec-tile"') || !bin.includes('class="spec-model"') || !bin.includes('class="pick-if"') || !bin.includes("Pick it for:")) {
    throw new Error("Hub card is missing the spec tile");
  }
  if (bin.includes('class="p-photo"') || bin.includes('class="type-tile"') || bin.includes('class="illu"') || /amazon\.com/i.test(bin)) {
    throw new Error("Hub card used a photo, an icon tile, or an Amazon image");
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
  const usAmazon = card.amazonButton(products[0], "US");
  if (!usAmazon.includes("https://www.amazon.com/") || !usAmazon.includes("tag=checkedlab01-20") || usAmazon.includes("tag=checkedlab-20")) {
    throw new Error("US Amazon button has the wrong tag");
  }
  const caAmazon = card.amazonButton(products.find((product) => product.asin && product.asin.ca) || products[0], "CA");
  if (!caAmazon.includes("https://www.amazon.ca/") || !caAmazon.includes("tag=checkedlab-20") || caAmazon.includes("tag=checkedlab01-20")) {
    throw new Error("CA Amazon button has the wrong tag");
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
  const siblingCount = Math.min(4, Math.max(0, group.length - 1));
  for (let step = 1; step <= siblingCount; step++) picks.push(group[(index + step) % group.length]);
  const links = [
    '<a href="/' + product.category + '/">' + card.esc(HUB_NAME[product.category]) + "</a>",
    '<a href="/recalls/">Recall checks</a>',
    '<a href="/how-we-check/">How we check</a>',
    ...explainers.filter((entry) => entry.products.includes(product.id)).map((entry) =>
      '<a href="/recalls/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>"
    ),
    ...compares.filter((entry) => entry.products.includes(product.id) || (entry.alsoFrom || []).includes(product.id)).map((entry) => {
      const otherId = entry.products.find((id) => id !== product.id);
      const other = otherId ? resolveCompareSide(entry, otherId) : null;
      const label = entry.products.includes(product.id) && other
        ? "Compare with " + (other.model || other.title)
        : entry.linkLabel;
      return '<a href="/compare/' + entry.slug + '/">' + card.esc(label) + "</a>";
    }),
    ...editorialLinksForProduct(product),
    ...bestTypesForIds([product.id]).map(bestAnchor),
    ...winterGuideLinks(product),
    ...thanksGuideLinks(product),
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

function productFold(id, heading, body) {
  return '<details class="fold" id="' + id + '"><summary><h2>' + heading + "</h2></summary><div class=\"fold-body\">" + body + "</div></details>";
}

function productPage(product) {
  card.beginPage();
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
  const pick = card.pickLine(product);
  const media = card.visual(product, { eager: true, hero: true });
  const titleHtml = media.includes("spec-tile")
    ? '<div class="visually-hidden"><h1 class="p-title">' + card.visibleTitle(product.title) + "</h1></div>"
    : '<h1 class="p-title">' + card.visibleTitle(product.title) + "</h1>";
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

<main id="main">
<div class="wrap">
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<a href="/${hub}/">${card.esc(name)}</a>
<span aria-hidden="true">/</span>
<span aria-current="page">${card.esc(product.title)}</span>
</nav>
<article class="product-grid" id="${card.esc(product.id)}" data-category="${card.esc(hub)}">
<div class="fold-top">
<div class="pick-media">${media}</div>
<div class="p-main">
<span class="only-us">${card.badgeHtml(us)}</span>
<span class="only-ca">${card.badgeHtml(ca)}</span>
${titleHtml}
<p class="pick-if">${card.esc(pick)}</p>
<div class="only-us">${card.amazonButton(product, "US")}</div>
<div class="only-ca">${card.amazonButton(product, "CA")}</div>
</div>
</div>
</article>
<nav class="toc" aria-label="Jump to"><p>Jump to</p><a href="#is-it-recalled">Recall check</a><a href="#specs">Specs</a><a href="#stores">Stores</a><a href="#why-listed">Why it’s listed</a><a href="#questions">Questions</a></nav>
<details class="fold"><summary><h2 class="recall-q" id="is-it-recalled">Is the ${card.esc(product.title)} recalled?</h2></summary><div class="fold-body">${datedParagraph(us, "US")}${datedParagraph(ca, "Canadian")}${otherSection(product)}${modelFindHtml(product)}</div></details>
${productFold("specs", "Specs", specList(product) + card.evidenceList(product) + '<p class="price-note">Prices change often, check the current price at the store.</p><p class="affiliate-note">Amazon link is an affiliate link</p>')}
${productFold("stores", "Stores", '<div class="only-us">' + card.storeButtons(product, "US") + '</div><div class="only-ca">' + card.storeButtons(product, "CA") + "</div>")}
${productFold("why-listed", "Why it’s listed", '<p class="why-note">' + card.esc(why) + "</p>" + '<p class="p-note only-us">' + card.esc(card.honestLine(product, us)) + '</p><p class="p-note only-ca">' + card.esc(card.honestLine(product, ca)) + "</p>" + card.checkList(product))}
${productFold("questions", "Questions", faqHtml(product) + canadaBlock(product))}
${siblingLinks(product)}
</div>
</main>

<footer>
<div class="foot">
${DISCLOSURE}
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

function mastheadHtml(current) {
  const mark = (key) => current === key ? ' aria-current="page"' : "";
  const cats = NAV.map(([hub, label]) =>
    '<a href="/' + hub + '/"' + mark(hub) + ">" + ICONS[hub] + "<span>" + label + "</span></a>"
  ).join("") +
    '<a href="/thanksgiving/"' + mark("thanksgiving") + "><span>Thanksgiving</span></a>" +
    '<a href="/toy-safety/"' + mark("toy-safety") + "><span>Toy safety</span></a>" +
    '<a href="/winter-safety/"' + mark("winter-safety") + "><span>Winter safety</span></a>";
  return '<div class="masthead">\n<header class="bar">\n' +
    '<a class="logo" href="/"><span class="logo-mark" aria-hidden="true"></span>Checked Lab</a>\n' +
    '<div class="nav-panel" id="site-nav" data-nav-panel>\n<nav class="primary-nav" aria-label="Primary">\n' +
    '<a href="/recalls/"' + mark("recalls") + ">Recall checks</a>\n" +
    '<a href="/gifts/"' + mark("gifts") + ">Gift guides</a>\n" +
    '<a href="/best/"' + mark("best") + ">Best of</a>\n" +
    '<a href="/black-friday/"' + mark("black-friday") + ">Black Friday</a>\n" +
    '<details class="cat-menu">\n<summary>Categories</summary>\n<div class="cat-panel">' + cats + "</div>\n</details>\n" +
    '<a href="/how-we-check/"' + mark("how") + ">How we check</a>\n" +
    '<a href="/bin-list/"' + mark("bin") + ">BIN list</a>\n" +
    "</nav>\n</div>\n" +
    '<div class="country-switch" role="group" aria-label="Country">\n' +
    '<button type="button" data-region-set="US">US</button>\n' +
    '<button type="button" data-region-set="CA">CA</button>\n</div>\n' +
    '<form class="head-search" action="/" method="get" role="search">\n' +
    '<label class="visually-hidden" for="site-q">Search models</label>\n' +
    '<input id="site-q" name="q" data-model-search type="search" placeholder="Search models" autocomplete="off" enterkeyhint="search">\n' +
    "</form>\n" +
    '<button class="nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="site-nav">Menu</button>\n' +
    "</header>\n</div>";
}

function inferCurrent(html) {
  const match = html.match(/rel="canonical" href="https:\/\/www\.checkedlab\.com([^"]*)"/);
  const path = match ? match[1] : "/";
  if (path.startsWith("/how-we-check")) return "how";
  if (path.startsWith("/bin-list")) return "bin";
  if (path.startsWith("/recalls")) return "recalls";
  if (path.startsWith("/gifts")) return "gifts";
  if (path.startsWith("/best")) return "best";
  if (path.startsWith("/black-friday")) return "black-friday";
  if (path.startsWith("/thanksgiving")) return "thanksgiving";
  if (path.startsWith("/toy-safety")) return "toy-safety";
  if (path.startsWith("/winter-safety")) return "winter-safety";
  const hub = path.split("/").filter(Boolean)[0];
  if (HUBS.includes(hub)) return hub;
  return "";
}

function blockEnd(html, start) {
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = re.exec(html))) {
    depth += match[0] === "</div>" ? -1 : 1;
    if (depth === 0) return re.lastIndex;
  }
  return -1;
}

function installChrome(html) {
  const mast = html.indexOf('<div class="masthead"');
  if (mast < 0) return html;
  const end = blockEnd(html, mast);
  if (end < 0) throw new Error("Masthead did not close");
  const top = html.lastIndexOf('<div class="topbar"', mast);
  const from = top >= 0 && mast - top < 400 ? top : mast;
  return html.slice(0, from) + mastheadHtml(inferCurrent(html)) + html.slice(end);
}

function ensureChrome(html) {
  return polish(installChrome(html));
}

function sceneBlock() {
  return "";
}

function ensureScene(html) {
  return html
    .replace(/<div class="hero-art" data-scene="[^"]*">[\s\S]*?<\/div>\n?/g, "")
    .replace(/<figure class="hero-photo">[\s\S]*?<\/figure>\n?/g, "")
    .replace(/\n?<link rel="preload" as="image"[^>]*>/g, "");
}

function hubTiles() {
  return '<section class="hub-tiles" aria-label="Categories">\n' + NAV.map(([hub, label]) =>
    '<a class="tile tile-' + hub + '" href="/' + hub + '/">' + ICONS[hub] + "<span>" + label + "</span></a>"
  ).join("\n") + "\n</section>";
}

function recallWidget() {
  return `<section class="recall-widget" id="is-it-recalled-search" aria-labelledby="recall-search-title">
<h2 id="recall-search-title">Is it recalled?</h2>
<p>Search the models on this site. For a model that is not listed, open the official search.</p>
<form class="find" role="search" action="#is-it-recalled-search">
<label for="recall-q">Model or brand</label>
<input id="recall-q" data-recall-search type="search" placeholder="Try heater, FN101, or Coway" autocomplete="off" enterkeyhint="search">
</form>
<div data-recall-results aria-live="polite"></div>
<p class="recall-official"><a href="${CPSC_SEARCH}" target="_blank" rel="noopener">Search CPSC recalls</a><a href="${HC_SEARCH}" target="_blank" rel="noopener">Search Health Canada recalls</a></p>
</section>`;
}

function giftQuiz() {
  const options = [
    ["cook", "Home cook"],
    ["coffee", "Coffee"],
    ["home", "Home"],
    ["garage", "Garage"],
    ["pet", "Pet"],
    ["sleep", "Sleep"],
    ["tech", "Tech"],
    ["kids", "Kids"],
    ["host", "Host"]
  ];
  const buttons = (step) => options.map(([value, label]) =>
    '<button type="button" data-quiz-value="' + value + '" data-quiz-step-value="' + step + '">' + label + "</button>"
  ).join("");
  return `<section class="quiz" id="gift-finder" data-gift-quiz aria-labelledby="quiz-title">
<h2 id="quiz-title">Gift finder</h2>
<p>Who it is for, then what they are into. No prices.</p>
<fieldset data-quiz-step="who">
<legend>Who is it for?</legend>
<div class="quiz-options">${buttons("who")}</div>
</fieldset>
<fieldset data-quiz-step="budget" hidden>
<legend>Budget</legend>
<p>Any budget. These guides do not list prices.</p>
<button type="button" data-quiz-next>Continue</button>
</fieldset>
<fieldset data-quiz-step="interest" hidden>
<legend>What are they into?</legend>
<div class="quiz-options">${buttons("interest")}</div>
</fieldset>
<p class="quiz-result" data-quiz-result hidden></p>
</section>`;
}

function ensureDock(html) {
  html = html.replace(/\n?<div class="dock" data-dock>[\s\S]*?<\/div>\n?/g, "\n");
  if (!html.includes('data-page="product"')) return html;
  const dock = '<div class="dock" data-dock><a class="dock-cta" href="#is-it-recalled">Is it recalled?</a></div>\n';
  return html.replace("</body>", dock + "</body>");
}

function polish(html) {
  html = installChrome(html);
  html = html.replace(/<div class="disclosure">[\s\S]*?<\/div>\s*/g, "");
  if (html.includes("<footer>")) html = html.replace(/<footer>[\s\S]*?<\/footer>/, FOOTER);
  html = html.replace(/name="theme-color" content="#[0-9A-Fa-f]{3,8}"/g, 'name="theme-color" content="#1F4D3A"');
  if (!html.includes('class="skip"')) {
    html = html.replace(/<body([^>]*)>/, '<body$1>\n<a class="skip" href="#main">Skip to content</a>');
  }
  if (!html.includes('id="main"')) html = html.replace("<main>", '<main id="main">');
  return ensureDock(html);
}

function assertSafeImages(html, where) {
  const tags = html.match(/<img\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const src = (tag.match(/\bsrc="([^"]+)"/i) || [])[1] || "";
    if (/amazon\.com|media-amazon|images-amazon/i.test(src)) throw new Error("Amazon image on " + where);
    if (/^https?:\/\//i.test(src)) throw new Error("Hotlinked image on " + where);
    if (src.includes("/images/") && !src.startsWith("/images/photos/") && !src.startsWith("/images/products/")) {
      throw new Error("Unlicensed product photo on " + where);
    }
    if (!/\balt="/i.test(tag)) throw new Error("Image missing alt on " + where);
    if (!/loading="lazy"|fetchpriority="high"/i.test(tag)) throw new Error("Image missing load hint on " + where);
  }
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
  card.beginPage();
    const cards = entry.products.map((id, index) => {
    const product = products.find((item) => item.id === id);
    if (!product) throw new Error("Explainer is missing catalogue id " + id);
    return card.card(product, "US", index === 0 ? { eager: true } : {});
  }).join("\n");
  const lines = entry.products.map((id) => {
    const product = products.find((item) => item.id === id);
    const us = recallSentence(card.recallFor(product, "US"), "US");
    const ca = recallSentence(card.recallFor(product, "CA"), "Canadian");
    return "<li>" + card.esc(us) + " " + card.esc(ca) + " <a href=\"" + card.productPath(product) + "\">" + card.esc(product.title) + "</a>.</li>";
  }).join("");
  const compareLinks = compares.filter((item) => (item.explainers || []).includes(entry.slug)).map((item) =>
    '<a href="/compare/' + item.slug + '/">' + card.esc(item.linkLabel) + "</a>"
  ).join(" ");
  const also = (entry.also || []).map((slug) => {
    const other = explainers.find((item) => item.slug === slug);
    if (!other) throw new Error("Explainer also missing " + slug + " from " + entry.slug);
    return '<a href="/recalls/' + slug + '/">' + card.esc(other.linkLabel) + "</a>";
  }).join(" ");
  const more = (entry.more || []).map((link) => {
    if (!link || typeof link.href !== "string" || !link.href.startsWith("/") || !link.label) {
      throw new Error("Explainer more link must be internal: " + entry.slug);
    }
    return '<a href="' + card.esc(link.href) + '">' + card.esc(link.label) + "</a>";
  }).join(" ");
  return '<div class="pick-grid">' + cards + "</div>" +
    productFold("catalogue-lines", "Checked Lab catalogue", "<p>" + card.esc(entry.catalogue) + "</p><ul>" + lines + "</ul>" +
    '<p class="lede"><a href="/recalls/">All recall checks</a> <a href="/black-friday/">Black Friday</a> <a href="/' + entry.hub + '/">' + card.esc(HUB_NAME[entry.hub]) + "</a> <a href=\"/how-we-check/\">How we check</a>" +
    (compareLinks ? " " + compareLinks : "") + (also ? " " + also : "") + (more ? " " + more : "") + "</p>");
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

function mentionsModel(text, product) {
  const hay = String(text).toLowerCase();
  const model = String(product.model || "").toLowerCase();
  return Boolean(model && model.length > 1 && hay.includes(model));
}

function specNumber(value) {
  const match = String(value).replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function shortPickName(product) {
  const model = String(product.model || "").trim();
  if (!model) return product.title;
  if (model.length <= 18) return model;
  const token = model.split(/\s+/)[0];
  if (/\d/.test(token) && token.length <= 12) return token;
  return model;
}

function clipValue(value) {
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > 48 ? text.split(",")[0] : text;
}

function compareRank(label) {
  const order = ["run time", "runtime", "battery", "suction", "weight", "charge time", "capacity", "bin volume", "power", "heat output", "cadr", "peak current"];
  const index = order.indexOf(String(label || "").toLowerCase());
  return index >= 0 ? index : 40;
}

function favorablePhrase(label, value, otherValue) {
  const name = String(label || "").toLowerCase();
  const mine = specNumber(value);
  const theirs = specNumber(otherValue);
  if (mine == null || theirs == null || mine === theirs) return "";
  const shown = clipValue(value);
  if (/run time|runtime/.test(name) && mine > theirs) return "longer run time (" + shown + ")";
  if (name === "suction" && mine > theirs) return "stronger suction (" + shown + ")";
  if (name === "weight" && mine < theirs) return "a lower weight (" + shown + ")";
  if (/charge/.test(name) && mine < theirs) return "a shorter charge (" + shown + ")";
  if (mine > theirs && /capacity|power|heat|cadr|battery|bin volume/.test(name)) return "a higher " + name + " (" + shown + ")";
  return "";
}

function plainPhrase(label, value) {
  const name = String(label || "").toLowerCase();
  const shown = clipValue(value);
  if (/run time|runtime/.test(name)) return shown + " run time";
  if (name === "suction") return "suction of " + shown;
  if (name === "weight") return "a weight of " + shown;
  if (/charge/.test(name)) return "a charge time of " + shown;
  return name + " of " + shown;
}

function pickBoxText(entry, product, pair) {
  const other = pair.find((item) => item.id !== product.id);
  let rows = [];
  try {
    rows = sharedSpecRows(product, other);
  } catch {
    rows = [];
  }
  const ranked = rows.filter((row) => String(row.left.value).trim() !== String(row.right.value).trim())
    .sort((a, b) => compareRank(a.label) - compareRank(b.label));
  const phrases = [];
  for (const row of ranked) {
    const phrase = favorablePhrase(row.label, row.left.value, row.right.value);
    if (!phrase) continue;
    phrases.push(phrase);
    if (phrases.length === 2) break;
  }
  if (phrases.length < 2) {
    for (const row of ranked) {
      if (favorablePhrase(row.label, row.left.value, row.right.value)) continue;
      phrases.push(plainPhrase(row.label, row.left.value));
      if (phrases.length === 2) break;
    }
  }
  if (!phrases.length) {
    return "you want " + card.pickLine(product).replace(/^Pick it for:\s*/, "") + ".";
  }
  return "you want " + (phrases.length === 2 ? phrases[0] + " and " + phrases[1] : phrases[0]) + ".";
}

function pickPair(entry, pair) {
  return '<div class="pick-pair">' + pair.map((product) =>
    '<article class="pick-box"><h2>Pick the ' + card.esc(shortPickName(product)) + " if</h2><p>" +
    card.esc(pickBoxText(entry, product, pair)) + '</p><a class="hub-more" href="' + card.productPath(product) + '">See the model</a></article>'
  ).join("") + "</div>";
}

function resolveCompareSide(entry, id) {
  const catalog = products.find((item) => item.id === id);
  const guest = (entry.guests || []).find((item) => item.id === id);
  const base = catalog || guest;
  if (!base) throw new Error("Compare is missing " + id);
  const adds = (entry.specAdds && entry.specAdds[id]) || [];
  const addLabels = new Set(adds.map((spec) => spec.label));
  const specs = [...(base.specs || []).filter((spec) => spec && !addLabels.has(spec.label)), ...adds];
  return { ...base, specs, catalog: Boolean(catalog) };
}

function relatedCompares(entry) {
  const slugs = new Set(entry.related || []);
  for (const other of compares) {
    if (other.slug === entry.slug) continue;
    if (other.products.some((id) => entry.products.includes(id))) slugs.add(other.slug);
    if ((other.related || []).includes(entry.slug)) slugs.add(other.slug);
  }
  return compares.filter((other) => slugs.has(other.slug));
}

function compareArt(product, index, strict) {
  if (strict && product.imageMatch !== "exact") return card.tile(product);
  return card.visual(product, { eager: index === 0, sizes: "(max-width: 640px) 46vw, 180px" });
}

function verdictBlock(entry, pair) {
  return '<div class="pick-pair">' + entry.verdict.map((item) => {
    if (!item.heading || !Array.isArray(item.bullets) || item.bullets.length < 2 || item.bullets.length > 3) {
      throw new Error("Verdict needs a heading and two or three bullets: " + entry.slug);
    }
    const side = pair.find((product) => product.id === item.id);
    let link = "";
    if (side && side.catalog) link = '<a class="hub-more" href="' + card.productPath(side) + '">See the model</a>';
    else if (side && side.sourceUrl) {
      link = '<a class="hub-more" href="' + card.esc(side.sourceUrl) + '" target="_blank" rel="noopener">Maker page</a>';
    }
    return '<article class="pick-box"><h2>' + card.esc(item.heading) + "</h2><ul>" +
      item.bullets.map((bullet) => "<li>" + card.esc(bullet) + "</li>").join("") +
      "</ul>" + link + "</article>";
  }).join("") + "</div>";
}

function sideAnchor(product) {
  if (product.catalog) return '<a href="' + card.productPath(product) + '">' + card.esc(product.title) + "</a>";
  if (product.sourceUrl) {
    return '<a href="' + card.esc(product.sourceUrl) + '" target="_blank" rel="noopener">' + card.esc(product.sourceName || product.title) + "</a>";
  }
  return card.esc(product.title);
}

function unmatchedSpecHtml(pair, rows) {
  const labels = new Set(rows.map((row) => row.label));
  return pair.map((product) => {
    const specs = (product.specs || []).filter((spec) => spec && spec.label && spec.value && spec.url && !labels.has(spec.label));
    if (!specs.length) return "";
    const items = specs.map((spec) =>
      "<li>" + card.esc(spec.label) + ": " + card.esc(spec.value) +
      ' <a href="' + card.esc(spec.url) + '" target="_blank" rel="noopener">Source</a></li>'
    ).join("");
    return "<h3>" + card.esc(shortPickName(product)) + "</h3><ul>" + items + "</ul>";
  }).join("");
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
          { "@type": "ListItem", position: 2, name: "Spec comparisons", item: ORIGIN + "/compare/" },
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
      },
      {
        "@type": "ItemList",
        name: entry.title,
        numberOfItems: 2,
        itemListElement: pair.map((product, index) => {
          const item = { "@type": "ListItem", position: index + 1, name: product.title };
          if (product.catalog) item.url = ORIGIN + card.productPath(product);
          else if (product.sourceUrl) item.url = product.sourceUrl;
          return item;
        })
      }
    ]
  };
  assertNoCommerce(graph);
  return JSON.stringify(graph, null, 2).replace(/</g, "\\u003c");
}

function compareBodyWords(entry) {
  const chunks = [...(entry.fit || [])];
  for (const section of entry.sections || []) chunks.push(section.heading, ...(section.paragraphs || []));
  return chunks.join(" ").split(/\s+/).filter(Boolean).length;
}

function assertBuyerVerdict(entry) {
  if (!entry.verdict) return;
  const siteVoice = /\b(cards?|catalogues?|catalogs?|pages?|matching)\b/i;
  const intro = String(entry.description || "").split(/(?<=\.)\s/)[0];
  if (siteVoice.test(intro)) throw new Error("Compare intro talks about the site: " + entry.slug);
  for (const item of entry.verdict) {
    const text = [item.heading, ...(item.bullets || [])].join(" ");
    if (siteVoice.test(text)) throw new Error("Verdict talks about the site: " + entry.slug);
  }
}

function writeCompares() {
  if (compares.length !== 35) throw new Error("Expected thirty-five compare pages");
  for (const entry of compares) {
    if (!/^[a-z0-9-]+$/.test(entry.slug)) throw new Error("Bad compare slug");
    assertBuyerVerdict(entry);
    const pair = entry.products.map((id) => resolveCompareSide(entry, id));
    if (entry.verdict && entry.verdict.length !== 2) throw new Error("Verdict needs two sides: " + entry.slug);
    const rows = sharedSpecRows(pair[0], pair[1]);
    card.beginPage();
    const head = pair.map((product, index) => {
      const art = compareArt(product, index, Boolean(entry.verdict));
      const nameClass = art.includes("spec-tile") ? ' class="visually-hidden"' : "";
      return '<th><div class="compare-who">' + art + "<p" + nameClass + ">" + card.esc(shortPickName(product)) + "</p></div></th>";
    }).join("");
    const body = rows.map((row) =>
      "<tr><th>" + card.esc(row.label) + "</th><td>" + specCell(row.left) + "</td><td>" + specCell(row.right) + "</td></tr>"
    ).join("");
    const recallsHtml = pair.map((product) => {
      const us = recallSentence(card.recallFor(product, "US"), "US");
      const ca = recallSentence(card.recallFor(product, "CA"), "Canadian");
      return "<p>" + sideAnchor(product) + ". " + card.esc(us) + " " + card.esc(ca) + "</p>";
    }).join("") +
      '<p>Those sentences are the catalogue match dated ' + card.esc(recalls.checkedAt) + ' (UTC), from the <a href="' + CPSC_SEARCH + '" target="_blank" rel="noopener">CPSC Recalls</a> search and the <a href="' + HC_SEARCH + '" target="_blank" rel="noopener">Health Canada recalls and safety alerts</a> search. Open the model page for the feed link.</p>';
    const stores = (region, heading) => "<h2>" + heading + "</h2>" + pair.map((product) =>
      "<h3>" + card.esc(product.model || product.title) + "</h3>" + card.storeButtons(product, region)
    ).join("");
    const fit = (entry.fit || []).map((paragraph) => "<p>" + card.esc(paragraph) + "</p>").join("");
    const sections = (entry.sections || []).map((section) => {
      if (!section.heading || !Array.isArray(section.paragraphs) || !section.paragraphs.length) {
        throw new Error("Compare section is incomplete: " + entry.slug);
      }
      return "<h2>" + card.esc(section.heading) + "</h2>" +
        section.paragraphs.map((paragraph) => "<p>" + card.esc(paragraph) + "</p>").join("");
    }).join("");
    if (entry.sections && entry.sections.length) {
      const words = compareBodyWords(entry);
      if (words < 320) throw new Error("Compare page is thin (" + words + " words): " + entry.slug);
      const pickText = entry.sections.map((section) => section.paragraphs.join(" ")).join(" ");
      if (!/Pick the /.test(pickText)) throw new Error("Compare page has no pick-by-spec line: " + entry.slug);
    }
    const related = relatedCompares(entry);
    if (entry.verdict && related.length < 2) throw new Error("Compare needs two related pages: " + entry.slug);
    const relatedHtml = related.length
      ? '<p class="lede">Related spec pages: ' + related.map((other) =>
        '<a href="/compare/' + other.slug + '/">' + card.esc(other.linkLabel) + "</a>"
      ).join(" ") + ".</p>"
      : "";
    const crossHtml = anchorsForIds(entry.products).join(" ");
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
<main id="main">
<div class="wrap prose">
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<a href="/compare/">Spec comparisons</a>
<span aria-hidden="true">/</span>
<span aria-current="page">${card.esc(entry.title)}</span>
</nav>
<h1>${card.esc(entry.title)}</h1>
<p class="sub">${card.esc(entry.description.split(/(?<=\.)\s/)[0])}</p>
${entry.verdict ? verdictBlock(entry, pair) + "\n" : ""}<div class="compare-wrap">
<table class="compare">
<thead><tr><th>Spec</th>${head}</tr></thead>
<tbody>${body}</tbody>
</table>
</div>
${entry.verdict ? "" : pickPair(entry, pair)}
<nav class="toc" aria-label="Jump to"><p>Jump to</p><a href="#how-to-read">How to read this</a><a href="#recall-check">Recall check</a><a href="#stores">Stores</a></nav>
${productFold("how-to-read", "How to read this", '<p class="lede">' + card.esc(entry.description) + "</p><p>Each line below is copied from that model’s maker page. The Source link opens that page. A spec that only one card lists is left out of the table. Recall lines use the " + card.esc(recalls.checkedAt) + " (UTC) catalogue check.</p>" + fit + (sections ? "\n" + sections : "") + (entry.verdict ? unmatchedSpecHtml(pair, rows) : "") + (relatedHtml ? "\n" + relatedHtml : ""))}
${productFold("recall-check", "Recall check", recallsHtml + '<p class="lede"><a href="/compare/">All comparisons</a> ' + (entry.verdict ? '<a href="/black-friday/">Black Friday</a> ' : "") + '<a href="/recalls/">All recall checks</a> <a href="/' + entry.hub + '/">' + card.esc(HUB_NAME[entry.hub]) + '</a> <a href="/how-we-check/">How we check</a> ' + pair.map(sideAnchor).join(" ") + (crossHtml ? " " + crossHtml : "") + "</p>")}
${productFold("stores", "Stores", stores("US", "United States stores") + stores("CA", "Canadian stores"))}
</div>
</main>
<footer>
<div class="foot">
${DISCLOSURE}
<p>© 2026 CHECKED LAB<br>Winnipeg, MB</p>
<p class="foot-mail"><a href="/recalls/">Recall checks</a><a href="/how-we-check/">How we check</a><a href="/bin-list/">BIN list</a><a href="mailto:hello@checkedlab.com">hello@</a><a href="mailto:support@checkedlab.com">support@</a><a href="mailto:press@checkedlab.com">press@</a><a href="mailto:legal@checkedlab.com">legal@</a></p>
</div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
    if (COPY_BAN.test(html) || /\$\d|\bdeal\b|\bdiscount\b|\d+\s*%\s*off\b/i.test(html)) {
      throw new Error("Compare page has a disallowed claim: " + entry.slug);
    }
    if (!html.includes("checkedlab01-20") || !html.includes("checkedlab-20")) {
      throw new Error("Compare page is missing Amazon tags: " + entry.slug);
    }
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const types = ld["@graph"].map((node) => node["@type"]).sort().join(",");
    if (types !== "Article,BreadcrumbList,ItemList") throw new Error("Compare schema on " + entry.slug);
    mkdirSync(join(root, "compare", entry.slug), { recursive: true });
    writeFileSync(join(root, "compare", entry.slug, "index.html"), polish(html));
  }
  writeCompareIndex();
}

function compareIndexJsonLd() {
  const url = ORIGIN + "/compare/";
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
          { "@type": "ListItem", position: 2, name: "Spec comparisons", item: url }
        ]
      },
      {
        "@type": "CollectionPage",
        "@id": url,
        name: "Spec comparisons, from the maker pages",
        headline: "Spec comparisons, from the maker pages",
        url: url,
        dateModified: recalls.checkedAt,
        inLanguage: "en",
        description: "Pairs of catalogue models. Each page repeats spec lines that both maker pages share, with a source link and a dated recall line.",
        mainEntity: {
          "@type": "ItemList",
          name: "Spec comparisons",
          numberOfItems: compares.length,
          itemListElement: compares.map((entry, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: entry.title,
            url: ORIGIN + "/compare/" + entry.slug + "/"
          }))
        }
      }
    ]
  };
  const faqs = hubGuides.compare.faqs;
  graph["@graph"].push({
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: plainInline(item.a) }
    }))
  });
  assertNoCommerce(graph);
  return JSON.stringify(graph, null, 2).replace(/</g, "\\u003c");
}

function writeCompareIndex() {
  const url = ORIGIN + "/compare/";
  const title = "Spec comparisons, from the maker pages";
  const description = "Pairs of catalogue models. Each page repeats spec lines that both maker pages share, with a source link and a dated recall line.";
  const sections = HUBS.filter((hub) => compares.some((entry) => entry.hub === hub)).map((hub) => {
    const items = compares.filter((entry) => entry.hub === hub).map((entry) =>
      "<li><a href=\"/compare/" + entry.slug + "/\">" + card.esc(entry.title) + "</a>. " + card.esc(entry.description) + "</li>"
    ).join("");
    return "<h2><a href=\"/" + hub + "/\">" + card.esc(HUB_NAME[hub]) + "</a></h2><ul>" + items + "</ul>";
  }).join("");
  const html = `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${url}">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.esc(title)} — Checked Lab</title>
<meta name="description" content="${card.esc(description)}">
<meta property="og:title" content="${card.esc(title)} — Checked Lab">
<meta property="og:description" content="${card.esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<link rel="icon" type="image/png" href="/favicon.png">
${FONT_PRELOAD}
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#F5F5F7">
<script type="application/ld+json">
${compareIndexJsonLd()}
</script>
</head>
<body data-page="recalls">
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
${nav("compare")}
</div>
<main>
<div class="wrap prose">
${sceneBlock("compare")}
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<span aria-current="page">Spec comparisons</span>
</nav>
<h1>${card.esc(title)}</h1>
<p class="sub">Open a pair. The table is the spec lines both maker pages share.</p>
${sections}
${productFold("compare-guide", "How to read a comparison", '<p class="lede">' + card.esc(description) + "</p>" + renderHubGuide("compare") + '<p>Each line on a comparison is copied from that model’s maker page. A spec that only one card lists is left out of the table. Recall lines use the ' + card.esc(recalls.checkedAt) + ' (UTC) catalogue check. Search the model on <a href="' + CPSC_SEARCH + '" target="_blank" rel="noopener">CPSC Recalls</a> and on <a href="' + HC_SEARCH + '" target="_blank" rel="noopener">Health Canada recalls and safety alerts</a>.</p>')}
<p class="lede"><a href="/recalls/">All recall checks</a> <a href="/how-we-check/">How we check</a> <a href="/black-friday/">Black Friday</a> <a href="/gifts/">Gift guides</a> <a href="/alternatives/">Alternatives</a> <a href="/worth-it/">Worth matching</a></p>
</div>
</main>
<footer>
<div class="foot">
${DISCLOSURE}
<p>© 2026 CHECKED LAB<br>Winnipeg, MB</p>
<p class="foot-mail"><a href="/recalls/">Recall checks</a><a href="/how-we-check/">How we check</a><a href="/bin-list/">BIN list</a><a href="mailto:hello@checkedlab.com">hello@</a><a href="mailto:support@checkedlab.com">support@</a><a href="mailto:press@checkedlab.com">press@</a><a href="mailto:legal@checkedlab.com">legal@</a></p>
</div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
  if (/\$\d/.test(html) || /we tested|we bought|does not test|\bwinner\b|\bscore\b/i.test(html)) {
    throw new Error("Compare index has a disallowed claim");
  }
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const types = ld["@graph"].map((node) => node["@type"]).sort().join(",");
  if (types !== "BreadcrumbList,CollectionPage,FAQPage") throw new Error("Compare index schema " + types);
  mkdirSync(join(root, "compare"), { recursive: true });
  writeFileSync(join(root, "compare", "index.html"), polish(html));
}

function editorialPaths() {
  return [
    "/alternatives/",
    ...editorial.alternatives.map((entry) => "/alternatives/" + entry.slug + "/"),
    "/worth-it/",
    ...editorial.worth.map((entry) => "/worth-it/" + entry.slug + "/"),
    ...editorial.season.map((entry) => "/black-friday/" + entry.slug + "/")
  ];
}

function editorialHubLinks(hub) {
  const links = [];
  const alt = editorial.alternatives.filter((entry) => entry.hub === hub);
  const worth = editorial.worth.filter((entry) => entry.hub === hub);
  if (alt.length) links.push('<a href="/alternatives/">Alternatives</a>');
  for (const entry of alt) links.push('<a href="/alternatives/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>");
  if (worth.length) links.push('<a href="/worth-it/">Worth matching</a>');
  for (const entry of worth) links.push('<a href="/worth-it/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>");
  for (const entry of editorial.season.filter((item) => item.hub === hub)) {
    links.push('<a href="/black-friday/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>");
  }
  return links;
}

function editorialLists() {
  return [
    ["alternatives", editorial.alternatives],
    ["worth-it", editorial.worth],
    ["black-friday", editorial.season]
  ];
}

function editorialLinksForProduct(product) {
  const links = [];
  for (const [section, list] of editorialLists()) {
    for (const entry of list) {
      const ids = [entry.subject, ...(entry.others || [])];
      if (!ids.includes(product.id)) continue;
      links.push('<a href="/' + section + '/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>");
    }
  }
  return links;
}

function anchorsForIds(ids) {
  const set = new Set(ids || []);
  const links = [];
  const seen = new Set();
  const add = (href, label) => {
    if (seen.has(href)) return;
    seen.add(href);
    links.push('<a href="' + href + '">' + card.esc(label) + "</a>");
  };
  for (const [section, list] of editorialLists()) {
    for (const entry of list) {
      const mine = [entry.subject, ...(entry.others || [])];
      if (!mine.some((id) => set.has(id))) continue;
      add("/" + section + "/" + entry.slug + "/", entry.linkLabel);
    }
  }
  for (const entry of explainers) {
    if (!(entry.products || []).some((id) => set.has(id))) continue;
    add("/recalls/" + entry.slug + "/", entry.linkLabel);
  }
  return links;
}

function seeAlsoHtml(entry) {
  const refs = entry.seeAlso || [];
  if (!refs.length) return "";
  const links = refs.map((ref) => {
    if (!ref || !ref.section || !ref.slug) throw new Error("Bad seeAlso on " + entry.slug);
    if (ref.section === "recalls") {
      const other = explainers.find((item) => item.slug === ref.slug);
      if (!other) throw new Error("seeAlso recall missing " + ref.slug + " from " + entry.slug);
      return '<a href="/recalls/' + ref.slug + '/">' + card.esc(other.linkLabel) + "</a>";
    }
    const list = editorialLists().find((pair) => pair[0] === ref.section);
    const other = list && list[1].find((item) => item.slug === ref.slug);
    if (!other) throw new Error("seeAlso missing " + ref.section + "/" + ref.slug);
    return '<a href="/' + ref.section + "/" + ref.slug + '/">' + card.esc(other.linkLabel) + "</a>";
  });
  if (links.length < 2) throw new Error("seeAlso needs two pages: " + entry.slug);
  return '<p class="lede">Related pages: ' + links.join(" ") + ".</p>";
}

function editorialIndexBlock() {
  const alt = editorial.alternatives.map((entry) =>
    '<a href="/alternatives/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>"
  ).join(" ");
  const worth = editorial.worth.map((entry) =>
    '<a href="/worth-it/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>"
  ).join(" ");
  return "<h2>Alternatives and spec matches</h2>" +
    "<p>These pages stay inside the catalogue. A pick line cites a maker spec from the card.</p>" +
    '<p class="lede"><a href="/alternatives/">Alternatives</a> ' + alt + "</p>" +
    '<p class="lede"><a href="/worth-it/">Worth matching</a> ' + worth + "</p>" +
    '<h2>One model at a time</h2><p>Each page is one catalogue model: the maker lines, a pick by those lines, and the dated recall sentence.</p><p class="lede">' +
    editorial.season.map((entry) => '<a href="/black-friday/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>").join(" ") +
    "</p>";
}

function editorialProducts(entry) {
  const ids = [entry.subject, ...(entry.others || [])];
  return ids.map((id) => {
    const product = products.find((item) => item.id === id);
    if (!product) throw new Error("Editorial page is missing " + id);
    return product;
  });
}

function editorialSpecBlock(product) {
  const rows = (product.specs || []).filter((spec) => spec && spec.label && spec.value && spec.url).map((spec) =>
    '<div class="spec"><dt>' + card.esc(spec.label) + "</dt><dd>" + card.esc(spec.value) +
    ' <a href="' + card.esc(spec.url) + '" target="_blank" rel="noopener">Source</a></dd></div>'
  ).join("");
  if (!rows) throw new Error("Editorial subject has no sourced specs: " + product.id);
  return "<h2>" + card.esc(product.title) + '</h2><dl class="specs">' + rows + "</dl>";
}

function editorialWords(entry) {
  const chunks = [];
  for (const section of entry.sections || []) chunks.push(section.heading, ...(section.paragraphs || []));
  return chunks.join(" ").split(/\s+/).filter(Boolean).length;
}

function editorialArticle(entry, section, crumb, pair) {
  const url = ORIGIN + "/" + section + "/" + entry.slug + "/";
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
          { "@type": "ListItem", position: 2, name: crumb, item: ORIGIN + "/" + section + "/" },
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
      },
      {
        "@type": "ItemList",
        name: entry.title,
        numberOfItems: pair.length,
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

function writeEditorialPage(entry, section, crumb) {
  if (!/^[a-z0-9-]+$/.test(entry.slug)) throw new Error("Bad editorial slug");
  if (!HUBS.includes(entry.hub)) throw new Error("Bad editorial hub: " + entry.slug);
  const words = editorialWords(entry);
  if (words < 320) throw new Error("Editorial page is thin (" + words + " words): " + section + "/" + entry.slug);
  const prose = (entry.sections || []).map((sectionItem) => sectionItem.paragraphs.join(" ")).join(" ");
  if (!/Pick the /.test(prose)) throw new Error("Editorial page has no pick line: " + entry.slug);
  const pair = editorialProducts(entry);
  const sections = (entry.sections || []).map((sectionItem) =>
    "<h2>" + card.esc(sectionItem.heading) + "</h2>" +
    sectionItem.paragraphs.map((paragraph) => "<p>" + card.esc(paragraph) + "</p>").join("")
  ).join("");
  const recallsHtml = pair.map((product) => {
    const us = recallSentence(card.recallFor(product, "US"), "US");
    const ca = recallSentence(card.recallFor(product, "CA"), "Canadian");
    return "<p><a href=\"" + card.productPath(product) + "\">" + card.esc(product.title) + "</a>. " + card.esc(us) + " " + card.esc(ca) + "</p>";
  }).join("") +
    '<p>Those sentences are the catalogue match dated ' + card.esc(recalls.checkedAt) + ' (UTC), from the <a href="' + CPSC_SEARCH + '" target="_blank" rel="noopener">CPSC Recalls</a> search and the <a href="' + HC_SEARCH + '" target="_blank" rel="noopener">Health Canada recalls and safety alerts</a> search.</p>';
  const stores = (region, heading) => "<h2>" + heading + "</h2>" + pair.map((product) =>
    "<h3>" + card.esc(product.model || product.title) + "</h3>" + card.storeButtons(product, region)
  ).join("");
  const related = compares.filter((item) => item.products.some((id) => pair.some((product) => product.id === id)));
  const noticeLinks = explainers.filter((item) => item.products.some((id) => pair.some((product) => product.id === id)));
  const relatedHtml = (related.length
    ? '<p class="lede">Spec comparisons: ' + related.map((item) =>
      '<a href="/compare/' + item.slug + '/">' + card.esc(item.linkLabel) + "</a>"
    ).join(" ") + ".</p>"
    : "") + (noticeLinks.length
    ? '<p class="lede">Official notices: ' + noticeLinks.map((item) =>
      '<a href="/recalls/' + item.slug + '/">' + card.esc(item.linkLabel) + "</a>"
    ).join(" ") + ".</p>"
    : "");
  const url = ORIGIN + "/" + section + "/" + entry.slug + "/";
  card.beginPage();
  const picks = '<div class="pick-grid">' + pair.map((product) => card.card(product, "US")).join("\n") + "</div>";
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
${editorialArticle(entry, section, crumb, pair)}
</script>
</head>
<body data-page="recalls">
<div class="masthead">
<header>
<a class="logo" href="/">CHECKED LAB</a>
</header>
${nav(entry.hub)}
</div>
<main id="main">
<div class="wrap prose">
${sceneBlock("compare")}
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<a href="/${section}/">${card.esc(crumb)}</a>
<span aria-hidden="true">/</span>
<span aria-current="page">${card.esc(entry.title)}</span>
</nav>
<h1>${card.esc(entry.title)}</h1>
<p class="sub">${card.esc(entry.description.split(/(?<=\.)\s/)[0])}</p>
${picks}
<nav class="toc" aria-label="Jump to"><p>Jump to</p><a href="#read-lines">The maker lines</a><a href="#recall-check">Recall check</a><a href="#stores">Stores</a></nav>
${productFold("read-lines", "The maker lines", '<p class="lede">' + card.esc(entry.description) + "</p><p>Each spec line is copied from that model’s maker page. The Source link opens that page. Recall lines use the " + card.esc(recalls.checkedAt) + " (UTC) catalogue check.</p>" + pair.map(editorialSpecBlock).join("\n") + sections)}
${productFold("recall-check", "Recall check", recallsHtml + '<p class="lede"><a href="/' + section + '/">' + card.esc(crumb) + '</a> <a href="/' + entry.hub + '/">' + card.esc(HUB_NAME[entry.hub]) + '</a> <a href="/compare/">Spec comparisons</a> <a href="/black-friday/">Black Friday</a> <a href="/recalls/">Recall checks</a> <a href="/how-we-check/">How we check</a> ' + bestTypesForIds(pair.map((product) => product.id)).map(bestAnchor).join(" ") + " " + pair.map((product) => '<a href="' + card.productPath(product) + '">' + card.esc(product.title) + "</a>").join(" ") + "</p>" + relatedHtml + seeAlsoHtml(entry))}
${productFold("stores", "Stores", stores("US", "United States stores") + stores("CA", "Canadian stores"))}
</div>
</main>
<footer><div class="foot">${DISCLOSURE}</div></footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
  if (COPY_BAN.test(html) || /\bdeal\b|\bdiscount\b|\d+\s*%\s*off\b/i.test(html)) {
    throw new Error("Editorial page has a disallowed claim: " + section + "/" + entry.slug);
  }
  if (!html.includes("checkedlab01-20") || !html.includes("checkedlab-20")) {
    throw new Error("Editorial page is missing Amazon tags: " + entry.slug);
  }
  mkdirSync(join(root, section, entry.slug), { recursive: true });
  writeFileSync(join(root, section, entry.slug, "index.html"), polish(html));
}

function editorialIndexArticle(section, title, description, list) {
  const url = ORIGIN + "/" + section + "/";
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
          { "@type": "ListItem", position: 2, name: title, item: url }
        ]
      },
      {
        "@type": "CollectionPage",
        name: title,
        headline: title,
        url: url,
        description: description,
        dateModified: recalls.checkedAt,
        inLanguage: "en",
        mainEntity: {
          "@type": "ItemList",
          name: title,
          numberOfItems: list.length,
          itemListElement: list.map((entry, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: entry.title,
            url: ORIGIN + "/" + section + "/" + entry.slug + "/"
          }))
        }
      }
    ]
  };
  assertNoCommerce(graph);
  return JSON.stringify(graph, null, 2).replace(/</g, "\\u003c");
}

function writeEditorialIndex(section, title, description, intro, list) {
  const items = list.map((entry) =>
    "<li><a href=\"/" + section + "/" + entry.slug + "/\">" + card.esc(entry.title) + "</a>. " + card.esc(entry.description) + "</li>"
  ).join("");
  const url = ORIGIN + "/" + section + "/";
  const html = `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${url}">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.esc(title)} — Checked Lab</title>
<meta name="description" content="${card.esc(description)}">
<meta property="og:title" content="${card.esc(title)} — Checked Lab">
<meta property="og:description" content="${card.esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<link rel="icon" type="image/png" href="/favicon.png">
${FONT_PRELOAD}
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#F5F5F7">
<script type="application/ld+json">
${editorialIndexArticle(section, title, description, list)}
</script>
</head>
<body data-page="recalls">
<div class="masthead"><header><a class="logo" href="/">CHECKED LAB</a></header>${nav("compare")}</div>
<main id="main">
<div class="wrap prose">
${sceneBlock("compare")}
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<span aria-current="page">${card.esc(title)}</span>
</nav>
<h1>${card.esc(title)}</h1>
<p class="sub">${card.esc(String(description).split(/(?<=\.)\s/)[0])}</p>
<ul class="scan-list">${items}</ul>
${productFold("about-list", "How to use this list", intro.map((paragraph) => "<p>" + paragraph + "</p>").join("\n") + '<p class="lede"><a href="/compare/">Spec comparisons</a> <a href="/black-friday/">Black Friday</a> <a href="/recalls/">Recall checks</a> <a href="/how-we-check/">How we check</a> <a href="/alternatives/">Alternatives</a> <a href="/worth-it/">Worth matching</a></p>')}
</div>
</main>
<footer><div class="foot">${DISCLOSURE}</div></footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
  if (COPY_BAN.test(html) || /\bdeal\b|\bdiscount\b/i.test(html)) throw new Error("Editorial index failed the honesty check: " + section);
  mkdirSync(join(root, section), { recursive: true });
  writeFileSync(join(root, section, "index.html"), polish(html));
}

function bestTypes() {
  return bestDoc.types;
}

function bestPagePath(type) {
  return "/best/" + type.slug + "/";
}

function bestPaths() {
  return ["/best/", ...bestTypes().map(bestPagePath)];
}

function bestModelIds(type) {
  return type.picks.map((pick) => pick.id).concat((type.also || []).map((item) => item.id));
}

function bestTypesForIds(ids) {
  const set = new Set(ids);
  return bestTypes().filter((type) => bestModelIds(type).some((id) => set.has(id)));
}

function bestAnchor(type) {
  return '<a href="' + bestPagePath(type) + '">See all best ' + card.esc(type.name) + "</a>";
}

function bestLede(ids) {
  const tags = bestTypesForIds(ids).map(bestAnchor);
  if (!tags.length) return "";
  return '<p class="lede">' + tags.join(" ") + "</p>";
}

function appendBestLinks(html, needle, ids) {
  let next = html;
  for (const type of bestTypesForIds(ids)) {
    const href = bestPagePath(type);
    if (next.includes(href)) continue;
    const at = next.indexOf(needle);
    if (at < 0) throw new Error("Lede missing for best link near " + needle);
    const end = next.indexOf("</p>", at);
    next = next.slice(0, end) + " " + bestAnchor(type) + next.slice(end);
  }
  return next;
}

function bestQuotes(text, value) {
  return String(text).toLowerCase().includes(String(value).toLowerCase());
}

function bestSpecItems(product, labels) {
  if (!labels || labels.length < 2 || labels.length > 3) throw new Error("Pick needs 2 or 3 specs: " + product.id);
  return '<ul class="hub-specs">' + labels.map((label) => {
    const spec = (product.specs || []).find((item) => item.label === label);
    if (!spec || !spec.value || !spec.url) throw new Error("Missing sourced spec " + label + " on " + product.id);
    return "<li><span>" + card.esc(spec.label) + "</span> " + card.esc(spec.value) +
      ' <a href="' + card.esc(spec.url) + '" target="_blank" rel="noopener">Source</a></li>';
  }).join("") + "</ul>";
}

function bestRecall(product) {
  return '<div class="only-us">' + card.recallBlock(card.recallFor(product, "US")) + "</div>" +
    '<div class="only-ca">' + card.recallBlock(card.recallFor(product, "CA")) + "</div>";
}

function bestStores(product) {
  return '<div class="only-us">' + card.storeButtons(product, "US") + "</div>" +
    '<div class="only-ca">' + card.storeButtons(product, "CA") + "</div>" +
    '<p class="price-note">Prices change often, check the current price at the store.</p>' +
    '<p class="affiliate-note">Amazon link is an affiliate link</p>';
}

function bestCard(product, pick, opts) {
  const href = card.productPath(product);
  const media = card.visual(product, Object.assign({ noCredit: true, genericUnlessExact: true }, opts || {}));
  const tiled = media.includes('class="spec-tile"');
  const label = pick.bestFor ? '<p class="pick-if">' + card.esc(pick.bestFor) + "</p>" : "";
  return '<article class="product-grid hub-card" id="' + card.esc(product.id) + '">' +
    '<div class="pick-media">' + media + "</div>" +
    '<div class="p-main">' +
    label +
    '<span class="only-us">' + card.badgeHtml(card.recallFor(product, "US")) + "</span>" +
    '<span class="only-ca">' + card.badgeHtml(card.recallFor(product, "CA")) + "</span>" +
    card.noteBadge(product) +
    '<h2 class="p-title' + (tiled ? " visually-hidden" : "") + '"><a href="' + href + '">' + card.visibleTitle(product.title) + "</a></h2>" +
    bestSpecItems(product, pick.specs) +
    bestRecall(product) +
    '<p><a class="hub-more" href="' + href + '">Model page</a></p>' +
    bestStores(product) +
    "</div></article>";
}

function bestWords(type) {
  const chunks = [...(type.how || []), ...(type.look || []), ...(type.faqs || []).flatMap((item) => [item.q, item.a])];
  for (const pick of type.picks) chunks.push(pick.bestFor, pick.because);
  for (const extra of type.also || []) chunks.push(extra.note);
  return chunks.join(" ").split(/\s+/).filter(Boolean).length;
}

function bestMethodHtml() {
  return [
    "<p>Checked Lab lines up maker pages, store links, and public recall records for shoppers in the US and Canada.</p>",
    "<p>Manufacturer pages, and only the sentences those pages actually state. The source link sits next to the spec.</p>",
    "<p>US recalls come from the CPSC SaferProducts API, and Canadian recalls from Health Canada’s open dataset d38de914-c94c-429b-8ab1-8776c31643e3. The date is the day that match was recorded.</p>",
    "<p>Placement on a card is editorial. Brands do not buy a slot on the page. Prices stay on the store sites. The buttons open the store.</p>"
  ].join("");
}

function bestRelatedHtml(ids) {
  const set = new Set(ids);
  const compareLinks = compares.filter((entry) => entry.products.some((id) => set.has(id)));
  const noticeLinks = explainers.filter((entry) => entry.products.some((id) => set.has(id)));
  return (compareLinks.length
    ? '<p class="lede">Spec comparisons: ' + compareLinks.map((entry) =>
      '<a href="/compare/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>"
    ).join(" ") + ".</p>"
    : "") + (noticeLinks.length
    ? '<p class="lede">Official notices: ' + noticeLinks.map((entry) =>
      '<a href="/recalls/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>"
    ).join(" ") + ".</p>"
    : "");
}

function bestJsonLd(type, picks) {
  const url = ORIGIN + bestPagePath(type);
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
          { "@type": "ListItem", position: 2, name: "Best of", item: ORIGIN + "/best/" },
          { "@type": "ListItem", position: 3, name: type.h1, item: url }
        ]
      },
      {
        "@type": "Article",
        headline: type.title,
        description: type.description,
        dateModified: recalls.checkedAt,
        inLanguage: "en",
        mainEntityOfPage: url
      },
      {
        "@type": "ItemList",
        name: type.title,
        numberOfItems: picks.length,
        itemListElement: picks.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: product.title,
          url: ORIGIN + card.productPath(product)
        }))
      },
      {
        "@type": "FAQPage",
        mainEntity: type.faqs.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a }
        }))
      }
    ]
  };
  assertNoCommerce(graph);
  return JSON.stringify(graph, null, 2).replace(/</g, "\\u003c");
}

function bestIndexJsonLd() {
  const url = ORIGIN + "/best/";
  const types = bestTypes();
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
          { "@type": "ListItem", position: 2, name: "Best of", item: url }
        ]
      },
      {
        "@type": "CollectionPage",
        name: bestDoc.title,
        headline: bestDoc.h1,
        url: url,
        description: bestDoc.description,
        dateModified: recalls.checkedAt,
        inLanguage: "en",
        mainEntity: {
          "@type": "ItemList",
          name: bestDoc.title,
          numberOfItems: types.length,
          itemListElement: types.map((type, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: type.title,
            url: ORIGIN + bestPagePath(type)
          }))
        }
      },
      {
        "@type": "FAQPage",
        mainEntity: bestDoc.faqs.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a }
        }))
      }
    ]
  };
  assertNoCommerce(graph);
  return JSON.stringify(graph, null, 2).replace(/</g, "\\u003c");
}

function assertBestDoc() {
  if (!bestDoc || bestDoc.types.length !== 12) throw new Error("Expected 12 best guides");
  const seen = new Set();
  let previousCount = Infinity;
  let previousName = "";
  for (const type of bestDoc.types) {
    if (!/^[a-z0-9-]+$/.test(type.slug)) throw new Error("Bad best slug: " + type.slug);
    if (seen.has(type.slug)) throw new Error("Duplicate best slug: " + type.slug);
    seen.add(type.slug);
    if (type.picks.length < 3 || type.picks.length > 6) throw new Error("Best pick count on " + type.slug);
    const count = bestModelIds(type).length;
    if (count < type.picks.length) throw new Error("Best model count on " + type.slug);
    if (count > previousCount || (count === previousCount && type.name < previousName)) {
      throw new Error("Best guides are not ordered by model count: " + type.slug);
    }
    previousCount = count;
    previousName = type.name;
    if (bestWords(type) < 320) throw new Error("Best page is thin (" + bestWords(type) + "): " + type.slug);
    const labels = new Set();
    const ids = new Set();
    for (const pick of type.picks) {
      if (ids.has(pick.id)) throw new Error("Duplicate pick " + pick.id);
      ids.add(pick.id);
      const product = products.find((item) => item.id === pick.id);
      if (!product) throw new Error("Best pick is not in the catalogue: " + pick.id);
      const bestFor = pick.bestFor || "";
      if (bestFor) {
        if (!bestFor.startsWith("Best for ")) throw new Error("Best label on " + pick.id);
        if (labels.has(bestFor)) throw new Error("Repeated label on " + type.slug);
        if (/\b\d+(?:\.\d+)?\s*lb\b/i.test(bestFor)) throw new Error("Weight trivia label on " + pick.id);
        labels.add(bestFor);
        const sourced = pick.because + " " + pick.specs.map((label) => {
          const spec = (product.specs || []).find((item) => item.label === label);
          return spec ? spec.value : "";
        }).join(" ");
        for (const num of bestFor.match(/\d[\d,.]*/g) || []) {
          const plain = num.replace(/,/g, "");
          if (!sourced.includes(num) && !sourced.replace(/,/g, "").includes(plain)) {
            throw new Error("Best label number is not in the sourced specs on " + pick.id + ": " + num);
          }
        }
      }
      if (COPY_BAN.test(pick.bestFor + " " + pick.because)) throw new Error("Best copy ban on " + pick.id);
      for (const label of pick.specs) {
        const spec = (product.specs || []).find((item) => item.label === label);
        if (!spec) throw new Error("Best spec missing " + label + " on " + pick.id);
        if (!bestQuotes(pick.because, spec.value)) throw new Error("Best reason misses " + label + " on " + pick.id);
      }
    }
    for (const extra of type.also || []) {
      const product = products.find((item) => item.id === extra.id);
      if (!product) throw new Error("Best also-link missing " + extra.id);
      const quoted = (product.specs || []).some((spec) => spec.value && bestQuotes(extra.note, spec.value));
      if (!quoted) throw new Error("Also note misses a spec on " + extra.id);
    }
    const prose = [...type.how, ...type.look, ...type.faqs.map((item) => item.q + " " + item.a)].join(" ");
    if (COPY_BAN.test(prose)) throw new Error("Best guide failed the honesty check: " + type.slug);
  }
  const intro = bestDoc.intro.join(" ");
  if (guideWords(intro) < 120) throw new Error("Best index is thin");
  if (COPY_BAN.test(intro + " " + bestDoc.faqs.map((item) => item.q + " " + item.a).join(" "))) {
    throw new Error("Best index failed the honesty check");
  }
}

function writeBestPage(type) {
  const picks = type.picks.map((pick) => {
    const product = products.find((item) => item.id === pick.id);
    return { pick, product };
  });
  const ids = bestModelIds(type);
  const hubs = [...new Set(picks.map((item) => item.product.category))];
  const why = picks.map((item) => "<h3>" + card.esc(item.product.title) + "</h3><p>" + card.esc(item.pick.because) + "</p>").join("");
  const also = (type.also || []).map((extra) => {
    const product = products.find((item) => item.id === extra.id);
    return "<p><a href=\"" + card.productPath(product) + "\">" + card.esc(product.title) + "</a>. " + card.esc(extra.note) + "</p>";
  }).join("");
  const checklist = '<ol class="checklist">' + type.look.map((item) => "<li>" + card.esc(item) + "</li>").join("") + "</ol>";
  const faqs = type.faqs.map((item) => "<h3>" + card.esc(item.q) + '</h3><p class="faq-a">' + card.esc(item.a) + "</p>").join("");
  const hubLinks = hubs.map((hub) => '<a href="/' + hub + '/">' + card.esc(HUB_NAME[hub]) + "</a>").join(" ");
  const url = ORIGIN + bestPagePath(type);
  card.beginPage();
  const cards = '<div class="pick-grid">' + picks.map((item, index) => bestCard(item.product, item.pick, index === 0 ? { eager: true } : {})).join("\n") + "</div>";
  const html = `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${url}">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.esc(type.title)} | Checked Lab</title>
<meta name="description" content="${card.esc(type.description)}">
<meta property="og:title" content="${card.esc(type.title)} | Checked Lab">
<meta property="og:description" content="${card.esc(type.description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<link rel="icon" type="image/png" href="/favicon.png">
${FONT_PRELOAD}
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#F5F5F7">
<script type="application/ld+json">
${bestJsonLd(type, picks.map((item) => item.product))}
</script>
</head>
<body data-page="best">
<div class="masthead"><header><a class="logo" href="/">CHECKED LAB</a></header>${nav(hubs[0])}</div>
<main id="main">
<div class="wrap prose">
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<a href="/best/">Best of</a>
<span aria-hidden="true">/</span>
<span aria-current="page">${card.esc(type.h1)}</span>
</nav>
<h1>${card.esc(type.h1)}</h1>
<p class="sub">${card.esc(type.description)}</p>
${cards}
<nav class="toc" aria-label="Jump to"><p>Jump to</p><a href="#how-we-picked">How we picked</a><a href="#what-to-look-for">What to look for</a><a href="#questions">Questions</a></nav>
${productFold("how-we-picked", "How we picked", bestMethodHtml() + type.how.map((paragraph) => "<p>" + card.esc(paragraph) + "</p>").join("") + why + (also ? "<h3>Also listed</h3>" + also : "") + bestRelatedHtml(ids))}
${productFold("what-to-look-for", "What to look for", checklist)}
<section class="faq" id="questions">
<h2>Questions</h2>
${faqs}
</section>
<p class="lede"><a href="/best/">All buyer guides</a> ${hubLinks} <a href="/black-friday/">Black Friday</a> <a href="/gifts/">Gift guides</a> <a href="/recalls/">Recall checks</a> <a href="/how-we-check/">How we check</a> ${picks.map((item) => '<a href="' + card.productPath(item.product) + '">' + card.esc(item.product.title) + "</a>").join(" ")}</p>
</div>
</main>
<footer><div class="foot">${DISCLOSURE}</div></footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
  if (COPY_BAN.test(html)) throw new Error("Best page failed the honesty check: " + type.slug);
  if (!html.includes("checkedlab01-20") || !html.includes("checkedlab-20")) {
    throw new Error("Best page is missing Amazon tags: " + type.slug);
  }
  const us = [...html.matchAll(/<div class="only-us">([\s\S]*?)<\/div>/g)].map((match) => match[1]).join("\n");
  const ca = [...html.matchAll(/<div class="only-ca">([\s\S]*?)<\/div>/g)].map((match) => match[1]).join("\n");
  if (us.includes("checkedlab-20") || ca.includes("checkedlab01-20")) {
    throw new Error("Amazon tags crossed regions on " + type.slug);
  }
  mkdirSync(join(root, "best", type.slug), { recursive: true });
  writeFileSync(join(root, "best", type.slug, "index.html"), polish(html));
}

function writeBestIndex() {
  const types = bestTypes();
  const items = types.map((type) =>
    "<li><a href=\"" + bestPagePath(type) + "\">" + card.esc(type.h1) + "</a>. " +
    card.esc(type.description) + "</li>"
  ).join("");
  const faqs = bestDoc.faqs.map((item) =>
    "<h3>" + card.esc(item.q) + '</h3><p class="faq-a">' + card.esc(item.a) + "</p>"
  ).join("");
  const url = ORIGIN + "/best/";
  const html = `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${url}">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.esc(bestDoc.title)} | Checked Lab</title>
<meta name="description" content="${card.esc(bestDoc.description)}">
<meta property="og:title" content="${card.esc(bestDoc.title)} | Checked Lab">
<meta property="og:description" content="${card.esc(bestDoc.description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<link rel="icon" type="image/png" href="/favicon.png">
${FONT_PRELOAD}
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#F5F5F7">
<script type="application/ld+json">
${bestIndexJsonLd()}
</script>
</head>
<body data-page="best">
<div class="masthead"><header><a class="logo" href="/">CHECKED LAB</a></header>${nav("")}</div>
<main id="main">
<div class="wrap prose">
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<span aria-current="page">Best of</span>
</nav>
<h1>${card.esc(bestDoc.h1)}</h1>
<p class="sub">${card.esc(bestDoc.description)}</p>
<ul class="scan-list">${items}</ul>
${productFold("how-we-picked", "How these pages were chosen", bestDoc.intro.map((paragraph) => "<p>" + card.esc(paragraph) + "</p>").join("") + bestMethodHtml())}
<section class="faq" id="questions">
<h2>Questions</h2>
${faqs}
</section>
<p class="lede"><a href="/black-friday/">Black Friday</a> <a href="/gifts/">Gift guides</a> <a href="/compare/">Spec comparisons</a> <a href="/recalls/">Recall checks</a> <a href="/how-we-check/">How we check</a></p>
</div>
</main>
<footer><div class="foot">${DISCLOSURE}</div></footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
  if (COPY_BAN.test(html)) throw new Error("Best index failed the honesty check");
  mkdirSync(join(root, "best"), { recursive: true });
  writeFileSync(join(root, "best", "index.html"), polish(html));
}

function writeBest() {
  assertBestDoc();
  for (const type of bestTypes()) writeBestPage(type);
  writeBestIndex();
  const keep = new Set(bestTypes().map((type) => type.slug));
  const dir = join(root, "best");
  for (const entry of readdirSync(dir)) {
    if (entry === "index.html") continue;
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (!keep.has(entry)) rmSync(full, { recursive: true, force: true });
  }
}

function assertBestPages() {
  const index = readFileSync(join(root, "best", "index.html"), "utf8");
  if (!index.includes('"@type": "FAQPage"') || !index.includes('"@type": "BreadcrumbList"') || !index.includes('"@type": "ItemList"')) {
    throw new Error("Best index schema missing");
  }
  if (!index.includes("<h1>The Best Buyer Guides for 2026</h1>")) throw new Error("Best index H1");
  if (!index.includes("<title>Best Buyer Guides 2026 (US &amp; Canada) | Checked Lab</title>")) throw new Error("Best index title");
  if (/\bfrom the catalogue\b|\bin this catalogue\b/i.test(index)) throw new Error("Best index still uses catalogue voice");
  for (const type of bestTypes()) {
    const html = readFileSync(join(root, "best", type.slug, "index.html"), "utf8");
    if (!html.includes('href="/best/"')) throw new Error("Best crumb missing on " + type.slug);
    if (!html.includes("How we picked") || !html.includes("What to look for")) throw new Error("Best sections missing on " + type.slug);
    for (const pick of type.picks) {
      const product = products.find((item) => item.id === pick.id);
      if (!html.includes('href="' + card.productPath(product) + '"')) throw new Error("Best page misses " + pick.id);
      if (pick.bestFor && !html.includes(card.esc(pick.bestFor))) throw new Error("Best label missing on " + pick.id);
      if (!pick.bestFor && html.includes('id="' + pick.id + '"><')) {
        const article = html.slice(html.indexOf('id="' + pick.id + '"'));
        const end = article.indexOf("</article>");
        if (article.slice(0, end).includes('class="pick-if"')) throw new Error("Empty Best label still rendered on " + pick.id);
      }
    }
    if (/figcaption|img-credit/i.test(html)) throw new Error("Best card shows a photo credit: " + type.slug);
    if (/\bfrom the catalogue\b|\bin this catalogue\b/i.test(html)) {
      throw new Error("Best page still says catalogue in the intro voice: " + type.slug);
    }
    const articles = html.match(/<article class="product-grid[\s\S]*?<\/article>/g) || [];
    for (const article of articles) {
      const id = (article.match(/\bid="([^"]+)"/) || [])[1];
      const product = products.find((item) => item.id === id);
      if (!product) continue;
      if (article.includes('class="spec-tile"')) {
        if (!article.includes('class="p-title visually-hidden"')) throw new Error("Spec tile repeats the title on " + id);
      } else if (article.includes('class="p-photo"')) {
        if (article.includes("visually-hidden")) throw new Error("Photo card hid the title on " + id);
        const alt = (article.match(/\balt="([^"]*)"/) || [])[1] || "";
        if (product.imageMatch !== "exact" && alt === card.esc(product.title)) {
          throw new Error("Photo alt names the model on " + id);
        }
      }
    }
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assertNoCommerce(data);
    const types = data["@graph"].map((node) => node["@type"]).sort().join(",");
    if (types !== "Article,BreadcrumbList,FAQPage,ItemList") throw new Error("Best schema on " + type.slug + " " + types);
    const faq = data["@graph"].find((node) => node["@type"] === "FAQPage");
    if (!faq || faq.mainEntity.length !== type.faqs.length) throw new Error("Best FAQPage " + type.slug);
    faq.mainEntity.forEach((node, index) => {
      if (node.name !== type.faqs[index].q || node.acceptedAnswer.text !== type.faqs[index].a) {
        throw new Error("Best FAQ JSON-LD mismatch " + type.slug);
      }
    });
    const list = data["@graph"].find((node) => node["@type"] === "ItemList");
    if (!list || list.numberOfItems !== type.picks.length) throw new Error("Best ItemList " + type.slug);
  }
  const indexNow = readFileSync(join(root, "scripts", "indexnow.mjs"), "utf8");
  if (!indexNow.includes("sitemap.xml")) throw new Error("IndexNow no longer reads the sitemap");
}

function writeEditorial() {
  if (editorial.alternatives.length !== 5) throw new Error("Expected five alternatives pages");
  if (editorial.worth.length !== 5) throw new Error("Expected five worth-it pages");
  if (editorial.season.length !== 9) throw new Error("Expected nine Black Friday model pages");
  for (const entry of editorial.alternatives) writeEditorialPage(entry, "alternatives", "Alternatives");
  for (const entry of editorial.worth) writeEditorialPage(entry, "worth-it", "Worth matching");
  for (const entry of editorial.season) writeEditorialPage(entry, "black-friday", "Black Friday");
  writeEditorialIndex("alternatives", "Alternatives in this catalogue", "Catalogue models you can read next to a named card. Each page cites maker spec lines and the dated recall check.", [
    "An alternative here is another model already on Checked Lab, not a model from outside the catalogue. The page quotes the maker lines and says which line to read for a given use.",
    "Open the model page for the full card. The recall sentence is the catalogue match dated " + card.esc(recalls.checkedAt) + " (UTC). Search the model on <a href=\"" + CPSC_SEARCH + "\" target=\"_blank\" rel=\"noopener\">CPSC Recalls</a> and on <a href=\"" + HC_SEARCH + "\" target=\"_blank\" rel=\"noopener\">Health Canada recalls and safety alerts</a>."
  ], editorial.alternatives);
  writeEditorialIndex("worth-it", "Worth matching to the spec line", "When a maker page’s lines fit the room, the chore, or the battery figure you are matching. No price verdict.", [
    "Worth matching means the sentences on the maker page describe the constraint you have: a cabinet height, a run time, a jar size, a battery line. It is not a price, a rating, or a rank.",
    "Each page names the catalogue neighbour to read when those lines do not fit. The recall sentence is the catalogue match dated " + card.esc(recalls.checkedAt) + " (UTC)."
  ], editorial.worth);
}

function roundupTable(entry) {
  if (!entry.tableHeading) throw new Error("Roundup needs a table heading: " + entry.slug);
  const rows = entry.notices.map((notice) => {
    if (!notice.hazard || !notice.product) throw new Error("Roundup notice needs product and hazard: " + entry.slug);
    return "<tr><td>" + card.esc(notice.date) + "</td><td>" + card.esc(notice.product) + "</td><td>" + card.esc(notice.models.join(", ")) + "</td><td>" + card.esc(notice.hazard) + "</td><td>" + card.esc(notice.remedy) + "</td><td><a href=\"" + href(notice.url) + "\" target=\"_blank\" rel=\"noopener\">" + card.esc(notice.agency) + " notice</a></td></tr>";
  }).join("");
  return "<h2>" + card.esc(entry.tableHeading) + "</h2><div class=\"compare-wrap\"><table class=\"compare\"><thead><tr><th>Date</th><th>Product</th><th>Model numbers</th><th>Hazard</th><th>What the notice tells owners</th><th>Notice</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
}

function writeExplainers() {
  if (explainers.length !== 10) throw new Error("Expected ten explainer pages");
  const slugs = new Set();
  for (const entry of explainers) {
    if (!/^[a-z0-9-]+$/.test(entry.slug) || slugs.has(entry.slug)) throw new Error("Bad explainer slug");
    slugs.add(entry.slug);
    if (entry.roundup && entry.notices.length < 2) throw new Error("Roundup has fewer than two notices: " + entry.slug);
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
${sceneBlock("recalls")}
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<a href="/recalls/">Recall checks</a>
<span aria-hidden="true">/</span>
<span aria-current="page">${card.esc(entry.title)}</span>
</nav>
<h1>${card.esc(entry.title)}</h1>
<p class="sub">${card.esc(entry.description.split(/(?<=\.)\s/)[0])}</p>
${entry.roundup ? roundupTable(entry) : ""}
${catalogueHtml(entry)}
${productFold("official-notices", "What the notices say", '<p class="lede">' + card.esc(entry.description) + " Catalogue lines below use the " + card.esc(recalls.checkedAt) + " (UTC) check.</p>" + entry.notices.map(noticeHtml).join("\n"))}
</div>
</main>
<footer>
<div class="foot">
${DISCLOSURE}
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
    writeFileSync(join(root, "recalls", entry.slug, "index.html"), polish(html));
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
${sceneBlock("recalls")}
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<span aria-current="page">Recall checks</span>
</nav>
<h1>Recall checks</h1>
${recallWidget()}
<p class="lede">Checked <time datetime="${card.esc(date)}">${card.esc(date)}</time> (UTC). Every catalogue model has a United States line from the <a href="${href(usSource)}" target="_blank" rel="noopener">CPSC SaferProducts</a> source and a Canada line from the <a href="${CA_DATASET_PAGE}" target="_blank" rel="noopener">Health Canada open dataset</a>.</p>
<p>A date is the day that check ran. Open a model for the maker specs. Read <a href="/how-we-check/">how we check</a> and the <a href="/bin-list/">BIN list</a>. <a href="/black-friday/">Black Friday 2026: check the model before you buy</a>. <a href="/thanksgiving/">Thanksgiving and holiday hosting, recall-checked</a>. <a href="/winter-safety/">Winter home safety, recall-checked</a>. <a href="/toy-safety/">Holiday toy safety, recall-checked</a>. <a href="/recalls/feed.xml">RSS</a> updates when a recall record changes.</p>
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
${DISCLOSURE}
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
  writeFileSync(join(root, "recalls", "index.html"), polish(html));
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

function bfModel(product, opts) {
  const art = card.mediaWithSpecs(product, opts);
  const hidden = art.includes("spec-tile") ? ' class="visually-hidden"' : "";
  return '<article class="bf-model" id="' + card.esc(product.id) + '">' +
    art +
    "<h3" + hidden + '><a href="' + card.productPath(product) + '">' + card.visibleTitle(product.title) + "</a></h3>" +
    '<p class="pick-if">' + card.esc(card.pickLine(product)) + "</p>" +
    '<a class="hub-more" href="' + card.productPath(product) + '">See the model</a>' +
    '<p class="only-us pick-status">' + bfStatusHtml(card.recallFor(product, "US"), "US") + "</p>" +
    '<p class="only-ca pick-status">' + bfStatusHtml(card.recallFor(product, "CA"), "Canadian") + "</p>" +
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
  card.beginPage();
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
    const bestTags = bestTypesForIds(group.map((product) => product.id)).map(bestAnchor).join(" ");
    return '<section class="pick-grid" id="' + hub + '"><h2><a href="/' + hub + '/">' + card.esc(HUB_NAME[hub]) + "</a></h2>" +
      group.map((product, index) => bfModel(product, hub === "winter" && index === 0 ? { eager: true } : {})).join("\n") +
      '<p class="lede"><a href="/' + hub + '/">All ' + card.esc(HUB_NAME[hub]) + " models</a>" + (bestTags ? " " + bestTags : "") + "</p></section>";
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
${sceneBlock("black-friday")}
<nav class="crumbs" aria-label="Breadcrumb">
<a href="/">Home</a>
<span aria-hidden="true">/</span>
<span aria-current="page">Black Friday</span>
</nav>
<h1>Before you buy on Black Friday, check the model.</h1>
<p class="sub">Confirm the model number, then read the dated recall check.</p>
<nav class="toc" aria-label="Jump to"><p>Jump to</p>${jumps}</nav>
${sections}
${productFold("before-you-pay", "Before you pay", '<p class="lede">Confirm the model number, then read the recall check for that model. The status under each card is the catalogue check dated <time datetime="' + card.esc(date) + '">' + card.esc(date) + '</time> (UTC).</p>' + renderHubGuide("black-friday", { faq: false }) + '<p><a href="/gifts/">Holiday 2026 gift guides</a> group the same catalogue by recipient. Each pick quotes the maker specs and repeats this dated check. <a href="/gifts/for-kids/">Gifts for kids</a> names mainstream kids products and the official check to do. <a href="/winter-safety/">Winter home safety, recall-checked</a> covers heaters, heated bedding, alarms, and outage power. <a href="/toy-safety/">Holiday toy safety, recall-checked</a> covers button batteries, magnets, water beads, and ride-ons.</p><p class="only-us">' + card.esc(US_DATES) + ' <a href="' + US_DEALS + '" target="_blank" rel="sponsored nofollow noopener">Amazon.com Black Friday</a>.</p><p class="only-ca">' + card.esc(CA_DATES) + ' <a href="' + CA_DEALS + '" target="_blank" rel="sponsored nofollow noopener">Amazon.ca Black Friday</a>.</p><p>Gift and seasonal models from this catalogue. Open the card and match the model number on the listing.</p><ol class="checklist"><li>Confirm the exact model number on the box, in the manual, and on the listing. A family name such as Foodi or Cosori can point at a different model.</li><li>Check that model on <a href="https://www.cpsc.gov/Recalls" target="_blank" rel="noopener">CPSC Recalls</a> for a US purchase and on <a href="https://recalls-rappels.canada.ca/en" target="_blank" rel="noopener">Health Canada recalls and safety alerts</a> for a Canadian purchase. <a href="/recalls/">Recall checks</a> is the catalogue match. <a href="/how-we-check/">How we check</a> says what the date means.</li><li>Beware look-alike listings and third-party sellers. The brand in the title is not the model number.</li><li>Read the return window on the listing before you pay. The window is printed on the store page.</li></ol>')}
${productFold("comparisons", "Maker spec comparisons", '<p>Each page repeats spec lines that both maker pages share. The cell links the maker page. The recall line is the catalogue match. <a href="/compare/">All comparisons</a>.</p><p class="lede">' + compares.map((entry) => '<a href="/compare/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>").join(" ") + "</p>" + editorialIndexBlock())}
${productFold("notices", "Notices to open before you buy", "<p>These pages quote the official notice and name the catalogue card.</p><ul>" + notices + "</ul>")}
<section class="faq" id="questions">
<h2>Questions</h2>
${faqHtml}
</section>
</div>
</main>
<footer>
<div class="foot">
${DISCLOSURE}
<p>© 2026 CHECKED LAB<br>Winnipeg, MB</p>
${SEASON_FOOT}
</div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
  if (/\$\d/.test(html) || /\d+\s*%/.test(html)) throw new Error("Black Friday page has a price or a percent");
  if (/we tested|we bought|does not test|did not test/i.test(html)) throw new Error("Black Friday page has a test claim");
  mkdirSync(join(root, "black-friday"), { recursive: true });
  writeFileSync(join(root, "black-friday", "index.html"), polish(html));
}

function assertBlackFriday(html) {
  assertFooterDisclosure(html, "Black Friday disclosure missing");
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
  if (!html.includes('href="/compare/"')) throw new Error("Black Friday misses the comparison index");
  for (const entry of compares) {
    if (!html.includes('href="/compare/' + entry.slug + '/"')) throw new Error("Black Friday misses " + entry.slug);
  }
  const usBits = [...html.matchAll(/<p class="only-us">([\s\S]*?)<\/p>/g)].map((match) => match[1]).join("\n");
  const caBits = [...html.matchAll(/<p class="only-ca">([\s\S]*?)<\/p>/g)].map((match) => match[1]).join("\n");
  const usTags = [...usBits.matchAll(/[?&]tag=([a-z0-9-]+)/g)].map((match) => match[1]);
  const caTags = [...caBits.matchAll(/[?&]tag=([a-z0-9-]+)/g)].map((match) => match[1]);
  if (usTags.length !== 1 || usTags[0] !== "checkedlab01-20") throw new Error("US Amazon tag on Black Friday");
  if (caTags.length !== 1 || caTags[0] !== "checkedlab-20") throw new Error("CA Amazon tag on Black Friday");
  if (!html.includes('href="/gifts/"')) throw new Error("Black Friday is missing the gift guides link");
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

function giftGuides() {
  const guides = giftsDoc && Array.isArray(giftsDoc.guides) ? giftsDoc.guides : null;
  if (guides && guides.some((guide) => guide.kind && guide.kind !== "checks")) throw new Error("Unknown gift kind");
  const lists = guides ? guides.filter((guide) => guide.kind !== "checks") : null;
  if (!lists || lists.length < 5 || lists.length > 7) throw new Error("Gift guides must be 5 to 7 lists");
  return lists;
}

function checksGuides() {
  const guides = giftsDoc && Array.isArray(giftsDoc.guides) ? giftsDoc.guides : [];
  const checks = guides.filter((guide) => guide.kind === "checks");
  const slugs = checks.map((guide) => guide.slug).sort().join(",");
  if (slugs !== "for-kids,for-the-host") throw new Error("Check gift guides changed: " + slugs);
  return checks;
}

function kidsGuide() {
  const kids = checksGuides().find((guide) => guide.slug === "for-kids");
  if (!kids) throw new Error("Kids gift guide missing");
  return kids;
}

function hostGuide() {
  const host = checksGuides().find((guide) => guide.slug === "for-the-host");
  if (!host) throw new Error("Host gift guide missing");
  return host;
}

function giftPath(guide) {
  return guide ? GIFT_PATH + guide.slug + "/" : GIFT_PATH;
}

function giftPaths() {
  return [GIFT_PATH, ...giftGuides().map((guide) => giftPath(guide)), ...checksGuides().map((guide) => giftPath(guide))];
}

function humanList(items) {
  if (items.length < 2) return items.join("");
  return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
}

function giftHay(product) {
  return [
    product.title || "",
    product.sourceUrl || "",
    ...((product.recallMatch && product.recallMatch.family) || []),
    ...((product.evidence || []).map((item) => item.claim || "")),
    ...((product.specs || []).flatMap((spec) => [spec.label || "", spec.value || ""]))
  ].join("\n");
}

function giftSpecs(product, guide) {
  const clean = (product.specs || []).filter((spec) => {
    if (!spec || !spec.label || !spec.value) return false;
    if (/^ratings?$/i.test(spec.label)) return false;
    return !GIFT_BAN.test(spec.label + " " + spec.value);
  });
  if (guide.specPattern) {
    const re = new RegExp(guide.specPattern, "i");
    clean.sort((a, b) => {
      const am = re.test(a.label + " " + a.value) ? 0 : 1;
      const bm = re.test(b.label + " " + b.value) ? 0 : 1;
      return am - bm;
    });
  }
  if (clean.length < 2) throw new Error("Gift pick needs two maker specs: " + product.id);
  return clean.slice(0, 3);
}

function giftWhy(product, guide) {
  const specs = giftSpecs(product, guide);
  const source = product.sourceName || specs[0].source;
  if (!source) throw new Error("Gift pick has no maker name: " + product.id);
  const body = specs.map((spec) => spec.label + ": " + spec.value).join(". ");
  const sentence = source + " states: " + body + ".";
  if (GIFT_BAN.test(sentence)) throw new Error("Gift spec line failed the honesty check: " + product.id);
  if (!sentence.startsWith(source + " states: ")) throw new Error("Gift spec line is not attributed: " + product.id);
  for (const spec of specs) {
    const pair = spec.label + ": " + spec.value;
    if (!sentence.includes(pair)) throw new Error("Gift spec line dropped " + pair);
    const stored = (product.specs || []).some((item) => item.label === spec.label && item.value === spec.value);
    if (!stored) throw new Error("Gift spec is not on " + product.id + ": " + pair);
  }
  return sentence;
}

function assertGiftPick(product, guide, seen) {
  if (seen.has(product.id)) throw new Error("Gift pick is listed twice: " + product.id);
  seen.add(product.id);
  if (guide.category && product.category !== guide.category) {
    throw new Error("Gift pick " + product.id + " is not in " + guide.category);
  }
  if (guide.match) {
    if (!giftHay(product).match(new RegExp(guide.match, "i"))) {
      throw new Error("Gift pick " + product.id + " does not match " + guide.slug);
    }
  } else if (!guide.category) {
    throw new Error("Gift guide needs a category or a match: " + guide.slug);
  }
  for (const region of ["US", "CA"]) {
    const rec = card.recallFor(product, region);
    if (rec.status !== "none" || !/^\d{4}-\d{2}-\d{2}$/.test(rec.checkedAt || "")) {
      throw new Error("Gift pick is not a clear dated check: " + product.id + " " + region);
    }
  }
  giftWhy(product, guide);
}

function giftPicks(guide, seen) {
  const byId = new Map(products.map((product) => [product.id, product]));
  if (!Array.isArray(guide.products)) throw new Error("Gift guide products missing: " + guide.slug);
  const picks = guide.products.map((id) => {
    const product = byId.get(id);
    if (!product) throw new Error("Gift pick is not in the catalogue: " + id);
    assertGiftPick(product, guide, seen);
    return product;
  });
  if (picks.length < 5 || picks.length > 12) throw new Error("Gift guide " + guide.slug + " has " + picks.length + " picks");
  return picks;
}

function giftHubFaqs(guides) {
  return [
    {
      q: "What does the recall line on a gift pick mean?",
      a: "It is the recorded check for that model. On the US view the source is CPSC. On the CA view the source is Health Canada. The date is the day that check was recorded. No matching recall was found for that model as of that date. A notice for a different model can still exist, and the model page links it."
    },
    {
      q: "Where do the spec lines come from?",
      a: "Each spec line is copied from the maker fields stored for that model. The model page links the maker source."
    },
    {
      q: "Which recipient lists are published?",
      a: "The lists are the recipient groups this catalogue can fill with at least five models: " + humanList(guides.map((guide) => guide.label)) + "."
    },
    {
      q: "Where is the kids list?",
      a: "Gifts for kids names " + kidsGuide().picks.length + " mainstream kids product lines and the official check to do before you buy. It does not use a catalogue card. Toy safety covers button and coin batteries, magnets, water beads, and ride-ons and scooters."
    },
    {
      q: "Where is the host list?",
      a: "Gifts for the host names " + hostGuide().picks.length + " widely sold hosting tools and the official check to do before you buy. It does not use a catalogue card. Thanksgiving covers turkey fryers, pressure cookers, turkey temperatures, and kitchen fires."
    }
  ];
}

function giftCrumbs(pageLabel) {
  const tail = pageLabel
    ? '<a href="/gifts/">Gift guides</a>\n<span aria-hidden="true">/</span>\n<span aria-current="page">' + card.esc(pageLabel) + "</span>"
    : '<span aria-current="page">Gift guides</span>';
  return '<nav class="crumbs" aria-label="Breadcrumb">\n<a href="/">Home</a>\n<span aria-hidden="true">/</span>\n' + tail + "\n</nav>\n";
}

function giftJumps(guides, currentSlug) {
  return '<p class="recall-filters">' + guides.concat(checksGuides()).map((guide) => {
    const current = guide.slug === currentSlug ? ' aria-current="page"' : "";
    return '<a href="' + giftPath(guide) + '"' + current + ">" + card.esc(guide.label) + "</a>";
  }).join("") + "</p>";
}

function giftOtherNote(product) {
  const count = otherNotices(card.recallFor(product, "US")).length + otherNotices(card.recallFor(product, "CA")).length;
  if (!count) return "";
  return '<p class="recall-other">An official notice for a different model is on the <a href="' + card.productPath(product) + '">model page</a>.</p>';
}

function giftPickHtml(product, guide, opts) {
  const art = card.mediaWithSpecs(product, opts);
  const hidden = art.includes("spec-tile") ? ' class="visually-hidden"' : "";
  return '<article class="guide-pick" id="' + card.esc(product.id) + '">' +
    art +
    "<h2" + hidden + '><a href="' + card.productPath(product) + '">' + card.visibleTitle(product.title) + "</a></h2>" +
    '<p class="pick-if">' + card.esc(card.pickLine(product)) + "</p>" +
    '<div class="only-us">' + card.amazonButton(product, "US") + "</div>" +
    '<div class="only-ca">' + card.amazonButton(product, "CA") + "</div>" +
    '<p><a class="hub-more" href="' + card.productPath(product) + '">Model page</a></p>' +
    '<details class="fold"><summary>Maker line and recall</summary><div class="fold-body"><p class="why">' +
    card.esc(guide.fit) + " " + card.esc(giftWhy(product, guide)) + "</p>" +
    '<p class="only-us">' + bfStatusHtml(card.recallFor(product, "US"), "US") + "</p>" +
    '<p class="only-ca">' + bfStatusHtml(card.recallFor(product, "CA"), "Canadian") + "</p>" +
    giftOtherNote(product) + "</div></details></article>";
}

function giftJson(url, name, headline, description, crumbs, listName, items, faqs) {
  const graph = [
    { "@type": "BreadcrumbList", itemListElement: crumbs },
    {
      "@type": "CollectionPage",
      "@id": url,
      name,
      headline,
      url,
      dateModified: recalls.checkedAt,
      inLanguage: "en",
      description,
      mainEntity: {
        "@type": "ItemList",
        name: listName,
        numberOfItems: items.length,
        itemListElement: items
      }
    }
  ];
  if (faqs) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a }
      }))
    });
  }
  const data = { "@context": "https://schema.org", "@graph": graph };
  assertNoCommerce(data);
  return JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
}

function giftShell(url, title, description, mainHtml, jsonLd) {
  const titled = title + " — Checked Lab";
  return `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${url}">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.esc(titled)}</title>
<meta name="description" content="${card.esc(description)}">
<meta property="og:title" content="${card.esc(titled)}">
<meta property="og:description" content="${card.esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Checked Lab. Checked before you buy.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${card.esc(titled)}">
<meta name="twitter:description" content="${card.esc(description)}">
<meta name="twitter:image" content="${ORIGIN}/assets/og.png">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${FONT_PRELOAD}
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#F5F5F7">
<script type="application/ld+json">
${jsonLd}
</script>
</head>
<body data-page="gifts">
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
<a href="/gifts/" aria-current="page">GIFT GUIDES</a>
<a href="/thanksgiving/">THANKSGIVING</a>
<a href="/toy-safety/">TOY SAFETY</a>
<a href="/recalls/">RECALL CHECKS</a>
<a href="/how-we-check/">HOW WE CHECK</a>
<a href="/bin-list/">BIN LIST</a>
</nav>
</div>
</header>
${nav("gifts")}
</div>
<main>
<div class="wrap prose">
${mainHtml}
</div>
</main>
<footer>
<div class="foot">
${DISCLOSURE}
<p>© 2026 CHECKED LAB<br>Winnipeg, MB</p>
${SEASON_FOOT}
</div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

function giftHubHtml(grouped) {
  const guides = grouped.map((item) => item.guide);
  const faqs = giftHubFaqs(guides);
  const url = ORIGIN + GIFT_PATH;
  const checks = checksGuides();
  const list = "<ul class=\"guide-list\">" + grouped.map((item) =>
    "<li><h2><a href=\"" + giftPath(item.guide) + "\">" + card.esc(item.guide.h1) + "</a></h2><p>" +
    item.picks.length + " catalogue models. " + card.esc(item.guide.description) + "</p></li>"
  ).join("") +
    checks.map((guide) =>
      "<li><h2><a href=\"" + giftPath(guide) + "\">" + card.esc(guide.h1) + "</a></h2><p>" +
      guide.picks.length + " product lines. " + card.esc(guide.description) + "</p></li>"
    ).join("") + "</ul>";
  const main = giftCrumbs() +
    "<h1>" + card.esc(giftsDoc.h1) + "</h1>" +
    '<p class="sub">' + card.esc(String(giftsDoc.description).split(/(?<=\.)\s/)[0]) + "</p>" +
    list +
    productFold("gift-notes", "How these lists are built",
      '<p class="lede">' + card.esc(giftsDoc.description) + "</p>" +
      renderHubGuide("gifts", { faq: false }) +
      giftQuiz() +
      '<p>A recipient list is published when the catalogue can fill it with at least five models and the recorded US and Canadian checks found no matching recall. The spec line on each model is copied from the maker fields. <a href="/how-we-check/">How we check</a> says what the date means. <a href="' + giftPath(kidsGuide()) + '">Gifts for kids</a> is a recall-check list, not a catalogue list. <a href="/toy-safety/">Toy safety</a> covers button batteries, magnets, water beads, and ride-ons. <a href="' + giftPath(hostGuide()) + '">Gifts for the host</a> is a recall-check list for holiday hosting. <a href="/thanksgiving/">Thanksgiving and holiday hosting</a> covers turkey fryers, pressure cookers, turkey temperatures, and kitchen fires.</p>' +
      (compares.some((entry) => (entry.linkFrom || []).includes("/gifts/"))
        ? '<p class="lede">Spec comparisons: ' + compares.filter((entry) => (entry.linkFrom || []).includes("/gifts/")).map((entry) =>
          '<a href="/compare/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>"
        ).join(" ") + ".</p>"
        : "") +
      bestLede(grouped.flatMap((item) => item.picks.map((product) => product.id)))) +
    '<section class="faq" id="questions"><h2>Questions</h2>' +
    faqs.map((item) => "<h3>" + card.esc(item.q) + '</h3><p class="faq-a">' + card.esc(item.a) + "</p>").join("") +
    "</section>";
  const jsonLd = giftJson(
    url,
    giftsDoc.title,
    giftsDoc.h1,
    giftsDoc.description,
    [
      { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: "Gift guides", item: url }
    ],
    giftsDoc.h1,
    guides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      url: ORIGIN + giftPath(guide)
    })).concat(checks.map((guide, index) => ({
      "@type": "ListItem",
      position: guides.length + index + 1,
      name: guide.title,
      url: ORIGIN + giftPath(guide)
    }))),
    faqs
  );
  return giftShell(url, giftsDoc.title, giftsDoc.description, main, jsonLd);
}

function compareLinksForGuide(guide) {
  const ids = new Set(guide.products || []);
  const links = compares.filter((entry) =>
    (entry.guides || []).includes(guide.slug) || entry.products.some((id) => ids.has(id))
  );
  if (!links.length) return "";
  return '<p class="lede">Maker spec comparisons: ' + links.map((entry) =>
    '<a href="/compare/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>"
  ).join(" ") + ".</p>";
}

function giftGuideHtml(guide, picks, grouped) {
  const url = ORIGIN + giftPath(guide);
  const guides = grouped.map((item) => item.guide);
  card.beginPage();
  const main = giftCrumbs(guide.h1) +
    "<h1>" + card.esc(guide.h1) + "</h1>" +
    '<p class="sub">' + card.esc(String(guide.description).split(/(?<=\.)\s/)[0]) + "</p>" +
    '<section class="pick-grid">\n' + picks.map((product, index) => giftPickHtml(product, guide, index === 0 ? { eager: true } : {})).join("\n") + "\n</section>" +
    productFold("gift-notes", "How to read this list",
      '<p class="lede">' + card.esc(guide.description) + "</p>" +
      '<p>Each spec line is copied from the maker fields stored for that model. The badge is the recorded CPSC check on the US view and the recorded Health Canada check on the CA view. <a href="/how-we-check/">How we check</a> says what the date means. <a href="/gifts/#gift-finder">Gift finder</a>.</p>' +
      giftJumps(guides, guide.slug) +
      compareLinksForGuide(guide) +
      bestLede(picks.map((product) => product.id)) +
      (anchorsForIds(guide.products).length ? '<p class="lede">' + anchorsForIds(guide.products).join(" ") + "</p>" : "") +
      '<p class="lede"><a href="/gifts/">All gift guides</a></p>');
  const jsonLd = giftJson(
    url,
    guide.title,
    guide.h1,
    guide.description,
    [
      { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: "Gift guides", item: ORIGIN + GIFT_PATH },
      { "@type": "ListItem", position: 3, name: guide.h1, item: url }
    ],
    guide.h1,
    picks.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.title,
      url: ORIGIN + card.productPath(product)
    }))
  );
  return giftShell(url, guide.title, guide.description, main, jsonLd);
}

function writeGiftFile(dir, html) {
  html = polish(html);
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  if (GIFT_BAN.test(visible)) throw new Error("Gift page failed the honesty check: " + dir);
  assertSafeImages(html, dir);
  if (/we tested|we bought|does not test|did not test|not tested/i.test(html)) throw new Error("Gift page has a test claim: " + dir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

function winterGuides() {
  const guides = winterDoc && Array.isArray(winterDoc.guides) ? winterDoc.guides : null;
  if (!guides || guides.length !== 4) throw new Error("Winter safety needs four guides");
  return guides;
}

function winterPath(guide) {
  return guide ? WINTER_PATH + guide.slug + "/" : WINTER_PATH;
}

function winterPaths() {
  return [WINTER_PATH, ...winterGuides().map((guide) => winterPath(guide))];
}

function winterGuideLinks(product) {
  return winterGuides().filter((guide) =>
    (guide.catalogue || []).some((item) => item.id === product.id)
  ).map((guide) => '<a href="' + winterPath(guide) + '">' + card.esc(guide.label) + "</a>");
}

function winterSpans(spans, where) {
  if (!Array.isArray(spans) || !spans.length) throw new Error("Winter copy missing: " + where);
  return spans.map((span) => {
    if (!span || typeof span.text !== "string" || !span.text) throw new Error("Winter span missing text: " + where);
    if (GIFT_BAN.test(span.text)) throw new Error("Winter copy failed the honesty check: " + where);
    if (!span.href) return card.esc(span.text);
    if (typeof span.href !== "string" || (!span.href.startsWith("/") && !/^https:\/\//.test(span.href))) {
      throw new Error("Winter span href: " + where);
    }
    const extra = span.href.startsWith("/") ? "" : ' target="_blank" rel="noopener"';
    return '<a href="' + card.esc(span.href) + '"' + extra + ">" + card.esc(span.text) + "</a>";
  }).join("");
}

function assertWinterPatternUrl(url) {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    throw new Error("Pattern URL is not https: " + url);
  }
  if (host !== "cpsc.gov" && host !== "recalls-rappels.canada.ca") {
    throw new Error("Pattern URL is not CPSC or Health Canada: " + url);
  }
  if (!/\/Recalls\/|\/alert-recall\//.test(url)) throw new Error("Pattern URL is not a recall page: " + url);
}

function winterCrumbs(pageLabel) {
  const tail = pageLabel
    ? '<a href="/winter-safety/">Winter safety</a>\n<span aria-hidden="true">/</span>\n<span aria-current="page">' + card.esc(pageLabel) + "</span>"
    : '<span aria-current="page">Winter safety</span>';
  return '<nav class="crumbs" aria-label="Breadcrumb">\n<a href="/">Home</a>\n<span aria-hidden="true">/</span>\n' + tail + "\n</nav>\n";
}

function winterJumps(currentSlug) {
  return '<p class="recall-filters">' + winterGuides().map((guide) => {
    const current = guide.slug === currentSlug ? ' aria-current="page"' : "";
    return '<a href="' + winterPath(guide) + '"' + current + ">" + card.esc(guide.label) + "</a>";
  }).join("") + "</p>";
}

function winterLook(guide) {
  return '<ul class="evidence checklist">' + guide.look.map((spans, index) =>
    "<li>" + winterSpans(spans, guide.slug + " look " + index) + "</li>"
  ).join("") + "</ul>";
}

function winterMethod(guide) {
  const lead = '<p>For a purchase in the United States, search the brand and the model on <a href="' + CPSC_SEARCH +
    '" target="_blank" rel="noopener">CPSC Recalls</a>. For a purchase in Canada, search the same words on <a href="' + HC_SEARCH +
    '" target="_blank" rel="noopener">Health Canada recalls and safety alerts</a>. Open the notice and match the model number on the unit. A family name on the box can point at a different model.</p>';
  const extra = (guide.methodExtra || []).map((spans, index) =>
    "<p>" + winterSpans(spans, guide.slug + " method " + index) + "</p>"
  ).join("");
  return lead + extra;
}

function winterPatternsHtml(guide) {
  return "<ul>" + guide.patterns.map((pattern) => {
    assertWinterPatternUrl(pattern.url);
    if (!pattern.agency || !pattern.title || !pattern.says) throw new Error("Winter pattern is incomplete: " + guide.slug);
    if (GIFT_BAN.test(pattern.agency + " " + pattern.title + " " + pattern.says)) {
      throw new Error("Winter pattern failed the honesty check: " + guide.slug);
    }
    return '<li><a href="' + card.esc(pattern.url) + '" target="_blank" rel="noopener">' +
      card.esc(pattern.agency) + ": " + card.esc(pattern.title) + "</a>. " + card.esc(pattern.says) + "</li>";
  }).join("") + "</ul>";
}

function winterCatalogueHtml(guide) {
  if (!Array.isArray(guide.catalogue) || !guide.catalogue.length) {
    return "<p>No catalogue card is listed in this guide. Search the model number on the unit using the official pages above.</p>";
  }
  card.beginPage();
  return "<ul>" + guide.catalogue.map((item, index) => {
    const product = products.find((entry) => entry.id === item.id);
    if (!product) throw new Error("Winter guide names a missing card: " + item.id);
    const us = recallSentence(card.recallFor(product, "US"), "US");
    const ca = recallSentence(card.recallFor(product, "CA"), "Canadian");
    return '<li class="catalogue-pick">' + card.visual(product, index === 0 ? { eager: true } : {}) + '<a href="' + card.productPath(product) + '">' + card.esc(product.title) + "</a>. " +
      card.esc(us) + " " + card.esc(ca) + " " + winterSpans(item.note, item.id) + "</li>";
  }).join("") + "</ul>";
}

function winterSearchButtons(guide) {
  if (!Array.isArray(guide.searches) || !guide.searches.length) throw new Error("Winter guide needs a search: " + guide.slug);
  return guide.searches.map((query) => {
    if (typeof query !== "string" || !query.trim()) throw new Error("Winter search is empty: " + guide.slug);
    const stub = { title: query, searchQuery: query };
    const us = card.amazonButton(stub, "US");
    const ca = card.amazonButton(stub, "CA");
    if (!us.includes("/s?k=") || !ca.includes("/s?k=") || us.includes("/dp/") || ca.includes("/dp/")) {
      throw new Error("Winter Amazon link is not a search: " + guide.slug);
    }
    if (!us.includes("tag=checkedlab01-20") || !ca.includes("tag=checkedlab-20")) {
      throw new Error("Winter Amazon tag missing: " + guide.slug);
    }
    return '<div class="only-us"><p>Amazon.com search for ' + card.esc(query) + ".</p>" + us + "</div>\n" +
      '<div class="only-ca"><p>Amazon.ca search for ' + card.esc(query) + ".</p>" + ca + "</div>";
  }).join("\n");
}

function winterMoreLinks(guide) {
  const base = [
    '<a href="/winter-safety/">All winter safety guides</a>',
    '<a href="/how-we-check/">How we check</a>',
    '<a href="/recalls/">Recall checks</a>'
  ];
  const more = (guide.links || []).map((link) => {
    if (!link || typeof link.href !== "string" || !link.href.startsWith("/") || !link.label) {
      throw new Error("Winter link must be an internal page: " + guide.slug);
    }
    return '<a href="' + card.esc(link.href) + '">' + card.esc(link.label) + "</a>";
  });
  return '<p class="lede">' + base.concat(more).join(" ") + "</p>";
}

function winterFaqsHtml(faqs) {
  return '<section class="faq" id="questions"><h2>Questions</h2>' +
    faqs.map((item) => "<h3>" + card.esc(item.q) + '</h3><p class="faq-a">' + card.esc(item.a) + "</p>").join("") +
    "</section>";
}

function winterJsonLd(url, name, description, crumbs, faqs, list) {
  const graph = [{ "@type": "BreadcrumbList", itemListElement: crumbs }];
  if (list) {
    graph.push({
      "@type": "CollectionPage",
      "@id": url,
      name,
      headline: name,
      url,
      dateModified: recalls.checkedAt,
      inLanguage: "en",
      description,
      mainEntity: {
        "@type": "ItemList",
        name,
        numberOfItems: list.length,
        itemListElement: list
      }
    });
  } else {
    graph.push({
      "@type": "Article",
      headline: name,
      description,
      dateModified: recalls.checkedAt,
      inLanguage: "en",
      mainEntityOfPage: url
    });
  }
  graph.push({
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a }
    }))
  });
  const data = { "@context": "https://schema.org", "@graph": graph };
  assertNoCommerce(data);
  return JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
}

function winterShell(url, title, description, mainHtml, jsonLd) {
  const titled = title + " — Checked Lab";
  return `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${url}">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.esc(titled)}</title>
<meta name="description" content="${card.esc(description)}">
<meta property="og:title" content="${card.esc(titled)}">
<meta property="og:description" content="${card.esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Checked Lab. Checked before you buy.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${card.esc(titled)}">
<meta name="twitter:description" content="${card.esc(description)}">
<meta name="twitter:image" content="${ORIGIN}/assets/og.png">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${FONT_PRELOAD}
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#F5F5F7">
<script type="application/ld+json">
${jsonLd}
</script>
</head>
<body data-page="winter-safety">
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
<a href="/thanksgiving/">THANKSGIVING</a>
<a href="/toy-safety/">TOY SAFETY</a>
<a href="/winter-safety/" aria-current="page">WINTER SAFETY</a>
<a href="/recalls/">RECALL CHECKS</a>
<a href="/how-we-check/">HOW WE CHECK</a>
<a href="/bin-list/">BIN LIST</a>
</nav>
</div>
</header>
${nav("winter-safety")}
</div>
<main>
<div class="wrap prose">
${mainHtml}
</div>
</main>
<footer>
<div class="foot">
${DISCLOSURE}
<p>© 2026 CHECKED LAB<br>Winnipeg, MB</p>
${SEASON_FOOT}
</div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

function assertWinterCopy(text, where) {
  if (!text || typeof text !== "string") throw new Error("Winter copy missing: " + where);
  if (GIFT_BAN.test(text) || /we tested|we bought|does not test|did not test|not tested/i.test(text)) {
    throw new Error("Winter copy failed the honesty check: " + where);
  }
}

function winterHubHtml() {
  const guides = winterGuides();
  const faqs = winterDoc.faqs;
  const url = ORIGIN + WINTER_PATH;
  const list = '<ul class="guide-list">' + guides.map((guide) =>
    '<li><h2><a href="' + winterPath(guide) + '">' + card.esc(guide.h1) + "</a></h2><p>" + card.esc(guide.description) + "</p></li>"
  ).join("") + "</ul>";
  const main = sceneBlock("winter-safety") + winterCrumbs() +
    "<h1>" + card.esc(winterDoc.h1) + "</h1>" +
    '<p class="lede">' + card.esc(winterDoc.description) + "</p>" +
    '<p>Read the label, then search the model on <a href="' + CPSC_SEARCH + '" target="_blank" rel="noopener">CPSC Recalls</a> or <a href="' + HC_SEARCH + '" target="_blank" rel="noopener">Health Canada recalls and safety alerts</a>. <a href="/how-we-check/">How we check</a> says what a dated catalogue line means. <a href="/winter/">Winter</a> is the catalogue. <a href="/recalls/">Recall checks</a> lists every catalogue model. <a href="/thanksgiving/">Thanksgiving and holiday hosting</a> covers turkey fryers, pressure cookers, turkey temperatures, and kitchen fires.</p>' +
    list +
    winterFaqsHtml(faqs);
  const jsonLd = winterJsonLd(
    url,
    winterDoc.title,
    winterDoc.description,
    [
      { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: "Winter safety", item: url }
    ],
    faqs,
    guides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      url: ORIGIN + winterPath(guide)
    }))
  );
  return winterShell(url, winterDoc.title, winterDoc.description, main, jsonLd);
}

function winterGuideHtml(guide) {
  const url = ORIGIN + winterPath(guide);
  const main = sceneBlock("winter-safety") + winterCrumbs(guide.h1) +
    "<h1>" + card.esc(guide.h1) + "</h1>" +
    '<p class="lede">' + card.esc(guide.description) + "</p>" +
    winterJumps(guide.slug) +
    "<h2>What to read on the label</h2>" + winterLook(guide) +
    "<h2>How to search a recall</h2>" + winterMethod(guide) +
    "<h2>Patterns in official notices</h2>" +
    "<p>Each pattern below is one official notice. The sentence is what that notice says.</p>" +
    winterPatternsHtml(guide) +
    "<h2>How we check</h2><p>" + card.esc(WINTER_CHECK) + ' <a href="/how-we-check/">How we check</a>.</p>' +
    "<h2>Catalogue cards</h2>" + winterCatalogueHtml(guide) +
    winterMoreLinks(guide) +
    "<h2>Amazon search</h2>" +
    "<p>The button opens the Amazon search for the words under it. It is not a product page.</p>" +
    winterSearchButtons(guide) +
    winterFaqsHtml(guide.faqs);
  const jsonLd = winterJsonLd(
    url,
    guide.title,
    guide.description,
    [
      { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: "Winter safety", item: ORIGIN + WINTER_PATH },
      { "@type": "ListItem", position: 3, name: guide.h1, item: url }
    ],
    guide.faqs,
    null
  );
  return winterShell(url, guide.title, guide.description, main, jsonLd);
}

function writeWinterFile(dir, html) {
  html = polish(html);
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  if (GIFT_BAN.test(visible) || /we tested|we bought|does not test|did not test|not tested/i.test(visible)) {
    throw new Error("Winter page failed the honesty check: " + dir);
  }
  assertSafeImages(html, dir);
  if (/\/dp\//.test(html)) throw new Error("Winter page uses an Amazon product page: " + dir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

function writeWinterSafety() {
  assertWinterCopy(winterDoc.title, "hub title");
  assertWinterCopy(winterDoc.h1, "hub h1");
  assertWinterCopy(winterDoc.description, "hub description");
  assertWinterCopy(WINTER_CHECK, "how we check");
  if (!Array.isArray(winterDoc.faqs) || winterDoc.faqs.length < 3) throw new Error("Winter hub FAQs");
  for (const item of winterDoc.faqs) {
    assertWinterCopy(item.q, "hub faq");
    assertWinterCopy(item.a, "hub faq");
  }
  const slugs = new Set();
  for (const guide of winterGuides()) {
    if (!/^[a-z0-9-]+$/.test(guide.slug || "")) throw new Error("Unsafe winter slug: " + guide.slug);
    if (slugs.has(guide.slug)) throw new Error("Duplicate winter slug: " + guide.slug);
    slugs.add(guide.slug);
    for (const key of ["title", "h1", "label", "description"]) assertWinterCopy(guide[key], guide.slug + " " + key);
    if (!Array.isArray(guide.look) || guide.look.length < 2) throw new Error("Winter look list: " + guide.slug);
    if (!Array.isArray(guide.patterns) || guide.patterns.length < 2) throw new Error("Winter patterns: " + guide.slug);
    if (!Array.isArray(guide.faqs) || guide.faqs.length < 3) throw new Error("Winter FAQs: " + guide.slug);
    for (const item of guide.faqs) {
      assertWinterCopy(item.q, guide.slug);
      assertWinterCopy(item.a, guide.slug);
    }
    winterLook(guide);
    winterMethod(guide);
    winterPatternsHtml(guide);
    winterCatalogueHtml(guide);
    winterSearchButtons(guide);
  }
  const dir = join(root, "winter-safety");
  mkdirSync(dir, { recursive: true });
  writeWinterFile(dir, winterHubHtml());
  for (const guide of winterGuides()) writeWinterFile(join(dir, guide.slug), winterGuideHtml(guide));
  for (const entry of readdirSync(dir)) {
    if (entry === "index.html") continue;
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (!winterGuides().some((guide) => guide.slug === entry)) rmSync(full, { recursive: true, force: true });
  }
}

function assertOfficialHref(href, where) {
  if (typeof href !== "string" || (!href.startsWith("/") && !/^https:\/\//.test(href))) {
    throw new Error("Official href: " + where);
  }
  if (href.startsWith("/")) return;
  let host = "";
  try {
    host = new URL(href).hostname.replace(/^www\./, "");
  } catch {
    throw new Error("Official href: " + where);
  }
  if (!TOY_HOSTS.has(host) && !THANKS_HOSTS.has(host)) throw new Error("Href is not an official source: " + href);
}

function officialSpans(spans, where) {
  if (!Array.isArray(spans) || !spans.length) throw new Error("Official copy missing: " + where);
  for (const span of spans) {
    if (span && span.href) assertOfficialHref(span.href, where);
  }
  return winterSpans(spans, where);
}

function assertKidsGuide(guide) {
  for (const key of ["title", "h1", "label", "description"]) assertWinterCopy(guide[key], "kids " + key);
  if (!Array.isArray(guide.picks) || guide.picks.length < 5 || guide.picks.length > 8) {
    throw new Error("Kids picks " + (guide.picks && guide.picks.length));
  }
  if (!Array.isArray(guide.faqs) || guide.faqs.length < 3) throw new Error("Kids FAQs");
  const ids = new Set();
  for (const pick of guide.picks) {
    if (!/^[a-z0-9-]+$/.test(pick.id || "")) throw new Error("Kids pick id");
    if (ids.has(pick.id)) throw new Error("Duplicate kids pick " + pick.id);
    ids.add(pick.id);
    assertWinterCopy(pick.name, pick.id);
    assertWinterCopy(pick.why, pick.id);
    assertWinterCopy(pick.search, pick.id);
    if (!pick.why.startsWith("On this list because ")) throw new Error("Kids why: " + pick.id);
    officialSpans(pick.check, pick.id);
    if (!pick.check.some((span) => span.href && /^https:\/\//.test(span.href))) {
      throw new Error("Kids pick needs an official link: " + pick.id);
    }
  }
  for (const item of guide.faqs) {
    assertWinterCopy(item.q, "kids faq");
    assertWinterCopy(item.a, "kids faq");
  }
}

function kidsGuideHtml(guide, grouped) {
  const url = ORIGIN + giftPath(guide);
  const guides = grouped.map((item) => item.guide);
  const picks = guide.picks.map((pick) => {
    const buttons = winterSearchButtons({ slug: guide.slug + "-" + pick.id, searches: [pick.search] });
    const art = card.visual({ id: pick.id, title: pick.name, category: "" });
    const hidden = art.includes("spec-tile") ? ' class="visually-hidden"' : "";
    return '<article class="guide-pick" id="' + card.esc(pick.id) + '">' +
      art +
      "<h2" + hidden + ">" + card.esc(pick.name) + "</h2>" +
      '<p class="why">' + card.esc(pick.why) + "</p>" +
      "<p>" + officialSpans(pick.check, pick.id) + "</p>" +
      buttons +
      "</article>";
  }).join("\n");
  const main = sceneBlock("gifts") + giftCrumbs(guide.h1) +
    "<h1>" + card.esc(guide.h1) + "</h1>" +
    '<p class="lede">' + card.esc(guide.description) + "</p>" +
    '<p>Each line names a widely sold kids product and the official check to do. The button opens the Amazon search for the words under it. It is not a product page. <a href="/toy-safety/">Toy safety</a> covers <a href="/toy-safety/button-coin-batteries/">button and coin batteries</a>, <a href="/toy-safety/magnets/">magnets</a>, <a href="/toy-safety/water-beads/">water beads</a>, and <a href="/toy-safety/ride-ons-and-scooters/">ride-ons and scooters</a>. <a href="/how-we-check/">How we check</a> says what a dated catalogue line means. The catalogue ice cream maker has its own model check: <a href="/black-friday/ninja-creami/">Ninja Creami Black Friday model check</a>.</p>' +
    compareLinksForGuide(guide) +
    giftJumps(guides, guide.slug) +
    '<section class="pick-grid">\n' + picks + "\n</section>" +
    '<p class="lede"><a href="/gifts/">All gift guides</a></p>' +
    winterFaqsHtml(guide.faqs);
  const jsonLd = giftJson(
    url,
    guide.title,
    guide.h1,
    guide.description,
    [
      { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: "Gift guides", item: ORIGIN + GIFT_PATH },
      { "@type": "ListItem", position: 3, name: guide.h1, item: url }
    ],
    guide.h1,
    guide.picks.map((pick, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: pick.name,
      url: url + "#" + pick.id
    })),
    guide.faqs
  );
  return giftShell(url, guide.title, guide.description, main, jsonLd);
}

function hostGuideHtml(guide, grouped) {
  const url = ORIGIN + giftPath(guide);
  const guides = grouped.map((item) => item.guide);
  const picks = guide.picks.map((pick) => {
    const buttons = winterSearchButtons({ slug: guide.slug + "-" + pick.id, searches: [pick.search] });
    const art = card.visual({ id: pick.id, title: pick.name, category: "" });
    const hidden = art.includes("spec-tile") ? ' class="visually-hidden"' : "";
    return '<article class="guide-pick" id="' + card.esc(pick.id) + '">' +
      art +
      "<h2" + hidden + ">" + card.esc(pick.name) + "</h2>" +
      '<p class="why">' + card.esc(pick.why) + "</p>" +
      "<p>" + officialSpans(pick.check, pick.id) + "</p>" +
      buttons +
      "</article>";
  }).join("\n");
  const main = sceneBlock("gifts") + giftCrumbs(guide.h1) +
    "<h1>" + card.esc(guide.h1) + "</h1>" +
    '<p class="lede">' + card.esc(guide.description) + "</p>" +
    '<p>Each line names a widely sold hosting tool and the official check to do. The button opens the Amazon search for the words under it. It is not a product page. <a href="/thanksgiving/">Thanksgiving and holiday hosting</a> covers <a href="/thanksgiving/turkey-fryers/">turkey fryers</a>, <a href="/thanksgiving/pressure-cookers/">pressure cookers</a>, <a href="/thanksgiving/turkey-temperatures/">turkey temperatures</a>, and <a href="/thanksgiving/kitchen-fires/">kitchen fires</a>. <a href="/how-we-check/">How we check</a> says what a dated catalogue line means. The rice cooker card has its own spec match: <a href="/worth-it/zojirushi-ns-zcc10/">Zojirushi rice cooker spec match</a>.</p>' +
    giftJumps(guides, guide.slug) +
    '<section class="pick-grid">\n' + picks + "\n</section>" +
    '<p class="lede"><a href="/gifts/">All gift guides</a></p>' +
    winterFaqsHtml(guide.faqs);
  const jsonLd = giftJson(
    url,
    guide.title,
    guide.h1,
    guide.description,
    [
      { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: "Gift guides", item: ORIGIN + GIFT_PATH },
      { "@type": "ListItem", position: 3, name: guide.h1, item: url }
    ],
    guide.h1,
    guide.picks.map((pick, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: pick.name,
      url: url + "#" + pick.id
    })),
    guide.faqs
  );
  return giftShell(url, guide.title, guide.description, main, jsonLd);
}

function assertHostPage(html) {
  const guide = hostGuide();
  const url = ORIGIN + giftPath(guide);
  assertGiftShell(html, url, guide.title, guide.description);
  if (!html.includes("<h1>" + card.esc(guide.h1) + "</h1>")) throw new Error("Host H1");
  if (html.includes("/dp/")) throw new Error("Host page uses an Amazon product page");
  assertSafeImages(html, "host");
  assertAmazonSide(html, "only-us", "https://www.amazon.com/", "checkedlab01-20", guide.picks.length);
  assertAmazonSide(html, "only-ca", "https://www.amazon.ca/", "checkedlab-20", guide.picks.length);
  for (const pick of guide.picks) {
    if (!html.includes('id="' + pick.id + '"')) throw new Error("Host anchor " + pick.id);
    if (!html.includes(card.esc(pick.why))) throw new Error("Host why missing " + pick.id);
  }
  if (!html.includes("/s?k=")) throw new Error("Host search missing");
  for (const path of thanksPaths()) {
    if (!html.includes('href="' + path + '"')) throw new Error("Host page misses " + path);
  }
  assertGiftLd(html, guide.picks.length, guide.faqs);
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  if (GIFT_BAN.test(visible) || /we tested|we bought|does not test|did not test|not tested/i.test(visible)) {
    throw new Error("Host page failed the honesty check");
  }
}

function assertKidsPage(html) {
  const guide = kidsGuide();
  const url = ORIGIN + giftPath(guide);
  assertGiftShell(html, url, guide.title, guide.description);
  if (!html.includes("<h1>" + card.esc(guide.h1) + "</h1>")) throw new Error("Kids H1");
  if (html.includes("/dp/")) throw new Error("Kids page uses an Amazon product page");
  assertSafeImages(html, "kids");
  assertAmazonSide(html, "only-us", "https://www.amazon.com/", "checkedlab01-20", guide.picks.length);
  assertAmazonSide(html, "only-ca", "https://www.amazon.ca/", "checkedlab-20", guide.picks.length);
  for (const pick of guide.picks) {
    if (!html.includes('id="' + pick.id + '"')) throw new Error("Kids anchor " + pick.id);
    if (!html.includes(card.esc(pick.why))) throw new Error("Kids why missing " + pick.id);
  }
  if (!html.includes("/s?k=")) throw new Error("Kids search missing");
  for (const path of toyPaths().slice(1)) {
    if (!html.includes('href="' + path + '"')) throw new Error("Kids page misses " + path);
  }
  assertGiftLd(html, guide.picks.length, guide.faqs);
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  if (GIFT_BAN.test(visible) || /we tested|we bought|does not test|did not test|not tested/i.test(visible)) {
    throw new Error("Kids page failed the honesty check");
  }
}

function toyGuides() {
  const guides = toyDoc && Array.isArray(toyDoc.guides) ? toyDoc.guides : null;
  if (!guides || guides.length !== 4) throw new Error("Toy safety needs four guides");
  return guides;
}

function toyPath(guide) {
  return guide ? TOY_PATH + guide.slug + "/" : TOY_PATH;
}

function toyPaths() {
  return [TOY_PATH, ...toyGuides().map((guide) => toyPath(guide))];
}

function assertToyPatternUrl(url) {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    throw new Error("Pattern URL is not https: " + url);
  }
  if (!TOY_HOSTS.has(host)) throw new Error("Pattern URL is not an official source: " + url);
}

function toyCrumbs(pageLabel) {
  const tail = pageLabel
    ? '<a href="/toy-safety/">Toy safety</a>\n<span aria-hidden="true">/</span>\n<span aria-current="page">' + card.esc(pageLabel) + "</span>"
    : '<span aria-current="page">Toy safety</span>';
  return '<nav class="crumbs" aria-label="Breadcrumb">\n<a href="/">Home</a>\n<span aria-hidden="true">/</span>\n' + tail + "\n</nav>\n";
}

function toyJumps(currentSlug) {
  return '<p class="recall-filters">' + toyGuides().map((guide) => {
    const current = guide.slug === currentSlug ? ' aria-current="page"' : "";
    return '<a href="' + toyPath(guide) + '"' + current + ">" + card.esc(guide.label) + "</a>";
  }).join("") + "</p>";
}

function toyLook(guide) {
  return '<ul class="evidence checklist">' + guide.look.map((spans, index) =>
    "<li>" + officialSpans(spans, guide.slug + " look " + index) + "</li>"
  ).join("") + "</ul>";
}

function toyPatternsHtml(guide) {
  const hosts = new Set();
  const html = "<ul>" + guide.patterns.map((pattern) => {
    assertToyPatternUrl(pattern.url);
    hosts.add(new URL(pattern.url).hostname.replace(/^www\./, ""));
    if (!pattern.agency || !pattern.title || !pattern.says) throw new Error("Toy pattern is incomplete: " + guide.slug);
    assertWinterCopy(pattern.agency + " " + pattern.title + " " + pattern.says, guide.slug);
    return '<li><a href="' + card.esc(pattern.url) + '" target="_blank" rel="noopener">' +
      card.esc(pattern.agency) + ": " + card.esc(pattern.title) + "</a>. " + card.esc(pattern.says) + "</li>";
  }).join("") + "</ul>";
  if (!hosts.has("cpsc.gov")) throw new Error("Toy guide needs a CPSC page: " + guide.slug);
  if (![...hosts].some((host) => host === "canada.ca" || host === "recalls-rappels.canada.ca")) {
    throw new Error("Toy guide needs a Health Canada page: " + guide.slug);
  }
  return html;
}

function toyMoreLinks(guide) {
  const base = [
    '<a href="/toy-safety/">All toy safety guides</a>',
    '<a href="/gifts/for-kids/">Gifts for kids</a>',
    '<a href="/how-we-check/">How we check</a>',
    '<a href="/recalls/">Recall checks</a>'
  ];
  const more = (guide.links || []).map((link) => {
    if (!link || typeof link.href !== "string" || !link.href.startsWith("/") || !link.label) {
      throw new Error("Toy link must be an internal page: " + guide.slug);
    }
    return '<a href="' + card.esc(link.href) + '">' + card.esc(link.label) + "</a>";
  });
  return '<p class="lede">' + base.concat(more).join(" ") + "</p>";
}

function toyShell(url, title, description, mainHtml, jsonLd) {
  const titled = title + " — Checked Lab";
  return `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${url}">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.esc(titled)}</title>
<meta name="description" content="${card.esc(description)}">
<meta property="og:title" content="${card.esc(titled)}">
<meta property="og:description" content="${card.esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Checked Lab. Checked before you buy.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${card.esc(titled)}">
<meta name="twitter:description" content="${card.esc(description)}">
<meta name="twitter:image" content="${ORIGIN}/assets/og.png">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${FONT_PRELOAD}
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#F5F5F7">
<script type="application/ld+json">
${jsonLd}
</script>
</head>
<body data-page="toy-safety">
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
<a href="/thanksgiving/">THANKSGIVING</a>
<a href="/toy-safety/" aria-current="page">TOY SAFETY</a>
<a href="/winter-safety/">WINTER SAFETY</a>
<a href="/gifts/">GIFT GUIDES</a>
<a href="/recalls/">RECALL CHECKS</a>
<a href="/how-we-check/">HOW WE CHECK</a>
<a href="/bin-list/">BIN LIST</a>
</nav>
</div>
</header>
${nav("toy-safety")}
</div>
<main>
<div class="wrap prose">
${mainHtml}
</div>
</main>
<footer>
<div class="foot">
${DISCLOSURE}
<p>© 2026 CHECKED LAB<br>Winnipeg, MB</p>
${SEASON_FOOT}
</div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

function toyHubHtml() {
  const guides = toyGuides();
  const faqs = toyDoc.faqs;
  const url = ORIGIN + TOY_PATH;
  const list = '<ul class="guide-list">' + guides.map((guide) =>
    '<li><h2><a href="' + toyPath(guide) + '">' + card.esc(guide.h1) + "</a></h2><p>" + card.esc(guide.description) + "</p></li>"
  ).join("") + "</ul>";
  const main = sceneBlock("toy-safety") + toyCrumbs() +
    "<h1>" + card.esc(toyDoc.h1) + "</h1>" +
    '<p class="lede">' + card.esc(toyDoc.description) + "</p>" +
    '<p>Read the label, then search the product on <a href="' + CPSC_SEARCH + '" target="_blank" rel="noopener">CPSC Recalls</a> or <a href="' + HC_SEARCH + '" target="_blank" rel="noopener">Health Canada recalls and safety alerts</a>. <a href="/how-we-check/">How we check</a> says what a dated catalogue line means. These guides are not catalogue cards. <a href="/recalls/">Recall checks</a> lists every catalogue model. <a href="/gifts/for-kids/">Gifts for kids</a> names mainstream kids products and the check to do.</p>' +
    list +
    winterFaqsHtml(faqs);
  const jsonLd = winterJsonLd(
    url,
    toyDoc.title,
    toyDoc.description,
    [
      { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: "Toy safety", item: url }
    ],
    faqs,
    guides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      url: ORIGIN + toyPath(guide)
    }))
  );
  return toyShell(url, toyDoc.title, toyDoc.description, main, jsonLd);
}

function toyGuideHtml(guide) {
  const url = ORIGIN + toyPath(guide);
  const main = sceneBlock("toy-safety") + toyCrumbs(guide.h1) +
    "<h1>" + card.esc(guide.h1) + "</h1>" +
    '<p class="lede">' + card.esc(guide.description) + "</p>" +
    toyJumps(guide.slug) +
    "<h2>What to read on the label</h2>" + toyLook(guide) +
    "<h2>How to search a recall</h2>" + winterMethod(guide) +
    "<h2>Patterns in official notices</h2>" +
    "<p>Each pattern below is one official page. The sentence is what that page says.</p>" +
    toyPatternsHtml(guide) +
    "<h2>How we check</h2><p>" + card.esc(WINTER_CHECK) + ' <a href="/how-we-check/">How we check</a>.</p>' +
    "<h2>Catalogue cards</h2>" + winterCatalogueHtml(guide) +
    toyMoreLinks(guide) +
    "<h2>Amazon search</h2>" +
    "<p>The button opens the Amazon search for the words under it. It is not a product page.</p>" +
    winterSearchButtons(guide) +
    winterFaqsHtml(guide.faqs);
  const jsonLd = winterJsonLd(
    url,
    guide.title,
    guide.description,
    [
      { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: "Toy safety", item: ORIGIN + TOY_PATH },
      { "@type": "ListItem", position: 3, name: guide.h1, item: url }
    ],
    guide.faqs,
    null
  );
  return toyShell(url, guide.title, guide.description, main, jsonLd);
}

function writeToyFile(dir, html) {
  html = polish(html);
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  if (GIFT_BAN.test(visible) || /we tested|we bought|does not test|did not test|not tested/i.test(visible)) {
    throw new Error("Toy page failed the honesty check: " + dir);
  }
  assertSafeImages(html, dir);
  if (/\/dp\//.test(html)) throw new Error("Toy page uses an Amazon product page: " + dir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

function writeToySafety() {
  assertWinterCopy(toyDoc.title, "toy hub title");
  assertWinterCopy(toyDoc.h1, "toy hub h1");
  assertWinterCopy(toyDoc.description, "toy hub description");
  if (!Array.isArray(toyDoc.faqs) || toyDoc.faqs.length < 3) throw new Error("Toy hub FAQs");
  for (const item of toyDoc.faqs) {
    assertWinterCopy(item.q, "toy hub faq");
    assertWinterCopy(item.a, "toy hub faq");
  }
  const slugs = new Set();
  for (const guide of toyGuides()) {
    if (!/^[a-z0-9-]+$/.test(guide.slug || "")) throw new Error("Unsafe toy slug: " + guide.slug);
    if (slugs.has(guide.slug)) throw new Error("Duplicate toy slug: " + guide.slug);
    slugs.add(guide.slug);
    for (const key of ["title", "h1", "label", "description"]) assertWinterCopy(guide[key], guide.slug + " " + key);
    if (!Array.isArray(guide.look) || guide.look.length < 2) throw new Error("Toy look list: " + guide.slug);
    if (!Array.isArray(guide.patterns) || guide.patterns.length < 2) throw new Error("Toy patterns: " + guide.slug);
    if (!Array.isArray(guide.faqs) || guide.faqs.length < 3) throw new Error("Toy FAQs: " + guide.slug);
    for (const item of guide.faqs) {
      assertWinterCopy(item.q, guide.slug);
      assertWinterCopy(item.a, guide.slug);
    }
    if (guide.methodExtra) {
      guide.methodExtra.forEach((spans, index) => officialSpans(spans, guide.slug + " method " + index));
    }
    toyLook(guide);
    toyPatternsHtml(guide);
    winterSearchButtons(guide);
  }
  const dir = join(root, "toy-safety");
  mkdirSync(dir, { recursive: true });
  writeToyFile(dir, toyHubHtml());
  for (const guide of toyGuides()) writeToyFile(join(dir, guide.slug), toyGuideHtml(guide));
  for (const entry of readdirSync(dir)) {
    if (entry === "index.html") continue;
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (!toyGuides().some((guide) => guide.slug === entry)) rmSync(full, { recursive: true, force: true });
  }
}

function thanksGuides() {
  const guides = thanksDoc && Array.isArray(thanksDoc.guides) ? thanksDoc.guides : null;
  if (!guides || guides.length !== 4) throw new Error("Thanksgiving needs four guides");
  return guides;
}

function thanksPath(guide) {
  return guide ? THANKS_PATH + guide.slug + "/" : THANKS_PATH;
}

function thanksPaths() {
  return [THANKS_PATH, ...thanksGuides().map((guide) => thanksPath(guide))];
}

function thanksGuideLinks(product) {
  return thanksGuides().filter((guide) =>
    (guide.catalogue || []).some((item) => item.id === product.id)
  ).map((guide) => '<a href="' + thanksPath(guide) + '">' + card.esc(guide.label) + "</a>");
}

function assertThanksPatternUrl(url) {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    throw new Error("Pattern URL is not https: " + url);
  }
  if (!TOY_HOSTS.has(host) && !THANKS_HOSTS.has(host)) throw new Error("Pattern URL is not an official source: " + url);
}

function thanksCrumbs(pageLabel) {
  const tail = pageLabel
    ? '<a href="/thanksgiving/">Thanksgiving</a>\n<span aria-hidden="true">/</span>\n<span aria-current="page">' + card.esc(pageLabel) + "</span>"
    : '<span aria-current="page">Thanksgiving</span>';
  return '<nav class="crumbs" aria-label="Breadcrumb">\n<a href="/">Home</a>\n<span aria-hidden="true">/</span>\n' + tail + "\n</nav>\n";
}

function thanksJumps(currentSlug) {
  return '<p class="recall-filters">' + thanksGuides().map((guide) => {
    const current = guide.slug === currentSlug ? ' aria-current="page"' : "";
    return '<a href="' + thanksPath(guide) + '"' + current + ">" + card.esc(guide.label) + "</a>";
  }).join("") + "</p>";
}

function thanksLook(guide) {
  return '<ul class="evidence checklist">' + guide.look.map((spans, index) =>
    "<li>" + officialSpans(spans, guide.slug + " look " + index) + "</li>"
  ).join("") + "</ul>";
}

function thanksPatternsHtml(guide) {
  const hosts = new Set();
  const html = "<ul>" + guide.patterns.map((pattern) => {
    assertThanksPatternUrl(pattern.url);
    hosts.add(new URL(pattern.url).hostname.replace(/^www\./, ""));
    if (!pattern.agency || !pattern.title || !pattern.says) throw new Error("Thanksgiving pattern is incomplete: " + guide.slug);
    assertWinterCopy(pattern.agency + " " + pattern.title + " " + pattern.says, guide.slug);
    return '<li><a href="' + card.esc(pattern.url) + '" target="_blank" rel="noopener">' +
      card.esc(pattern.agency) + ": " + card.esc(pattern.title) + "</a>. " + card.esc(pattern.says) + "</li>";
  }).join("") + "</ul>";
  const need = {
    "turkey-fryers": ["cpsc.gov", "recalls-rappels.canada.ca", "nfpa.org"],
    "pressure-cookers": ["cpsc.gov", "recalls-rappels.canada.ca"],
    "turkey-temperatures": ["fsis.usda.gov", "cpsc.gov"],
    "kitchen-fires": ["cpsc.gov", "nfpa.org", "usfa.fema.gov"]
  }[guide.slug];
  if (!need) throw new Error("Thanksgiving host rule missing: " + guide.slug);
  for (const host of need) {
    if (!hosts.has(host)) throw new Error("Thanksgiving guide missing " + host + ": " + guide.slug);
  }
  return html;
}

function thanksMoreLinks(guide) {
  const base = [
    '<a href="/thanksgiving/">All Thanksgiving guides</a>',
    '<a href="/gifts/for-the-host/">Gifts for the host</a>',
    '<a href="/winter-safety/">Winter safety</a>',
    '<a href="/how-we-check/">How we check</a>',
    '<a href="/recalls/">Recall checks</a>'
  ];
  const more = (guide.links || []).map((link) => {
    if (!link || typeof link.href !== "string" || !link.href.startsWith("/") || !link.label) {
      throw new Error("Thanksgiving link must be an internal page: " + guide.slug);
    }
    return '<a href="' + card.esc(link.href) + '">' + card.esc(link.label) + "</a>";
  });
  return '<p class="lede">' + base.concat(more).join(" ") + "</p>";
}

function thanksShell(url, title, description, mainHtml, jsonLd) {
  const titled = title + " — Checked Lab";
  return `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${url}">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.esc(titled)}</title>
<meta name="description" content="${card.esc(description)}">
<meta property="og:title" content="${card.esc(titled)}">
<meta property="og:description" content="${card.esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Checked Lab. Checked before you buy.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${card.esc(titled)}">
<meta name="twitter:description" content="${card.esc(description)}">
<meta name="twitter:image" content="${ORIGIN}/assets/og.png">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${FONT_PRELOAD}
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#F5F5F7">
<script type="application/ld+json">
${jsonLd}
</script>
</head>
<body data-page="thanksgiving">
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
<a href="/thanksgiving/" aria-current="page">THANKSGIVING</a>
<a href="/winter-safety/">WINTER SAFETY</a>
<a href="/gifts/">GIFT GUIDES</a>
<a href="/toy-safety/">TOY SAFETY</a>
<a href="/recalls/">RECALL CHECKS</a>
<a href="/how-we-check/">HOW WE CHECK</a>
<a href="/bin-list/">BIN LIST</a>
</nav>
</div>
</header>
${nav("thanksgiving")}
</div>
<main>
<div class="wrap prose">
${mainHtml}
</div>
</main>
<footer>
<div class="foot">
${DISCLOSURE}
<p>© 2026 CHECKED LAB<br>Winnipeg, MB</p>
${SEASON_FOOT}
</div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
}

function thanksHubHtml() {
  const guides = thanksGuides();
  const faqs = thanksDoc.faqs;
  const url = ORIGIN + THANKS_PATH;
  const list = '<ul class="guide-list">' + guides.map((guide) =>
    '<li><h2><a href="' + thanksPath(guide) + '">' + card.esc(guide.h1) + "</a></h2><p>" + card.esc(guide.description) + "</p></li>"
  ).join("") + "</ul>";
  const main = sceneBlock("thanksgiving") + thanksCrumbs() +
    "<h1>" + card.esc(thanksDoc.h1) + "</h1>" +
    '<p class="lede">' + card.esc(thanksDoc.description) + "</p>" +
    '<p>Read the label, then search the product on <a href="' + CPSC_SEARCH + '" target="_blank" rel="noopener">CPSC Recalls</a> or <a href="' + HC_SEARCH + '" target="_blank" rel="noopener">Health Canada recalls and safety alerts</a>. Turkey temperatures on this page come from <a href="https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/poultry/turkey-basics-safe-cooking" target="_blank" rel="noopener">USDA FSIS</a>. Cooking-fire guidance comes from <a href="https://www.nfpa.org/-/media/project/storefront/catalog/files/home-fire-safety/emac/educationalmessagesdeskreference.pdf" target="_blank" rel="noopener">NFPA</a> and <a href="https://www.usfa.fema.gov/prevention/home-fires/prepare-for-fire/fire-extinguishers/" target="_blank" rel="noopener">USFA</a>. <a href="/how-we-check/">How we check</a> says what a dated catalogue line means. These guides are not catalogue cards. <a href="/recalls/">Recall checks</a> lists every catalogue model. <a href="/gifts/for-the-host/">Gifts for the host</a> names widely sold hosting tools and the check to do. <a href="/winter-safety/">Winter home safety</a> covers heaters, heated bedding, alarms, and outage power.</p>' +
    list +
    winterFaqsHtml(faqs);
  const jsonLd = winterJsonLd(
    url,
    thanksDoc.title,
    thanksDoc.description,
    [
      { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: "Thanksgiving", item: url }
    ],
    faqs,
    guides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: guide.title,
      url: ORIGIN + thanksPath(guide)
    }))
  );
  return thanksShell(url, thanksDoc.title, thanksDoc.description, main, jsonLd);
}

function thanksGuideHtml(guide) {
  const url = ORIGIN + thanksPath(guide);
  const main = sceneBlock("thanksgiving") + thanksCrumbs(guide.h1) +
    "<h1>" + card.esc(guide.h1) + "</h1>" +
    '<p class="lede">' + card.esc(guide.description) + "</p>" +
    thanksJumps(guide.slug) +
    "<h2>What to read on the label</h2>" + thanksLook(guide) +
    "<h2>How to search a recall</h2>" + winterMethod(guide) +
    "<h2>Patterns in official notices</h2>" +
    "<p>Each pattern below is one official page. The sentence is what that page says.</p>" +
    thanksPatternsHtml(guide) +
    "<h2>How we check</h2><p>" + card.esc(WINTER_CHECK) + ' <a href="/how-we-check/">How we check</a>.</p>' +
    "<h2>Catalogue cards</h2>" + winterCatalogueHtml(guide) +
    thanksMoreLinks(guide) +
    "<h2>Amazon search</h2>" +
    "<p>The button opens the Amazon search for the words under it. It is not a product page.</p>" +
    winterSearchButtons(guide) +
    winterFaqsHtml(guide.faqs);
  const jsonLd = winterJsonLd(
    url,
    guide.title,
    guide.description,
    [
      { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: "Thanksgiving", item: ORIGIN + THANKS_PATH },
      { "@type": "ListItem", position: 3, name: guide.h1, item: url }
    ],
    guide.faqs,
    null
  );
  return thanksShell(url, guide.title, guide.description, main, jsonLd);
}

function writeThanksFile(dir, html) {
  html = polish(html);
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  if (GIFT_BAN.test(visible) || /we tested|we bought|does not test|did not test|not tested/i.test(visible)) {
    throw new Error("Thanksgiving page failed the honesty check: " + dir);
  }
  assertSafeImages(html, dir);
  if (/\/dp\//.test(html)) throw new Error("Thanksgiving page uses an Amazon product page: " + dir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
}

function writeThanksgiving() {
  assertWinterCopy(thanksDoc.title, "thanksgiving hub title");
  assertWinterCopy(thanksDoc.h1, "thanksgiving hub h1");
  assertWinterCopy(thanksDoc.description, "thanksgiving hub description");
  if (!Array.isArray(thanksDoc.faqs) || thanksDoc.faqs.length < 3) throw new Error("Thanksgiving hub FAQs");
  for (const item of thanksDoc.faqs) {
    assertWinterCopy(item.q, "thanksgiving hub faq");
    assertWinterCopy(item.a, "thanksgiving hub faq");
  }
  const slugs = new Set();
  for (const guide of thanksGuides()) {
    if (!/^[a-z0-9-]+$/.test(guide.slug || "")) throw new Error("Unsafe thanksgiving slug: " + guide.slug);
    if (slugs.has(guide.slug)) throw new Error("Duplicate thanksgiving slug: " + guide.slug);
    slugs.add(guide.slug);
    for (const key of ["title", "h1", "label", "description"]) assertWinterCopy(guide[key], guide.slug + " " + key);
    if (!Array.isArray(guide.look) || guide.look.length < 2) throw new Error("Thanksgiving look list: " + guide.slug);
    if (!Array.isArray(guide.patterns) || guide.patterns.length < 2) throw new Error("Thanksgiving patterns: " + guide.slug);
    if (!Array.isArray(guide.faqs) || guide.faqs.length < 3) throw new Error("Thanksgiving FAQs: " + guide.slug);
    for (const item of guide.faqs) {
      assertWinterCopy(item.q, guide.slug);
      assertWinterCopy(item.a, guide.slug);
    }
    if (guide.methodExtra) {
      guide.methodExtra.forEach((spans, index) => officialSpans(spans, guide.slug + " method " + index));
    }
    thanksLook(guide);
    thanksPatternsHtml(guide);
    winterCatalogueHtml(guide);
    winterSearchButtons(guide);
  }
  const dir = join(root, "thanksgiving");
  mkdirSync(dir, { recursive: true });
  writeThanksFile(dir, thanksHubHtml());
  for (const guide of thanksGuides()) writeThanksFile(join(dir, guide.slug), thanksGuideHtml(guide));
  for (const entry of readdirSync(dir)) {
    if (entry === "index.html") continue;
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (!thanksGuides().some((guide) => guide.slug === entry)) rmSync(full, { recursive: true, force: true });
  }
}

function assertToyPages() {
  const hub = readFileSync(join(root, "toy-safety", "index.html"), "utf8");
  if (!hub.includes('<link rel="canonical" href="' + ORIGIN + TOY_PATH + '">')) throw new Error("Toy hub canonical");
  if (!hub.includes('property="og:url" content="' + ORIGIN + TOY_PATH + '"')) throw new Error("Toy hub OG url");
  if (!hub.includes("<h1>" + card.esc(toyDoc.h1) + "</h1>")) throw new Error("Toy hub H1");
  if (!hub.includes(CPSC_SEARCH) || !hub.includes(HC_SEARCH)) throw new Error("Toy hub search links");
  if (!hub.includes('href="/gifts/for-kids/"')) throw new Error("Toy hub misses the kids list");
  for (const item of toyDoc.faqs) {
    if (!hub.includes("<h3>" + card.esc(item.q) + "</h3>")) throw new Error("Toy hub FAQ question");
    if (!hub.includes('<p class="faq-a">' + card.esc(item.a) + "</p>")) throw new Error("Toy hub FAQ answer");
  }
  const hubLd = JSON.parse(hub.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assertNoCommerce(hubLd);
  const hubFaq = hubLd["@graph"].find((node) => node["@type"] === "FAQPage");
  if (!hubFaq || hubFaq.mainEntity.length !== toyDoc.faqs.length) throw new Error("Toy hub FAQPage");
  hubFaq.mainEntity.forEach((node, index) => {
    if (node.name !== toyDoc.faqs[index].q || node.acceptedAnswer.text !== toyDoc.faqs[index].a) {
      throw new Error("Toy hub FAQ JSON-LD mismatch");
    }
  });
  if (!hubLd["@graph"].some((node) => node["@type"] === "CollectionPage")) throw new Error("Toy hub CollectionPage");
  if (!hubLd["@graph"].some((node) => node["@type"] === "BreadcrumbList")) throw new Error("Toy hub BreadcrumbList");
  for (const guide of toyGuides()) {
    const path = toyPath(guide);
    if (!hub.includes('href="' + path + '"')) throw new Error("Toy hub misses " + guide.slug);
    const html = readFileSync(join(root, path.slice(1), "index.html"), "utf8");
    const pageUrl = ORIGIN + path;
    if (!html.includes('<link rel="canonical" href="' + pageUrl + '">')) throw new Error("Toy canonical " + guide.slug);
    if (!html.includes('property="og:title" content="' + card.esc(guide.title + " — Checked Lab") + '"')) {
      throw new Error("Toy OG title " + guide.slug);
    }
    if (!html.includes("<h2>What to read on the label</h2>")) throw new Error("Toy look heading " + guide.slug);
    if (!html.includes("<h2>How to search a recall</h2>") || !html.includes(CPSC_SEARCH) || !html.includes(HC_SEARCH)) {
      throw new Error("Toy search method " + guide.slug);
    }
    if (!html.includes("<h2>Patterns in official notices</h2>")) throw new Error("Toy pattern heading " + guide.slug);
    if (!html.includes(card.esc(WINTER_CHECK))) throw new Error("Toy how-we-check note " + guide.slug);
    if (!html.includes('href="/how-we-check/"') || !html.includes('href="/recalls/"') || !html.includes('href="/toy-safety/"')) {
      throw new Error("Toy internal links " + guide.slug);
    }
    if (!html.includes('href="/gifts/for-kids/"')) throw new Error("Toy guide misses the kids list " + guide.slug);
    if (!html.includes('data-region-set="US"') || !html.includes('data-region-set="CA"')) throw new Error("Toy region switch " + guide.slug);
    for (const pattern of guide.patterns) {
      if (!html.includes('href="' + card.esc(pattern.url) + '"')) throw new Error("Toy pattern link " + pattern.url);
      if (!html.includes(card.esc(pattern.says))) throw new Error("Toy pattern text " + pattern.url);
    }
    assertAmazonSide(html, "only-us", "https://www.amazon.com/", "checkedlab01-20", guide.searches.length);
    assertAmazonSide(html, "only-ca", "https://www.amazon.ca/", "checkedlab-20", guide.searches.length);
    if (html.includes("/dp/")) throw new Error("Toy guide uses an ASIN link: " + guide.slug);
    assertSafeImages(html, guide.slug);
    const visible = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
    if (GIFT_BAN.test(visible) || /we tested|we bought|does not test|did not test|not tested/i.test(visible)) {
      throw new Error("Toy guide failed the honesty check: " + guide.slug);
    }
    for (const item of guide.faqs) {
      if (!html.includes("<h3>" + card.esc(item.q) + "</h3>")) throw new Error("Toy FAQ question " + guide.slug);
      if (!html.includes('<p class="faq-a">' + card.esc(item.a) + "</p>")) throw new Error("Toy FAQ answer " + guide.slug);
    }
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assertNoCommerce(data);
    const types = data["@graph"].map((node) => node["@type"]).sort().join(",");
    if (types !== "Article,BreadcrumbList,FAQPage") throw new Error("Toy schema " + guide.slug + " " + types);
    const faq = data["@graph"].find((node) => node["@type"] === "FAQPage");
    if (!faq || faq.mainEntity.length !== guide.faqs.length) throw new Error("Toy FAQPage " + guide.slug);
    faq.mainEntity.forEach((node, index) => {
      if (node.name !== guide.faqs[index].q || node.acceptedAnswer.text !== guide.faqs[index].a) {
        throw new Error("Toy FAQ JSON-LD mismatch " + guide.slug);
      }
    });
  }
}

function assertThanksgivingPages() {
  const hub = readFileSync(join(root, "thanksgiving", "index.html"), "utf8");
  if (!hub.includes('<link rel="canonical" href="' + ORIGIN + THANKS_PATH + '">')) throw new Error("Thanksgiving hub canonical");
  if (!hub.includes('property="og:url" content="' + ORIGIN + THANKS_PATH + '"')) throw new Error("Thanksgiving hub OG url");
  if (!hub.includes("<h1>" + card.esc(thanksDoc.h1) + "</h1>")) throw new Error("Thanksgiving hub H1");
  if (!hub.includes(CPSC_SEARCH) || !hub.includes(HC_SEARCH)) throw new Error("Thanksgiving hub search links");
  if (!hub.includes('href="/gifts/for-the-host/"')) throw new Error("Thanksgiving hub misses the host list");
  if (!hub.includes('href="/winter-safety/"')) throw new Error("Thanksgiving hub misses winter safety");
  if (!hub.includes("November 26, 2026")) throw new Error("Thanksgiving date missing");
  for (const item of thanksDoc.faqs) {
    if (!hub.includes("<h3>" + card.esc(item.q) + "</h3>")) throw new Error("Thanksgiving hub FAQ question");
    if (!hub.includes('<p class="faq-a">' + card.esc(item.a) + "</p>")) throw new Error("Thanksgiving hub FAQ answer");
  }
  const hubLd = JSON.parse(hub.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assertNoCommerce(hubLd);
  const hubFaq = hubLd["@graph"].find((node) => node["@type"] === "FAQPage");
  if (!hubFaq || hubFaq.mainEntity.length !== thanksDoc.faqs.length) throw new Error("Thanksgiving hub FAQPage");
  hubFaq.mainEntity.forEach((node, index) => {
    if (node.name !== thanksDoc.faqs[index].q || node.acceptedAnswer.text !== thanksDoc.faqs[index].a) {
      throw new Error("Thanksgiving hub FAQ JSON-LD mismatch");
    }
  });
  if (!hubLd["@graph"].some((node) => node["@type"] === "CollectionPage")) throw new Error("Thanksgiving hub CollectionPage");
  if (!hubLd["@graph"].some((node) => node["@type"] === "BreadcrumbList")) throw new Error("Thanksgiving hub BreadcrumbList");
  for (const guide of thanksGuides()) {
    const path = thanksPath(guide);
    if (!hub.includes('href="' + path + '"')) throw new Error("Thanksgiving hub misses " + guide.slug);
    const html = readFileSync(join(root, path.slice(1), "index.html"), "utf8");
    const pageUrl = ORIGIN + path;
    if (!html.includes('<link rel="canonical" href="' + pageUrl + '">')) throw new Error("Thanksgiving canonical " + guide.slug);
    if (!html.includes('property="og:title" content="' + card.esc(guide.title + " — Checked Lab") + '"')) {
      throw new Error("Thanksgiving OG title " + guide.slug);
    }
    if (!html.includes("<h2>What to read on the label</h2>")) throw new Error("Thanksgiving look heading " + guide.slug);
    if (!html.includes("<h2>How to search a recall</h2>") || !html.includes(CPSC_SEARCH) || !html.includes(HC_SEARCH)) {
      throw new Error("Thanksgiving search method " + guide.slug);
    }
    if (!html.includes("<h2>Patterns in official notices</h2>")) throw new Error("Thanksgiving pattern heading " + guide.slug);
    if (!html.includes(card.esc(WINTER_CHECK))) throw new Error("Thanksgiving how-we-check note " + guide.slug);
    if (!html.includes('href="/how-we-check/"') || !html.includes('href="/recalls/"') || !html.includes('href="/thanksgiving/"')) {
      throw new Error("Thanksgiving internal links " + guide.slug);
    }
    if (!html.includes('href="/gifts/for-the-host/"')) throw new Error("Thanksgiving guide misses the host list " + guide.slug);
    if (!html.includes('data-region-set="US"') || !html.includes('data-region-set="CA"')) throw new Error("Thanksgiving region switch " + guide.slug);
    for (const pattern of guide.patterns) {
      if (!html.includes('href="' + card.esc(pattern.url) + '"')) throw new Error("Thanksgiving pattern link " + pattern.url);
      if (!html.includes(card.esc(pattern.says))) throw new Error("Thanksgiving pattern text " + pattern.url);
    }
    for (const item of guide.catalogue || []) {
      const product = products.find((entry) => entry.id === item.id);
      if (!html.includes('href="' + card.productPath(product) + '"')) throw new Error("Thanksgiving card link " + item.id);
      const page = readFileSync(join(root, product.category, product.id, "index.html"), "utf8");
      if (!page.includes('href="' + path + '"')) throw new Error("Catalogue card misses " + path + " on " + item.id);
    }
    assertAmazonSide(html, "only-us", "https://www.amazon.com/", "checkedlab01-20", guide.searches.length);
    assertAmazonSide(html, "only-ca", "https://www.amazon.ca/", "checkedlab-20", guide.searches.length);
    if (html.includes("/dp/")) throw new Error("Thanksgiving guide uses an ASIN link: " + guide.slug);
    assertSafeImages(html, guide.slug);
    const visible = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
    if (GIFT_BAN.test(visible) || /we tested|we bought|does not test|did not test|not tested/i.test(visible)) {
      throw new Error("Thanksgiving guide failed the honesty check: " + guide.slug);
    }
    for (const item of guide.faqs) {
      if (!html.includes("<h3>" + card.esc(item.q) + "</h3>")) throw new Error("Thanksgiving FAQ question " + guide.slug);
      if (!html.includes('<p class="faq-a">' + card.esc(item.a) + "</p>")) throw new Error("Thanksgiving FAQ answer " + guide.slug);
    }
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assertNoCommerce(data);
    const types = data["@graph"].map((node) => node["@type"]).sort().join(",");
    if (types !== "Article,BreadcrumbList,FAQPage") throw new Error("Thanksgiving schema " + guide.slug + " " + types);
    const faq = data["@graph"].find((node) => node["@type"] === "FAQPage");
    if (!faq || faq.mainEntity.length !== guide.faqs.length) throw new Error("Thanksgiving FAQPage " + guide.slug);
    faq.mainEntity.forEach((node, index) => {
      if (node.name !== guide.faqs[index].q || node.acceptedAnswer.text !== guide.faqs[index].a) {
        throw new Error("Thanksgiving FAQ JSON-LD mismatch " + guide.slug);
      }
    });
  }
}

function writeGifts() {
  if (!giftsDoc || giftsDoc.title !== "Holiday 2026 gift guides" || !giftsDoc.h1 || !giftsDoc.description) {
    throw new Error("Gift hub copy is missing");
  }
  if (GIFT_BAN.test(giftsDoc.title + " " + giftsDoc.h1 + " " + giftsDoc.description)) {
    throw new Error("Gift hub copy failed the honesty check");
  }
  const slugs = new Set();
  const seen = new Set();
  const grouped = [];
  for (const guide of giftGuides()) {
    if (!/^[a-z0-9-]+$/.test(guide.slug || "")) throw new Error("Unsafe gift slug: " + guide.slug);
    if (slugs.has(guide.slug)) throw new Error("Duplicate gift slug: " + guide.slug);
    slugs.add(guide.slug);
    for (const key of ["title", "h1", "label", "description", "fit"]) {
      if (!guide[key] || typeof guide[key] !== "string") throw new Error("Gift guide missing " + key + ": " + guide.slug);
    }
    if (GIFT_BAN.test([guide.title, guide.h1, guide.label, guide.description, guide.fit].join(" "))) {
      throw new Error("Gift guide copy failed the honesty check: " + guide.slug);
    }
    grouped.push({ guide, picks: giftPicks(guide, seen) });
  }
  const kids = kidsGuide();
  assertKidsGuide(kids);
  const host = hostGuide();
  assertKidsGuide(host);
  const dir = join(root, "gifts");
  mkdirSync(dir, { recursive: true });
  writeGiftFile(dir, giftHubHtml(grouped));
  for (const item of grouped) writeGiftFile(join(dir, item.guide.slug), giftGuideHtml(item.guide, item.picks, grouped));
  writeGiftFile(join(dir, kids.slug), kidsGuideHtml(kids, grouped));
  writeGiftFile(join(dir, host.slug), hostGuideHtml(host, grouped));
  const keep = new Set(grouped.map((item) => item.guide.slug).concat(kids.slug, host.slug));
  for (const entry of readdirSync(dir)) {
    if (entry === "index.html") continue;
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (!keep.has(entry)) rmSync(full, { recursive: true, force: true });
  }
}

function assertGiftShell(html, url, title, description) {
  const titled = title + " — Checked Lab";
  assertFooterDisclosure(html, "Gift disclosure missing " + url);
  if (!html.includes('<link rel="canonical" href="' + url + '">')) throw new Error("Gift canonical " + url);
  if (!html.includes("<title>" + card.esc(titled) + "</title>")) throw new Error("Gift title " + url);
  if (!html.includes('name="description" content="' + card.esc(description) + '"')) throw new Error("Gift description " + url);
  if (!html.includes('data-region-set="US"') || !html.includes('data-region-set="CA"')) throw new Error("Gift region switch " + url);
  if (!html.includes('href="/how-we-check/"')) throw new Error("Gift how-we-check link " + url);
}

function assertGiftLd(html, count, faqs) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (blocks.length !== 1) throw new Error("Gift JSON-LD count");
  const data = JSON.parse(blocks[0][1]);
  assertNoCommerce(data);
  const flat = JSON.stringify(data);
  for (const type of ["CollectionPage", "ItemList", "BreadcrumbList"]) {
    if (!flat.includes(type)) throw new Error("Gift JSON-LD missing " + type);
  }
  if (/"@type":"Product"|offers|aggregateRating|reviewCount|ratingValue/i.test(flat)) {
    throw new Error("Gift JSON-LD has a commerce type");
  }
  const list = (data["@graph"] || []).find((node) => node["@type"] === "CollectionPage");
  if (!list || !list.mainEntity || list.mainEntity["@type"] !== "ItemList" || list.mainEntity.numberOfItems !== count) {
    throw new Error("Gift ItemList count");
  }
  if (!list.mainEntity.itemListElement || list.mainEntity.itemListElement.length !== count) {
    throw new Error("Gift ItemList items");
  }
  if (!(data["@graph"] || []).some((node) => node["@type"] === "BreadcrumbList")) throw new Error("Gift breadcrumbs");
  const faq = (data["@graph"] || []).find((node) => node["@type"] === "FAQPage");
  if (faqs) {
    if (!faq || faq.mainEntity.length !== faqs.length) throw new Error("Gift FAQPage");
    faq.mainEntity.forEach((node, index) => {
      if (node.name !== faqs[index].q || !node.acceptedAnswer || node.acceptedAnswer.text !== faqs[index].a) {
        throw new Error("Gift FAQ JSON-LD mismatch");
      }
    });
  } else if (faq) {
    throw new Error("Gift guide includes an unrequested FAQ");
  }
}

function assertAmazonSide(html, cls, host, tag, count) {
  const bits = [...html.matchAll(new RegExp('<div class="' + cls + '">([\\s\\S]*?)<\\/div>', "g"))].map((match) => match[1]);
  if (bits.length !== count) throw new Error(cls + " Amazon buttons " + bits.length + " expected " + count);
  for (const bit of bits) {
    if (!bit.includes(host) || !bit.includes("tag=" + tag) || !bit.includes("store-btn store-primary")) {
      throw new Error("Amazon button missing " + host);
    }
    if (tag === "checkedlab01-20" && bit.includes("tag=checkedlab-20")) throw new Error("US Amazon tag crossed");
    if (tag === "checkedlab-20" && bit.includes("tag=checkedlab01-20")) throw new Error("CA Amazon tag crossed");
  }
}

function assertGiftPages() {
  const seen = new Set();
  const grouped = giftGuides().map((guide) => ({ guide, picks: giftPicks(guide, seen) }));
  const hub = readFileSync(join(root, "gifts", "index.html"), "utf8");
  assertGiftShell(hub, ORIGIN + GIFT_PATH, giftsDoc.title, giftsDoc.description);
  if (!hub.includes("<h1>" + card.esc(giftsDoc.h1) + "</h1>")) throw new Error("Gift hub H1");
  const faqs = giftHubFaqs(grouped.map((item) => item.guide));
  for (const item of faqs) {
    if (!hub.includes("<h3>" + card.esc(item.q) + "</h3>")) throw new Error("Gift hub FAQ question");
    if (!hub.includes('<p class="faq-a">' + card.esc(item.a) + "</p>")) throw new Error("Gift hub FAQ answer");
  }
  assertGiftLd(hub, grouped.length + checksGuides().length, faqs);
  if (!hub.includes('href="' + giftPath(kidsGuide()) + '"')) throw new Error("Gift hub misses the kids list");
  if (!hub.includes('href="' + giftPath(hostGuide()) + '"')) throw new Error("Gift hub misses the host list");
  if (!hub.includes('href="/toy-safety/"')) throw new Error("Gift hub misses toy safety");
  if (!hub.includes('href="/thanksgiving/"')) throw new Error("Gift hub misses Thanksgiving");
  assertKidsPage(readFileSync(join(root, "gifts", "for-kids", "index.html"), "utf8"));
  assertHostPage(readFileSync(join(root, "gifts", "for-the-host", "index.html"), "utf8"));
  const hubVisible = hub.replace(/<script[\s\S]*?<\/script>/gi, "");
  if (GIFT_BAN.test(hubVisible)) throw new Error("Gift hub failed the honesty check");
  assertSafeImages(hub, "gift hub");
  for (const item of grouped) {
    const path = giftPath(item.guide);
    if (!hub.includes('href="' + path + '"')) throw new Error("Gift hub misses " + item.guide.slug);
    const html = readFileSync(join(root, path.slice(1), "index.html"), "utf8");
    assertGiftShell(html, ORIGIN + path, item.guide.title, item.guide.description);
    if (!html.includes("<h1>" + card.esc(item.guide.h1) + "</h1>")) throw new Error("Gift H1 " + item.guide.slug);
    if (!html.includes(card.esc(item.guide.fit))) throw new Error("Gift fit missing " + item.guide.slug);
    if (!html.includes('href="/gifts/"')) throw new Error("Gift guide misses the hub");
    for (const entry of compares) {
      const linked = (entry.guides || []).includes(item.guide.slug) || entry.products.some((id) => item.picks.some((product) => product.id === id));
      if (linked && !html.includes('href="/compare/' + entry.slug + '/"')) {
        throw new Error("Gift guide misses " + entry.slug + " on " + item.guide.slug);
      }
    }
    assertAmazonSide(html, "only-us", "https://www.amazon.com/", "checkedlab01-20", item.picks.length);
    assertAmazonSide(html, "only-ca", "https://www.amazon.ca/", "checkedlab-20", item.picks.length);
    for (const product of item.picks) {
      const href = card.productPath(product);
      if (!html.includes('href="' + href + '"')) throw new Error("Gift guide misses " + product.id);
      if (!html.includes(card.esc(giftWhy(product, item.guide)))) throw new Error("Gift spec line missing " + product.id);
      for (const rec of [card.recallFor(product, "US"), card.recallFor(product, "CA")]) {
        if (!html.includes(rec.checkedAt)) throw new Error("Gift date missing " + product.id);
      }
      if (!html.includes('id="' + product.id + '"')) throw new Error("Gift anchor missing " + product.id);
    }
    if (html.includes("badge-bin") || html.includes("Official recall found")) {
      throw new Error("Gift guide includes a recalled model: " + item.guide.slug);
    }
    assertGiftLd(html, item.picks.length, null);
    const visible = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    if (GIFT_BAN.test(visible)) throw new Error("Gift guide failed the honesty check: " + item.guide.slug);
    assertSafeImages(html, item.guide.slug);
  }
}

function assertWinterPages() {
  const hub = readFileSync(join(root, "winter-safety", "index.html"), "utf8");
  if (!hub.includes('<link rel="canonical" href="' + ORIGIN + WINTER_PATH + '">')) throw new Error("Winter hub canonical");
  if (!hub.includes('property="og:url" content="' + ORIGIN + WINTER_PATH + '"')) throw new Error("Winter hub OG url");
  if (!hub.includes('property="og:image" content="' + ORIGIN + '/assets/og.png"')) throw new Error("Winter hub OG image");
  if (!hub.includes("<h1>" + card.esc(winterDoc.h1) + "</h1>")) throw new Error("Winter hub H1");
  if (!hub.includes(CPSC_SEARCH) || !hub.includes(HC_SEARCH)) throw new Error("Winter hub search links");
  for (const item of winterDoc.faqs) {
    if (!hub.includes("<h3>" + card.esc(item.q) + "</h3>")) throw new Error("Winter hub FAQ question");
    if (!hub.includes('<p class="faq-a">' + card.esc(item.a) + "</p>")) throw new Error("Winter hub FAQ answer");
  }
  const hubLd = JSON.parse(hub.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assertNoCommerce(hubLd);
  const hubFaq = hubLd["@graph"].find((node) => node["@type"] === "FAQPage");
  if (!hubFaq || hubFaq.mainEntity.length !== winterDoc.faqs.length) throw new Error("Winter hub FAQPage");
  hubFaq.mainEntity.forEach((node, index) => {
    if (node.name !== winterDoc.faqs[index].q || node.acceptedAnswer.text !== winterDoc.faqs[index].a) {
      throw new Error("Winter hub FAQ JSON-LD mismatch");
    }
  });
  if (!hubLd["@graph"].some((node) => node["@type"] === "CollectionPage")) throw new Error("Winter hub CollectionPage");
  for (const guide of winterGuides()) {
    const path = winterPath(guide);
    if (!hub.includes('href="' + path + '"')) throw new Error("Winter hub misses " + guide.slug);
    const html = readFileSync(join(root, path.slice(1), "index.html"), "utf8");
    const url = ORIGIN + path;
    if (!html.includes('<link rel="canonical" href="' + url + '">')) throw new Error("Winter canonical " + guide.slug);
    if (!html.includes('property="og:title" content="' + card.esc(guide.title + " — Checked Lab") + '"')) {
      throw new Error("Winter OG title " + guide.slug);
    }
    if (!html.includes('name="description" content="' + card.esc(guide.description) + '"')) {
      throw new Error("Winter description " + guide.slug);
    }
    if (!html.includes("<h2>What to read on the label</h2>")) throw new Error("Winter look heading " + guide.slug);
    if (!html.includes("<h2>How to search a recall</h2>") || !html.includes(CPSC_SEARCH) || !html.includes(HC_SEARCH)) {
      throw new Error("Winter search method " + guide.slug);
    }
    if (!html.includes("<h2>Patterns in official notices</h2>")) throw new Error("Winter pattern heading " + guide.slug);
    if (!html.includes(card.esc(WINTER_CHECK))) throw new Error("Winter how-we-check note " + guide.slug);
    if (!html.includes('href="/how-we-check/"') || !html.includes('href="/recalls/"') || !html.includes('href="/winter-safety/"')) {
      throw new Error("Winter internal links " + guide.slug);
    }
    for (const pattern of guide.patterns) {
      if (!html.includes('href="' + card.esc(pattern.url) + '"')) throw new Error("Winter pattern link " + pattern.url);
      if (!html.includes(card.esc(pattern.says))) throw new Error("Winter pattern text " + pattern.url);
    }
    for (const item of guide.catalogue) {
      const product = products.find((entry) => entry.id === item.id);
      if (!html.includes('href="' + card.productPath(product) + '"')) throw new Error("Winter card link " + item.id);
      const page = readFileSync(join(root, product.category, product.id, "index.html"), "utf8");
      if (!page.includes('href="' + path + '"')) throw new Error("Catalogue card misses " + path + " on " + item.id);
    }
    assertAmazonSide(html, "only-us", "https://www.amazon.com/", "checkedlab01-20", guide.searches.length);
    assertAmazonSide(html, "only-ca", "https://www.amazon.ca/", "checkedlab-20", guide.searches.length);
    if (html.includes("/dp/")) throw new Error("Winter guide uses an ASIN link: " + guide.slug);
    assertSafeImages(html, guide.slug);
    const visible = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
    if (GIFT_BAN.test(visible) || /we tested|we bought|does not test|did not test|not tested/i.test(visible)) {
      throw new Error("Winter guide failed the honesty check: " + guide.slug);
    }
    for (const item of guide.faqs) {
      if (!html.includes("<h3>" + card.esc(item.q) + "</h3>")) throw new Error("Winter FAQ question " + guide.slug);
      if (!html.includes('<p class="faq-a">' + card.esc(item.a) + "</p>")) throw new Error("Winter FAQ answer " + guide.slug);
    }
    const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assertNoCommerce(data);
    const types = data["@graph"].map((node) => node["@type"]).sort().join(",");
    if (types !== "Article,BreadcrumbList,FAQPage") throw new Error("Winter schema " + guide.slug + " " + types);
    const faq = data["@graph"].find((node) => node["@type"] === "FAQPage");
    if (!faq || faq.mainEntity.length !== guide.faqs.length) throw new Error("Winter FAQPage " + guide.slug);
    faq.mainEntity.forEach((node, index) => {
      if (node.name !== guide.faqs[index].q || node.acceptedAnswer.text !== guide.faqs[index].a) {
        throw new Error("Winter FAQ JSON-LD mismatch " + guide.slug);
      }
    });
  }
}

function licenseUrlFor(license) {
  const map = {
    "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
    "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
    "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
    "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
    "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0/",
    "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
    "CC0": "https://creativecommons.org/publicdomain/zero/1.0/",
    "Public domain": "https://creativecommons.org/publicdomain/mark/1.0/"
  };
  return map[license] || "";
}

function creditAuthor(credit) {
  const match = String(credit || "").match(/^Photo(?::| by)\s+([^,]+)/);
  return match ? match[1].trim() : "";
}

function extLink(href, label) {
  return '<a href="' + card.esc(href) + '" target="_blank" rel="noopener">' + card.esc(label) + "</a>";
}

function writePhotoCredits() {
  const photos = JSON.parse(readFileSync(join(root, "data", "photos.json"), "utf8"));
  const lifestyle = photos.map((photo) =>
    "<li>" + extLink(photo.source, photo.credit) +
    "<small>" + card.esc(photo.license) + " · " + card.esc(photo.use) + "</small></li>"
  ).join("\n");
  const catalogue = products.filter((product) => product.imageKind === "model" && product.imageSource).map((product) => {
    const author = product.imageAuthor || creditAuthor(product.imageCredit) || "Photographer";
    const license = product.imageLicense || "";
    const licenseHref = product.imageLicenseUrl || licenseUrlFor(license);
    const shows = product.imageShows || product.title;
    const who = extLink(product.imageSource, author);
    const terms = licenseHref ? extLink(licenseHref, license || "License") : card.esc(license);
    const source = extLink(product.imageSource, "Source page");
    return "<li>" + who +
      "<small>" + terms + " · " + source + " · Shows: " + card.esc(shows) +
      " · " + card.esc(product.title) + "</small></li>";
  }).join("\n");
  const html = `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${ORIGIN}/photo-credits/">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Photo credits — Checked Lab</title>
<meta name="description" content="Photographers, licenses, source pages, and what each photo shows on Checked Lab.">
<meta property="og:title" content="Photo credits — Checked Lab">
<meta property="og:description" content="Photographers, licenses, source pages, and what each photo shows on Checked Lab.">
<meta property="og:type" content="website">
<meta property="og:url" content="${ORIGIN}/photo-credits/">
<meta property="og:image" content="${ORIGIN}/assets/og.png">
<link rel="icon" type="image/png" href="/favicon.png">
${FONT_PRELOAD}
<link rel="stylesheet" href="/assets/site.css">
<meta name="theme-color" content="#1F4D3A">
</head>
<body data-page="credits">
<div class="masthead"></div>
<main id="main">
<div class="wrap prose">
<h1>Photo credits</h1>
<p class="lede">Photos are stored on this site. Each catalogue line names the photographer, links the license and the source page, and says what the photo shows. A catalogue photo may be the exact model, another model of the same brand, or the same kind of product. Captions are not repeated under the photos.</p>
<h2>Catalogue photos</h2>
<ul class="credits">
${catalogue}
</ul>
<h2>Scene photos</h2>
<ul class="credits">
${lifestyle}
</ul>
</div>
</main>
<footer></footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`;
  const dir = join(root, "photo-credits");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), polish(html));
}

function plainInline(text) {
  return String(text).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function guideWords(text) {
  return plainInline(text).trim().split(/\s+/).filter(Boolean).length;
}

function renderInline(text) {
  const parts = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let match;
  while ((match = re.exec(text))) {
    parts.push(card.esc(text.slice(last, match.index)));
    const url = match[2];
    const label = card.esc(match[1]);
    parts.push(url.startsWith("/")
      ? '<a href="' + card.esc(url) + '">' + label + "</a>"
      : '<a href="' + card.esc(url) + '" target="_blank" rel="noopener">' + label + "</a>");
    last = re.lastIndex;
  }
  parts.push(card.esc(text.slice(last)));
  return parts.join("");
}

function eachGuideUrl(guide, visit) {
  const texts = guide.intro.concat(guide.picks.map((pick) => pick.body), (guide.faqs || []).map((item) => item.a));
  for (const text of texts) {
    const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
    let match;
    while ((match = re.exec(text))) visit(match[2]);
  }
  for (const pick of guide.picks) {
    for (const link of pick.links || []) visit(link.href);
  }
}

function knownInternalPaths() {
  const paths = new Set([
    "/",
    "/how-we-check/",
    "/bin-list/",
    "/photo-credits/",
    "/recalls/",
    "/compare/",
    "/black-friday/",
    "/gifts/",
    "/winter-safety/",
    "/toy-safety/",
    "/thanksgiving/"
  ]);
  for (const hub of HUBS) paths.add("/" + hub + "/");
  for (const product of products) paths.add(card.productPath(product));
  for (const entry of compares) paths.add("/compare/" + entry.slug + "/");
  for (const path of editorialPaths()) paths.add(path);
  for (const path of bestPaths()) paths.add(path);
  for (const entry of explainers) paths.add("/recalls/" + entry.slug + "/");
  for (const path of giftPaths()) paths.add(path);
  for (const path of winterPaths()) paths.add(path);
  for (const path of toyPaths()) paths.add(path);
  for (const path of thanksPaths()) paths.add(path);
  return paths;
}

function allowedExternalHosts() {
  const hosts = new Set([
    "www.cpsc.gov",
    "cpsc.gov",
    "www.saferproducts.gov",
    "saferproducts.gov",
    "recalls-rappels.canada.ca",
    "open.canada.ca",
    "www.canada.ca",
    "canada.ca"
  ]);
  const add = (url) => {
    try { hosts.add(new URL(url).host); } catch { /* ignore incomplete rows */ }
  };
  for (const product of products) {
    if (product.sourceUrl) add(product.sourceUrl);
    for (const spec of product.specs || []) add(spec.url);
  }
  return hosts;
}

function assertHubGuides() {
  const keys = Object.keys(hubGuides);
  for (const key of GUIDE_KEYS) {
    if (!keys.includes(key)) throw new Error("Missing hub guide " + key);
  }
  const paths = knownInternalPaths();
  const hosts = allowedExternalHosts();
  const titles = new Set();
  for (const key of GUIDE_KEYS) {
    const guide = hubGuides[key];
    if (!guide.heading || !Array.isArray(guide.intro) || !Array.isArray(guide.picks)) {
      throw new Error("Hub guide is incomplete: " + key);
    }
    const words = guide.intro.reduce((sum, paragraph) => sum + guideWords(paragraph), 0);
    hubWordCounts[key] = words;
    if (words < 300 || words > 600) throw new Error(key + " intro is " + words + " words");
    const prose = JSON.stringify(guide);
    if (COPY_BAN.test(prose)) throw new Error("Hub guide failed the honesty check: " + key);
    if (key === "black-friday" && /deal/i.test(plainInline(guide.intro.join(" ") + guide.picks.map((pick) => pick.need + pick.body).join(" ")))) {
      throw new Error("Black Friday guide contains deal");
    }
    const faqs = guide.faqs || [];
    if (key === "black-friday" || key === "gifts") {
      if (faqs.length) throw new Error(key + " already has its own FAQ block");
    } else if (faqs.length < 4 || faqs.length > 6) {
      throw new Error(key + " needs 4 to 6 FAQs");
    }
    if (guide.picks.length < 3) throw new Error(key + " needs quick picks");
    for (const pick of guide.picks) {
      if (!pick.need || !pick.body || !Array.isArray(pick.links) || !pick.links.length) {
        throw new Error("Incomplete quick pick on " + key);
      }
      for (const link of pick.links) {
        if (!paths.has(link.href)) throw new Error("Quick pick link is not a page: " + link.href);
      }
    }
    if (guide.title) {
      if (titles.has(guide.title)) throw new Error("Duplicate hub title " + guide.title);
      titles.add(guide.title);
    }
    eachGuideUrl(guide, (url) => {
      if (url.startsWith("/")) {
        if (!paths.has(url)) throw new Error("Hub guide links a missing page: " + url + " on " + key);
        return;
      }
      let host = "";
      try { host = new URL(url).host; } catch { throw new Error("Bad guide URL " + url); }
      if (!url.startsWith("https://") || !hosts.has(host)) throw new Error("Guide source is not allowed: " + url);
    });
  }
}

function sentenceChunks(text) {
  const parts = String(text).split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < parts.length; i += 3) chunks.push(parts.slice(i, i + 3).join(" "));
  return chunks.length ? chunks : [String(text)];
}

function renderParas(paragraph) {
  return sentenceChunks(paragraph).map((part) => "<p>" + renderInline(part) + "</p>").join("\n");
}

function renderHubGuide(key, opts = {}) {
  const guide = hubGuides[key];
  const paras = guide.intro.map((paragraph) => renderParas(paragraph)).join("\n");
  const picks = '<div class="need-grid">' + guide.picks.map((pick) =>
    '<article class="need"><h3>' + card.esc(pick.need) + "</h3>" + renderParas(pick.body) + '<p class="lede">' +
    pick.links.map((link) => '<a href="' + card.esc(link.href) + '">' + card.esc(link.label) + "</a>").join(" ") +
    "</p></article>"
  ).join("\n") + "</div>";
  let models = "";
  if (opts.models && opts.models.length) {
    models = productFold("models-on-page", "Models on this page", '<ul class="model-index">' + opts.models.map((product) =>
      '<li><a href="' + card.productPath(product) + '">' + card.esc(product.title) + "</a></li>"
    ).join("") + "</ul>");
  }
  const faqs = opts.faq === false ? "" : guideFaqBlock(guide.faqs || []);
  const headingId = opts.headingId || "guide-heading";
  const toc = '<nav class="toc" aria-label="Jump to"><p>Jump to</p><a href="#' + headingId + '">' + card.esc(guide.heading) +
    '</a><a href="#quick-picks">Quick picks</a>' + (models ? '<a href="#models-on-page">Models</a>' : "") +
    (faqs ? '<a href="#questions">Questions</a>' : "") + "</nav>";
  return '<section class="guide">\n' + toc + "\n" +
    productFold(headingId, card.esc(guide.heading), paras) + "\n" +
    productFold("quick-picks", "Quick picks by need", picks) +
    (models ? "\n" + models : "") + (faqs ? "\n" + faqs : "") + "\n</section>";
}

function guideFaqBlock(faqs) {
  if (!faqs.length) return "";
  return '<section class="faq" id="questions"><h2>Questions</h2>' + faqs.map((item, index) =>
    '<details class="fold" id="q-' + index + '"><summary><h3>' + card.esc(item.q) + "</h3></summary><div class=\"fold-body\">" +
    sentenceChunks(item.a).map((part) => '<p class="faq-a">' + renderInline(part) + "</p>").join("") +
    "</div></details>"
  ).join("") + "</section>";
}

function setMeta(html, title, description) {
  if (title) {
    const safe = card.esc(title);
    html = html.replace(/<title>[^<]*<\/title>/, "<title>" + safe + "</title>");
    html = html.replace(/property="og:title" content="[^"]*"/, 'property="og:title" content="' + safe + '"');
    html = html.replace(/name="twitter:title" content="[^"]*"/, 'name="twitter:title" content="' + safe + '"');
  }
  if (description) {
    const safe = card.esc(description);
    html = html.replace(/name="description" content="[^"]*"/, 'name="description" content="' + safe + '"');
    html = html.replace(/property="og:description" content="[^"]*"/, 'property="og:description" content="' + safe + '"');
    html = html.replace(/name="twitter:description" content="[^"]*"/, 'name="twitter:description" content="' + safe + '"');
  }
  return html;
}

function categoryCrumbs(hub) {
  return '<nav class="crumbs" aria-label="Breadcrumb">\n<a href="/">Home</a>\n<span aria-hidden="true">/</span>\n<span aria-current="page">' +
    card.esc(HUB_NAME[hub]) + "</span>\n</nav>\n";
}

function mountGuideBlock(html, block, anchor) {
  if (html.includes(GUIDE_START)) return fillMount(html, block, GUIDE_START, GUIDE_END);
  if (!html.includes(anchor)) throw new Error("Guide anchor missing");
  return html.replace(anchor, GUIDE_START + "\n" + block + "\n" + GUIDE_END + "\n" + anchor);
}

function upsertPageSchema(html, opts) {
  const re = /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/;
  const match = html.match(re);
  if (!match) throw new Error("Missing JSON-LD for a hub guide");
  const data = JSON.parse(match[1]);
  if (!Array.isArray(data["@graph"])) throw new Error("JSON-LD has no @graph");
  if (opts.crumbs && !data["@graph"].some((node) => node["@type"] === "BreadcrumbList")) {
    data["@graph"].unshift({ "@type": "BreadcrumbList", itemListElement: opts.crumbs });
  }
  if (!data["@graph"].some((node) => node["@type"] === "BreadcrumbList")) {
    throw new Error("BreadcrumbList missing after the guide update");
  }
  if (opts.description) {
    for (const node of data["@graph"]) {
      if (["ItemList", "WebSite", "Organization", "CollectionPage"].includes(node["@type"]) && typeof node.description === "string") {
        node.description = opts.description;
      }
    }
  }
  if (opts.faqs && opts.faqs.length) {
    const faqNode = {
      "@type": "FAQPage",
      mainEntity: opts.faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: plainInline(item.a) }
      }))
    };
    const index = data["@graph"].findIndex((node) => node["@type"] === "FAQPage");
    if (index >= 0) data["@graph"][index] = faqNode;
    else data["@graph"].push(faqNode);
  }
  assertNoCommerce(data);
  const json = JSON.stringify(data, null, 2).replace(/</g, "\\u003c");
  return html.replace(re, "<script type=\"application/ld+json\">\n" + json + "\n</script>");
}

function applyCategoryHub(html, hub) {
  const guide = hubGuides[hub];
  if (!html.includes('class="crumbs"')) {
    if (!html.includes('<div class="wrap">')) throw new Error("No wrap for breadcrumbs on " + hub);
    html = html.replace('<div class="wrap">', '<div class="wrap">\n' + categoryCrumbs(hub));
  }
  html = setMeta(html, guide.title, guide.description);
  html = mountGuideBlock(html, renderHubGuide(hub, { models: byHub.get(hub) }), '<div id="product-mount"');
  html = hoistCatalogue(html);
  return upsertPageSchema(html, { faqs: guide.faqs, description: guide.description });
}

function hoistCatalogue(html) {
  if (html.includes('id="related-checks"')) return html;
  const guideRe = /<!-- checkedlab:guide start -->[\s\S]*?<!-- checkedlab:guide end -->/;
  const mountRe = /<div id="product-mount"[\s\S]*?\n<\/div>/;
  const guide = html.match(guideRe);
  const mount = html.match(mountRe);
  if (!guide || !mount) return html;
  const guideAt = html.indexOf(guide[0]);
  const lede = html.slice(0, guideAt).match(/<p class="lede">[\s\S]*?<\/p>\n?/);
  let next = html;
  if (lede) next = next.replace(lede[0], "");
  next = next.replace(guide[0], "");
  const related = lede
    ? '<details class="fold" id="related-checks"><summary><h2>Related checks</h2></summary><div class="fold-body">' + lede[0] + "</div></details>\n"
    : "";
  const movedMount = next.match(mountRe);
  if (!movedMount) return html;
  return next.replace(movedMount[0], movedMount[0] + "\n" + guide[0] + "\n" + related);
}

function applyHomeGuide(html) {
  const guide = hubGuides.home;
  html = setMeta(html, guide.title, guide.description);
  const block = renderHubGuide("home", { headingId: "home-guide-title" });
  if (html.includes(GUIDE_START)) html = fillMount(html, block, GUIDE_START, GUIDE_END);
  else {
    const anchor = '<section class="seasons"';
    if (!html.includes(anchor)) throw new Error("Homepage seasons section missing");
    const wrapped = '<section class="guide-band">\n<div class="wrap">\n' + GUIDE_START + "\n" + block + "\n" + GUIDE_END + "\n</div>\n</section>\n";
    html = html.replace(anchor, wrapped + anchor);
  }
  return upsertPageSchema(html, {
    faqs: guide.faqs,
    description: guide.description,
    crumbs: [{ "@type": "ListItem", position: 1, name: "Home", item: ORIGIN + "/" }]
  });
}

function pageFile(urlPath) {
  return join(root, urlPath === "/" ? "index.html" : urlPath.slice(1) + "index.html");
}

function assertModelLinks(html, product) {
  const hubHref = "/" + product.category + "/";
  if (!html.includes('href="' + hubHref + '"')) throw new Error("Hub link missing on " + product.id);
  const others = products.filter((item) => item.category === product.category && item.id !== product.id);
  const want = Math.min(4, others.length);
  const found = others.filter((item) => html.includes('href="' + card.productPath(item) + '"')).length;
  if (found < want) throw new Error(product.id + " links " + found + " siblings, expected at least " + want);
  for (const entry of compares.filter((item) => item.products.includes(product.id))) {
    if (!html.includes('href="/compare/' + entry.slug + '/"')) {
      throw new Error(product.id + " is missing compare " + entry.slug);
    }
  }
  if (!html.includes('"@type": "BreadcrumbList"')) throw new Error("BreadcrumbList missing on " + product.id);
}

function assertUniqueMeta() {
  const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
  const paths = [...sitemap.matchAll(/<loc>https:\/\/www\.checkedlab\.com([^<]*)<\/loc>/g)].map((match) => match[1]);
  const titles = new Map();
  const descriptions = new Map();
  for (const path of paths) {
    const html = readFileSync(pageFile(path), "utf8");
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
    const description = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
    if (!title) throw new Error("Missing title on " + path);
    if (!description) throw new Error("Missing description on " + path);
    if (titles.has(title)) throw new Error("Duplicate title on " + path + " and " + titles.get(title) + ": " + title);
    if (descriptions.has(description)) {
      throw new Error("Duplicate description on " + path + " and " + descriptions.get(description));
    }
    titles.set(title, path);
    descriptions.set(description, path);
    const expected = ORIGIN + path;
    if (canonical !== expected || !expected.endsWith("/")) {
      throw new Error("Canonical on " + path + " is " + canonical);
    }
  }
}

function normInternal(href) {
  if (!href || !href.startsWith("/")) return "";
  const path = href.split("#")[0].split("?")[0];
  if (!path || /\.[a-z0-9]+$/i.test(path)) return "";
  return path.endsWith("/") ? path : path + "/";
}

function excludedOrphan(path) {
  return path === "/social/" || path.startsWith("/social/");
}

function assertNoOrphans() {
  const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
  const paths = [...sitemap.matchAll(/<loc>https:\/\/www\.checkedlab\.com([^<]*)<\/loc>/g)].map((match) => match[1]).filter((path) => !excludedOrphan(path));
  const inbound = new Map(paths.map((path) => [path, 0]));
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith(".") || entry === "dist" || entry === "node_modules" || entry === "scripts" || entry === "data") continue;
      if (entry === "social" && dir === root) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".html")) files.push(full);
    }
  };
  walk(root);
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const self = ((html.match(/rel="canonical" href="https:\/\/www\.checkedlab\.com([^"]*)"/) || [])[1]) || "";
    const seen = new Set();
    for (const match of html.matchAll(/href="([^"]*)"/g)) {
      const path = normInternal(match[1]);
      if (!path || path === self || seen.has(path) || !inbound.has(path)) continue;
      seen.add(path);
      inbound.set(path, inbound.get(path) + 1);
    }
  }
  const orphans = [...inbound.entries()].filter(([, count]) => count === 0).map(([path]) => path);
  if (orphans.length) throw new Error("Orphan pages with no inbound internal link: " + orphans.join(", "));
  console.log("Orphan check: 0 orphans across " + paths.length + " sitemap URLs.");
}

function stampPages(ordered) {
  const rev = loadJson(REV_PATH, {});
  const paths = [
    ["/", join(root, "index.html")],
    ...HUBS.map((hub) => ["/" + hub + "/", join(root, hub, "index.html")]),
    ["/how-we-check/", join(root, "how-we-check", "index.html")],
    ["/bin-list/", join(root, "bin-list", "index.html")],
    ["/photo-credits/", join(root, "photo-credits", "index.html")],
    ["/recalls/", join(root, "recalls", "index.html")],
    [BF_PATH, join(root, "black-friday", "index.html")],
    ...giftPaths().map((path) => [path, join(root, path.slice(1), "index.html")]),
    ...winterPaths().map((path) => [path, join(root, path.slice(1), "index.html")]),
    ...toyPaths().map((path) => [path, join(root, path.slice(1), "index.html")]),
    ...thanksPaths().map((path) => [path, join(root, path.slice(1), "index.html")]),
    ...explainers.map((entry) => ["/recalls/" + entry.slug + "/", join(root, "recalls", entry.slug, "index.html")]),
    ["/compare/", join(root, "compare", "index.html")],
    ...compares.map((entry) => ["/compare/" + entry.slug + "/", join(root, "compare", entry.slug, "index.html")]),
    ...editorialPaths().map((path) => [path, join(root, path.slice(1), "index.html")]),
    ...bestPaths().map((path) => [path, join(root, path.slice(1), "index.html")]),
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
    "/photo-credits/",
    "/recalls/",
    BF_PATH,
    ...giftPaths(),
    ...winterPaths(),
    ...toyPaths(),
    ...thanksPaths(),
    ...explainers.map((entry) => "/recalls/" + entry.slug + "/"),
    "/compare/",
    ...compares.map((entry) => "/compare/" + entry.slug + "/"),
    ...editorialPaths(),
    ...bestPaths()
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
  if (xml.includes("/social/")) throw new Error("Sitemap lists /social/");
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

function headerValue(vercel, source, key) {
  const rule = (vercel.headers || []).find((item) => item.source === source);
  const header = rule && (rule.headers || []).find((item) => item.key.toLowerCase() === key.toLowerCase());
  return header && header.value;
}

function assertSocialAssets(dist) {
  const expected = [
    "2026-11/ig/01-sony-bose-cover.png",
    "2026-11/ig/01-sony-bose-cta.png",
    "2026-11/ig/01-sony-bose-table.png",
    "2026-11/ig/02-recall-cover.png",
    "2026-11/ig/02-recall-cta.png",
    "2026-11/ig/02-recall-steps.png",
    "2026-11/ig/03-dyson-cover.png",
    "2026-11/ig/03-dyson-cta.png",
    "2026-11/ig/03-dyson-table.png",
    "2026-11/ig/04-levoit-winix-cover.png",
    "2026-11/ig/04-levoit-winix-cta.png",
    "2026-11/ig/04-levoit-winix-table.png",
    "2026-11/ig/05-litter-cover.png",
    "2026-11/ig/05-litter-cta.png",
    "2026-11/ig/05-litter-table.png",
    "2026-11/shorts/black-friday-recall-check.mp4",
    "2026-11/shorts/dyson-v15-vs-v8.mp4",
    "2026-11/shorts/sony-xm5-vs-bose-qc-ultra.mp4"
  ].sort();
  const dir = join(root, "social");
  const found = walkFiles(dir).map((file) => file.slice(dir.length + 1).split("\\").join("/")).sort();
  if (found.join("\n") !== expected.join("\n")) {
    throw new Error("Social asset set does not match the publish list");
  }
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  for (const rel of expected) {
    const src = readFileSync(join(dir, rel));
    const out = readFileSync(join(dist, "social", rel));
    if (Buffer.compare(src, out) !== 0) throw new Error("Social asset was rewritten in dist: " + rel);
    if (rel.endsWith(".png") && !src.subarray(0, 8).equals(png)) throw new Error("Social PNG is not a PNG: " + rel);
    if (rel.endsWith(".mp4") && src.subarray(4, 8).toString("ascii") !== "ftyp") throw new Error("Social MP4 is not an MP4: " + rel);
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
  if (!statSync(join(dist, "compare", "index.html")).isFile()) throw new Error("dist is missing /compare/");
  if (!statSync(join(dist, "gifts", "index.html")).isFile()) throw new Error("dist is missing /gifts/");
  if (!statSync(join(dist, "gifts", giftGuides()[0].slug, "index.html")).isFile()) throw new Error("dist is missing a gift guide");
  if (!statSync(join(dist, "winter-safety", "index.html")).isFile()) throw new Error("dist is missing /winter-safety/");
  if (!statSync(join(dist, "winter-safety", winterGuides()[0].slug, "index.html")).isFile()) {
    throw new Error("dist is missing a winter safety guide");
  }
  if (!statSync(join(dist, "toy-safety", "index.html")).isFile()) throw new Error("dist is missing /toy-safety/");
  if (!statSync(join(dist, "toy-safety", toyGuides()[0].slug, "index.html")).isFile()) {
    throw new Error("dist is missing a toy safety guide");
  }
  if (!statSync(join(dist, "gifts", "for-kids", "index.html")).isFile()) throw new Error("dist is missing /gifts/for-kids/");
  if (!statSync(join(dist, "gifts", "for-the-host", "index.html")).isFile()) throw new Error("dist is missing /gifts/for-the-host/");
  if (!statSync(join(dist, "thanksgiving", "index.html")).isFile()) throw new Error("dist is missing /thanksgiving/");
  if (!statSync(join(dist, "thanksgiving", thanksGuides()[0].slug, "index.html")).isFile()) {
    throw new Error("dist is missing a Thanksgiving guide");
  }
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
  assertSocialAssets(dist);
}

function assertImageUse() {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith(".") || entry === "dist" || entry === "node_modules" || entry === "scripts" || entry === "data" || entry === "social") continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".html")) files.push(full);
    }
  };
  walk(root);
  const heroes = new Map();
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const counts = new Map();
    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      const src = ((match[0].match(/\bsrc="([^"]+)"/i) || [])[1] || "").split("?")[0];
      if (!src.startsWith("/images/")) continue;
      counts.set(src, (counts.get(src) || 0) + 1);
      const around = html.slice(Math.max(0, match.index - 160), match.index);
      if (/\bdata-hero\b/.test(match[0]) || /class="[^"]*(?:hero-photo|scene-photo)/.test(around)) {
        if (!heroes.has(src)) heroes.set(src, new Set());
        heroes.get(src).add(file);
      }
    }
    for (const [src, count] of counts) {
      if (count > 1) throw new Error("Image used " + count + " times on one page (" + file + "): " + src);
    }
  }
  for (const [src, pages] of heroes) {
    if (pages.size > 3) throw new Error("Hero image " + src + " is used on " + pages.size + " pages");
  }
  console.log("Image check: no page repeats a file, no hero file exceeds 3 pages.");
}

function assertFooterDisclosure(html, message) {
  const count = html.split(DISCLOSURE).length - 1;
  const footer = html.match(/<footer>[\s\S]*?<\/footer>/);
  if (count !== 1 || !footer || !footer[0].includes(DISCLOSURE)) throw new Error(message);
  if (/Affiliate disclosure\.|I earn from qualifying|earn us nothing/.test(html)) throw new Error(message);
}

function assertEveryPageDisclosure() {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith(".") || entry === "dist" || entry === "node_modules" || entry === "scripts" || entry === "data") continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".html")) files.push(full);
    }
  };
  walk(root);
  for (const file of files) {
    assertFooterDisclosure(readFileSync(file, "utf8"), "Disclosure missing on " + file.slice(root.length));
  }
}

function verifyOutput(pages) {
  assertImageUse();
  for (const hub of HUBS) {
    const html = readFileSync(join(root, hub, "index.html"), "utf8");
    const found = [...html.matchAll(/<article class="(?:product-grid hub-card|product-row)"[\s\S]*?<\/article>/g)].map((match) => match[0]);
    card.beginPage();
    const expected = byHub.get(hub).map((product, index) => card.card(product, "US", index === 0 ? { eager: true } : {}));
    if (found.length !== expected.length) throw new Error(hub + " card count " + found.length);
    expected.forEach((markup, index) => {
      if (found[index] !== markup) throw new Error(hub + " card " + index + " does not match card()");
    });
    assertFooterDisclosure(html, hub + " disclosure changed");
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
      const allowed = String(product.image || "");
      if (!/media-amazon\.com|images-amazon\.com/i.test(allowed) || !html.includes(allowed)) {
        throw new Error("Amazon image on " + product.id);
      }
    }
    const noindex = html.includes('<meta name="robots" content="noindex">');
    if (indexable(product) === noindex) throw new Error("Index flag mismatch on " + product.id);
    assertProductSeo(html, product);
  }
  const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
  if (sitemap.includes("/social/")) throw new Error("Sitemap lists /social/");
  const indexed = pages.filter(indexable);
  const locCount = (sitemap.match(/<loc>/g) || []).length;
  const giftCount = giftPaths().length;
  const winterCount = winterPaths().length;
  const toyCount = toyPaths().length;
  const thanksCount = thanksPaths().length;
  const staticCore = 7 + HUBS.length;
  const expectedLocs = staticCore + giftCount + winterCount + toyCount + thanksCount + explainers.length + compares.length + editorialPaths().length + bestPaths().length + indexed.length;
  if (locCount !== expectedLocs) {
    throw new Error("Sitemap URL count " + locCount + " expected " + expectedLocs);
  }
  if (!sitemap.includes("<loc>" + ORIGIN + "/compare/</loc>")) throw new Error("Sitemap is missing /compare/");
  for (const entry of compares) {
    if (!sitemap.includes("<loc>" + ORIGIN + "/compare/" + entry.slug + "/</loc>")) {
      throw new Error("Sitemap is missing /compare/" + entry.slug + "/");
    }
  }
  for (const path of editorialPaths()) {
    if (!sitemap.includes("<loc>" + ORIGIN + path + "</loc>")) throw new Error("Sitemap is missing " + path);
  }
  for (const path of bestPaths()) {
    if (!sitemap.includes("<loc>" + ORIGIN + path + "</loc>")) throw new Error("Sitemap is missing " + path);
  }
  for (const entry of explainers) {
    if (!sitemap.includes("<loc>" + ORIGIN + "/recalls/" + entry.slug + "/</loc>")) {
      throw new Error("Sitemap is missing /recalls/" + entry.slug + "/");
    }
  }
  if (!sitemap.includes("<loc>" + ORIGIN + "/recalls/</loc>")) throw new Error("Sitemap is missing /recalls/");
  if (!sitemap.includes("<loc>" + ORIGIN + BF_PATH + "</loc>")) throw new Error("Sitemap is missing /black-friday/");
  for (const path of giftPaths()) {
    if (!sitemap.includes("<loc>" + ORIGIN + path + "</loc>")) throw new Error("Sitemap is missing " + path);
  }
  for (const path of winterPaths()) {
    if (!sitemap.includes("<loc>" + ORIGIN + path + "</loc>")) throw new Error("Sitemap is missing " + path);
  }
  for (const path of toyPaths()) {
    if (!sitemap.includes("<loc>" + ORIGIN + path + "</loc>")) throw new Error("Sitemap is missing " + path);
  }
  for (const path of thanksPaths()) {
    if (!sitemap.includes("<loc>" + ORIGIN + path + "</loc>")) throw new Error("Sitemap is missing " + path);
  }
  for (const loc of sitemap.match(/<loc>[^<]+<\/loc>/g) || []) {
    if (!loc.includes(ORIGIN + "/") || !loc.endsWith("/</loc>")) throw new Error("Sitemap URL is not canonical: " + loc);
  }
  for (const product of pages) {
    const loc = ORIGIN + card.productPath(product);
    if (indexable(product) !== sitemap.includes("<loc>" + loc + "</loc>")) {
      throw new Error("Sitemap listing mismatch on " + product.id);
    }
    const page = readFileSync(join(root, product.category, product.id, "index.html"), "utf8");
    if (!page.includes('<a href="/recalls/">Recall checks</a>')) {
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
  if (!home.includes('href="/gifts/"')) throw new Error("Homepage is missing the gift guides link");
  if (!home.includes('href="/winter-safety/"')) throw new Error("Homepage is missing the winter safety link");
  if (!home.includes('href="/toy-safety/"')) throw new Error("Homepage is missing the toy safety link");
  if (!home.includes('href="/thanksgiving/"')) throw new Error("Homepage is missing the Thanksgiving link");
  assertGiftPages();
  assertWinterPages();
  assertToyPages();
  assertThanksgivingPages();
  if (!recallPage.includes('href="/black-friday/"')) throw new Error("Recall page is missing the Black Friday link");
  if (!recallPage.includes('href="/winter-safety/"')) throw new Error("Recall page is missing the winter safety link");
  if (!recallPage.includes('href="/toy-safety/"')) throw new Error("Recall page is missing the toy safety link");
  if (!recallPage.includes('href="/thanksgiving/"')) throw new Error("Recall page is missing the Thanksgiving link");
  if (!readFileSync(join(root, "winter", "index.html"), "utf8").includes('href="/winter-safety/"')) {
    throw new Error("Winter hub is missing the winter safety link");
  }
  assertBlackFriday(readFileSync(join(root, "black-friday", "index.html"), "utf8"));
  if (!home.includes('fetchpriority="low"')) throw new Error("Font preload is still high priority");
  const robots = readFileSync(join(root, "robots.txt"), "utf8");
  if (!robots.includes("Sitemap: https://www.checkedlab.com/sitemap.xml")) throw new Error("robots.txt lost the sitemap");
  if (/disallow:\s*\/assets/i.test(robots)) throw new Error("robots.txt blocks assets");
  if (/disallow:\s*\/social/i.test(robots)) throw new Error("robots.txt blocks /social/");
  const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
  const pets = (vercel.redirects || []).find((rule) => rule.source === "/pets" && rule.destination === "/pet/" && rule.permanent === true);
  if (!pets) throw new Error("The /pets redirect changed");
  if (headerValue(vercel, "/social/(.*)", "X-Robots-Tag") !== "noindex") {
    throw new Error("Social assets are missing X-Robots-Tag: noindex");
  }
  if (headerValue(vercel, "/social/(.*).png", "Content-Type") !== "image/png") {
    throw new Error("PNG social assets are not served as image/png");
  }
  if (headerValue(vercel, "/social/(.*).mp4", "Content-Type") !== "video/mp4") {
    throw new Error("MP4 social assets are not served as video/mp4");
  }
  const feed = readFileSync(join(root, "recalls", "feed.xml"), "utf8");
  const log = JSON.parse(readFileSync(FEED_LOG_PATH, "utf8"));
  if ((feed.match(/<item>/g) || []).length !== log.items.length) throw new Error("Feed item count drifted");
  if (Object.keys(log.signatures).length !== pages.length) throw new Error("Feed is not tracking every catalogue model");
  if (/google\.com\/ping/i.test(readFileSync(join(root, "scripts", "indexnow.mjs"), "utf8"))) {
    throw new Error("IndexNow script calls the Google sitemap ping");
  }
  for (const hub of HUBS) {
    const html = readFileSync(join(root, hub, "index.html"), "utf8");
    if (!html.includes('<a href="/recalls/">Recall checks</a>')) {
      throw new Error("Recall checks link missing on " + hub);
    }
    if (!html.includes('class="guide"') || !html.includes('class="crumbs"')) {
      throw new Error("Hub guide or breadcrumbs missing on " + hub);
    }
    if (!html.includes('"@type": "FAQPage"')) throw new Error("Hub FAQPage missing on " + hub);
    for (const product of byHub.get(hub)) {
      if (!html.includes('href="' + card.productPath(product) + '"')) {
        throw new Error(hub + " does not link to " + product.id);
      }
    }
  }
  for (const product of pages) {
    assertModelLinks(readFileSync(join(root, product.category, product.id, "index.html"), "utf8"), product);
  }
  const homeGuide = readFileSync(join(root, "index.html"), "utf8");
  if (!homeGuide.includes('id="home-guide-title"') || !homeGuide.includes('"@type": "FAQPage"')) {
    throw new Error("Homepage guide or FAQPage missing");
  }
  if (!homeGuide.includes('"@type": "BreadcrumbList"')) throw new Error("Homepage BreadcrumbList missing");
  const compareHub = readFileSync(join(root, "compare", "index.html"), "utf8");
  if (!compareHub.includes('"@type": "FAQPage"') || !compareHub.includes("Quick picks by need")) {
    throw new Error("Compare hub guide missing");
  }
  assertUniqueMeta();
  assertNoOrphans();
  assertBestPages();
  assertEveryPageDisclosure();
}

function assertProductSeo(html, product) {
  const title = pageTitle(product);
  if (!html.includes("<title>" + card.esc(title) + "</title>")) throw new Error("Title template on " + product.id);
  assertFooterDisclosure(html, "Disclosure missing on " + product.id);
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
