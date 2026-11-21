import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, statSync, cpSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const card = require(join(root, "assets/card.js"));

const ORIGIN = "https://www.checkedlab.com";
const START = "<!-- checkedlab:cards start -->";
const END = "<!-- checkedlab:cards end -->";
const DISCLOSURE = '<p class="foot-disclosure">As an Amazon Associate, Checked Lab earns from qualifying purchases.</p>';
const FOOTER = `<footer class="site-footer">
<div class="wrap">
<div class="foot-grid">
<div class="foot-brand-block"><strong class="foot-brand">Checked Lab</strong><span class="foot-tag">We buy. We test. We bin the BS.</span></div>
<nav class="foot-links" aria-label="Footer">
<a href="/recalls/">Recall checks</a><a href="/best/">Best guides</a><a href="/kitchen/">Kitchen</a><a href="/air-water/">Air &amp; water</a><a href="/personal-tech/">Personal tech</a><a href="/how-we-check/">How we check</a><a href="/bin-list/">BIN list</a><a href="/photo-credits/">Photo credits</a><a href="/gifts/">Gift guides</a><a href="/compare/">Spec comparisons</a><a href="/black-friday/">Black Friday</a><a href="/thanksgiving/">Thanksgiving</a><a href="/toy-safety/">Toy safety</a><a href="/winter-safety/">Winter safety</a><a href="mailto:hello@checkedlab.com">hello@</a>
</nav>
</div>
${DISCLOSURE}
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
const THANKS_HOSTS = new Set(["fsis.usda.gov", "usda.gov", "foodsafety.gov", "nfpa.org", "usfa.fema.gov"]);
const ANSWER_HOSTS = new Set(["cpsc.gov", "recalls-rappels.canada.ca", "anker.com"]);
const CITE_HOSTS = new Set([
  ...TOY_HOSTS,
  ...THANKS_HOSTS,
  "ecfr.gov",
  "federalregister.gov",
  "data.energizer.com",
  "duracell.com"
]);
const CPSC_SEARCH = "https://www.cpsc.gov/Recalls";
const HC_SEARCH = "https://recalls-rappels.canada.ca/en";
const WINTER_CHECK = "How we check describes the dated CPSC and Health Canada match on a catalogue card. The date is the day that match was recorded. These guides add the label lines to read and the official search to open, including for a model that is not on a card. A clear line on one card does not cover a different model number.";
/* "Star-Elite" is the Sunbeam recall distributor in a CPSC URL, not a star rating. */
const GIFT_BAN = /\$\d|\bwe tested\b|\btested by us\b|\bwe bought\b|\bdoes not test\b|\bdid not test\b|\bnot tested\b|hands-on|lab-tested|lab tested|out of 5|star rating|review count|\bdiscount\b|\bstars?\b(?!-Elite)|\d+\s*%\s*off\b/i;
/* A digit before %20 or %2C is a search URL, not a discount. A real percent is 20% or 20 %. */
const PERCENT_CLAIM = /\d+\s*%(?![0-9A-Fa-f]{2})/;
const BF_TITLE = "Black Friday and Cyber Monday 2026: what to check";
const BF_H1 = "What to know before Black Friday and Cyber Monday 2026";
const BF_DESC = "Before Black Friday or Cyber Monday 2026, confirm the model number and read the dated CPSC or Health Canada check.";
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
const FONT_PRELOAD = '<link rel="preload" href="/assets/fonts/source-sans-3-latin.woff2" as="font" type="font/woff2" crossorigin fetchpriority="low">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&amp;family=Inter:wght@400;500;600;700&amp;family=Newsreader:opsz,wght@6..72,500;6..72,600&amp;display=swap">';
const HOME_START = "<!-- checkedlab:recall-home start -->";
const HOME_END = "<!-- checkedlab:recall-home end -->";
const HOME_BF_START = "<!-- checkedlab:bf-home start -->";
const HOME_BF_END = "<!-- checkedlab:bf-home end -->";
/* Models that already have a Black Friday model page or a compare page. Who-lines are rewritten from each product's pick and specs. */
const BF_SHORTLIST = [
  { id: "instant-pot-duo-plus", who: "A 6-quart cooker that pressure cooks, slow cooks, and has a rice setting." },
  { id: "kitchenaid-artisan", who: "A tilt-head stand mixer with 10 speeds and a 5-quart bowl." },
  { id: "ninja-creami-nc301", who: "Seven ice cream programs, with two 16 oz pints in the box." },
  { id: "sony-wh-1000xm5", who: "Over-ear noise cancelling, with up to 30 hours of playback." },
  { id: "airpods-pro-3", who: "Earbuds with noise cancelling, a Hearing Aid feature, and an IP57 rating." },
  { id: "coway-ap-1512hh", who: "A purifier rated for 361 square feet at 4.8 air changes an hour." },
  { id: "dyson-v15-detect", who: "A cordless vacuum with whole-machine HEPA filtration and up to 60 minutes of run time." },
  { id: "litter-robot-4", who: "Up to 4 cats, and up to 8 days between drawer empties for one cat." }
];
const HOME_BF = [
  { id: "instant-pot-duo-plus", who: "Pressure, slow cook, and rice in one 6-quart pot." },
  { id: "sony-wh-1000xm5", who: "Up to 30 hours with noise cancelling on." },
  { id: "coway-ap-1512hh", who: "Room coverage of 361 square feet at 4.8 air changes an hour." }
];
const REPLACE_LINKS = {
  "lasko-heaters": {
    text: "The notices name older Lasko heaters, including 5540, 5500, and 5700. CT32150 and CT14401 are not in those lists. CT32150 is the tall tower with a tip-over switch. CT14401 is 14 inches tall.",
    links: [
      ["/best/heaters/", "Heaters"],
      ["/compare/lasko-ct32150-vs-ct14401/", "CT32150 and CT14401"],
      ["/winter-safety/space-heaters/", "Space heaters"]
    ]
  },
  "anker-power-banks": {
    text: "The notices name specific banks, including A1263, A1642, A1647, and A1652. A1289, the 737 PowerCore 24K, is not one of those numbers. It is a 24,000 mAh bank with up to 140 W from USB-C. A portable power station is a different product.",
    links: [
      ["/personal-tech/anker-a1289/", "Anker 737 PowerCore 24K"],
      ["/winter-safety/portable-power/", "Portable power stations"],
      ["/personal-tech/", "Personal tech"]
    ]
  },
  "instant-pot-official-notices": {
    text: "Duo Plus is not a model name in the 2015 or 2018 notices. The Duo Plus page is the 6-quart cooker. The comparison next to it is the Foodi 10-in-1 oven.",
    links: [
      ["/kitchen/instant-pot-duo-plus/", "Instant Pot Duo Plus"],
      ["/compare/instant-pot-duo-plus-vs-ninja-foodi-10in1/", "Duo Plus and Foodi 10-in-1"],
      ["/kitchen/", "Kitchen"]
    ]
  },
  "cosori-air-fryer-2023": {
    heading: "Replacement options",
    text: "Cosori's remedy comes first. The CPSC notice says to stop using a listed fryer and register for a free replacement air fryer or another Cosori product. That registration asks for photos of the unit with the cord cut, and no receipt is needed. The Health Canada notice says to stop using it and request a replacement unit at the Cosori recall page or 1-888-216-5974. The Pro II card is the CS358-AF series, which is not in either model list, and its capacity line is 5.8 quarts. The comparison beside it is the Crispi, which cooks in glass containers.",
    links: [
      ["/best/air-fryers/", "Air fryers"],
      ["/kitchen/cosori-pro-5-8/", "COSORI Pro II"],
      ["/compare/ninja-crispi-fn101-vs-cosori-pro-5-8/", "Crispi and Pro II"]
    ]
  },
  "ninja-foodi-op300": {
    text: "The notices name OP300-series cookers, including OP301 and OP302. The two Ninja cards here are different strings: DT201C, the 10-in-1 oven, and FN101, the Crispi, which cooks in glass containers. Neither string is in those notices.",
    links: [
      ["/best/air-fryers/", "Air fryers"],
      ["/kitchen/ninja-crispi-fn101/", "Ninja Crispi"],
      ["/compare/instant-pot-duo-plus-vs-ninja-foodi-10in1/", "Duo Plus and Foodi 10-in-1"]
    ]
  },
  "toro-power-clear-snowblowers": {
    text: "Model 38753 is not in the Power Clear lists. The Power Clear 721 E page is that model. The comparison beside it is the EGO snow blower.",
    links: [
      ["/winter/toro-power-clear-38753/", "Toro Power Clear 721 E"],
      ["/compare/ego-snt2110-vs-toro-power-clear-38753/", "EGO and Toro"],
      ["/winter/", "Winter"]
    ]
  },
  "heated-blanket-recalls": {
    text: "Match the model on the wash label before you retire a blanket. The Sunbeam queen-size notice names 32810027. The Sunbeam throw on the winter pages is TSL8WS, a different model.",
    links: [
      ["/winter-safety/electric-blankets/", "Electric blankets"],
      ["/winter/", "Winter"],
      ["/winter/sunbeam-tsl8ws/", "Sunbeam LoftTec throw"]
    ]
  }
};
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
/* /social/ text and captions use COPY_BAN plus the phrases a shopper post must not use. */
const SOCIAL_PHRASE_BAN = "not a verdict|catalogue check|stay(?:s)? off (?:this|the) table|has not been recorded|\\bcatalogue\\b|\\bmaker lines\\b|\\bverdict\\b|\\bcell\\b|side by side, not a verdict|read the source lines yourself|read the cadr lines carefully|same brand, different lines|same job, different lines|each cell is copied|maker specs|these are maker page lines|#makerspecs|recall lines use the \\d{4}-\\d{2}-\\d{2} \\\\(utc\\\\) cpsc and health canada catalogue check";
const SOCIAL_COPY_BAN = new RegExp(COPY_BAN.source + "|" + SOCIAL_PHRASE_BAN, "i");
/* Site HTML uses the same slide phrases. "maker specs" in a sentence stays, because gift and hub lines already say it. The all-caps eyebrow does not. */
const SITE_ROBOTIC_BAN = /side by side, not a verdict|read the source lines yourself|read the cadr lines carefully|same brand, different lines|same job, different lines|catalogue check|stay(?:s)? off (?:this|the) table|each cell is copied|these are maker page lines|recall lines use the \d{4}-\d{2}-\d{2} \(utc\) cpsc and health canada catalogue check/i;
/* The six long model-vs-model pages. Older pages still use some of these words. */
const LONG_COMPARE_SLUGS = [
  "dyson-v8-vs-dyson-v10",
  "sony-wh-1000xm5-vs-xm6",
  "kitchenaid-artisan-vs-classic",
  "allclad-d3-vs-d5",
  "zojirushi-vs-tiger-rice-cooker",
  "mr-heater-buddy-vs-big-buddy",
  "roborock-qrevo-vs-roborock-qrevo-s"
];
const LONG_COMPARE_BAN = /a figure only one maker prints|those sentences are the catalogue match|recall check has not been recorded|\bnot a verdict\b|stays? off (?:this|the) table|\bmaker specs\b|\bcatalogue\b|\bunit not named\b/i;
const SITE_EYEBROW_BAN = /MAKER SPECS/;
const READER_VOICE_BAN = /worth matching|in this catalogue|in this catalog|check the model|to match on|on a listing/i;
const READER_WORDING_BAN = /\bworth matching\b|Pick it for:|The maker lines|\bmaker lines\b/i;
const VOICE_PAGES = new Set([
  "alternatives/irobot-roomba-combo-j9-plus",
  "alternatives/sony-wh-1000xm5",
  "worth-it/zojirushi-ns-zcc10",
  "worth-it/breville-bes870xl",
  "recalls/air-fryer-recalls",
  "recalls/space-heater-recalls",
  "black-friday/ninja-creami",
  "black-friday/airpods-pro-3",
  "black-friday/levoit-air-purifiers"
]);
function assertReaderVoice(text, where) {
  const found = String(text || "").match(READER_VOICE_BAN);
  if (found) throw new Error("Reader voice ban on " + where + ": " + found[0]);
}

function assertHeadline(title, description, where, limit) {
  assertReaderVoice(title, where + " title");
  assertReaderVoice(description, where + " description");
  assertReaderVoice(String(description || "").split(/(?<=\.)\s/)[0], where + " intro");
  if (limit && String(title).length > 60) {
    throw new Error("Title is " + String(title).length + " characters on " + where + ": " + title);
  }
}

function buyerReason(id) {
  const product = products.find((item) => item.id === id);
  return product && product.pick ? product.pick : "";
}

function pickParagraph(product) {
  const line = card.pickLine(product);
  return line ? '<p class="pick-if">' + card.esc(line) + "</p>" : "";
}

function factNumbers(product) {
  const parts = [product.title, product.model, product.meta, product.searchQuery];
  for (const spec of product.specs || []) parts.push(spec && spec.label, spec && spec.value);
  for (const item of product.evidence || []) parts.push(item && item.claim);
  const values = new Set();
  const text = parts.filter(Boolean).join("\n").replace(/,/g, "");
  for (const match of text.matchAll(/\d+(?:\.\d+)?/g)) values.add(Number(match[0]));
  return values;
}

function assertPickLine(product) {
  if (product.pick == null || product.pick === "") return;
  const line = String(product.pick);
  if (!/^Pick it if you want [\s\S]+\.$/.test(line)) throw new Error("Pick line shape on " + product.id);
  if (line.length > 180) throw new Error("Pick line is long on " + product.id + ": " + line.length);
  if (COPY_BAN.test(line) || READER_WORDING_BAN.test(line)) throw new Error("Pick line banned wording on " + product.id);
  const known = factNumbers(product);
  for (const match of line.replace(/,/g, "").matchAll(/\d+(?:\.\d+)?/g)) {
    const value = Number(match[0]);
    if (![...known].some((item) => item === value)) {
      throw new Error("Pick line number " + match[0] + " is not in the maker facts on " + product.id);
    }
  }
}

function metaContents(html, key) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const out = [];
  for (const tag of tags) {
    const name = (tag.match(/\b(?:name|property)="([^"]+)"/i) || [])[1] || "";
    if (name.toLowerCase() !== key) continue;
    out.push((tag.match(/\bcontent="([^"]*)"/i) || [])[1] || "");
  }
  return out;
}

function assertPageVoice(html, where) {
  const fields = [
    [(html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "", "title"]
  ];
  for (const match of html.matchAll(/<h1[^>]*>([^<]*)<\/h1>/gi)) fields.push([match[1], "h1"]);
  for (const match of html.matchAll(/<p class="sub">([^<]*)<\/p>/gi)) fields.push([match[1], "intro"]);
  for (const description of metaContents(html, "description").concat(metaContents(html, "og:description"))) {
    fields.push([description, "description"]);
  }
  for (const [text, label] of fields) assertReaderVoice(text, where + " " + label);
}

function assertAllPageVoice() {
  const skip = new Set(["dist", "node_modules", ".git", "scripts", "data", "social"]);
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (skip.has(entry)) continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".html")) files.push(full);
    }
  };
  walk(root);
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const where = file.slice(root.length);
    assertPageVoice(html, where);
    const banned = html.match(READER_WORDING_BAN);
    if (banned) throw new Error("Reader wording ban on " + where + ": " + banned[0]);
    const robotic = html.match(SITE_ROBOTIC_BAN) || html.match(SITE_EYEBROW_BAN);
    if (robotic) {
      const at = Math.max(0, robotic.index - 40);
      const snippet = html.slice(at, robotic.index + robotic[0].length + 40).replace(/\s+/g, " ").trim();
      throw new Error("Robotic phrase ban on " + where + ": " + robotic[0] + " near “" + snippet + "”");
    }
    if (LONG_COMPARE_SLUGS.some((slug) => where.includes("/compare/" + slug + "/"))) {
      const shopper = html.match(LONG_COMPARE_BAN);
      if (shopper) {
        const at = Math.max(0, shopper.index - 40);
        const snippet = html.slice(at, shopper.index + shopper[0].length + 40).replace(/\s+/g, " ").trim();
        throw new Error("Compare phrase ban on " + where + ": " + shopper[0] + " near “" + snippet + "”");
      }
    }
  }
}

const HUB_TEXT_BAN = [
  ["maker lines", /maker lines/i],
  ["maker page", /maker page/i],
  ["page states", /page states/i],
  ["you are matching", /you are matching/i],
  ["catalogue", /catalogue/i],
  [" recall match", / recall match(?![a-z])/i],
  ["?.", /\?\./]
];

function readerFacingText(html) {
  return String(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:amp|#38);/gi, "&")
    .replace(/&(?:#39|apos);/gi, "'")
    .replace(/&(?:#34|quot);/gi, '"')
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/\s+/g, " ");
}

function assertHubReaderText() {
  const files = [
    "index.html",
    "alternatives/index.html",
    "worth-it/index.html",
    "compare/index.html",
    "recalls/index.html",
    "black-friday/index.html",
    "gifts/index.html",
    "best/index.html"
  ].concat(HUBS.map((hub) => hub + "/index.html"));
  for (const rel of files) {
    const text = readerFacingText(readFileSync(join(root, rel), "utf8"));
    for (const [label, re] of HUB_TEXT_BAN) {
      const found = text.match(re);
      if (!found) continue;
      const at = Math.max(0, found.index - 48);
      const snippet = text.slice(at, found.index + found[0].length + 48).replace(/\s+/g, " ").trim();
      throw new Error("Reader voice ban on " + rel + ": " + label + " near “" + snippet + "”");
    }
  }
}

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
  if (html.includes(REC_START)) {
    html = fillMount(html, recallsOnHome.length ? recallsOnHome.map((product) => card.card(product, "US")).join("\n") : '<p class="empty">No official model recall is on the list.</p>', REC_START, REC_END);
  }
  html = fillHomePointer(html, recalls.checkedAt || "");
  html = fillMount(html, homeBlackFridayModule(), HOME_BF_START, HOME_BF_END);
  html = html.replace(/<section class="hub-tiles"[\s\S]*?<\/section>\n?/g, "");
  html = ensureScene(html);
  if (!html.includes('id="is-it-recalled-search"')) {
    html = html.replace('<section class="recall-band"', recallWidget() + "\n" + giftQuiz() + '\n<section class="recall-band"');
  }
  html = ensureChrome(ensureFontPreload(ensureCardScript(html)), "home");
  html = applyHomeGuide(html);
  html = reshapeHome(html);
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
renderSocialAssets();
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
    assertPickLine(product);
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
  for (const bit of ['data-category="kitchen"', "badge-bin", "BIN · Recalled", "Check on Amazon"]) {
    if (!bin.includes(bit)) throw new Error("BIN card missing " + bit);
  }
  if (!bin.includes("checkedlab01-20")) throw new Error("Hub card is missing the US Amazon tag");
  if (bin.includes("check-title") || bin.includes("evidence") || /\$\d/.test(bin)) {
    throw new Error("Hub card includes a product-page block");
  }
  if (!/\bspec-tile\b/.test(bin) || !/\bspec-model\b/.test(bin)) {
    throw new Error("Hub card is missing the spec tile");
  }
  if (bin.includes('class="pick-if"') || bin.includes("Pick it for:")) {
    throw new Error("Hub card invented a pick line");
  }
  const voiced = card.card({
    id: "example-voice",
    title: "Example voice model",
    category: "kitchen",
    pick: "Pick it if you want one machine that grinds the beans and pulls the espresso.",
    evidence: [],
    checks: ["Read the recall line on this card before you buy."],
    recall: {
      us: { status: "none", detail: "No recall matches this model.", url: "https://www.cpsc.gov/Recalls/example" }
    }
  }, "US");
  if (!voiced.includes("Pick it if you want one machine that grinds the beans and pulls the espresso.") || voiced.includes("Pick it for:")) {
    throw new Error("Hub card dropped the buyer line");
  }
  if (bin.includes('class="p-photo"') || bin.includes('class="type-tile"') || bin.includes('class="illu"') || /media-amazon|images-amazon/i.test(bin)) {
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
  return '<nav class="related-links" aria-label="Related">' + links.join("") + "</nav>";
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

function productFold(id, heading, body, open) {
  return '<details class="fold"' + (open ? " open" : "") + ' id="' + id + '"><summary><span class="fold-caret" aria-hidden="true">▸</span><h2>' + heading + '</h2><span class="fold-state"></span></summary><div class="fold-body">' + body + "</div></details>";
}

function heroSpecStrip(product) {
  const specs = (product.specs || []).filter((spec) => spec && spec.label && spec.value && !/^(model|asin|sku|item)$/i.test(String(spec.label).trim())).slice(0, 4);
  if (!specs.length) return "";
  return '<div class="spec-strip hero-specs">' + specs.map((spec) =>
    '<div class="spec-item"><strong>' + card.esc(spec.label) + "</strong><span>" + card.esc(spec.value) + "</span></div>"
  ).join("") + "</div>";
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
  const pickHtml = pickParagraph(product);
  const media = card.visual(product, { eager: true, hero: true });
  const titleHtml = '<h1 class="p-title">' + card.visibleTitle(product.title) + "</h1>";
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
${card.badgeHtml(card.worstRecall(product))}
${titleHtml}
${pickHtml}
${heroSpecStrip(product)}
<div class="only-us">${card.amazonButton(product, "US")}</div>
<div class="only-ca">${card.amazonButton(product, "CA")}</div>
</div>
</div>
</article>
<nav class="toc" aria-label="Jump to"><p>Jump to</p><a href="#is-it-recalled">Recall check</a><a href="#specs">Specs</a><a href="#stores">Stores</a><a href="#why-listed">Why it’s listed</a><a href="#questions">Questions</a></nav>
<details class="fold" open><summary><span class="fold-caret" aria-hidden="true">▸</span><h2 class="recall-q" id="is-it-recalled">Is the ${card.esc(product.title)} recalled?</h2><span class="fold-state"></span></summary><div class="fold-body">${datedParagraph(us, "US")}${datedParagraph(ca, "Canadian")}${otherSection(product)}${modelFindHtml(product)}</div></details>
${productFold("specs", "Specs", specList(product) + card.evidenceList(product) + '<p class="price-note">Prices change often, check the current price at the store.</p><p class="affiliate-note">Amazon link is an affiliate link</p>', true)}
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

function checkedLabel(date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const parts = String(date || "").split("-");
  if (parts.length !== 3 || months[Number(parts[1]) - 1] == null) return "CPSC & Health Canada checked";
  return "CPSC & Health Canada checked · " + months[Number(parts[1]) - 1] + " " + Number(parts[2]) + ", " + parts[0];
}

function mastheadHtml(current) {
  const mark = (key) => current === key ? ' class="is-current" aria-current="page"' : "";
  const links = [
    ["/recalls/", "Recalls", "recalls"],
    ["/best/", "Best Guides", "best"],
    ["/kitchen/", "Kitchen", "kitchen"],
    ["/air-water/", "Air & Water", "air-water"],
    ["/personal-tech/", "Personal Tech", "personal-tech"],
    ["/how-we-check/", "How We Check", "how"]
  ];
  const stamp = '<span class="brand-stamp" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="square" stroke-linejoin="miter"><path d="M4.5 12.5L9.5 17.5L19.5 6.5"/></svg></span>';
  return '<div class="site-chrome">\n<div class="util-bar"><div class="wrap util-inner">' +
    '<div class="manifesto"><span class="manifesto-dot" aria-hidden="true"></span><span>We buy. We test. We bin the BS.</span></div>' +
    '<div class="util-meta"><span class="hide-mob">' + card.esc(checkedLabel(recalls.checkedAt)) + "</span>" +
    '<div class="region-seg country-switch" role="group" aria-label="Country">' +
    '<button type="button" data-region-set="US">US</button>' +
    '<button type="button" data-region-set="CA">CA</button></div></div></div></div>\n' +
    '<header class="site-header"><div class="wrap head-inner">' +
    '<a class="brand-lockup" href="/">' + stamp +
    '<span class="brand-words"><span class="brand-name">Checked Lab</span><span class="brand-sub">Recall &amp; Spec Desk</span></span></a>' +
    '<div class="nav-panel" id="site-nav" data-nav-panel><nav class="main-nav" aria-label="Primary">' +
    links.map(([href, label, key]) => '<a href="' + href + '"' + mark(key) + ">" + label + "</a>").join("") +
    "</nav></div>" +
    '<form class="head-search" action="/" method="get" role="search">' +
    '<label class="visually-hidden" for="site-q">Search model or brand</label>' +
    '<input id="site-q" name="q" data-model-search type="search" placeholder="Search model or brand..." autocomplete="off" enterkeyhint="search">' +
    '<button type="submit">GO</button></form>' +
    '<button class="mob-menu-btn nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="site-nav">Menu</button>' +
    "</div></header>\n</div>";
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
  const fresh = mastheadHtml(inferCurrent(html));
  const chrome = html.indexOf('<div class="site-chrome"');
  if (chrome >= 0) {
    const end = blockEnd(html, chrome);
    if (end < 0) throw new Error("Site chrome did not close");
    return html.slice(0, chrome) + fresh + html.slice(end);
  }
  const mast = html.indexOf('<div class="masthead"');
  if (mast < 0) return html;
  const end = blockEnd(html, mast);
  if (end < 0) throw new Error("Masthead did not close");
  const top = html.lastIndexOf('<div class="topbar"', mast);
  const from = top >= 0 && mast - top < 400 ? top : mast;
  return html.slice(0, from) + fresh + html.slice(end);
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
  return html.replace(/\n?<div class="dock" data-dock>[\s\S]*?<\/div>\n?/g, "\n");
}

function trustBarHtml(jump) {
  const when = checkedLabel(recalls.checkedAt).replace(/^CPSC & Health Canada checked · /, "");
  const link = jump
    ? '<a class="btn-outline trust-jump" href="' + jump + '">↓ Jump to full list</a>'
    : "";
  return '<div class="trust-bar"><div class="trust-meta"><strong>Sources: CPSC &amp; Health Canada</strong><span>Checked: ' +
    card.esc(when) + "</span></div>" + link + "</div>";
}

function ensureTrustBar(html) {
  const path = (html.match(/rel="canonical" href="https:\/\/www\.checkedlab\.com([^"]*)"/) || [])[1] || "";
  if (!/^\/(recalls|best|winter-safety|toy-safety|thanksgiving|gifts)\//.test(path)) return html;
  const start = html.indexOf('<div class="trust-bar"');
  if (start >= 0) {
    const end = blockEnd(html, start);
    if (end > start) html = html.slice(0, start) + html.slice(end);
  }
  let jump = "";
  if (html.includes('id="full-list"')) jump = "#full-list";
  else if (html.includes('id="recalls-by-brand"')) jump = "#recalls-by-brand";
  else if (html.includes('id="is-mine-affected"')) jump = "#is-mine-affected";
  else if (html.includes('id="united-states"')) jump = "#united-states";
  const bar = trustBarHtml(jump);
  const lead = /(<h1\b[^>]*>[\s\S]*?<\/h1>\s*(?:<p class="(?:sub|lede|deck)">[\s\S]*?<\/p>\s*)?)/;
  if (!lead.test(html)) return html;
  return html.replace(lead, "$1" + bar + "\n");
}

function polish(html) {
  html = installChrome(html);
  html = html.replace(/<div class="disclosure">[\s\S]*?<\/div>\s*/g, "");
  if (html.includes("<footer")) html = html.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/, FOOTER);
  html = html.replace(/name="theme-color" content="#[0-9A-Fa-f]{3,8}"/g, 'name="theme-color" content="#111315"');
  html = ensureTrustBar(html);
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
  return '<p class="recall-pointer">Recall checks are dated <time datetime="' + card.esc(date) + '">' + card.esc(date) + '</time> (UTC). <a href="/recalls/">Recall checks</a> lists every model for the United States and Canada.</p>';
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
  return '<p class="empty">No listed model is binned as of ' + card.esc(date) + ".</p>";
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
  return "<h2>BIN</h2>\n<p>These listed models match an official notice.</p>\n<ul>" + items + "</ul>";
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
  return '<section id="category-notices"><h2>Official notices in these categories</h2><p>These lines are titles, dates, and model text copied from CPSC and Health Canada notices for air fryers, space heaters, and power banks. A notice can name models that are outside this list. The link opens the official page.</p>' + blocks + "</section>";
}

function recallsDescription(date) {
  return "US and Canada recall status for every listed model, checked " + date + " (UTC). Official CPSC and Health Canada notices are linked.";
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
  if (Array.isArray(entry.faqs) && entry.faqs.length) {
    graph["@graph"].push({
      "@type": "FAQPage",
      mainEntity: entry.faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a }
      }))
    });
  }
  assertNoCommerce(graph);
  const types = graph["@graph"].map((node) => node["@type"]);
  const expected = entry.faqs && entry.faqs.length ? "BreadcrumbList,Article,FAQPage" : "BreadcrumbList,Article";
  if (types.join(",") !== expected) throw new Error("Explainer schema on " + entry.slug);
  return JSON.stringify(graph, null, 2).replace(/</g, "\\u003c");
}

function answerSpans(spans, where) {
  if (!Array.isArray(spans) || !spans.length) throw new Error("Answer copy missing: " + where);
  return spans.map((span) => {
    if (!span || typeof span.text !== "string" || span.text === "") throw new Error("Answer span missing text: " + where);
    assertReaderVoice(span.text, where);
    if (/\$\d/.test(span.text) || /we tested|we bought|does not test/i.test(span.text)) {
      throw new Error("Answer copy has a disallowed claim: " + where);
    }
    if (span.strong) return "<strong>" + card.esc(span.text) + "</strong>";
    if (!span.href) return card.esc(span.text);
    let host = "";
    try {
      host = new URL(span.href).hostname.replace(/^www\./, "");
    } catch {
      throw new Error("Answer href: " + where);
    }
    if (!ANSWER_HOSTS.has(host)) throw new Error("Answer href is not an allowed source: " + span.href);
    return '<a href="' + href(span.href) + '" target="_blank" rel="noopener">' + card.esc(span.text) + "</a>";
  }).join("");
}

function answerText(item) {
  return (item.paragraphs || []).map((spans) => spans.map((span) => span.text || "").join("")).join(" ");
}

function recallKind(text, place) {
  const blob = String(text || "");
  if (/no recall found/i.test(blob)) return "clear";
  if (/serial numbers?\b|\bdate codes?\b|tracker ranges?\b|manufactured\b.{0,80}\bthrough\b|manufactured from\b|codes \d+ to \d+/i.test(blob)) {
    return "serial";
  }
  const codes = blob.match(/\b[A-Z]{2,}[A-Z0-9]*-[A-Z0-9-]+\b/g) || [];
  const brand = String(place || "").split(/[\s+]/)[0].toUpperCase().replace(/[^A-Z]/g, "");
  const prefix = brand.slice(0, 3);
  if (codes.length && prefix.length === 3 && codes.every((code) => code.startsWith(prefix))) return "bin";
  if (/\bmodel\s+[A-Z0-9][A-Z0-9-]{2,}\b/.test(blob) && !/\bmodels\b/i.test(blob)) return "bin";
  if (codes.length) return "partial";
  if (/stop using/i.test(blob)) return "bin";
  return "partial";
}

function verdictBadge(kind) {
  if (kind === "clear") return card.badgeHtml({ status: "none" });
  if (kind === "serial") return card.badgeHtml({ kind: "serial" });
  if (kind === "partial") return card.badgeHtml({ kind: "partial" });
  return card.badgeHtml({ status: "bin" });
}

function answerModelGroup(item) {
  const ids = [];
  const seen = new Set();
  const blob = item.num + " " + answerText(item);
  for (const match of blob.matchAll(/\bA\d{4,}\b/g)) {
    if (!seen.has(match[0])) {
      seen.add(match[0]);
      ids.push(match[0]);
    }
  }
  const group = (ids.length ? ids : [item.num]).slice(0, 3).join(", ");
  return group + " serial";
}

function renderAnswerParagraph(spans, where) {
  const links = (spans || []).filter((span) => span && span.href);
  const words = (spans || []).filter((span) => span && !span.href && String(span.text || "").trim());
  if (links.length && !words.length) {
    return '<ul class="notice-chips">' + links.map((span, index) =>
      "<li>" + answerSpans([span], where + " link " + index) + "</li>"
    ).join("") + "</ul>";
  }
  return "<p>" + answerSpans(spans, where) + "</p>";
}

function chipLinks(links, where) {
  if (!links || !links.length) return "";
  return '<ul class="notice-chips">' + links.map((link) => "<li>" + officialNoticeLink(link, where) + "</li>").join("") + "</ul>";
}

function noticeKind(notice) {
  const text = [notice.product, notice.hazard, notice.remedy, notice.says, notice.howToCheck, notice.modelsLabel, ...(notice.models || [])].filter(Boolean).join(" ");
  return recallKind(text, notice.product || "");
}

function answersHtml(entry) {
  const block = entry.answers;
  if (!block) return "";
  if (!block.id || !/^[a-z0-9-]+$/.test(block.id) || !block.heading || !block.intro) {
    throw new Error("Answer block needs an id, heading, and intro: " + entry.slug);
  }
  if (!Array.isArray(block.cards) || block.cards.length < 2) throw new Error("Answer block needs cards: " + entry.slug);
  assertReaderVoice(block.heading + " " + block.intro + " " + (block.note || ""), entry.slug + " answers");
  const placeCount = new Map();
  for (const item of block.cards) placeCount.set(item.place, (placeCount.get(item.place) || 0) + 1);
  const details = [];
  const cards = block.cards.map((item, index) => {
    if (!item || !item.place || !item.num || !Array.isArray(item.paragraphs) || !item.paragraphs.length) {
      throw new Error("Answer card needs a place, a number, and paragraphs: " + entry.slug);
    }
    if (item.id && !/^[a-z0-9-]+$/.test(item.id)) throw new Error("Answer card id: " + entry.slug);
    assertReaderVoice(item.place + " " + item.num, entry.slug + " answer");
    const id = item.id ? ' id="' + item.id + '"' : "";
    const title = placeCount.get(item.place) > 1 ? answerModelGroup(item) : item.place;
    const kind = recallKind(item.num + " " + answerText(item), item.place);
    const tone = kind === "clear" ? "is-clear" : kind === "bin" ? "is-bin" : "is-warn";
    const line = renderAnswerParagraph(item.paragraphs[0], entry.slug + " answer " + index + " 0");
    if (item.paragraphs.length > 1) {
      const rest = item.paragraphs.slice(1).map((spans, paragraph) =>
        renderAnswerParagraph(spans, entry.slug + " answer " + index + " " + (paragraph + 1))
      ).join("");
      details.push("<article><h3>" + card.esc(title) + "</h3>" + rest + "</article>");
    }
    return '<article class="answer-card brand-card ' + tone + '"' + id + '><div class="brand-card-head"><h3>' + card.esc(title) +
      "</h3>" + verdictBadge(kind) + '</div><p class="answer-num">' + card.esc(item.num) + "</p>" + line + "</article>";
  }).join("");
  const note = block.note ? "<p>" + card.esc(block.note) + "</p>" : "";
  const detail = details.length
    ? '<div class="brand-detail"><h2>Detail</h2><div class="model-stack is-open">' + details.join("") + "</div></div>"
    : "";
  return '<section id="' + block.id + '"><h2>' + card.esc(block.heading) + "</h2><p>" + card.esc(block.intro) +
    '</p><div class="answer-split brand-grid">' + cards + "</div>" + detail + note + "</section>";
}

function officialNoticeLink(link, where) {
  if (!link || !/^https:\/\/(www\.cpsc\.gov|recalls-rappels\.canada\.ca)\//.test(link.url || "")) {
    throw new Error("Notice link must be a CPSC or Health Canada page: " + where);
  }
  return '<a href="' + href(link.url) + '" target="_blank" rel="noopener">' + card.esc(link.label || "Official notice") + "</a>";
}

function checkItemsHtml(entry) {
  if (!Array.isArray(entry.check) || !entry.check.length) return "";
  return entry.check.map((item) => {
    if (!item || !item.label || !item.text) throw new Error("Check block needs a label and text: " + entry.slug);
    assertReaderVoice(item.label + " " + item.text, entry.slug + " check");
    const links = Array.isArray(item.links) ? item.links : [];
    const anchors = links.length
      ? '<ul class="notice-chips">' + links.map((link) => "<li>" + officialNoticeLink(link, entry.slug) + "</li>").join("") + "</ul>"
      : "";
    return "<li><strong>" + card.esc(item.label) + ".</strong> " + card.esc(item.text) + anchors + "</li>";
  }).join("");
}

function modelTableHtml(entry) {
  const table = entry.modelTable;
  if (!table) return "";
  if (!table.heading || !table.intro || !Array.isArray(table.columns) || table.columns.length < 2) {
    throw new Error("Model table needs a heading, intro, and columns: " + entry.slug);
  }
  if (!Array.isArray(table.rows) || !table.rows.length) throw new Error("Model table needs rows: " + entry.slug);
  assertReaderVoice(table.heading + " " + table.intro + " " + (table.note || ""), entry.slug + " model table");
  const head = "<tr>" + table.columns.map((column) => "<th>" + card.esc(column) + "</th>").join("") + "</tr>";
  const body = table.rows.map((row, index) => {
    if (!row || !Array.isArray(row.cells) || row.cells.length !== table.columns.length - 1) {
      throw new Error("Model row width on " + entry.slug + " row " + index);
    }
    row.cells.forEach((cell) => assertReaderVoice(cell, entry.slug + " model row"));
    const links = chipLinks(row.links || [], entry.slug);
    if (!links) throw new Error("Model row needs a notice link: " + entry.slug);
    const cells = row.cells.map((cell) => "<td>" + card.esc(cell) + "</td>").join("");
    return "<tr>" + cells + "<td>" + links + "</td></tr>";
  }).join("");
  const stack = table.rows.map((row) => {
    const links = chipLinks(row.links || [], entry.slug);
    const facts = row.cells.slice(1).map((cell, index) =>
      "<p><strong>" + card.esc(table.columns[index + 1]) + ".</strong> " + card.esc(cell) + "</p>"
    ).join("");
    return "<article><h3>" + card.esc(row.cells[0]) + "</h3>" + facts + links + "</article>";
  }).join("");
  const note = table.note ? "<p>" + card.esc(table.note) + "</p>" : "";
  const extra = checkItemsHtml(entry);
  const more = extra ? '<details><summary>Where to look and what to do</summary><ul class="evidence">' + extra + "</ul></details>" : "";
  return '<section class="model-card" id="is-mine-affected"><h2>' + card.esc(table.heading) + "</h2><p>" +
    card.esc(table.intro) + '</p><div class="model-scroll"><table class="model-table"><thead>' + head +
    "</thead><tbody>" + body + '</tbody></table></div><div class="model-stack">' + stack + "</div>" + note + more + "</section>";
}

function listCardHtml(entry) {
  const block = entry.listCard;
  if (!block) return "";
  if (!block.id || !/^[a-z0-9-]+$/.test(block.id) || !block.heading || !block.intro) {
    throw new Error("List card needs an id, heading, and intro: " + entry.slug);
  }
  if (!Array.isArray(block.items) || block.items.length < 2) throw new Error("List card needs items: " + entry.slug);
  assertReaderVoice(block.heading + " " + block.intro + " " + (block.note || ""), entry.slug + " list");
  const items = block.items.map((item, index) => {
    if (!item || !item.name || !item.text) throw new Error("List item needs a name and text: " + entry.slug);
    assertReaderVoice(item.name + " " + item.text, entry.slug + " list " + index);
    const links = chipLinks(item.links || [], entry.slug);
    if (!links) throw new Error("List item needs a notice link: " + entry.slug);
    return "<article><h3>" + card.esc(item.name) + "</h3><p>" + card.esc(item.text) + "</p>" + links + "</article>";
  }).join("");
  const note = block.note ? "<p>" + card.esc(block.note) + "</p>" : "";
  return '<section class="model-card" id="' + block.id + '"><h2>' + card.esc(block.heading) + "</h2><p>" +
    card.esc(block.intro) + '</p><div class="model-stack is-open">' + items + "</div>" + note + "</section>";
}

function topLinkHtml(entry) {
  const link = entry.topLink;
  if (!link) return "";
  if (!link.href || !link.label || !link.text) throw new Error("Top link needs an href, label, and text: " + entry.slug);
  assertSitePath(link.href, entry.slug);
  assertReaderVoice(link.label + " " + link.text, entry.slug + " top link");
  return '<p class="lede"><a href="' + card.esc(link.href) + '">' + card.esc(link.label) + "</a>. " + card.esc(link.text) + "</p>";
}

function recallCardHtml(entry) {
  const block = entry.recallCard;
  if (!block || !block.heading || !block.intro || !Array.isArray(block.agencies) || block.agencies.length < 2) {
    throw new Error("Recall card needs a heading, intro, and agencies: " + entry.slug);
  }
  assertReaderVoice(block.heading + " " + block.intro + " " + (block.note || ""), entry.slug + " recall card");
  const agencies = block.agencies.map((agency, index) => {
    if (!agency || !agency.name || !agency.date || !agency.remedy || !Array.isArray(agency.models) || agency.models.length < 2) {
      throw new Error("Recall card agency is incomplete: " + entry.slug);
    }
    assertReaderVoice(agency.name + " " + agency.date + " " + agency.remedy, entry.slug + " recall card " + index);
    agency.models.forEach((model) => assertReaderVoice(model, entry.slug + " model"));
    const links = chipLinks(agency.links || [], entry.slug);
    if (!links) throw new Error("Recall card agency needs a notice link: " + entry.slug);
    const models = '<ul class="model-list">' + agency.models.map((model) => "<li>" + card.esc(model) + "</li>").join("") + "</ul>";
    return "<article><h3>" + card.esc(agency.name) + " · " + card.esc(agency.date) + "</h3><p>" +
      card.esc(agency.remedy) + "</p>" + models + links + "</article>";
  }).join("");
  const note = block.note ? "<p>" + card.esc(block.note) + "</p>" : "";
  const extra = checkItemsHtml(entry);
  const more = extra ? '<details><summary>Where to look and what to do</summary><ul class="evidence">' + extra + "</ul></details>" : "";
  return '<section class="model-card" id="is-mine-affected"><h2>' + card.esc(block.heading) + "</h2><p>" +
    card.esc(block.intro) + '</p><div class="model-stack is-open">' + agencies + "</div>" + note + more + "</section>";
}

function affectedHtml(entry) {
  if (entry.recallCard) return recallCardHtml(entry);
  if (entry.modelTable) return modelTableHtml(entry);
  if (!Array.isArray(entry.check) || !entry.check.length) return "";
  return '<section id="is-mine-affected"><h2>Is mine affected?</h2><ul class="evidence">' + checkItemsHtml(entry) + "</ul></section>";
}

function assertSitePath(href, where) {
  if (typeof href !== "string" || !/^\/[a-z0-9/-]+\/$/.test(href)) {
    throw new Error("Internal link must be a site path: " + href + " on " + where);
  }
  const parts = href.split("/").filter(Boolean);
  if (parts[0] === "best" && parts.length === 2 && bestTypes().some((type) => type.slug === parts[1])) return;
  if (parts[0] === "recalls" && parts.length === 2 && explainers.some((entry) => entry.slug === parts[1])) return;
  if (parts[0] === "compare" && parts.length === 2 && compares.some((entry) => entry.slug === parts[1])) return;
  if (parts[0] === "winter-safety" && parts.length === 2 && winterGuides().some((guide) => guide.slug === parts[1])) return;
  if (parts[0] === "gifts" && parts.length === 2 && giftGuides().concat(checksGuides()).some((guide) => guide.slug === parts[1])) return;
  if (parts.length === 1 && HUBS.includes(parts[0])) return;
  if (parts.length === 2 && HUBS.includes(parts[0]) && products.some((product) => product.category === parts[0] && product.id === parts[1])) return;
  throw new Error("Internal link is not a page on this site: " + href + " on " + where);
}

function assertShopperLine(product, line, where) {
  if (!line || line.length > 180) throw new Error("Shopper line on " + where);
  if (COPY_BAN.test(line) || READER_WORDING_BAN.test(line) || READER_VOICE_BAN.test(line)) {
    throw new Error("Shopper line banned wording on " + where);
  }
  if (/\$\d|\d+\s*%|\bdeal\b|\bdiscount\b|\bwe used\b|\bwe tested\b|\bwe bought\b/i.test(line)) {
    throw new Error("Shopper line has a price, a deal, or a use claim on " + where);
  }
  for (const [label, re] of HUB_TEXT_BAN) {
    if (re.test(line)) throw new Error("Shopper line hits " + label + " on " + where);
  }
  const known = factNumbers(product);
  for (const match of line.replace(/,/g, "").matchAll(/\d+(?:\.\d+)?/g)) {
    const value = Number(match[0]);
    if (![...known].some((item) => item === value)) {
      throw new Error("Shopper line number " + match[0] + " is not in the facts on " + where);
    }
  }
}

function onBfOrCompare(id) {
  const season = editorial.season.some((entry) => entry.subject === id || (entry.others || []).includes(id));
  const compare = compares.some((entry) => (entry.products || []).includes(id) || (entry.alsoFrom || []).includes(id));
  if (!season && !compare) throw new Error("Shortlist model is not on a Black Friday or compare page: " + id);
}

function amazonTextLink(product, region) {
  const button = card.amazonButton(product, region);
  const url = (button.match(/href="([^"]+)"/) || [])[1];
  if (!url) throw new Error("Amazon link missing for " + product.id);
  const host = region === "CA" ? "https://www.amazon.ca/" : "https://www.amazon.com/";
  const tag = region === "CA" ? "tag=checkedlab-20" : "tag=checkedlab01-20";
  if (!url.includes(host) || !url.includes(tag)) throw new Error("Amazon tag drifted for " + product.id + " " + region);
  const other = region === "CA" ? "checkedlab01-20" : "checkedlab-20";
  if (url.includes(other)) throw new Error("Amazon tag crossed for " + product.id + " " + region);
  return '<a href="' + url + '" target="_blank" rel="sponsored nofollow noopener">Amazon</a>';
}

function replacingHtml(entry) {
  const block = REPLACE_LINKS[entry.slug];
  if (!block) return "";
  if (!Array.isArray(entry.check) || !entry.check.length) throw new Error("Replace block needs the affected section: " + entry.slug);
  assertReaderVoice(block.text, entry.slug + " replace");
  if (COPY_BAN.test(block.text) || /\$\d|\d+\s*%|\bdeal\b|\bdiscount\b|\bwe used\b|amazon\.com|tag=checkedlab/i.test(block.text)) {
    throw new Error("Replace block has a disallowed claim: " + entry.slug);
  }
  if (!block.links || block.links.length < 2 || block.links.length > 3) {
    throw new Error("Replace block needs 2 or 3 links: " + entry.slug);
  }
  const anchors = block.links.map(([href, label]) => {
    if (!label) throw new Error("Replace link needs a label: " + entry.slug);
    assertSitePath(href, entry.slug);
    return '<a href="' + card.esc(href) + '">' + card.esc(label) + "</a>";
  }).join(" ");
  const heading = block.heading || "If you're replacing it";
  if (/[<>]/.test(heading)) throw new Error("Replace heading: " + entry.slug);
  return '<section class="replacing" id="if-youre-replacing-it"><h2>' + heading + "</h2><p>" +
    card.esc(block.text) + '</p><p class="lede">' + anchors + "</p></section>";
}

function blackFridayShortlist() {
  if (BF_SHORTLIST.length < 6 || BF_SHORTLIST.length > 8) throw new Error("Black Friday shortlist count");
  const seen = new Set();
  const lines = new Set();
  const items = BF_SHORTLIST.map((item) => {
    if (seen.has(item.id)) throw new Error("Duplicate shortlist id " + item.id);
    seen.add(item.id);
    if (lines.has(item.who)) throw new Error("Repeated shortlist line: " + item.id);
    lines.add(item.who);
    onBfOrCompare(item.id);
    const product = products.find((entry) => entry.id === item.id);
    if (!product) throw new Error("Shortlist model missing: " + item.id);
    assertShopperLine(product, item.who, item.id);
    return '<li id="short-' + card.esc(product.id) + '"><p class="bf-short-name"><a href="' + card.productPath(product) + '">' +
      card.visibleTitle(product.title) + "</a></p><p class=\"bf-short-who\">" + card.esc(item.who) + "</p>" +
      '<div class="only-us">' + card.amazonButton(product, "US") + "</div>" +
      '<div class="only-ca">' + card.amazonButton(product, "CA") + "</div></li>";
  }).join("");
  return '<section class="bf-short" id="worth-checking"><h2>Worth checking this Black Friday</h2>' +
    "<p>Picks that already have a page here. Each line says who it is for. Specs and the dated recall check are on the model page.</p>" +
    '<ol class="bf-short-list">' + items + "</ol></section>";
}

function homeBlackFridayModule() {
  const ids = new Set(BF_SHORTLIST.map((item) => item.id));
  const used = new Set(BF_SHORTLIST.map((item) => item.who));
  if (HOME_BF.length !== 3) throw new Error("Home Black Friday module needs 3 picks");
  const items = HOME_BF.map((item) => {
    if (!ids.has(item.id)) throw new Error("Home pick is not on the Black Friday shortlist: " + item.id);
    if (used.has(item.who)) throw new Error("Home line repeats the shortlist: " + item.id);
    const product = products.find((entry) => entry.id === item.id);
    if (!product) throw new Error("Home pick missing: " + item.id);
    assertShopperLine(product, item.who, "home " + item.id);
    return "<li><p class=\"home-bf-line\"><a href=\"" + card.productPath(product) + "\">" + card.visibleTitle(product.title) +
      '</a><span class="only-us"> · ' + amazonTextLink(product, "US") + '</span><span class="only-ca"> · ' +
      amazonTextLink(product, "CA") + "</span></p><p class=\"home-bf-who\">" + card.esc(item.who) + "</p></li>";
  }).join("");
  return '<ul class="home-bf-list">' + items + '</ul><p class="home-bf-more"><a href="/black-friday/#worth-checking">The full Black Friday list</a></p>';
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
  const voice = VOICE_PAGES.has("recalls/" + entry.slug);
  const cards = entry.products.map((id, index) => {
    const product = products.find((item) => item.id === id);
    if (!product) throw new Error("Explainer is missing catalogue id " + id);
    const opts = index === 0 ? { eager: true } : {};
    if (entry.tiles) opts.tileUnlessExact = true;
    if (voice) opts.pick = buyerReason(product.id);
    return card.card(product, "US", opts);
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

function shown(text) {
  return card.esc(card.displayMeasure(text));
}

function specCell(spec) {
  return shown(spec.value) + ' <a href="' + card.esc(spec.url) + '" target="_blank" rel="noopener">Source</a>';
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
    const clause = String(card.pickLine(product) || "").replace(/^Pick it if you want\s+/i, "").replace(/\.$/, "");
    return clause ? "you want " + clause + "." : "the published specs are the ones to weigh.";
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
  const omit = new Set(entry.omitSpecs || []);
  const specs = [...(base.specs || []).filter((spec) => spec && !addLabels.has(spec.label)), ...adds]
    .filter((spec) => spec && spec.label && !omit.has(spec.label));
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
    return '<article class="pick-box"><h2>' + shown(item.heading) + "</h2><ul>" +
      item.bullets.map((bullet) => "<li>" + shown(bullet) + "</li>").join("") +
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
      "<li>" + card.esc(spec.label) + ": " + shown(spec.value) +
      ' <a href="' + card.esc(spec.url) + '" target="_blank" rel="noopener">Source</a></li>'
    ).join("");
    return "<h3>" + card.esc(shortPickName(product)) + "</h3><ul>" + items + "</ul>";
  }).join("");
}

function compareLead(entry) {
  if (!Array.isArray(entry.answer) || !entry.answer.length) {
    return '<p class="sub">' + card.esc(entry.description.split(/(?<=\.)\s/)[0]) + "</p>";
  }
  if (entry.answer.length < 2 || entry.answer.length > 3) {
    throw new Error("Short answer needs two or three sentences: " + entry.slug);
  }
  return '<p class="answer">' + entry.answer.map((sentence) => shown(sentence)).join(" ") + "</p>";
}

function changedCard(entry) {
  const items = entry.changed;
  if (!items) return "";
  if (!Array.isArray(items) || items.length < 3 || items.length > 5) {
    throw new Error("What changed needs 3 to 5 bullets: " + entry.slug);
  }
  return '<article class="answer-card" id="what-changed"><h2>What changed</h2><ul>' +
    items.map((bullet) => "<li>" + shown(bullet) + "</li>").join("") +
    "</ul></article>\n";
}

function compareFaqs(entry) {
  const faqs = entry.faqs || [];
  if (!faqs.length) return "";
  if (faqs.length < 4 || faqs.length > 6) throw new Error("Compare FAQs must be 4 to 6: " + entry.slug);
  for (const item of faqs) {
    if (!item.q || !item.a) throw new Error("FAQ missing text: " + entry.slug);
  }
  if (entry.faqLabel) {
    const items = faqs.map((item) =>
      '<details class="fold"><summary><h3>' + shown(item.q) + "</h3></summary><div class=\"fold-body\"><p>" +
      shown(item.a) + "</p></div></details>"
    ).join("");
    return '<section class="faq" id="questions"><h2>' + card.esc(entry.faqLabel) + "</h2>" + items + "</section>";
  }
  const body = faqs.map((item) => "<h3>" + shown(item.q) + "</h3><p>" + shown(item.a) + "</p>").join("");
  return productFold("questions", "Questions", body);
}

function compareSources(pair, entry) {
  if (!entry.answer && !entry.changed) return "";
  const seen = new Set();
  const items = [];
  const add = (url, label) => {
    if (!url || seen.has(url)) return;
    if (!/^https:\/\//.test(url)) throw new Error("Source is not https on " + entry.slug);
    seen.add(url);
    items.push('<li><a href="' + card.esc(url) + '" target="_blank" rel="noopener">' + card.esc(label) + "</a></li>");
  };
  for (const product of pair) {
    for (const spec of product.specs || []) {
      if (spec && spec.url) add(spec.url, (spec.source || product.sourceName || "Source") + ", " + spec.label);
    }
  }
  for (const item of entry.sources || []) add(item.url, item.label);
  if (!items.length) throw new Error("Compare is missing sources: " + entry.slug);
  return "<h2>Sources</h2><ul>" + items.join("") + "</ul>";
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
        description: card.displayMeasure(entry.description),
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
  if (Array.isArray(entry.faqs) && entry.faqs.length) {
    graph["@graph"].push({
      "@type": "FAQPage",
      mainEntity: entry.faqs.map((item) => ({
        "@type": "Question",
        name: card.displayMeasure(item.q),
        acceptedAnswer: { "@type": "Answer", text: card.displayMeasure(item.a) }
      }))
    });
  }
  assertNoCommerce(graph);
  return JSON.stringify(graph, null, 2).replace(/</g, "\\u003c");
}

function compareBodyWords(entry) {
  const chunks = [...(entry.fit || [])];
  for (const section of entry.sections || []) chunks.push(section.heading, ...(section.paragraphs || []));
  return chunks.join(" ").split(/\s+/).filter(Boolean).length;
}

function assertBuyerVerdict(entry) {
  assertHeadline(entry.title, entry.description, "compare/" + entry.slug, false);
  const siteVoice = /\b(cards?|catalogues?|catalogs?|pages?|matching)\b/i;
  const intro = String(entry.description || "").split(/(?<=\.)\s/)[0];
  if (entry.verdict || entry.answer) {
    if (siteVoice.test(intro)) throw new Error("Compare intro talks about the site: " + entry.slug);
    assertReaderVoice(intro, "compare/" + entry.slug + " intro");
  }
  if (entry.answer) {
    for (const sentence of entry.answer) {
      assertReaderVoice(sentence, "compare/" + entry.slug + " answer");
      if (siteVoice.test(sentence)) throw new Error("Short answer talks about the site: " + entry.slug);
    }
    const fullTitle = entry.title + " — Checked Lab";
    if (fullTitle.length > 60) throw new Error("Title tag is " + fullTitle.length + " characters on " + entry.slug + ": " + fullTitle);
    if (String(entry.description).length > 155) throw new Error("Description is " + entry.description.length + " characters on " + entry.slug);
    const faqText = (entry.faqs || []).map((item) => item.q + " " + item.a).join(" ");
    const total = (entry.answer.join(" ") + " " + compareBodyWordsText(entry) + " " + faqText).split(/\s+/).filter(Boolean).length;
    if (total < 700 || total > 1300) throw new Error("Compare length is " + total + " words: " + entry.slug);
  }
  if (entry.changed) {
    const fullTitle = entry.title + " — Checked Lab";
    if (fullTitle.length > 60) throw new Error("Title tag is " + fullTitle.length + " characters on " + entry.slug + ": " + fullTitle);
    if (String(entry.description).length > 155) throw new Error("Description is " + entry.description.length + " characters on " + entry.slug);
    if (!Array.isArray(entry.changed) || entry.changed.length < 3 || entry.changed.length > 5) {
      throw new Error("What changed needs 3 to 5 bullets: " + entry.slug);
    }
    for (const bullet of entry.changed) {
      assertReaderVoice(bullet, "compare/" + entry.slug + " changed");
      if (siteVoice.test(bullet)) throw new Error("What changed talks about the site: " + entry.slug);
    }
  }
  if (!entry.verdict) return;
  for (const item of entry.verdict) {
    const text = [item.heading, ...(item.bullets || [])].join(" ");
    if (siteVoice.test(text)) throw new Error("Verdict talks about the site: " + entry.slug);
    assertReaderVoice(item.heading, "compare/" + entry.slug + " verdict");
  }
}

function compareBodyWordsText(entry) {
  const chunks = [...(entry.fit || [])];
  for (const section of entry.sections || []) chunks.push(section.heading, ...(section.paragraphs || []));
  return chunks.join(" ");
}

function shopperRecallHtml(pair) {
  const lines = pair.map((product) => {
    const bits = [];
    const keep = (rec, place) => {
      if (rec.status === "bin" || (rec.status === "none" && rec.checkedAt)) bits.push(recallSentence(rec, place));
    };
    keep(card.recallFor(product, "US"), "US");
    keep(card.recallFor(product, "CA"), "Canadian");
    const name = product.catalog
      ? sideAnchor(product)
      : (product.sourceUrl
        ? '<a href="' + card.esc(product.sourceUrl) + '" target="_blank" rel="noopener">' + card.esc(product.title) + "</a>"
        : card.esc(product.title));
    return "<p>" + name + (bits.length ? ". " + card.esc(bits.join(" ")) : "") + "</p>";
  }).join("");
  return lines +
    '<p>Check the model number on <a href="' + CPSC_SEARCH + '" target="_blank" rel="noopener">CPSC (US)</a> and <a href="' + HC_SEARCH + '" target="_blank" rel="noopener">Health Canada (CA)</a> recalls before buying.</p>';
}

function writeCompares() {
  if (compares.length !== 42) throw new Error("Expected forty-two compare pages");
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
    const recallsHtml = entry.answer
      ? shopperRecallHtml(pair)
      : pair.map((product) => {
        const us = recallSentence(card.recallFor(product, "US"), "US");
        const ca = recallSentence(card.recallFor(product, "CA"), "Canadian");
        return "<p>" + sideAnchor(product) + ". " + card.esc(us) + " " + card.esc(ca) + "</p>";
      }).join("") +
        '<p>Those sentences are the catalogue match dated ' + card.esc(recalls.checkedAt) + ' (UTC), from the <a href="' + CPSC_SEARCH + '" target="_blank" rel="noopener">CPSC Recalls</a> search and the <a href="' + HC_SEARCH + '" target="_blank" rel="noopener">Health Canada recalls and safety alerts</a> search. Open the model page for the feed link.</p>';
    const stores = (region, heading) => "<h2>" + heading + "</h2>" + pair.map((product) =>
      "<h3>" + card.esc(product.model || product.title) + "</h3>" + card.storeButtons(product, region)
    ).join("");
    const fit = (entry.fit || []).map((paragraph) => "<p>" + shown(paragraph) + "</p>").join("");
    const sections = (entry.sections || []).map((section) => {
      if (!section.heading || !Array.isArray(section.paragraphs) || !section.paragraphs.length) {
        throw new Error("Compare section is incomplete: " + entry.slug);
      }
      return "<h2>" + shown(section.heading) + "</h2>" +
        section.paragraphs.map((paragraph) => "<p>" + shown(paragraph) + "</p>").join("");
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
    const readHeading = entry.changed ? "The details" : "How to read this";
    const readBlurb = entry.changed
      ? "<p>A row is shown when Apple prints that label for both models. Source opens the sentence the figure came from. A figure only one model lists is under that name below.</p>"
      : (entry.answer ? "" : '<p class="lede">' + shown(entry.description) + "</p>") +
        (entry.answer
          ? "<p>A row is shown when both makers print that label. Source opens the sentence the figure came from. Details only one of them prints are listed under that name below.</p><p>Check the model number on <a href=\"" + CPSC_SEARCH + "\" target=\"_blank\" rel=\"noopener\">CPSC (US)</a> and <a href=\"" + HC_SEARCH + "\" target=\"_blank\" rel=\"noopener\">Health Canada (CA)</a> recalls before buying.</p>"
          : "<p>Each line below is copied from that model’s maker page. The Source link opens that page. A spec that only one card lists is left out of the table. The recall line is the CPSC and Health Canada check dated " + card.esc(recalls.checkedAt) + " (UTC).</p>");
    const url = ORIGIN + "/compare/" + entry.slug + "/";
    const html = `<!DOCTYPE html>
