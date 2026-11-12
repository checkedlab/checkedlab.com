/* Card markup shared by the static build and the browser.
   No price, stock, or check time is rendered. */
(function (factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.CheckedLabCard = api;
})(function () {
  var REL = "sponsored nofollow noopener";
  var STORES = {
    US: [
      { id: "amazon", name: "Amazon", label: "Check price on Amazon" },
      { id: "bestbuy", name: "Best Buy", label: "Check price at Best Buy" },
      { id: "walmart", name: "Walmart", label: "Check price at Walmart" },
      { id: "target", name: "Target", label: "Check price at Target" },
      { id: "homedepot", name: "Home Depot", label: "Check price at Home Depot" }
    ],
    CA: [
      { id: "amazon", name: "Amazon", label: "Check price on Amazon" },
      { id: "bestbuy", name: "Best Buy", label: "Check price at Best Buy" },
      { id: "canadiantire", name: "Canadian Tire", label: "Check price at Canadian Tire" },
      { id: "walmart", name: "Walmart", label: "Check price at Walmart" },
      { id: "wayfair", name: "Wayfair", label: "Check price at Wayfair" }
    ]
  };

  function origin() {
    if (typeof window !== "undefined" && window.location && window.location.origin) {
      return window.location.origin;
    }
    return "https://www.checkedlab.com";
  }

  function regionKey(reg) {
    return reg === "CA" ? "ca" : "us";
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function safeUrl(url) {
    if (!url || typeof url !== "string") return "";
    try {
      var u = new URL(url, origin());
      if (u.protocol === "https:" || u.protocol === "http:") return u.href;
    } catch (e) {}
    return "";
  }

  function queryFor(product) {
    var q = product.searchQuery || product.title || "";
    return String(q).trim();
  }

  function amazonAsin(product, reg) {
    var asin = product.asin && product.asin[regionKey(reg)];
    if (typeof asin === "string" && /^[A-Z0-9]{10}$/.test(asin)) return asin;
    return "";
  }

  function storeUrl(product, reg, storeId) {
    var q = encodeURIComponent(queryFor(product));
    if (storeId === "amazon") {
      var asin = amazonAsin(product, reg);
      if (asin) {
        return reg === "CA"
          ? "https://www.amazon.ca/dp/" + asin + "?tag=checkedlab-20"
          : "https://www.amazon.com/dp/" + asin + "?tag=checkedlab01-20";
      }
      return reg === "CA"
        ? "https://www.amazon.ca/s?k=" + q + "&tag=checkedlab-20"
        : "https://www.amazon.com/s?k=" + q + "&tag=checkedlab01-20";
    }
    if (reg === "US") {
      if (storeId === "bestbuy") return "https://www.bestbuy.com/site/searchpage.jsp?st=" + q;
      if (storeId === "walmart") return "https://www.walmart.com/search?q=" + q;
      if (storeId === "target") return "https://www.target.com/s?searchTerm=" + q;
      if (storeId === "homedepot") return "https://www.homedepot.com/s/" + q;
    }
    if (storeId === "bestbuy") return "https://www.bestbuy.ca/en-ca/search?search=" + q;
    if (storeId === "canadiantire") return "https://www.canadiantire.ca/en/search-results.html?q=" + q;
    if (storeId === "walmart") return "https://www.walmart.ca/en/search?q=" + q;
    if (storeId === "wayfair") return "https://www.wayfair.ca/keyword.php?keyword=" + q;
    return "";
  }

  function outbound(url, label) {
    var href = safeUrl(url);
    if (!href) return esc(label);
    return '<a href="' + esc(href) + '" target="_blank" rel="' + REL + '">' + esc(label) + "</a>";
  }

  function recallBlock(rec) {
    rec = rec || { status: "not_recorded" };
    if (rec.status === "bin") {
      var source = rec.url ? " " + outbound(rec.url, "Recall notice") : "";
      return '<p class="recall recall-bin"><strong>Official recall found.</strong> ' + esc(rec.detail || "A recall matches this model.") + source + "</p>";
    }
    if (rec.status === "none" && rec.checkedAt) {
      var html = '<p class="recall recall-clear">No recall found as of ' + recallDate(rec.checkedAt) + ".</p>";
      var other = rec.other || [];
      if (other.length) {
        html += '<p class="recall-other">Other recalls that mention this brand name: ' +
          other.map(function (item) {
            return outbound(item.url, item.title || "Recall");
          }).join("; ") + "</p>";
      }
      return html;
    }
    if (rec.status === "unconfirmed") {
      var links = (rec.other || []).map(function (item) {
        return outbound(item.url, item.title || "Recall");
      }).join("; ");
      return '<p class="recall recall-wait">' + esc(rec.detail || "Recall status is not confirmed for this listing.") +
        (rec.checkedAt ? " Checked " + recallDate(rec.checkedAt) + "." : "") +
        (links ? " " + links : "") + "</p>";
    }
    return '<p class="recall recall-wait">A recall check has not been recorded for this listing.</p>';
  }

  function evidenceList(product) {
    var items = product.evidence || [];
    if (!items.length) return "";
    return "<ul class=\"evidence\">" + items.map(function (item) {
      var note = item.agrees === true ? " The linked page states this." : "";
      var source = item.url ? outbound(item.url, item.source || "Source") : esc(item.source || "Source");
      return "<li>" + esc(item.claim || "") + " " + source + "." + esc(note) + "</li>";
    }).join("") + "</ul>";
  }

  function checkList(product) {
    var items = product.checks || [
      "Confirm the model on the box matches the model named here.",
      "Confirm the store listing is this model, not a similar one.",
      "Read the recall line on this card before you buy."
    ];
    var extra = product.sourceUrl
      ? "<li>Read the model page, then decide. " + outbound(product.sourceUrl, product.sourceName || "Model page") + ".</li>"
      : "";
    return '<h3 class="check-title">What to check before you buy</h3><ul class="evidence">' +
      items.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") +
      extra + "</ul>";
  }

  function storeButtons(product, reg) {
    return '<div class="store-links">' + STORES[reg].map(function (store) {
      var url = storeUrl(product, reg, store.id);
      var primary = store.id === "amazon" ? " store-primary" : "";
      return '<a class="store-btn' + primary + '" href="' + esc(safeUrl(url)) + '" target="_blank" rel="' + REL + '">' + esc(store.label) + "</a>";
    }).join("") + "</div>";
  }

  function amazonButton(product, reg) {
    var store = null;
    for (var i = 0; i < STORES[reg].length; i++) {
      if (STORES[reg][i].id === "amazon") store = STORES[reg][i];
    }
    var url = storeUrl(product, reg, "amazon");
    return '<a class="store-btn store-primary" href="' + esc(safeUrl(url)) + '" target="_blank" rel="' + REL + '">' + esc(store.label) + "</a>";
  }

  function recallFor(product, reg) {
    return (product.recall || {})[regionKey(reg)] || { status: "not_recorded" };
  }

  function badgeHtml(recall) {
    var waiting = recall.status === "unconfirmed" || recall.status === "not_recorded" || !recall.status;
    if (recall.status === "bin") return '<span class="badge badge-bin">Official recall found</span>';
    if (waiting) return '<span class="badge badge-wait">Check model</span>';
    return '<span class="badge badge-clear">Recall checked</span>';
  }

  function honestLine(product, recall) {
    var waiting = recall.status === "unconfirmed" || recall.status === "not_recorded" || !recall.status;
    var hasSpecs = product.evidence && product.evidence.length;
    return waiting
      ? "The model on this card still needs a recall check."
      : "Recall-checked against CPSC and Health Canada." + (hasSpecs ? " Specs are from the maker." : "");
  }

  function amazonImage(product) {
    var meta = product.image_source || {};
    var src = String(product.image || "");
    return meta.kind === "amazon" || /media-amazon\.com|ssl-images-amazon\.com|images-amazon\.com/i.test(src);
  }

  /* A real photo renders only from product.image when that value is an
     http(s) URL (a later PA-API or SiteStripe URL drops into the same slot).
     Files under /images/ are not licensed product photos, so they stay unused. */
  function licensedSrc(product) {
    var src = String(product && product.image || "").trim();
    if (!/^https?:\/\//i.test(src)) return "";
    try {
      var u = new URL(src);
      if (u.protocol !== "https:" && u.protocol !== "http:") return "";
      return u.href;
    } catch (e) {
      return "";
    }
  }

  function imageSrc(product) {
    return licensedSrc(product);
  }

  function recallDate(value) {
    return '<span class="recall-date">' + esc(value) + "</span>";
  }

  function imageTag(product, opts) {
    opts = opts || {};
    var src = imageSrc(product);
    if (!src) return "";
    var meta = product.image_source || {};
    var size = "";
    var width = Number(meta.width) || 0;
    var height = Number(meta.height) || 0;
    if (width && height && /\.webp$/i.test(src)) {
      var scale = Math.min(1, 800 / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    if (width) size += ' width="' + width + '"';
    if (height) size += ' height="' + height + '"';
    var extra = "";
    if (/\.webp$/i.test(src) && meta.width > 400) {
      var fullW = Math.min(800, Number(meta.width));
      var small = src.replace(/\.webp$/i, "-400.webp");
      extra = ' srcset="' + esc(small) + ' 400w, ' + esc(src) + " " + fullW + 'w" sizes="' +
        esc(opts.sizes || "(min-width: 1100px) 220px, 46vw") + '"';
    }
    var load = opts.eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"';
    return '<img src="' + esc(src) + '"' + extra + ' alt="' + esc(product.title) + '"' + size + load + ">";
  }

  function imageFigure(product, reg, opts) {
    var img = imageTag(product, opts);
    if (!img) return "";
    var meta = product.image_source || {};
    var credit = meta.kind === "maker" && meta.credit
      ? '<p class="img-credit">' + esc(meta.credit) + "</p>"
      : "";
    return img + credit;
  }

  function imageHtml(product) {
    return imageFigure(product, "US");
  }

  function photoColumn(product, reg, opts) {
    return '<div class="p-side"><div class="p-img">' + visual(product, opts) + "</div></div>";
  }

  function imageColumn(product) {
    return photoColumn(product, "US", { eager: true, sizes: "(min-width: 800px) 480px, 92vw" });
  }

  function modelLine(product) {
    return product.model || product.meta || "";
  }

  function hubSpecs(product) {
    var specs = (product.specs || []).filter(function (spec) {
      return spec && spec.label && spec.value;
    }).slice(0, 2);
    if (!specs.length) return "";
    return '<ul class="hub-specs">' + specs.map(function (spec) {
      return "<li><span>" + esc(spec.label) + "</span> " + esc(spec.value) + "</li>";
    }).join("") + "</ul>";
  }

  function productPath(product) {
    return "/" + String(product.category || "") + "/" + String(product.id || "") + "/";
  }

  /* Visible titles only. A hyphen between letters or digits is a model token
     (AP-1512HH, 70-N1000s) and must not be a line-break opportunity. */
  function visibleTitle(title) {
    return esc(title).replace(/([A-Za-z0-9])-([A-Za-z0-9])/g, "$1\u2011$2");
  }

  function card(product, reg, opts) {
    opts = opts || {};
    var recall = recallFor(product, reg);
    var href = esc(productPath(product));
    var title = '<h2 class="p-title"><a href="' + href + '">' + visibleTitle(product.title) + "</a></h2>";
    var meta = '<p class="p-meta">' + esc(modelLine(product)) + "</p>";
    var more = '<a class="hub-more" href="' + href + '">See specs and stores</a>';
    var id = ' id="' + esc(product.id) + '" data-category="' + esc(product.category || "") + '"';
    return '<article class="product-grid hub-card"' + id + ">" + photoColumn(product, reg, opts) +
      '<div class="p-main">' + badgeHtml(recall) + noteBadge(product) + title + meta + hubSpecs(product) + more + "</div></article>";
  }

  var artSeq = 0;
  var NOTES = {
    heater: "/winter-safety/space-heaters/",
    blanket: "/winter-safety/electric-blankets/",
    battery: "/winter-safety/portable-power/",
    alarm: "/winter-safety/carbon-monoxide-smoke-alarms/",
    scooter: "/toy-safety/ride-ons-and-scooters/",
    magnet: "/toy-safety/magnets/",
    beads: "/toy-safety/water-beads/",
    jumper: "/winter-safety/portable-power/"
  };
  var MOTIF_BG = {
    blender: ["#FF5A1F", "#FFE14A"],
    mixer: ["#FF3D8A", "#FFE14A"],
    airfryer: ["#FF7A00", "#6D28D9"],
    pot: ["#E11D48", "#FFE14A"],
    processor: ["#6D28D9", "#22D3EE"],
    coffee: ["#7C2D12", "#FFE14A"],
    kettle: ["#0F766E", "#FFE14A"],
    knife: ["#1D4ED8", "#F8FAFC"],
    skillet: ["#C2410C", "#FFE14A"],
    ricecooker: ["#DB2777", "#FFE14A"],
    headphones: ["#4F46E5", "#22D3EE"],
    speaker: ["#0E7490", "#FFE14A"],
    camera: ["#111827", "#22D3EE"],
    keyboard: ["#6D28D9", "#FFE14A"],
    mouse: ["#0369A1", "#FFE14A"],
    brush: ["#0891B2", "#FFE14A"],
    shaver: ["#1E3A8A", "#22D3EE"],
    watch: ["#0F766E", "#F8FAFC"],
    battery: ["#B45309", "#FFE14A"],
    plug: ["#CA8A04", "#1A1240"],
    heater: ["#DC2626", "#FFE14A"],
    humidifier: ["#0284C7", "#F8FAFC"],
    blanket: ["#7C3AED", "#FFE14A"],
    snow: ["#2563EB", "#F8FAFC"],
    bottle: ["#0F766E", "#FFE14A"],
    purifier: ["#0891B2", "#F8FAFC"],
    drop: ["#0284C7", "#FFE14A"],
    filter: ["#1D4ED8", "#22D3EE"],
    pet: ["#DB2777", "#FFE14A"],
    feeder: ["#EA580C", "#FFE14A"],
    jumper: ["#DC2626", "#FFE14A"],
    drill: ["#EA580C", "#1A1240"],
    pump: ["#0369A1", "#FFE14A"],
    garage: ["#4F46E5", "#FFE14A"],
    bed: ["#6D28D9", "#F8FAFC"],
    moon: ["#312E81", "#FFE14A"],
    scooter: ["#16A34A", "#FFE14A"],
    bricks: ["#DC2626", "#FFE14A"],
    thermo: ["#E11D48", "#F8FAFC"],
    magnet: ["#DC2626", "#2563EB"],
    alarm: ["#B45309", "#FFE14A"],
    beads: ["#7C3AED", "#22D3EE"],
    box: ["#6D28D9", "#FF3D8A"]
  };

  function motifKey(product) {
    var b = [(product && product.id) || "", (product && product.title) || "", (product && product.category) || ""].join(" ").toLowerCase();
    var rules = [
      [/blender|vitamix/, "blender"],
      [/stand mixer|kitchenaid|artisan/, "mixer"],
      [/air fry|crispi|cosori|foodi/, "airfryer"],
      [/instant pot|multi-cook|pressure/, "pot"],
      [/food processor|cuisinart/, "processor"],
      [/kettle|stagg/, "kettle"],
      [/coffee|espresso|aeropress|chemex|moccamaster|baratza|grinder|barista|bes870/, "coffee"],
      [/knife|wusthof/, "knife"],
      [/skillet|lodge|sheet pan|nordic/, "skillet"],
      [/rice|zojirushi/, "ricecooker"],
      [/headphone|airpod|bose|wh-1000|shokz|earbud/, "headphones"],
      [/speaker|sonos|jbl/, "speaker"],
      [/dash|gopro|camera/, "camera"],
      [/keyboard|keychron/, "keyboard"],
      [/mouse|mx master/, "mouse"],
      [/toothbrush|oral-b|waterpik|hx3681/, "brush"],
      [/oneblade|shaver|braun/, "shaver"],
      [/forerunner|watch/, "watch"],
      [/power bank|a1289/, "battery"],
      [/charger|nano-30|nano 30/, "plug"],
      [/heater|lasko|dreo|vornado|delonghi|de'longhi|mh9bx|radiator/, "heater"],
      [/humid/, "humidifier"],
      [/blanket|throw|pendleton/, "blanket"],
      [/snow|shovel|blower/, "snow"],
      [/bottle|stanley/, "bottle"],
      [/purifier|airmega|winix|blueair|core 300|core 600|vital 200/, "purifier"],
      [/dehumid/, "drop"],
      [/waterdrop|zerowater|ispring|brita|filter/, "filter"],
      [/litter|kong|furbo|feeder|fountain|feliway|furminator|kurgo|sleepypod|catit|whisker|petsafe|pet/, "pet"],
      [/noco|jump|ctek|tender/, "jumper"],
      [/drill|dewalt/, "drill"],
      [/inflat|fanttik|viair|compressor/, "pump"],
      [/chamberlain|garage/, "garage"],
      [/pillow|mattress|sheet|casper|tempur|purple|brooklinen/, "bed"],
      [/hatch|lectrofan|sound|mask|manta|wake/, "moon"],
      [/scooter|ride-on|ride on/, "scooter"],
      [/brick|block/, "bricks"],
      [/thermo/, "thermo"],
      [/magnet/, "magnet"],
      [/alarm|smoke|carbon monoxide|\bco\b/, "alarm"],
      [/bead/, "beads"]
    ];
    for (var i = 0; i < rules.length; i++) {
      if (rules[i][0].test(b)) return rules[i][1];
    }
    var cat = {
      kitchen: "skillet",
      winter: "heater",
      "air-water": "purifier",
      pet: "pet",
      "car-garage": "garage",
      sleep: "bed",
      "personal-tech": "headphones"
    };
    return cat[product && product.category] || "box";
  }

  function glyph(key) {
    var g = {
      blender: '<rect x="36" y="10" width="48" height="14" rx="4"/><path d="M44 24h32l10 58H34L44 24z"/><path d="M48 52h24M48 66h24"/><rect x="40" y="86" width="40" height="16" rx="4"/>',
      mixer: '<path d="M30 78h60v22H30z"/><path d="M40 78V46h28l12 32"/><circle cx="78" cy="34" r="14"/><path d="M78 20v-8"/>',
      airfryer: '<path d="M34 24h52"/><rect x="30" y="34" width="60" height="54" rx="16"/><path d="M42 50h36M42 66h36"/><path d="M90 46h16"/>',
      pot: '<ellipse cx="60" cy="46" rx="28" ry="10"/><path d="M32 46v28a28 12 0 0 0 56 0V46"/><path d="M18 40h16M86 40h16"/>',
      processor: '<rect x="34" y="28" width="52" height="58" rx="8"/><path d="M48 28V16h24v12"/><circle cx="60" cy="58" r="12"/>',
      coffee: '<path d="M34 36h40v36a16 16 0 0 1-16 16H46a12 12 0 0 1-12-12z"/><path d="M74 44h12a10 10 0 0 1 0 20H74"/><path d="M44 22c4 6 4 6 8 0M56 18c4 6 4 6 8 0"/>',
      kettle: '<path d="M36 48h40l-6 40H42z"/><path d="M76 52h16l-6 16H76"/><path d="M48 48c0-16 24-16 24 0"/><path d="M52 24h16"/>',
      knife: '<path d="M30 78L78 22l10 8L42 86z"/><path d="M42 86l8 8-16 6z"/>',
      skillet: '<ellipse cx="54" cy="58" rx="28" ry="16"/><path d="M82 58h24"/>',
      ricecooker: '<rect x="32" y="40" width="56" height="46" rx="16"/><path d="M40 40c4-18 36-18 40 0"/><circle cx="60" cy="62" r="6"/>',
      headphones: '<path d="M28 62v10a16 16 0 0 0 16 16h4V52h-4A16 16 0 0 0 28 62zM92 62v10a16 16 0 0 1-16 16h-4V52h4a16 16 0 0 1 16 10z"/><path d="M32 58c0-22 56-22 56 0"/>',
      speaker: '<rect x="36" y="18" width="48" height="78" rx="12"/><circle cx="60" cy="46" r="10"/><circle cx="60" cy="74" r="6"/>',
      camera: '<rect x="24" y="36" width="72" height="48" rx="10"/><circle cx="60" cy="60" r="14"/><path d="M40 36l6-12h20l6 12"/>',
      keyboard: '<rect x="18" y="36" width="84" height="40" rx="8"/><path d="M28 48h8M42 48h8M56 48h8M70 48h8M34 62h40"/>',
      mouse: '<rect x="40" y="18" width="40" height="70" rx="20"/><path d="M60 18v24"/>',
      brush: '<path d="M48 18h24v28H48z"/><path d="M60 46v48"/><path d="M48 94h24"/>',
      shaver: '<rect x="42" y="16" width="36" height="28" rx="8"/><path d="M50 44h20l6 48H44z"/><path d="M50 24h20"/>',
      watch: '<rect x="38" y="28" width="44" height="52" rx="12"/><path d="M48 28V16h24v12M48 80v12h24V80"/><path d="M60 42v14l8 6"/>',
      battery: '<rect x="30" y="36" width="60" height="40" rx="8"/><path d="M90 50h8v12h-8"/><path d="M48 48h10l-4 12h10"/>',
      plug: '<rect x="44" y="40" width="32" height="28" rx="6"/><path d="M54 40V22M66 40V22M60 68v22"/>',
      heater: '<rect x="46" y="16" width="28" height="76" rx="12"/><path d="M18 36c10 8 10 12 0 18M18 60c10 8 10 12 0 18M102 36c-10 8-10 12 0 18M102 60c-10 8-10 12 0 18"/>',
      humidifier: '<rect x="42" y="28" width="36" height="66" rx="16"/><path d="M60 16c6 8 6 8 0 14c-6-6-6-6 0-14"/>',
      blanket: '<path d="M24 40h72v36H24z"/><path d="M24 58h72M40 40v36M56 40v36M72 40v36"/>',
      snow: '<path d="M36 86L70 28h16L52 86z"/><path d="M30 86h64"/><path d="M78 36l16 8"/>',
      bottle: '<path d="M48 16h24v14l10 18v40a14 14 0 0 1-14 14H52a14 14 0 0 1-14-14V48l10-18z"/>',
      purifier: '<rect x="40" y="16" width="40" height="82" rx="16"/><path d="M52 36h16M52 50h16M52 64h16"/>',
      drop: '<path d="M60 16c18 22 28 34 28 50a28 28 0 0 1-56 0c0-16 10-28 28-50z"/>',
      filter: '<path d="M36 28h48l-8 62H44z"/><path d="M44 48h32M46 64h28"/>',
      pet: '<circle cx="36" cy="40" r="10"/><circle cx="84" cy="40" r="10"/><circle cx="28" cy="62" r="8"/><circle cx="92" cy="62" r="8"/><ellipse cx="60" cy="74" rx="18" ry="14"/>',
      feeder: '<ellipse cx="60" cy="70" rx="34" ry="14"/><path d="M30 70c0-20 60-20 60 0"/><circle cx="60" cy="40" r="6"/>',
      jumper: '<rect x="28" y="40" width="64" height="36" rx="8"/><path d="M40 40V28M80 40V28M36 76l-10 14M84 76l10 14"/>',
      drill: '<rect x="22" y="42" width="48" height="28" rx="8"/><path d="M70 50h22l8 6-8 6H70"/><path d="M36 70v14"/>',
      pump: '<rect x="40" y="28" width="28" height="58" rx="8"/><path d="M68 46h22M54 28V16"/><circle cx="54" cy="96" r="8"/>',
      garage: '<path d="M20 52L60 24l40 28v46H20z"/><path d="M36 98V62h48v36M36 74h48M36 86h48"/>',
      bed: '<path d="M22 70V40h22v30"/><path d="M18 70h84v16H18z"/><path d="M44 58h48v12H44z"/>',
      moon: '<path d="M70 24a28 28 0 1 0 18 48 22 22 0 1 1-18-48z"/>',
      scooter: '<circle cx="36" cy="80" r="12"/><circle cx="86" cy="80" r="12"/><path d="M36 80L62 40h24"/><path d="M70 40l16 40"/>',
      bricks: '<rect x="22" y="28" width="34" height="18" rx="3"/><rect x="62" y="28" width="34" height="18" rx="3"/><rect x="40" y="52" width="34" height="18" rx="3"/><rect x="22" y="76" width="34" height="18" rx="3"/>',
      thermo: '<rect x="48" y="16" width="24" height="70" rx="12"/><circle cx="60" cy="92" r="12"/><path d="M60 36v32"/>',
      magnet: '<path d="M30 28h18v36a12 12 0 0 0 24 0V28h18v40a30 30 0 0 1-60 0z"/>',
      alarm: '<path d="M60 24a28 28 0 0 1 16 50H44A28 28 0 0 1 60 24z"/><path d="M44 78h32M36 30L24 20M84 30l12-10"/><circle cx="60" cy="50" r="4"/>',
      beads: '<circle cx="36" cy="60" r="14"/><circle cx="64" cy="44" r="14"/><circle cx="84" cy="72" r="12"/>',
      box: '<path d="M20 46L60 28l40 18-40 18z"/><path d="M20 46v32l40 18 40-18V46M60 64v32"/>'
    };
    return g[key] || g.box;
  }

  function noteBadge(product) {
    var href = NOTES[motifKey(product)];
    if (!href) return "";
    return '<a class="badge badge-note" href="' + esc(href) + '">Safety note</a>';
  }

  function illustrated(product) {
    var key = motifKey(product);
    var bg = MOTIF_BG[key] || MOTIF_BG.box;
    var label = "Illustrated " + (product && product.title ? product.title : "product");
    return '<svg class="illu" viewBox="0 0 160 160" role="img" aria-label="' + esc(label) + '" data-motif="' + esc(key) + '">' +
      '<rect width="160" height="160" rx="28" fill="' + bg[0] + '"/>' +
      '<circle cx="128" cy="30" r="16" fill="' + bg[1] + '"/>' +
      '<circle cx="28" cy="132" r="10" fill="' + bg[1] + '" opacity=".9"/>' +
      '<g transform="translate(18 22)" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">' +
      glyph(key) + "</g></svg>";
  }

  function visual(product, opts) {
    opts = opts || {};
    var src = licensedSrc(product);
    if (!src) return illustrated(product);
    var alt = (product && product.title) || "Product";
    var load = opts.eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"';
    var sizes = opts.sizes ? ' sizes="' + esc(opts.sizes) + '"' : "";
    return '<img class="p-photo" src="' + esc(src) + '" alt="' + esc(alt) + '" width="800" height="800"' + sizes + load + ">";
  }

  var SCENES = {
    home: { a: "#5B21B6", b: "#FF3D8A", c: "#FFE14A", d: "#22D3EE", g: ["blender", "headphones", "heater"], alt: "Illustrated lab bench with a blender, headphones, and a heater" },
    kitchen: { a: "#EA580C", b: "#FFE14A", c: "#FF3D8A", d: "#5B21B6", g: ["blender", "pot", "coffee"], alt: "Illustrated kitchen counter with a blender, a pot, and a mug" },
    winter: { a: "#1D4ED8", b: "#F8FAFC", c: "#22D3EE", d: "#FFE14A", g: ["heater", "snow", "bottle"], alt: "Illustrated winter scene with a heater, a snow shovel, and a bottle" },
    "car-garage": { a: "#C2410C", b: "#FFE14A", c: "#1D4ED8", d: "#111827", g: ["jumper", "drill", "camera"], alt: "Illustrated garage bench with a jump pack, a drill, and a camera" },
    "air-water": { a: "#0F766E", b: "#22D3EE", c: "#FFE14A", d: "#1D4ED8", g: ["purifier", "drop", "filter"], alt: "Illustrated air and water scene with a purifier, a drop, and a pitcher" },
    pet: { a: "#DB2777", b: "#FFE14A", c: "#5B21B6", d: "#22D3EE", g: ["pet", "feeder", "bottle"], alt: "Illustrated pet scene with a paw, a bowl, and a bottle" },
    sleep: { a: "#4C1D95", b: "#C4B5FD", c: "#FFE14A", d: "#F8FAFC", g: ["bed", "moon", "blanket"], alt: "Illustrated bedtime scene with a bed, a moon, and a blanket" },
    "personal-tech": { a: "#0369A1", b: "#22D3EE", c: "#FFE14A", d: "#5B21B6", g: ["headphones", "speaker", "watch"], alt: "Illustrated tech scene with headphones, a speaker, and a watch" },
    gifts: { a: "#FF3D8A", b: "#FFE14A", c: "#5B21B6", d: "#22D3EE", g: ["box", "coffee", "pet"], alt: "Illustrated gift scene with a present, a mug, and a paw" },
    "winter-safety": { a: "#B45309", b: "#FFE14A", c: "#DC2626", d: "#1D4ED8", g: ["heater", "alarm", "blanket"], alt: "Illustrated winter safety scene with a heater, an alarm, and a blanket" },
    "toy-safety": { a: "#16A34A", b: "#FFE14A", c: "#DC2626", d: "#2563EB", g: ["scooter", "bricks", "beads"], alt: "Illustrated toy scene with a scooter, bricks, and beads" },
    "black-friday": { a: "#111827", b: "#FF3D8A", c: "#FFE14A", d: "#22D3EE", g: ["box", "airfryer", "headphones"], alt: "Illustrated shopping scene with a present, an air fryer, and headphones" },
    compare: { a: "#5B21B6", b: "#22D3EE", c: "#FFE14A", d: "#FF3D8A", g: ["jumper", "heater", "airfryer"], alt: "Illustrated comparison scene with three product drawings" },
    recalls: { a: "#9F1239", b: "#FFE14A", c: "#1D4ED8", d: "#F8FAFC", g: ["alarm", "magnet", "heater"], alt: "Illustrated recall desk with an alarm, a magnet, and a heater" },
    bin: { a: "#7F1D1D", b: "#FECACA", c: "#FFE14A", d: "#111827", g: ["box", "alarm", "battery"], alt: "Illustrated bin desk with a box, an alarm, and a battery" }
  };

  function mini(key, x, y, fill) {
    return '<g transform="translate(' + x + " " + y + ')">' +
      '<g class="float">' +
      '<rect width="150" height="150" rx="28" fill="' + fill + '"/>' +
      '<g fill="none" stroke="#1A1240" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" transform="translate(14 16)">' +
      glyph(key) + "</g></g></g>";
  }

  function scene(name) {
    var s = SCENES[name] || SCENES.home;
    var icons = s.g || ["box", "blender", "headphones"];
    return '<svg class="scene" viewBox="0 0 640 420" role="img" aria-label="' + esc(s.alt) + '">' +
      '<rect width="640" height="420" rx="36" fill="' + s.a + '"/>' +
      '<circle class="float" cx="78" cy="70" r="36" fill="' + s.c + '"/>' +
      '<circle class="float delay" cx="590" cy="340" r="64" fill="' + s.b + '" opacity=".9"/>' +
      '<circle cx="40" cy="360" r="18" fill="' + s.d + '"/>' +
      mini(icons[0], 36, 150, "#F8FAFC") +
      mini(icons[1], 210, 78, s.c) +
      mini(icons[2], 250, 240, s.d) +
      '<g class="stamp">' +
      '<circle cx="540" cy="118" r="62" fill="' + s.c + '" stroke="#1A1240" stroke-width="5"/>' +
      '<circle cx="540" cy="118" r="48" fill="none" stroke="#1A1240" stroke-width="3" stroke-dasharray="4 6"/>' +
      '<path d="M516 118 l14 16 32-36" fill="none" stroke="#1A1240" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<text x="540" y="158" text-anchor="middle" font-size="15" font-weight="700" fill="#1A1240" font-family="Source Sans 3, Arial, sans-serif">CHECKED</text>' +
      "</g></svg>";
  }

  return {
    card: card,
    storeButtons: storeButtons,
    amazonButton: amazonButton,
    recallBlock: recallBlock,
    evidenceList: evidenceList,
    checkList: checkList,
    badgeHtml: badgeHtml,
    honestLine: honestLine,
    imageHtml: imageHtml,
    imageColumn: imageColumn,
    visual: visual,
    scene: scene,
    noteBadge: noteBadge,
    motifKey: motifKey,
    schemaImage: imageSrc,
    recallFor: recallFor,
    productPath: productPath,
    visibleTitle: visibleTitle,
    esc: esc
  };
});