<html lang="en" data-region="US">
<head>
<meta charset="UTF-8">
<link rel="canonical" href="${url}">
<script src="/assets/region-boot.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${card.esc(entry.title)} — Checked Lab</title>
<meta name="description" content="${shown(entry.description)}">
<meta property="og:title" content="${card.esc(entry.title)} — Checked Lab">
<meta property="og:description" content="${shown(entry.description)}">
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
${compareLead(entry)}
${changedCard(entry)}${entry.changed ? "" : (entry.verdict ? verdictBlock(entry, pair) + "\n" : "")}<div class="compare-wrap">
<table class="compare">
<thead><tr><th>Spec</th>${head}</tr></thead>
<tbody>${body}</tbody>
</table>
</div>
${entry.changed && entry.verdict ? verdictBlock(entry, pair) + "\n" : ""}${entry.verdict ? "" : pickPair(entry, pair)}
${entry.faqLabel ? compareFaqs(entry) + "\n" : ""}<nav class="toc" aria-label="Jump to"><p>Jump to</p>${entry.changed ? '<a href="#what-changed">What changed</a>' : ""}<a href="#how-to-read">${card.esc(readHeading)}</a>${entry.faqs ? '<a href="#questions">' + card.esc(entry.faqLabel || "Questions") + "</a>" : ""}<a href="#recall-check">Recall check</a><a href="#stores">Stores</a></nav>
${productFold("how-to-read", readHeading, readBlurb + fit + (sections ? "\n" + sections : "") + (entry.verdict ? unmatchedSpecHtml(pair, rows) : "") + compareSources(pair, entry) + (relatedHtml ? "\n" + relatedHtml : ""))}
${entry.faqs && !entry.faqLabel ? compareFaqs(entry) + "\n" : ""}${productFold("recall-check", "Recall check", recallsHtml + '<p class="lede"><a href="/compare/">All comparisons</a> ' + (entry.verdict ? '<a href="/black-friday/">Black Friday</a> ' : "") + '<a href="/recalls/">All recall checks</a> <a href="/' + entry.hub + '/">' + card.esc(HUB_NAME[entry.hub]) + '</a> <a href="/how-we-check/">How we check</a> ' + pair.map(sideAnchor).join(" ") + (crossHtml ? " " + crossHtml : "") + "</p>")}
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
    const expectedTypes = entry.faqs ? "Article,BreadcrumbList,FAQPage,ItemList" : "Article,BreadcrumbList,ItemList";
    if (types !== expectedTypes) throw new Error("Compare schema on " + entry.slug + ": " + types);
    if (entry.faqs) {
      const faq = ld["@graph"].find((node) => node["@type"] === "FAQPage");
      if (!faq || faq.mainEntity.length !== entry.faqs.length) throw new Error("Compare FAQPage " + entry.slug);
      entry.faqs.forEach((item, index) => {
        const node = faq.mainEntity[index];
        if (node.name !== card.displayMeasure(item.q) || !node.acceptedAnswer || node.acceptedAnswer.text !== card.displayMeasure(item.a)) {
          throw new Error("Compare FAQ JSON-LD mismatch " + entry.slug);
        }
        if (!html.includes("<p>" + shown(item.a) + "</p>")) throw new Error("Compare FAQ visible mismatch " + entry.slug);
      });
    }
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
        name: "Spec comparisons",
        headline: "Spec comparisons",
        url: url,
        dateModified: recalls.checkedAt,
        inLanguage: "en",
        description: "Two models, side by side. Each page repeats the specs both product pages share, with a source link and a dated recall line.",
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
  const title = "Spec comparisons";
  const description = "Two models, side by side. Each page repeats the specs both product pages share, with a source link and a dated recall line.";
  const sections = HUBS.filter((hub) => compares.some((entry) => entry.hub === hub)).map((hub) => {
    const items = compares.filter((entry) => entry.hub === hub).map((entry) =>
      "<li><a href=\"/compare/" + entry.slug + "/\">" + card.esc(entry.linkLabel) + "</a>. " + shown(entry.description) + "</li>"
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
<p class="sub">Open a pair. The table is the specs both product pages share.</p>
${sections}
${productFold("compare-guide", "How to read a comparison", '<p class="lede">' + card.esc(description) + "</p>" + renderHubGuide("compare") + '<p>Each line on a comparison is copied from that model’s product page. A spec that only one card lists is left out of the table. The recall line is the CPSC and Health Canada check dated ' + card.esc(recalls.checkedAt) + ' (UTC). Search the model on <a href="' + CPSC_SEARCH + '" target="_blank" rel="noopener">CPSC Recalls</a> and on <a href="' + HC_SEARCH + '" target="_blank" rel="noopener">Health Canada recalls and safety alerts</a>.</p>')}
<p class="lede"><a href="/recalls/">All recall checks</a> <a href="/how-we-check/">How we check</a> <a href="/black-friday/">Black Friday</a> <a href="/gifts/">Gift guides</a> <a href="/alternatives/">Alternatives</a> <a href="/worth-it/">Worth it?</a></p>
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
  if (worth.length) links.push('<a href="/worth-it/">Worth it?</a>');
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
    "<p>These pages stay on Checked Lab. A pick cites a spec from the card.</p>" +
    '<p class="lede"><a href="/alternatives/">Alternatives</a> ' + alt + "</p>" +
    '<p class="lede"><a href="/worth-it/">Worth it?</a> ' + worth + "</p>" +
    '<h2>One model at a time</h2><p>Each page is one model: the specs, a pick based on those specs, and the dated recall sentence.</p><p class="lede">' +
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
  if (Array.isArray(entry.faqs) && entry.faqs.length) {
    graph["@graph"].push({
      "@type": "FAQPage",
      mainEntity: entry.faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a }
      }))
    });
  }
  assertNoCommerce(graph);
  return JSON.stringify(graph, null, 2).replace(/</g, "\\u003c");
}

function editorialFaqs(entry) {
  const faqs = entry.faqs || [];
  if (!faqs.length) return "";
  const body = faqs.map((item) => {
    if (!item.q || !item.a) throw new Error("FAQ missing text: " + entry.slug);
    return "<h3>" + card.esc(item.q) + "</h3><p>" + card.esc(item.a) + "</p>";
  }).join("");
  return productFold("questions", "Questions", body) + "\n";
}

function writeEditorialPage(entry, section, crumb) {
  if (!/^[a-z0-9-]+$/.test(entry.slug)) throw new Error("Bad editorial slug");
  if (!HUBS.includes(entry.hub)) throw new Error("Bad editorial hub: " + entry.slug);
  const where = section + "/" + entry.slug;
  const voice = VOICE_PAGES.has(where);
  assertHeadline(entry.title, entry.description, where, voice);
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
  const picks = '<div class="pick-grid">' + pair.map((product) => {
    const opts = voice ? { pick: buyerReason(product.id) } : {};
    if (section === "black-friday") opts.tileUnlessExact = true;
    return card.card(product, "US", opts);
  }).join("\n") + "</div>";
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
<nav class="toc" aria-label="Jump to"><p>Jump to</p><a href="#read-lines">What the maker says</a>${entry.faqs && entry.faqs.length ? '<a href="#questions">Questions</a>' : ""}<a href="#recall-check">Recall check</a><a href="#stores">Stores</a></nav>
${productFold("read-lines", "What the maker says", '<p class="lede">' + card.esc(entry.description) + "</p><p>Each spec line is copied from that model’s maker page. The Source link opens that page. The recall line is the CPSC and Health Canada check dated " + card.esc(recalls.checkedAt) + " (UTC).</p>" + pair.map(editorialSpecBlock).join("\n") + sections)}
${editorialFaqs(entry)}${productFold("recall-check", "Recall check", recallsHtml + '<p class="lede"><a href="/' + section + '/">' + card.esc(crumb) + '</a> <a href="/' + entry.hub + '/">' + card.esc(HUB_NAME[entry.hub]) + '</a> <a href="/compare/">Spec comparisons</a> <a href="/black-friday/">Black Friday</a> <a href="/recalls/">Recall checks</a> <a href="/how-we-check/">How we check</a> ' + bestTypesForIds(pair.map((product) => product.id)).map(bestAnchor).join(" ") + " " + pair.map((product) => '<a href="' + card.productPath(product) + '">' + card.esc(product.title) + "</a>").join(" ") + "</p>" + relatedHtml + seeAlsoHtml(entry))}
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

function linkTail(title) {
  return /[.!?]$/.test(String(title).trim()) ? " " : ". ";
}

function writeEditorialIndex(section, title, description, intro, list) {
  assertHeadline(title, description, section + " index", false);
  for (const paragraph of intro) assertReaderVoice(paragraph, section + " index intro");
  const items = list.map((entry) =>
    "<li><a href=\"/" + section + "/" + entry.slug + "/\">" + card.esc(entry.title) + "</a>" + linkTail(entry.title) + card.esc(entry.description) + "</li>"
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
<section id="about-list"><h2>How to use this list</h2>${intro.map((paragraph) => "<p>" + paragraph + "</p>").join("\n")}<p class="lede"><a href="/compare/">Spec comparisons</a> <a href="/black-friday/">Black Friday</a> <a href="/recalls/">Recall checks</a> <a href="/how-we-check/">How we check</a> <a href="/alternatives/">Alternatives</a> <a href="/worth-it/">Is it worth it?</a></p></section>
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
  const art = card.visual(product, Object.assign({ noCredit: true, genericUnlessExact: true }, opts || {}));
  const media = art.includes("p-photo") ? '<div class="prod-media">' + art + "</div>" : art;
  const label = pick.bestFor ? '<p class="pick-if prod-why">' + card.esc(pick.bestFor) + "</p>" : "";
  return '<article class="product-grid hub-card prod-card" id="' + card.esc(product.id) + '">' +
    media +
    '<div class="p-main prod-body">' +
    label +
    card.badgeHtml(card.worstRecall(product)) +
    card.noteBadge(product) +
    '<h2 class="p-title prod-title"><a href="' + href + '">' + card.visibleTitle(product.title) + "</a></h2>" +
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
    "<p>Checked Lab lines up product pages, store links, and public recall records for shoppers in the US and Canada.</p>",
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
${(type.recallLinks || []).map((link) => {
    if (!link || !link.href || !link.label) throw new Error("Best recall link on " + type.slug);
    assertSitePath(link.href, "best " + type.slug);
    return '<a href="' + card.esc(link.href) + '">' + card.esc(link.label) + "</a>";
  }).join(" ") ? '<p class="lede">' + (type.recallLinks || []).map((link) => '<a href="' + card.esc(link.href) + '">' + card.esc(link.label) + "</a>").join(" ") + "</p>\n" : ""}${cards}
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
        if (!article.includes('class="p-title prod-title"')) throw new Error("Spec card is missing the title on " + id);
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
  for (const entry of editorial.season) {
    if (!/Black Friday/.test(entry.title) || !/Cyber Monday/.test(entry.title)) {
      throw new Error("Black Friday title needs both days: " + entry.slug);
    }
    const intro = String(entry.description || "").split(/(?<=\.)\s/)[0];
    if (!/Black Friday/.test(intro) || !/Cyber Monday/.test(intro)) {
      throw new Error("Black Friday intro needs both days: " + entry.slug);
    }
    const faqs = entry.faqs || [];
    if (!faqs.some((item) => /Cyber Monday/i.test(item.q) && /Cyber Monday/i.test(item.a))) {
      throw new Error("Black Friday model page needs a Cyber Monday FAQ: " + entry.slug);
    }
  }
  for (const entry of editorial.alternatives) writeEditorialPage(entry, "alternatives", "Alternatives");
  for (const entry of editorial.worth) writeEditorialPage(entry, "worth-it", "Worth it?");
  for (const entry of editorial.season) writeEditorialPage(entry, "black-friday", "Black Friday");
  writeEditorialIndex("alternatives", "Alternatives worth comparing", "Other models already on Checked Lab, set beside a named card. Each page cites the published specs and the dated recall check.", [
    "An alternative here is another model already on Checked Lab. The page quotes the published specs and says which figure to read for the way you will use it.",
    "Open the model page for the full card. The recall line is the CPSC and Health Canada check dated " + card.esc(recalls.checkedAt) + " (UTC). Search the model on <a href=\"" + CPSC_SEARCH + "\" target=\"_blank\" rel=\"noopener\">CPSC Recalls</a> and on <a href=\"" + HC_SEARCH + "\" target=\"_blank\" rel=\"noopener\">Health Canada recalls and safety alerts</a>."
  ], editorial.alternatives);
  writeEditorialIndex("worth-it", "Is it worth it?", "A plain look at who each product suits, and which spec is worth weighing. Prices stay on the store.", [
    "Each page says who the product suits and which spec to weigh: a cabinet height, a run time, a jar size, or a battery life. Prices stay on the store.",
    "If those specs do not fit, the page names another model already listed here. The recall line is the CPSC and Health Canada check dated " + card.esc(recalls.checkedAt) + " (UTC)."
  ], editorial.worth);
}

function roundupTable(entry) {
  if (!entry.tableHeading) throw new Error("Roundup needs a table heading: " + entry.slug);
  const rows = [];
  const blocks = [];
  const brandScan = entry.layout === "brand";
  for (const notice of entry.notices) {
    if (!notice.hazard || !notice.product || !notice.remedy) {
      throw new Error("Roundup notice needs product, hazard, and remedy: " + entry.slug);
    }
    const link = '<a href="' + href(notice.url) + '" target="_blank" rel="noopener">' + card.esc(notice.agency) + " notice</a>";
    const models = "<ul>" + notice.models.map((model) => "<li>" + card.esc(model) + "</li>").join("") + "</ul>";
    if (brandScan) {
      if (!notice.brand || !notice.remedyLine) throw new Error("Brand row needs a brand and a remedy line: " + entry.slug);
      assertReaderVoice(notice.brand + " " + notice.remedyLine, entry.slug + " brand row");
      if (notice.page) assertSitePath(notice.page, entry.slug);
      const brand = notice.page
        ? '<a href="' + card.esc(notice.page) + '">' + card.esc(notice.brand) + "</a>"
        : card.esc(notice.brand);
      const modelText = card.esc(notice.models.join(", "));
      rows.push("<tr><td>" + brand + "</td><td>" + modelText + "</td><td>" + card.esc(notice.date) + "</td><td>" + card.esc(notice.remedyLine) + "</td><td>" + link + "</td></tr>");
      blocks.push('<article class="recall-block"><h3>' + brand + '</h3><p><time datetime="' + card.esc(notice.date) + '">' +
        card.esc(notice.date) + "</time></p><p>" + card.esc(notice.remedyLine) + "</p><p>" + link +
        '</p><details><summary>Model numbers</summary>' + models + "</details></article>");
    } else {
      rows.push("<tr><td>" + card.esc(notice.date) + "</td><td>" + card.esc(notice.product) + "</td><td>" + card.esc(notice.models.join(", ")) + "</td><td>" + card.esc(notice.hazard) + "</td><td>" + card.esc(notice.remedy) + "</td><td>" + link + "</td></tr>");
      blocks.push('<article class="recall-block"><h3><time datetime="' + card.esc(notice.date) + '">' + card.esc(notice.date) + "</time> · " + card.esc(notice.product) + "</h3><p>" + card.esc(notice.hazard) + "</p><p>" + card.esc(notice.remedy) + "</p><p>" + link + '</p><details><summary>Model numbers</summary>' + models + "</details></article>");
    }
  }
  const head = brandScan
    ? "<tr><th>Brand</th><th>Models</th><th>Date</th><th>Remedy</th><th>Source</th></tr>"
    : "<tr><th>Date</th><th>Product</th><th>Model numbers</th><th>Hazard</th><th>What the notice tells owners</th><th>Notice</th></tr>";
  const note = entry.tableNote ? "<p>" + card.esc(entry.tableNote) + "</p>" : "";
  if (entry.tableNote) assertReaderVoice(entry.tableNote, entry.slug + " table note");
  return '<h2 id="full-list">' + card.esc(entry.tableHeading) + '</h2>' + note + '<div class="recall-roundup" id="full-list-table"><div class="compare-wrap recall-table"><table class="compare"><thead>' + head + "</thead><tbody>" + rows.join("") + '</tbody></table></div><div class="recall-stack">' + blocks.join("") + "</div></div>";
}

function shopHtml(entry) {
  const shop = entry.shop;
  if (!shop) return "";
  if (!shop.heading || !shop.text || !Array.isArray(shop.links) || shop.links.length < 2) {
    throw new Error("Shop block needs a heading, text, and links: " + entry.slug);
  }
  assertReaderVoice(shop.heading + " " + shop.text, entry.slug + " shop");
  const items = shop.links.map((link) => {
    if (!link || !link.href || !link.label) throw new Error("Shop link is incomplete: " + entry.slug);
    assertSitePath(link.href, entry.slug);
    const note = link.text ? "<p>" + card.esc(link.text) + "</p>" : "";
    if (link.text) assertReaderVoice(link.text, entry.slug + " shop link");
    return "<li><a href=\"" + card.esc(link.href) + "\">" + card.esc(link.label) + "</a>" + note + "</li>";
  }).join("");
  return '<section class="buying" id="shopping"><h2>' + card.esc(shop.heading) + "</h2><p>" +
    card.esc(shop.text) + '</p><ul class="buy-list">' + items + "</ul></section>";
}

function explainerFaqHtml(entry) {
  const faqs = entry.faqs || [];
  if (!faqs.length) return "";
  if (faqs.length < 2 || faqs.length > 4) throw new Error("Explainer FAQs must be 2 to 4: " + entry.slug);
  return '<section class="faq" id="questions"><h2>Questions</h2>' + faqs.map((item) => {
    if (!item || !item.q || !item.a) throw new Error("Explainer FAQ is incomplete: " + entry.slug);
    assertReaderVoice(item.q + " " + item.a, entry.slug + " faq");
    const answer = '<p class="faq-a">' + card.esc(item.a) + "</p>";
    if (!entry.faqFold) return "<h3>" + card.esc(item.q) + "</h3>" + answer;
    return '<details class="fold"><summary><h3>' + card.esc(item.q) + "</h3></summary><div class=\"fold-body\">" +
      answer + "</div></details>";
  }).join("") + "</section>";
}

function writeExplainers() {
  if (explainers.length !== 11) throw new Error("Expected eleven explainer pages");
  const replaceSlugs = ["lasko-heaters", "anker-power-banks", "instant-pot-official-notices", "cosori-air-fryer-2023", "ninja-foodi-op300", "toro-power-clear-snowblowers", "heated-blanket-recalls"];
  if (replaceSlugs.some((slug) => !REPLACE_LINKS[slug])) throw new Error("A recall replace block is missing");
  const replaceSentences = new Set();
  for (const slug of replaceSlugs) {
    for (const sentence of REPLACE_LINKS[slug].text.split(/(?<=\.)\s+/)) {
      if (replaceSentences.has(sentence)) throw new Error("Repeated replace sentence on " + slug);
      replaceSentences.add(sentence);
    }
  }
  const slugs = new Set();
  for (const entry of explainers) {
    if (!/^[a-z0-9-]+$/.test(entry.slug) || slugs.has(entry.slug)) throw new Error("Bad explainer slug");
    slugs.add(entry.slug);
    if (entry.roundup && entry.notices.length < 2) throw new Error("Roundup has fewer than two notices: " + entry.slug);
    assertHeadline(entry.title, entry.description, "recalls/" + entry.slug, VOICE_PAGES.has("recalls/" + entry.slug));
    const url = ORIGIN + "/recalls/" + entry.slug + "/";
    const sub = entry.sub || entry.description.split(/(?<=\.)\s/)[0];
    assertReaderVoice(sub, "recalls/" + entry.slug + " intro");
    const noticesLede = entry.noticesLede || entry.description;
    assertReaderVoice(noticesLede, "recalls/" + entry.slug + " notices");
    const roundup = entry.roundup ? roundupTable(entry) : "";
    const shop = shopHtml(entry);
    const faqs = explainerFaqHtml(entry);
    const lead = [topLinkHtml(entry), answersHtml(entry), affectedHtml(entry), listCardHtml(entry), replacingHtml(entry), roundup, shop, faqs]
      .filter(Boolean).join("\n");
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
<p class="sub">${card.esc(sub)}</p>
${lead ? lead + "\n" : "\n"}${catalogueHtml(entry)}
${productFold("official-notices", "What the notices say", '<p class="lede">' + card.esc(noticesLede) + " Catalogue lines below use the " + card.esc(recalls.checkedAt) + " (UTC) check.</p>" + entry.notices.map(noticeHtml).join("\n"))}
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
    if (REPLACE_LINKS[entry.slug]) {
      const affectedAt = html.indexOf('id="is-mine-affected"');
      const replaceAt = html.indexOf('id="if-youre-replacing-it"');
      if (affectedAt < 0 || replaceAt < affectedAt) throw new Error("Replace section is not under the affected block: " + entry.slug);
      const slice = html.slice(replaceAt, html.indexOf("</section>", replaceAt));
      if (/amazon\.com|tag=checkedlab|\$\d|\bdeal\b/i.test(slice)) throw new Error("Replace section has an Amazon or price claim: " + entry.slug);
      const heading = REPLACE_LINKS[entry.slug].heading || "If you're replacing it";
      if (!slice.includes("<h2>" + heading + "</h2>")) throw new Error("Replace heading missing: " + entry.slug);
      if (entry.slug === "cosori-air-fryer-2023" && !/replacement options/i.test(slice)) {
        throw new Error("Cosori page misses replacement options");
      }
    }
    if (entry.faqs && entry.faqs.length) {
      const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
      const faq = data["@graph"].find((node) => node["@type"] === "FAQPage");
      if (!faq || faq.mainEntity.length !== entry.faqs.length) throw new Error("Explainer FAQPage " + entry.slug);
      entry.faqs.forEach((item, index) => {
        if (!html.includes("<h3>" + card.esc(item.q) + "</h3>") || !html.includes('<p class="faq-a">' + card.esc(item.a) + "</p>")) {
          throw new Error("Explainer FAQ is not on the page: " + entry.slug);
        }
        if (faq.mainEntity[index].name !== item.q || faq.mainEntity[index].acceptedAnswer.text !== item.a) {
          throw new Error("Explainer FAQ JSON-LD mismatch " + entry.slug);
        }
      });
    }
    if (entry.slug === "air-fryer-recalls") {
      if (!html.includes('id="shopping"') || !html.includes(">Shopping for a new one?</h2>")) {
        throw new Error("Air fryer page is missing the shopping block");
      }
      if (!html.includes("<th>Brand</th>") || !html.includes("<th>Remedy</th>") || !html.includes("<th>Source</th>")) {
        throw new Error("Air fryer page is missing the brand table");
      }
    }
    if (entry.slug === "cosori-air-fryer-2023") {
      if (!html.includes(">Is my Cosori recalled?</h2>") || !html.includes("CP158-AF")) {
        throw new Error("Cosori page is missing the model card");
      }
    }
    if (entry.slug === "anker-power-banks") {
      if (!html.includes('id="serial-check"') || !html.includes(">A1257</p>")) {
        throw new Error("Anker page is missing the serial check for A1257");
      }
      if (!html.includes(">Is my Anker recalled?</h2>") || !html.includes(">A1112011</td>")) {
        throw new Error("Anker page is missing the model card");
      }
      if (!html.includes('<details class="fold"><summary><h3>Which Anker power banks were recalled?</h3></summary>')) {
        throw new Error("Anker page is missing the FAQ accordion");
      }
    }
    if (entry.slug === "heated-blanket-recalls") {
      if (!html.includes('id="brand-check"') || !html.includes('id="brand-bedsure"') || !html.includes('id="brand-bhg"') || !html.includes('id="brand-cosi"') || !html.includes('id="brand-ohs"')) {
        throw new Error("Heated blanket page is missing the brand check");
      }
    }
    if (entry.slug === "lasko-heaters") {
      if (!html.includes("Is my model recalled?") || !html.includes("481646 and 5309 are not")) {
        throw new Error("Lasko page is missing the model card");
      }
      if (/481646 is recalled|5309 is recalled/i.test(html)) throw new Error("Lasko page claims an unverified model");
    }
    if (entry.slug === "instant-pot-official-notices") {
      if (!html.includes("Instant Pot recall 2026") || !html.includes("No 2026 Instant Pot recall")) {
        throw new Error("Instant Pot page is missing the 2026 answer");
      }
    }
    if (entry.slug === "ninja-foodi-op300") {
      if (!html.includes('id="is-mine-affected"') || !html.includes("OP301") || !html.includes("OP300C")) {
        throw new Error("Foodi page is missing the model card");
      }
    }
    if (entry.slug === "toro-power-clear-snowblowers") {
      if (!html.includes("Which snow blowers have had safety recalls?") || !html.includes('id="snow-blowers-with-official-recalls"') || !html.includes("38753")) {
        throw new Error("Snow blower page is missing the recall list");
      }
    }
    if (entry.slug === "space-heater-recalls") {
      const main = html.slice(html.indexOf("<main"));
      const linkAt = main.indexOf('href="/recalls/lasko-heaters/"');
      const foldAt = main.indexOf('id="catalogue-lines"');
      if (linkAt < 0 || foldAt < 0 || linkAt > foldAt) throw new Error("Lasko link is not above the catalogue fold");
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
<p class="lede"><a href="/recalls/air-fryer-recalls/">Air fryer recalls by brand</a>. <a href="/recalls/cosori-air-fryer-2023/">Cosori air fryer recall</a>.</p>
${recallWidget()}
<p class="lede">Checked <time datetime="${card.esc(date)}">${card.esc(date)}</time> (UTC). Every listed model has a United States line from the <a href="${href(usSource)}" target="_blank" rel="noopener">CPSC SaferProducts</a> source and a Canada line from the <a href="${CA_DATASET_PAGE}" target="_blank" rel="noopener">Health Canada open dataset</a>.</p>
<p>A date is the day that check ran. Open a model for the maker specs. Read <a href="/how-we-check/">how we check</a> and the <a href="/bin-list/">BIN list</a>. <a href="/black-friday/">${card.esc(BF_TITLE)}</a>. <a href="/thanksgiving/">Thanksgiving and holiday hosting, recall-checked</a> includes <a href="/thanksgiving/turkey-temperatures/">the safe turkey temperature</a> and <a href="/thanksgiving/turkey-fryers/">turkey fryer recalls</a>. <a href="/winter-safety/">Winter home safety, recall-checked</a>. <a href="/toy-safety/">Holiday toy safety, recall-checked</a>. <a href="/recalls/feed.xml">RSS</a> updates when a recall record changes.</p>
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
      q: "What should I check before buying on Black Friday or Cyber Monday?",
      a: "Confirm the exact model number on the box and on the listing. Check that model with CPSC for a US purchase and with Health Canada for a Canadian purchase. A look-alike listing or a third-party seller can use the brand name for a different model. Read what is in the box, and read the return window on the store page before you pay."
    },
    {
      q: "When is Black Friday 2026 on Amazon?",
      a: US_DATES + " " + CA_DATES
    },
    {
      q: "What should an air fryer shopper match before buying?",
      a: "Match the model number on the unit to the listing. The Cosori 2023 notices and the Ninja Foodi OP300 notices name specific models. The model cards for the COSORI Pro II, the Ninja Foodi 10-in-1 oven, and the Ninja Crispi link those explainers."
    },
    {
      q: "Does a Black Friday listing check the recall?",
      a: "A sale listing is not a recall check. Each model on this page repeats the recall status and date from the CPSC and Health Canada check. A notice for another model in the same brand can still exist."
    },
    {
      q: "Where is the price?",
      a: "Prices stay on the store. This page links the Checked Lab card for the model."
    },
    {
      q: "Is Cyber Monday different from Black Friday?",
      a: "Cyber Monday 2026 is Monday, November 30. The model check is the same as on Black Friday: confirm the exact model number, read what is in the box, and read the return window on the store page. Then compare that model with the alternatives linked from its card."
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
  const art = card.mediaWithSpecs(product, Object.assign({ tileUnlessExact: true }, opts || {}));
  const hidden = art.includes("spec-tile") ? ' class="visually-hidden"' : "";
  return '<article class="bf-model" id="' + card.esc(product.id) + '">' +
    art +
    "<h3" + hidden + '><a href="' + card.productPath(product) + '">' + card.visibleTitle(product.title) + "</a></h3>" +
    pickParagraph(product) +
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
        headline: BF_H1,
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
  assertReaderVoice(BF_TITLE, "black friday title");
  assertReaderVoice(BF_H1, "black friday h1");
  assertReaderVoice(BF_DESC, "black friday description");
  if (BF_TITLE.length > 60) throw new Error("Black Friday title is over 60 characters");
  card.beginPage();
  const picked = blackFridayPicks();
  const url = ORIGIN + BF_PATH;
  const date = recalls.checkedAt || "";
  const faqs = blackFridayFaqs();
  const jumps = '<a href="#worth-checking">Worth checking</a>' + HUBS.map((hub) => '<a href="#' + hub + '">' + card.esc(HUB_NAME[hub]) + "</a>").join("");
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
<h1>${card.esc(BF_H1)}</h1>
<p class="sub">Confirm the model number before Black Friday and Cyber Monday 2026, then read the dated recall check.</p>
<nav class="toc" aria-label="Jump to"><p>Jump to</p>${jumps}</nav>
${blackFridayShortlist()}
${sections}
${productFold("before-you-pay", "Before you pay", '<p class="lede">Confirm the model number before Black Friday and before Cyber Monday, Monday, November 30, 2026. The status under each card is the recall check dated <time datetime="' + card.esc(date) + '">' + card.esc(date) + '</time> (UTC).</p>' + renderHubGuide("black-friday", { faq: false }) + '<p><a href="/gifts/">Holiday 2026 gift guides</a> group the same models by recipient. Each pick quotes the maker specs and repeats this dated check. <a href="/gifts/for-kids/">Gifts for kids</a> names mainstream kids products and the official check to do. <a href="/winter-safety/">Winter home safety, recall-checked</a> covers heaters, heated bedding, alarms, and outage power. <a href="/toy-safety/">Holiday toy safety, recall-checked</a> covers button batteries, magnets, water beads, and ride-ons. <a href="/thanksgiving/">Thanksgiving</a> is Thursday, November 26, 2026. Those guides cover <a href="/thanksgiving/turkey-temperatures/">the safe turkey temperature</a>, <a href="/thanksgiving/turkey-fryers/">turkey fryer safety</a>, <a href="/thanksgiving/pressure-cookers/">pressure cooker lids</a>, and <a href="/thanksgiving/kitchen-fires/">kitchen fires</a>.</p><p class="only-us">' + card.esc(US_DATES) + ' <a href="' + US_DEALS + '" target="_blank" rel="sponsored nofollow noopener">Amazon.com Black Friday</a>.</p><p class="only-ca">' + card.esc(CA_DATES) + ' <a href="' + CA_DEALS + '" target="_blank" rel="sponsored nofollow noopener">Amazon.ca Black Friday</a>.</p><p>Gift and seasonal models from this list. Open the card and match the model number on the listing. The same check applies on Cyber Monday.</p><ol class="checklist"><li>Confirm the exact model number on the box, in the manual, and on the listing. A family name such as Foodi or Cosori can point at a different model.</li><li>Check that model on <a href="https://www.cpsc.gov/Recalls" target="_blank" rel="noopener">CPSC Recalls</a> for a US purchase and on <a href="https://recalls-rappels.canada.ca/en" target="_blank" rel="noopener">Health Canada recalls and safety alerts</a> for a Canadian purchase. <a href="/recalls/">Recall checks</a> is the full list. <a href="/how-we-check/">How we check</a> says what the date means.</li><li>Beware look-alike listings and third-party sellers. The brand in the title is not the model number.</li><li>Read what is in the box, and read the return window on the listing before you pay. The window is printed on the store page. Cyber Monday does not change either line.</li></ol>')}
${productFold("comparisons", "Maker spec comparisons", '<p>Each page repeats the specs both product pages share. The cell links the product page. The recall line is the dated check. <a href="/compare/">All comparisons</a>.</p><p class="lede">' + compares.map((entry) => '<a href="/compare/' + entry.slug + '/">' + card.esc(entry.linkLabel) + "</a>").join(" ") + "</p>" + editorialIndexBlock())}
${productFold("notices", "Notices to open before you buy", "<p>These pages quote the official notice and name the model card.</p><ul>" + notices + "</ul>")}
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
  if (/\$\d/.test(html) || PERCENT_CLAIM.test(html)) throw new Error("Black Friday page has a price or a percent");
  if (/we tested|we bought|does not test|did not test/i.test(html)) throw new Error("Black Friday page has a test claim");
  mkdirSync(join(root, "black-friday"), { recursive: true });
  writeFileSync(join(root, "black-friday", "index.html"), polish(html));
}

function assertBlackFriday(html) {
  assertFooterDisclosure(html, "Black Friday disclosure missing");
  if (!html.includes('<link rel="canonical" href="' + ORIGIN + BF_PATH + '">')) throw new Error("Black Friday canonical");
  if (!html.includes("<title>" + BF_TITLE + " — Checked Lab</title>")) throw new Error("Black Friday title");
  if (!html.includes('name="description" content="' + BF_DESC + '"')) throw new Error("Black Friday description");
  if (!html.includes("<h1>" + BF_H1 + "</h1>")) throw new Error("Black Friday H1");
  if (!html.includes('data-region-set="US"') || !html.includes('data-region-set="CA"')) throw new Error("Black Friday region switch");
  if (/\$\d/.test(html) || PERCENT_CLAIM.test(html)) throw new Error("Black Friday page has a price or a percent");
  if (/we tested|we bought|does not test|did not test|lab-tested|lab tested/i.test(html)) {
    throw new Error("Black Friday page has a test claim");
  }
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  const dealHits = visible.match(/deal/gi) || [];
  if (dealHits.length !== 2) throw new Error("Black Friday page uses deal " + dealHits.length + " times");
  const shortStart = html.indexOf('id="worth-checking"');
  const shortEnd = html.indexOf('id="winter"', shortStart);
  if (shortStart < 0 || shortEnd < 0) throw new Error("Black Friday shortlist missing");
  const short = html.slice(shortStart, shortEnd);
  if (!short.includes(">Worth checking this Black Friday</h2>")) throw new Error("Black Friday shortlist heading");
  const shortUs = [...short.matchAll(/<div class="only-us">([\s\S]*?)<\/div>/g)].map((match) => match[1]).join("\n");
  const shortCa = [...short.matchAll(/<div class="only-ca">([\s\S]*?)<\/div>/g)].map((match) => match[1]).join("\n");
  if ((shortUs.match(/tag=checkedlab01-20/g) || []).length !== BF_SHORTLIST.length) throw new Error("Shortlist US Amazon tags");
  if ((shortCa.match(/tag=checkedlab-20/g) || []).length !== BF_SHORTLIST.length) throw new Error("Shortlist CA Amazon tags");
  if (shortUs.includes("checkedlab-20") || shortCa.includes("checkedlab01-20")) throw new Error("Shortlist Amazon tags crossed");
  for (const item of BF_SHORTLIST) {
    const product = products.find((entry) => entry.id === item.id);
    if (!short.includes('href="' + card.productPath(product) + '"')) throw new Error("Shortlist misses " + item.id);
    if (!short.includes(card.esc(item.who))) throw new Error("Shortlist line missing for " + item.id);
  }
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
  if (faqs.length < 3 || faqs.length > 6) throw new Error("Black Friday FAQ count");
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
      q: "Where do the specs come from?",
      a: "Each spec is copied from the fields stored for that model. The model page links the source."
    },
    {
      q: "Which recipient lists are published?",
      a: "The lists are the recipient groups this site can fill with at least five models: " + humanList(guides.map((guide) => guide.label)) + "."
    },
    {
      q: "Where is the kids list?",
      a: "Gifts for kids names " + kidsGuide().picks.length + " mainstream kids product lines and the official check to do before you buy. It does not use a model card. Toy safety covers button and coin batteries, magnets, water beads, and ride-ons and scooters."
    },
    {
      q: "Where is the host list?",
      a: "Gifts for the host names " + hostGuide().picks.length + " widely sold hosting tools and the official check to do before you buy. It does not use a model card. Thanksgiving covers turkey fryers, pressure cookers, turkey temperatures, and kitchen fires."
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
    pickParagraph(product) +
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
    item.picks.length + " models. " + card.esc(item.guide.description) + "</p></li>"
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
      '<p>A recipient list is published when the list can fill it with at least five models and the recorded US and Canadian checks found no matching recall. The spec line on each model is copied from the maker fields. <a href="/how-we-check/">How we check</a> says what the date means. <a href="' + giftPath(kidsGuide()) + '">Gifts for kids</a> is a recall-check list, not a model list. <a href="/toy-safety/">Toy safety</a> covers button batteries, magnets, water beads, and ride-ons. <a href="' + giftPath(hostGuide()) + '">Gifts for the host</a> is a recall-check list for holiday hosting. <a href="/thanksgiving/">Thanksgiving and holiday hosting</a> covers turkey fryers, pressure cookers, turkey temperatures, and kitchen fires.</p>' +
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

function citeSpans(spans, where) {
  if (!Array.isArray(spans) || !spans.length) throw new Error("Cited copy missing: " + where);
  for (const span of spans) {
    if (!span || !span.href || span.href.startsWith("/")) continue;
    let host = "";
    try {
      host = new URL(span.href).hostname.replace(/^www\./, "");
    } catch {
      throw new Error("Cited href: " + where);
    }
    if (!CITE_HOSTS.has(host)) throw new Error("Cited href is not an allowed source: " + span.href);
  }
  return winterSpans(spans, where);
}

function expectedFaqAnswer(item, where) {
  if (Array.isArray(item.body) && item.body.length) {
    return '<p class="faq-a">' + citeSpans(item.body, where || "faq") + "</p>";
  }
  return '<p class="faq-a">' + card.esc(item.a) + "</p>";
}

function winterFaqsHtml(faqs, where, accordion) {
  const items = faqs.map((item, index) => {
    const answer = expectedFaqAnswer(item, (where || "faq") + " " + index);
    if (!accordion) return "<h3>" + card.esc(item.q) + "</h3>" + answer;
    return '<details class="fold"><summary><h3>' + card.esc(item.q) + "</h3></summary><div class=\"fold-body\">" +
      answer + "</div></details>";
  }).join("");
  return '<section class="faq" id="questions"><h2>Questions</h2>' + items + "</section>";
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
    '<p>Read the label, then search the model on <a href="' + CPSC_SEARCH + '" target="_blank" rel="noopener">CPSC Recalls</a> or <a href="' + HC_SEARCH + '" target="_blank" rel="noopener">Health Canada recalls and safety alerts</a>. <a href="/how-we-check/">How we check</a> says what a dated catalogue line means. <a href="/winter/">Winter</a> is the catalogue. <a href="/recalls/">Recall checks</a> lists every catalogue model. <a href="/recalls/heated-blanket-recalls/">Heated blanket and throw recalls</a> lists the official notices. <a href="/thanksgiving/">Thanksgiving and holiday hosting</a> covers turkey fryers, pressure cookers, turkey temperatures, and kitchen fires.</p>' +
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

function winterIntro(guide) {
  if (!Array.isArray(guide.intro) || !guide.intro.length) return "";
  return guide.intro.map((spans, index) =>
    "<p>" + officialSpans(spans, guide.slug + " intro " + index) + "</p>"
  ).join("");
}

function winterBrandTable(guide) {
  const table = guide.brandTable;
  if (!table) return "";
  const none = "No CPSC or Health Canada recall found as of Nov 2026";
  if (table.heading !== "Heated blanket recalls by brand" || !table.intro || !Array.isArray(table.rows) || table.rows.length < 4) {
    throw new Error("Brand table is incomplete: " + guide.slug);
  }
  assertWinterCopy(table.heading + " " + table.intro, guide.slug + " brand table");
  const columns = ["Brand", "Product", "Date", "Notice"];
  const head = "<tr>" + columns.map((column) => "<th scope=\"col\">" + column + "</th>").join("") + "</tr>";
  const body = [];
  const stack = [];
  for (const row of table.rows) {
    if (!row || !row.brand || !row.product) throw new Error("Brand row: " + guide.slug);
    assertWinterCopy(row.brand + " " + row.product + " " + (row.date || "") + " " + (row.note || ""), guide.slug + " brand " + row.brand);
    const links = Array.isArray(row.links) ? row.links : [];
    let notice = "";
    if (row.note) {
      if (row.note !== none || links.length) throw new Error("No-recall row: " + row.brand);
      notice = card.esc(row.note);
    } else {
      if (!row.date || !links.length) throw new Error("Recall row needs a date and a notice: " + row.brand);
      notice = links.map((link) => {
        assertWinterPatternUrl(link.url);
        if (!link.label) throw new Error("Notice label: " + row.brand);
        return '<a href="' + card.esc(link.url) + '" target="_blank" rel="noopener">' + card.esc(link.label) + "</a>";
      }).join(" ");
    }
    const date = row.date ? card.esc(row.date) : "";
    body.push("<tr><td>" + card.esc(row.brand) + "</td><td>" + card.esc(row.product) + "</td><td>" + date + "</td><td>" + notice + "</td></tr>");
    const dateLine = date ? "<p><strong>Date.</strong> " + date + "</p>" : "";
    stack.push("<article><h3>" + card.esc(row.brand) + "</h3><p><strong>Product.</strong> " + card.esc(row.product) + "</p>" + dateLine + "<p>" + notice + "</p></article>");
  }
  return '<section class="model-card" id="recalls-by-brand"><h2>' + card.esc(table.heading) + "</h2><p>" +
    card.esc(table.intro) + '</p><div class="model-scroll"><table class="model-table"><thead>' + head +
    "</thead><tbody>" + body.join("") + '</tbody></table></div><div class="model-stack">' + stack.join("") + "</div></section>";
}

function winterGuideHtml(guide) {
  const url = ORIGIN + winterPath(guide);
  const main = sceneBlock("winter-safety") + winterCrumbs(guide.h1) +
    "<h1>" + card.esc(guide.h1) + "</h1>" +
    '<p class="lede">' + card.esc(guide.description) + "</p>" +
    winterIntro(guide) +
    winterBrandTable(guide) +
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
    winterFaqsHtml(guide.faqs, guide.slug, Boolean(guide.faqFold));
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
    winterBrandTable(guide);
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

function toyAnswerCard(guide) {
  const block = guide.answerCard;
  if (!block) return "";
  if (!block.heading || !/^[a-z0-9-]+$/.test(block.id || "")) throw new Error("Answer card: " + guide.slug);
  assertWinterCopy(block.heading, guide.slug + " answer");
  const paragraphs = Array.isArray(block.paragraphs) ? block.paragraphs : [];
  const points = Array.isArray(block.points) ? block.points : [];
  if (!paragraphs.length) throw new Error("Answer card body: " + guide.slug);
  const body = paragraphs.map((spans, index) =>
    "<p>" + officialSpans(spans, guide.slug + " answer " + index) + "</p>"
  ).join("");
  const list = points.length
    ? "<ul>" + points.map((spans, index) =>
      "<li>" + officialSpans(spans, guide.slug + " point " + index) + "</li>"
    ).join("") + "</ul>"
    : "";
  return '<div class="answer-stack"><article class="answer-card" id="' + card.esc(block.id) + '"><h2>' +
    card.esc(block.heading) + "</h2>" + body + list + "</article></div>";
}

function toyRecallTable(guide) {
  const table = guide.recallTable;
  if (!table) return "";
  if (!table.heading || !Array.isArray(table.intro) || !Array.isArray(table.rows) || table.rows.length < 2) {
    throw new Error("Recall table: " + guide.slug);
  }
  if (!/^[a-z0-9-]+$/.test(table.id || "")) throw new Error("Recall table id: " + guide.slug);
  assertWinterCopy(table.heading, guide.slug + " recalls");
  const intro = officialSpans(table.intro, guide.slug + " recall intro");
  const columns = ["Product", "Seller or brand", "Date", "Agency", "Notice"];
  const head = "<tr>" + columns.map((column) => '<th scope="col">' + column + "</th>").join("") + "</tr>";
  const body = [];
  const stack = [];
  for (const row of table.rows) {
    if (!row || !row.product || !row.seller || !row.date || !row.agency || !row.url || !row.label) {
      throw new Error("Recall row: " + guide.slug);
    }
    assertToyPatternUrl(row.url);
    if (!/\/Recalls\/|\/alert-recall\//.test(row.url)) throw new Error("Recall row is not a notice: " + row.url);
    assertWinterCopy([row.product, row.seller, row.date, row.agency, row.label].join(" "), guide.slug + " recall row");
    const link = '<a href="' + card.esc(row.url) + '" target="_blank" rel="noopener">' + card.esc(row.label) + "</a>";
    body.push("<tr><td>" + card.esc(row.product) + "</td><td>" + card.esc(row.seller) + "</td><td>" +
      card.esc(row.date) + "</td><td>" + card.esc(row.agency) + "</td><td>" + link + "</td></tr>");
    stack.push("<article><h3>" + card.esc(row.product) + "</h3><p><strong>Seller or brand.</strong> " +
      card.esc(row.seller) + "</p><p><strong>Date.</strong> " + card.esc(row.date) +
      "</p><p><strong>Agency.</strong> " + card.esc(row.agency) + "</p><p>" + link + "</p></article>");
  }
  const note = Array.isArray(table.note)
    ? "<p>" + officialSpans(table.note, guide.slug + " recall note") + "</p>"
    : "";
  return '<section class="model-card" id="' + card.esc(table.id) + '"><h2>' + card.esc(table.heading) + "</h2><p>" +
    intro + '</p><div class="model-scroll"><table class="model-table"><thead>' + head + "</thead><tbody>" +
    body.join("") + '</tbody></table></div><div class="model-stack">' + stack.join("") + "</div>" + note + "</section>";
}

function toyGuideHtml(guide) {
  const url = ORIGIN + toyPath(guide);
  const main = sceneBlock("toy-safety") + toyCrumbs(guide.h1) +
    "<h1>" + card.esc(guide.h1) + "</h1>" +
    '<p class="lede">' + card.esc(guide.description) + "</p>" +
    toyAnswerCard(guide) +
    toyRecallTable(guide) +
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
    toyAnswerCard(guide);
    toyRecallTable(guide);
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
    "turkey-temperatures": ["fsis.usda.gov", "cpsc.gov", "canada.ca"],
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
    '<p>Read the label, then search the product on <a href="' + CPSC_SEARCH + '" target="_blank" rel="noopener">CPSC Recalls</a> or <a href="' + HC_SEARCH + '" target="_blank" rel="noopener">Health Canada recalls and safety alerts</a>. Turkey temperatures on this page come from <a href="https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/poultry/turkey-basics-safe-cooking" target="_blank" rel="noopener">USDA FSIS</a> and <a href="https://www.canada.ca/en/health-canada/services/general-food-safety-tips/safe-internal-cooking-temperatures.html" target="_blank" rel="noopener">Health Canada’s safe cooking temperatures</a>. Cooking-fire guidance comes from <a href="https://www.nfpa.org/-/media/project/storefront/catalog/files/home-fire-safety/emac/educationalmessagesdeskreference.pdf" target="_blank" rel="noopener">NFPA</a> and <a href="https://www.usfa.fema.gov/prevention/home-fires/prepare-for-fire/fire-extinguishers/" target="_blank" rel="noopener">USFA</a>. <a href="/how-we-check/">How we check</a> says what a dated catalogue line means. These guides are not catalogue cards. <a href="/recalls/">Recall checks</a> lists every catalogue model. <a href="/gifts/for-the-host/">Gifts for the host</a> names widely sold hosting tools and the check to do. <a href="/winter-safety/">Winter home safety</a> covers heaters, heated bedding, alarms, and outage power.</p>' +
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

function thanksPageExists(href, where) {
  if (typeof href !== "string" || !href.startsWith("/")) throw new Error("Buying link: " + href + " on " + where);
  const hashAt = href.indexOf("#");
  const path = hashAt >= 0 ? href.slice(0, hashAt) : href;
  const id = hashAt >= 0 ? href.slice(hashAt + 1) : "";
  if (!/^\/(?:[a-z0-9-]+\/)+$/.test(path)) throw new Error("Buying link: " + href + " on " + where);
  if (id && !/^[a-z0-9-]+$/.test(id)) throw new Error("Buying anchor: " + href + " on " + where);
  const file = join(root, path.slice(1), "index.html");
  if (!existsSync(file)) throw new Error("Buying page missing: " + path + " on " + where);
  if (id && !readFileSync(file, "utf8").includes('id="' + id + '"')) {
    throw new Error("Buying anchor missing: " + href + " on " + where);
  }
}

function thanksNum(item, where) {
  if (Array.isArray(item.numLinks) && item.numLinks.length) {
    return item.numLinks.map((part, index) => {
      if (!part || typeof part.text !== "string" || !part.text) throw new Error("Answer number: " + where);
      if (!part.href) return card.esc(part.text);
      assertOfficialHref(part.href, where + " num " + index);
      const extra = part.href.startsWith("/") ? "" : ' target="_blank" rel="noopener"';
      return '<a href="' + card.esc(part.href) + '"' + extra + ">" + card.esc(part.text) + "</a>";
    }).join("");
  }
  if (!item.num) throw new Error("Answer card: " + where);
  return card.esc(item.num);
}

function thanksAnswer(guide) {
  if (!guide.answer) return "";
  if (!Array.isArray(guide.answer) || guide.answer.length < 2) throw new Error("Thanksgiving answer cards: " + guide.slug);
  const cards = guide.answer.map((item, index) => {
    if (!item || !item.place || !item.num) throw new Error("Answer card: " + guide.slug);
    assertWinterCopy(item.place + " " + item.num, guide.slug + " answer");
    const where = guide.slug + " answer " + index;
    let body = "";
    if (Array.isArray(item.points) && item.points.length) {
      body = "<ul>" + item.points.map((spans, point) =>
        "<li>" + officialSpans(spans, where + " point " + point) + "</li>"
      ).join("") + "</ul>";
    } else if (Array.isArray(item.body) && item.body.length) {
      body = "<p>" + officialSpans(item.body, where) + "</p>";
    } else {
      throw new Error("Answer card body: " + guide.slug);
    }
    return '<article class="answer-card"><p class="answer-place">' + card.esc(item.place) +
      '</p><p class="answer-num">' + thanksNum(item, where) + "</p>" + body + "</article>";
  }).join("");
  return '<div class="answer-split">' + cards + "</div>";
}

function thanksRecallCard(guide) {
  const block = guide.recallCard;
  if (!block) return "";
  if (!block.heading || !Array.isArray(block.intro) || !Array.isArray(block.rows) || block.rows.length < 2) {
    throw new Error("Recall card: " + guide.slug);
  }
  assertWinterCopy(block.heading, guide.slug + " recall");
  const intro = officialSpans(block.intro, guide.slug + " recall intro");
  const rows = "<ul>" + block.rows.map((row, index) => {
    if (!Array.isArray(row)) throw new Error("Recall row: " + guide.slug);
    return "<li>" + officialSpans(row, guide.slug + " recall " + index) + "</li>";
  }).join("") + "</ul>";
  return '<div class="answer-stack"><article class="answer-card" id="is-my-turkey-fryer-recalled"><h2>' +
    card.esc(block.heading) + "</h2><p>" + intro + "</p>" + rows + "</article></div>";
}

function thanksSpecTile(tile, where) {
  if (!tile || !tile.brand || !tile.model) throw new Error("Gear tile: " + where);
  assertWinterCopy(tile.brand + " " + tile.model + " " + (tile.facts || ""), where);
  return '<div class="spec-tile" data-cat="kitchen"><p class="spec-brand">' + card.esc(tile.brand) +
    '</p><p class="spec-model">' + card.esc(tile.model) + "</p>" +
    (tile.facts ? '<p class="spec-facts">' + card.esc(tile.facts) + "</p>" : "") + "</div>";
}

function thanksBuying(guide) {
  const block = guide.buying;
  if (!block || !Array.isArray(block.text) || !Array.isArray(block.links)) {
    throw new Error("Thanksgiving buying section: " + guide.slug);
  }
  if (block.links.length < 1 || block.links.length > 4) throw new Error("Thanksgiving buying links: " + guide.slug);
  const intro = officialSpans(block.text, guide.slug + " buying");
  const heading = block.heading || "If you're buying one";
  assertWinterCopy(heading, guide.slug + " buying heading");
  const headingHtml = block.heading ? card.esc(block.heading) : "If you're buying one";
  const tiled = new Set((block.tiles || []).map((tile) => tile && tile.href).filter(Boolean));
  const items = block.links.filter((link) => !tiled.has(link.href)).map((link) => {
    if (!link || !link.href || !link.label) throw new Error("Buying link: " + guide.slug);
    thanksPageExists(link.href, guide.slug);
    assertWinterCopy(link.label + " " + (link.note || ""), guide.slug + " buying link");
    const tile = link.tile ? thanksSpecTile(link.tile, guide.slug + " " + link.label) : "";
    const note = link.note ? "<p>" + card.esc(link.note) + "</p>" : "";
    return "<li>" + tile + '<a href="' + card.esc(link.href) + '">' + card.esc(link.label) + "</a>" + note + "</li>";
  }).join("");
  for (const link of block.links) {
    if (!link || !link.href || !link.label) throw new Error("Buying link: " + guide.slug);
    thanksPageExists(link.href, guide.slug);
    assertWinterCopy(link.label + " " + (link.note || ""), guide.slug + " buying link");
  }
  const gear = block.includeSearches ? thanksGear(guide) : "";
  const id = block.id || "if-youre-buying-one";
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error("Buying id: " + guide.slug);
  const list = items ? '<ul class="buy-list">' + items + "</ul>" : "";
  return '<section class="buying" id="' + id + '"><h2>' + headingHtml + "</h2><p>" +
    intro + "</p>" + list + gear + "</section>";
}

function thanksGear(guide) {
  const tiles = guide.buying.tiles || [];
  if (tiles.length !== guide.searches.length) throw new Error("Gear tiles: " + guide.slug);
  return guide.searches.map((query, index) => {
    const tile = tiles[index];
    let link = "";
    if (tile.href) {
      if (!tile.label) throw new Error("Gear link: " + guide.slug);
      thanksPageExists(tile.href, guide.slug);
      assertWinterCopy(tile.label + " " + (tile.note || ""), guide.slug + " gear link");
      link = '<p><a href="' + card.esc(tile.href) + '">' + card.esc(tile.label) + "</a></p>";
    }
    const note = tile.note ? "<p>" + card.esc(tile.note) + "</p>" : "";
    return '<div class="gear-item">' + thanksSpecTile(tile, guide.slug + " gear " + index) + link + note +
      winterSearchButtons({ slug: guide.slug, searches: [query] }) + "</div>";
  }).join("");
}

function thanksGuideHtml(guide) {
  const url = ORIGIN + thanksPath(guide);
  const folds =
    productFold("what-to-read", "What to read on the label", thanksLook(guide)) +
    productFold("how-to-search", "How to search a recall", winterMethod(guide)) +
    productFold("official-notices", "Patterns in official notices",
      "<p>Each pattern below is one official page. The sentence is what that page says.</p>" + thanksPatternsHtml(guide)) +
    productFold("how-we-check-notes", "How we check",
      "<p>" + card.esc(WINTER_CHECK) + ' <a href="/how-we-check/">How we check</a>.</p>') +
    productFold("catalogue-cards", "Catalogue cards", winterCatalogueHtml(guide) + thanksMoreLinks(guide)) +
    (guide.buying && guide.buying.includeSearches ? "" : productFold("amazon-search", "Amazon search",
      "<p>The button opens the Amazon search for the words under it. It is not a product page.</p>" + winterSearchButtons(guide)));
  const lead = '<p class="lede">' + card.esc(guide.description) + "</p>";
  const answer = thanksAnswer(guide);
  const recall = thanksRecallCard(guide);
  const note = Array.isArray(guide.note) ? "<p>" + officialSpans(guide.note, guide.slug + " note") + "</p>" : "";
  const top = guide.answerFirst
    ? (guide.recallFirst ? recall + answer : answer + recall) + note
    : lead + answer + recall + note;
  const main = sceneBlock("thanksgiving") + thanksCrumbs(guide.h1) +
    "<h1>" + card.esc(guide.h1) + "</h1>" +
    top +
    thanksJumps(guide.slug) +
    thanksBuying(guide) +
    folds +
    winterFaqsHtml(guide.faqs, guide.slug, Boolean(guide.faqFold));
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
    thanksAnswer(guide);
    thanksBuying(guide);
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
    if (guide.answerCard) {
      const answerAt = html.indexOf('id="' + guide.answerCard.id + '"');
      const lookAt = html.indexOf("<h2>What to read on the label</h2>");
      if (answerAt < 0 || lookAt < 0 || answerAt > lookAt) throw new Error("Answer card is not above the label list: " + guide.slug);
      if (!html.includes("<h2>" + card.esc(guide.answerCard.heading) + "</h2>")) throw new Error("Answer card heading " + guide.slug);
    }
    if (guide.recallTable) {
      if (!html.includes('id="' + guide.recallTable.id + '"')) throw new Error("Recall table " + guide.slug);
      for (const row of guide.recallTable.rows) {
        if (!html.includes('href="' + card.esc(row.url) + '"')) throw new Error("Recall row link " + row.url);
      }
    }
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
      if (!html.includes(expectedFaqAnswer(item, guide.slug))) throw new Error("Toy FAQ answer " + guide.slug);
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
    const buyHeading = (guide.buying && guide.buying.heading) ? card.esc(guide.buying.heading) : "If you're buying one";
    const buyId = (guide.buying && guide.buying.id) || "if-youre-buying-one";
    if (!html.includes("<h2>" + buyHeading + "</h2>") || !html.includes('id="' + buyId + '"')) {
      throw new Error("Thanksgiving buying section " + guide.slug);
    }
    if (guide.answerFirst) {
      const answerAt = html.indexOf('class="answer-split"');
      const foldAt = html.indexOf('<details class="fold"');
      if (answerAt < 0 || foldAt < 0 || answerAt > foldAt) throw new Error("Answer card is not before the folds: " + guide.slug);
    }
    for (const other of thanksGuides()) {
      if (other.slug !== guide.slug && !html.includes('href="' + thanksPath(other) + '"')) {
        throw new Error("Thanksgiving guide misses " + other.slug + " on " + guide.slug);
      }
    }
    if (guide.slug === "turkey-temperatures") {
      for (const bit of ["165°F", "82°C", "74°C", "73.9°C", "71.1°C", 'class="answer-split"', "Gear that helps", "Is 160°F safe for turkey?", "Safe turkey temp in Celsius", "Where to put the thermometer", "instant-read meat thermometer", "leave-in meat thermometer"]) {
        if (!html.includes(bit)) throw new Error("Turkey temperature answer missing " + bit);
      }
      for (const url of [
        "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/poultry/turkey-basics-safe-cooking",
        "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart",
        "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/poultry/lets-talk-turkey-roasting",
        "https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures",
        "https://www.canada.ca/en/health-canada/services/general-food-safety-tips/safe-internal-cooking-temperatures.html",
        "https://www.canada.ca/en/health-canada/services/meat-poultry-fish-seafood-safety/poultry-safety.html"
      ]) {
        if (!html.includes(url)) throw new Error("Turkey temperatures miss " + url);
      }
      if ((html.match(/As an Amazon Associate/g) || []).length !== 1) {
        throw new Error("Turkey temperatures disclosure count");
      }
    }
    if (guide.slug === "turkey-fryers") {
      for (const bit of ["Is my turkey fryer recalled?", "157826", "19-067", "February 19, 2019", "November 20, 2026", "Masterbuilt", "Char-Broil", "Bayou Classic", "Outdoor Gourmet Turkey Keg"]) {
        if (!html.includes(bit)) throw new Error("Turkey fryer recall card missing " + bit);
      }
      if ((html.match(/As an Amazon Associate/g) || []).length !== 1) {
        throw new Error("Turkey fryers disclosure count");
      }
    }
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
      if (!html.includes(expectedFaqAnswer(item, guide.slug))) throw new Error("Thanksgiving FAQ answer " + guide.slug);
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
      if (!html.includes(expectedFaqAnswer(item, guide.slug))) throw new Error("Winter FAQ answer " + guide.slug);
      if (guide.slug === "electric-blankets" && !html.includes('href="/recalls/heated-blanket-recalls/#brand-check"')) {
        throw new Error("Electric blankets page misses the brand check");
      }
      if (guide.slug === "electric-blankets") {
        if (!html.includes(">Heated blanket recalls by brand</h2>")) throw new Error("Electric blankets page misses the brand table");
        const none = html.match(/No CPSC or Health Canada recall found as of Nov 2026/g) || [];
        if (none.length < 3) throw new Error("Electric blankets page misses a no-recall line");
        if (!html.includes('href="https://www.cpsc.gov/Recalls/2023/Bedshe-International-Recalls-Bedsure-Electric-Heating-Blankets-and-Pads-Due-to-Fire-and-Thermal-Burn-Hazards-Recall-Alert"')) {
          throw new Error("Electric blankets page misses the Bedsure notice");
        }
      }
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

function tidyAuthor(name) {
  const text = String(name || "").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean);
  if (words.length >= 2 && words.length % 2 === 0) {
    const mid = words.length / 2;
    const left = words.slice(0, mid).join(" ");
    const right = words.slice(mid).join(" ");
    if (left.toLowerCase() === right.toLowerCase()) return left;
  }
  return text || "Photographer";
}

function extLink(href, label) {
  return '<a href="' + card.esc(href) + '" target="_blank" rel="noopener">' + card.esc(label) + "</a>";
}

function writePhotoCredits() {
  const photos = JSON.parse(readFileSync(join(root, "data", "photos.json"), "utf8"));
  const lifestyle = photos.map((photo) =>
    '<li class="credit-line"><span class="credit-author">' + extLink(photo.source, tidyAuthor(photo.credit)) + '</span><span class="credit-sep" aria-hidden="true"> · </span>' +
    '<span class="credit-license">' + card.esc(photo.license) + "</span> · " + card.esc(photo.use) + "</li>"
  ).join("\n");
  const catalogue = products.filter((product) => product.imageKind === "model" && product.imageSource).map((product) => {
    const author = tidyAuthor(product.imageAuthor || creditAuthor(product.imageCredit) || "Photographer");
    const license = product.imageLicense || "";
    const licenseHref = product.imageLicenseUrl || licenseUrlFor(license);
    const shows = product.imageShows || product.title;
    const who = extLink(product.imageSource, author);
    const terms = licenseHref ? extLink(licenseHref, license || "License") : card.esc(license);
    const source = extLink(product.imageSource, "Source page");
    return '<li class="credit-line"><span class="credit-author">' + who + '</span><span class="credit-sep" aria-hidden="true"> · </span>' +
      '<span class="credit-license">' + terms + "</span> · " + source + " · Shows: " + card.esc(shows) +
      " · " + card.esc(product.title) + "</li>";
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

function homeMain(parts) {
  const date = recalls.checkedAt || "";
  const when = checkedLabel(date).replace(/^CPSC & Health Canada checked · /, "");
  return `<main id="main">
<section class="hero-band">
<div class="wrap hero-grid">
<div>
<p class="kicker">Independent Recall &amp; Model Verification · US &amp; Canada</p>
<h1>Check any product for recalls before you buy.</h1>
<p class="deck">Confirm the model, the recall record, and the maker specs before you buy.</p>
<form class="lookup-box" action="/" method="get" role="search">
<label class="visually-hidden" for="home-q">Model or brand</label>
<input id="home-q" name="q" data-model-search type="search" placeholder="Model, brand, or product" autocomplete="off" enterkeyhint="search">
<button type="submit">Check record</button>
</form>
<div class="quick-links">
<span>Jump to</span>
<a href="/recalls/heated-blanket-recalls/">Heated blanket recalls</a>
<a href="/best/air-purifiers/">Air purifiers</a>
<a href="/recalls/anker-power-banks/">Power banks</a>
<a href="/kitchen/">Kitchen</a>
<a href="#categories">All 8 categories</a>
</div>
</div>
${deskHtml()}
</div>
</section>
<section class="section" id="popular">
<div class="wrap">
<div class="section-head">
<div>
<h2 id="popular-title">Recently recall-checked</h2>
<p class="section-sub">Model records checked against CPSC and Health Canada on ${card.esc(when)}.</p>
</div>
<a href="/recalls/">All recall checks →</a>
</div>
<p id="search-empty" class="empty" hidden>No model matches that.</p>
<div id="popular-mount" class="prod-grid" data-rendered-region="US">
${parts.popular}
</div>
</div>
</section>
<section class="section" id="categories">
<div class="wrap">
<div class="section-head"><div><h2>Browse by category</h2><p class="section-sub">Guides organized by room and the recall check. No sponsored placements.</p></div></div>
<div class="cat-grid">
<div class="cat-box"><h3>Kitchen</h3><ul>
<li><a href="/kitchen/">Kitchen models</a></li>
<li><a href="/best/">Best guides</a></li>
<li><a href="/recalls/air-fryer-recalls/">Air fryer recalls</a></li>
<li><a href="/thanksgiving/">Thanksgiving</a></li>
</ul></div>
<div class="cat-box"><h3>Air &amp; water</h3><ul>
<li><a href="/air-water/">Air &amp; water models</a></li>
<li><a href="/best/air-purifiers/">Air purifiers</a></li>
<li><a href="/winter-safety/carbon-monoxide-smoke-alarms/">Smoke and CO alarms</a></li>
<li><a href="/compare/">Spec comparisons</a></li>
</ul></div>
<div class="cat-box"><h3>Winter &amp; sleep</h3><ul>
<li><a href="/recalls/heated-blanket-recalls/">Heated blanket recalls</a></li>
<li><a href="/winter-safety/">Winter safety</a></li>
<li><a href="/winter/">Winter models</a></li>
<li><a href="/sleep/">Sleep</a></li>
</ul></div>
<div class="cat-box"><h3>Personal tech &amp; home</h3><ul>
<li><a href="/recalls/anker-power-banks/">Anker power banks</a></li>
<li><a href="/personal-tech/">Personal tech</a></li>
<li><a href="/cleaning/">Cleaning</a></li>
<li><a href="/toy-safety/">Toy safety</a></li>
</ul></div>
</div>
<p class="quick-links"><span>Also</span><a href="/gifts/">Gift guides</a><a href="/black-friday/">Black Friday</a><a href="/pet/">Pet</a><a href="/car-garage/">Car &amp; garage</a></p>
</div>
</section>
<section class="section" id="how">
<div class="wrap">
<div class="method-strip">
<div class="method-step"><strong>01 · Model match</strong><h3>Exact model number first</h3><p>The brand and model are matched to the CPSC SaferProducts feed and the Health Canada open dataset. The date on the card is the day that match was recorded.</p></div>
<div class="method-step"><strong>02 · Official databases</strong><h3>CPSC &amp; Health Canada</h3><p>The numbers come from the brand’s product page, with the source link beside them. Search the same model on CPSC Recalls and on Health Canada recalls and safety alerts.</p></div>
<div class="method-step"><strong>03 · Honest visuals</strong><h3>Real photos or spec cards</h3><p>An exact model photo stays on the card. Anything else is a typographic spec card. The buttons open the store. Prices stay on the store.</p></div>
</div>
<p class="method-more"><a href="/how-we-check/">Read the full method</a></p>
</div>
</section>
<section class="section guide-band" id="home-bf">
<div class="wrap">
<h2 id="home-bf-title">Worth checking this Black Friday</h2>
${parts.bf}
${parts.pointer}
<details class="fold" id="latest-recalls"><summary><h2>Latest official recalls</h2></summary><div class="fold-body"><div id="recall-mount" class="prod-grid">${parts.recalls}</div></div></details>
${parts.guide}
${parts.widget || ""}
${parts.quiz || ""}
</div>
</section>
</main>`;
}

function deskHtml() {
  const rows = [];
  for (const entry of explainers) {
    for (const notice of entry.notices || []) {
      if (!notice || !notice.date) continue;
      rows.push({ entry, notice });
    }
  }
  rows.sort((a, b) => String(b.notice.date).localeCompare(String(a.notice.date)));
  const seen = new Set();
  const picked = [];
  for (const row of rows) {
    const key = row.notice.product || row.notice.title || row.entry.slug;
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(row);
    if (picked.length === 4) break;
  }
  const body = picked.map(({ entry, notice }) => {
    const models = (notice.models || []).slice(0, 3).join(", ");
    const meta = [models, notice.agency, notice.date].filter(Boolean).join(" · ");
    return '<div class="desk-row">' + verdictBadge(noticeKind(notice)) +
      '<div><a class="desk-row-title" href="/recalls/' + entry.slug + '/">' + card.esc(notice.product || entry.title) + "</a>" +
      '<div class="desk-row-meta">' + card.esc(meta) + "</div></div></div>";
  }).join("");
  return '<aside class="desk-box" id="desk" aria-label="Latest recall checks"><div class="desk-head"><h2 class="desk-title">Recall Desk · Latest Checks</h2><a class="desk-more" href="/recalls/">All notices →</a></div>' + body + "</aside>";
}

function reshapeHome(html) {
  const take = (re) => {
    const match = html.match(re);
    if (!match) return "";
    html = html.replace(match[0], "");
    return match[0];
  };
  const guide = take(/<!-- checkedlab:guide start -->[\s\S]*?<!-- checkedlab:guide end -->/);
  const popular = take(/<!-- checkedlab:popular start -->[\s\S]*?<!-- checkedlab:popular end -->/);
  const bf = take(/<!-- checkedlab:bf-home start -->[\s\S]*?<!-- checkedlab:bf-home end -->/);
  const pointer = take(/<!-- checkedlab:recall-home start -->[\s\S]*?<!-- checkedlab:recall-home end -->/);
  take(/<!-- checkedlab:recalls start -->[\s\S]*?<!-- checkedlab:recalls end -->/);
  const widget = take(/<section class="recall-widget"[\s\S]*?<\/section>/);
  const quiz = take(/<section class="quiz"[\s\S]*?<\/section>/);
  if (!guide || !popular || !bf || !pointer) throw new Error("Home reshape is missing a mount");
  card.beginPage();
  const recalled = products.filter(isBin);
  const recalls = REC_START + "\n" + (recalled.length
    ? recalled.map((product) => card.card(product, "US")).join("\n")
    : '<p class="empty">No official model recall is on the list.</p>') + "\n" + REC_END;
  const main = homeMain({ guide, popular, bf, pointer, widget, quiz, recalls });
  if (!html.includes('<main id="main">')) throw new Error("Homepage main is missing");
  html = html.replace(/<main id="main">[\s\S]*?<\/main>/, main);
  html = html.replace(/<section class="recall-band"[\s\S]*?<\/section>\s*/g, "");
  return html;
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

function winnipegDate(when = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Winnipeg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(when);
  const pick = (type) => {
    const part = parts.find((item) => item.type === type);
    return part ? part.value : "";
  };
  const date = pick("year") + "-" + pick("month") + "-" + pick("day");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Winnipeg date is not a calendar day: " + date);
  return date;
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
  const today = winnipegDate();
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

// Opt-in. A normal build must not spawn Python or rewrite /social.
// fontTools without brotli crashes while reading the woff2 files, and a
// successful run re-encodes every Short.
function renderSocialAssets() {
  if (process.env.RENDER_SOCIAL !== "1") return;
  const probe = spawnSync("python3", ["-c", "import PIL, fontTools, brotli"], { encoding: "utf8" });
  if (probe.status !== 0) {
    const detail = (probe.stderr || probe.stdout || "").trim();
    throw new Error("RENDER_SOCIAL=1 but Pillow, fontTools, or brotli is missing. " + detail);
  }
  const run = spawnSync("python3", [join(root, "scripts", "render-social.py")], { stdio: "inherit" });
  if (run.status !== 0) throw new Error("Social renderer failed");
}

function assertSocialCopy() {
  const dir = join(root, "social");
  const files = walkFiles(dir).filter((file) => /\.(md|txt|html)$/i.test(file));
  if (!files.length) throw new Error("Social copy scan found no text");
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    const rel = "/social/" + file.slice(dir.length + 1).split("\\").join("/");
    const banned = text.match(SOCIAL_COPY_BAN);
    if (banned) {
      const at = Math.max(0, banned.index - 40);
      const snippet = text.slice(at, banned.index + banned[0].length + 40).replace(/\s+/g, " ").trim();
      throw new Error("Social copy ban on " + rel + ": " + banned[0] + " near “" + snippet + "”");
    }
    for (const match of text.matchAll(/^Title:\s*(.+)$/gm)) {
      const title = match[1].trim();
      if (title.length > 60) throw new Error("Social title is " + title.length + " characters on " + rel + ": " + title);
    }
  }
  console.log("Social copy check: " + files.length + " text file" + (files.length === 1 ? "" : "s") + ".");
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
    "2026-11/ig/06-airpods-cover.png",
    "2026-11/ig/06-airpods-cta.png",
    "2026-11/ig/06-airpods-table.png",
    "2026-11/ig/07-vitamix-cover.png",
    "2026-11/ig/07-vitamix-cta.png",
    "2026-11/ig/07-vitamix-table.png",
    "2026-11/captions-week2.md",
    "2026-11/captions-week3.md",
    "2026-11/ig/08-dyson-v8-v10-cover.png",
    "2026-11/ig/08-dyson-v8-v10-cta.png",
    "2026-11/ig/08-dyson-v8-v10-table.png",
    "2026-11/ig/09-sony-xm-cover.png",
    "2026-11/ig/09-sony-xm-cta.png",
    "2026-11/ig/09-sony-xm-table.png",
    "2026-11/ig/10-kitchenaid-cover.png",
    "2026-11/ig/10-kitchenaid-cta.png",
    "2026-11/ig/10-kitchenaid-table.png",
    "2026-11/ig/11-allclad-cover.png",
    "2026-11/ig/11-allclad-cta.png",
    "2026-11/ig/11-allclad-table.png",
    "2026-11/ig/12-rice-cover.png",
    "2026-11/ig/12-rice-cta.png",
    "2026-11/ig/12-rice-table.png",
    "2026-11/ig/13-buddy-cover.png",
    "2026-11/ig/13-buddy-cta.png",
    "2026-11/ig/13-buddy-table.png",
    "2026-11/shorts/airpods-pro-3-vs-pro-2.mp4",
    "2026-11/shorts/allclad-d3-vs-d5.mp4",
    "2026-11/shorts/black-friday-recall-check.mp4",
    "2026-11/shorts/dyson-v15-vs-v8.mp4",
    "2026-11/shorts/dyson-v8-vs-v10.mp4",
    "2026-11/shorts/kitchenaid-artisan-vs-classic.mp4",
    "2026-11/shorts/mr-heater-buddy-vs-big-buddy.mp4",
    "2026-11/shorts/sony-xm5-vs-bose-qc-ultra.mp4",
    "2026-11/shorts/sony-xm5-vs-xm6.mp4",
    "2026-11/shorts/vitamix-e310-vs-e320.mp4",
    "2026-11/shorts/zojirushi-vs-tiger.mp4"
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
  const footer = html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/);
  if (count !== 1 || !footer || !footer[0].includes(DISCLOSURE)) throw new Error(message);
  if (/Affiliate disclosure\.|I earn from qualifying|earn us nothing/.test(html)) throw new Error(message);
}

function assertReviewFixes() {
  const cuisinart = readFileSync(join(root, "kitchen", "cuisinart-dfp-14bcny", "index.html"), "utf8");
  if (cuisinart.includes("badge-clear") || cuisinart.includes("Clear · CPSC + HC")) {
    throw new Error("Cuisinart page still shows a clear badge");
  }
  if (!cuisinart.includes("BIN · Recalled")) throw new Error("Cuisinart page is missing the BIN badge");
  if (!cuisinart.includes('<details class="fold" open>') || !cuisinart.includes('id="specs"')) {
    throw new Error("Product folds are not open");
  }
  if (!cuisinart.includes('class="fold-caret"') || !cuisinart.includes("hero-specs")) {
    throw new Error("Product page is missing the caret or the spec strip");
  }
  if (cuisinart.includes("data-dock")) throw new Error("Sticky dock is still on the product page");
  const blankets = readFileSync(join(root, "recalls", "heated-blanket-recalls", "index.html"), "utf8");
  for (const id of ["brand-jkmax", "brand-octrot"]) {
    const at = blankets.indexOf('id="' + id + '"');
    const slice = blankets.slice(at, at + 400);
    if (!slice.includes("BIN · Recalled")) throw new Error(id + " is not BIN · Recalled");
  }
  if (blankets.indexOf('id="brand-check"') > blankets.indexOf('id="full-list"')) {
    throw new Error("Brand cards are below the full list");
  }
  if (!blankets.includes('class="notice-chips"')) throw new Error("Notice links are not chips");
  const anker = readFileSync(join(root, "recalls", "anker-power-banks", "index.html"), "utf8");
  if (anker.includes("<h3>On the bottom</h3>")) throw new Error("Anker cards still share the On the bottom title");
  if (!anker.includes("<h3>A1263 serial</h3>") || !anker.includes("<h3>A1112011 serial</h3>")) {
    throw new Error("Anker serial cards are missing distinct titles");
  }
  const credits = readFileSync(join(root, "photo-credits", "index.html"), "utf8");
  if (credits.includes("Unknown author Unknown author") || credits.includes("SureshCC")) {
    throw new Error("Photo credits still run the author into the licence");
  }
  if (!credits.includes('class="credit-sep"')) throw new Error("Photo credits are missing the author separator");
  const coway = readFileSync(join(root, "air-water", "coway-ap-1512hh", "index.html"), "utf8");
  const tile = coway.slice(coway.indexOf("spec-model"), coway.indexOf("spec-model") + 80);
  if (!tile.includes("AP-1512HH") || tile.includes("Airmega")) throw new Error("Coway spec tile repeats the product name");
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
    const found = [...html.matchAll(/<article class="(?:product-grid hub-card|product-row)[^"]*"[\s\S]*?<\/article>/g)].map((match) => match[0]);
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
  if (!binEmptyHtml("2026-11-10").includes("No listed model is binned as of 2026-11-10.")) {
    throw new Error("Empty BIN state is not readable");
  }
  if (!recallPage.includes("No listed model is binned as of") && !recallPage.includes("These listed models match an official notice.")) {
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
  if (!home.includes('id="home-bf"') || !home.includes('href="/black-friday/#worth-checking"')) {
    throw new Error("Homepage is missing the Black Friday shortlist");
  }
  for (const item of HOME_BF) {
    const product = products.find((entry) => entry.id === item.id);
    if (!home.includes(card.esc(item.who)) || !home.includes('href="' + card.productPath(product) + '"')) {
      throw new Error("Homepage shortlist misses " + item.id);
    }
  }
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
  assertReviewFixes();
  assertBuyerPicks();
  assertAllPageVoice();
  assertHubReaderText();
  assertSocialCopy();
}

function assertBuyerPicks() {
  const pages = [];
  for (const [section, list] of editorialLists()) {
    for (const entry of list) {
      const where = section + "/" + entry.slug;
      if (!VOICE_PAGES.has(where)) continue;
      pages.push([join(root, section, entry.slug, "index.html"), [entry.subject, ...(entry.others || [])], where]);
    }
  }
  for (const entry of explainers) {
    const where = "recalls/" + entry.slug;
    if (!VOICE_PAGES.has(where)) continue;
    pages.push([join(root, "recalls", entry.slug, "index.html"), entry.products, where]);
  }
  if (pages.length !== VOICE_PAGES.size) throw new Error("Expected " + VOICE_PAGES.size + " voice pages, found " + pages.length);
  for (const [file, ids, where] of pages) {
    const html = readFileSync(file, "utf8");
    if (html.includes("Pick it for:")) throw new Error("Spec pick line still on " + where);
    for (const id of ids) {
      const reason = buyerReason(id);
      if (!reason) throw new Error("No buyer reason for " + id + " on " + where);
      if (!html.includes(card.esc(reason))) throw new Error("Buyer reason missing for " + id + " on " + where);
    }
    if (where.startsWith("recalls/") && (!html.includes('class="recall-stack"') || !html.includes("<summary>Model numbers</summary>"))) {
      throw new Error("Recall stack missing on " + where);
    }
    assertPageVoice(html, where);
  }
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
    const usStatus = product.recall && product.recall.us && product.recall.us.status;
    const caStatus = product.recall && product.recall.ca && product.recall.ca.status;
    if ((usStatus === "bin" || caStatus === "bin") && (html.includes("badge-clear") || html.includes("Clear · CPSC + HC"))) {
      throw new Error("Clear badge on a recalled model: " + product.id);
    }
}

function indexable(product) {
  return Array.isArray(product.specs) && product.specs.length >= 3;
}
