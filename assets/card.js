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

  /* A real photo renders from a local /images/photos/ file with a recorded
     license, or from an http(s) product.image that is not an Amazon hotlink.
     The same slot is used either way. Category photos never claim the model. */
  function licensedSrc(product) {
    var src = String(product && product.image || "").trim();
    if (/^images\/photos\/[a-z0-9.-]+\.webp$/i.test(src)) src = "/" + src;
    if (/^\/images\/photos\/[a-z0-9.-]+\.webp$/i.test(src) && product && product.imageLicense) return src;
    if (!/^https?:\/\//i.test(src) || amazonImage(product)) return "";
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
      [/roomba|robot vacuum|roborock|eufy x10|av2501|av2820/, "robotvac"],
      [/cordless vacuum|stick vacuum|dyson v|tineco|iconpet|ip3251/, "stickvac"],
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
      [/brick|block|duplo|lego|tile/, "bricks"],
      [/scooter|razor|wagon/, "scooter"],
      [/thermapen|thermometer/, "thermo"],
      [/roast|dutch|gravy|oven|fryer/, "pot"],
      [/carving/, "knife"],
      [/extinguisher/, "alarm"],
      [/wheels/, "garage"],
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
      "personal-tech": "headphones",
      cleaning: "robotvac"
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
      box: '<path d="M20 46L60 28l40 18-40 18z"/><path d="M20 46v32l40 18 40-18V46M60 64v32"/>',
      robotvac: '<circle cx="60" cy="62" r="28"/><circle cx="60" cy="62" r="10"/><path d="M60 34V22"/>',
      stickvac: '<path d="M46 18h16v34H46z"/><path d="M54 52v28"/><path d="M36 86h36"/>'
    };
    return g[key] || g.box;
  }

  function noteBadge(product) {
    var href = NOTES[motifKey(product)];
    if (!href) return "";
    return '<a class="badge badge-note" href="' + esc(href) + '">Safety note</a>';
  }

  var CATEGORY_PHOTOS = {
    blender: ["cat-blender.webp", "Photo by Nicola Barts on Pexels", 1600, 2400],
    mixer: ["cat-blender.webp", "Photo by Nicola Barts on Pexels", 1600, 2400],
    airfryer: ["cat-airfryer.webp", "Photo by FOX on Pexels", 1600, 1066],
    pot: ["hub-cook.webp", "Photo by cottonbro studio on Pexels", 1600, 2400],
    processor: ["hub-cook.webp", "Photo by cottonbro studio on Pexels", 1600, 2400],
    coffee: ["cat-coffee.webp", "Photo by Valeriya Kobzar on Pexels", 1600, 2000],
    kettle: ["cat-kettle.webp", "Photo by H. Hümâ Yardim on Pexels", 1600, 2400],
    knife: ["hub-cook.webp", "Photo by cottonbro studio on Pexels", 1600, 2400],
    skillet: ["hub-cook.webp", "Photo by cottonbro studio on Pexels", 1600, 2400],
    ricecooker: ["cat-rice.webp", "Photo by Pew Nguyen on Pexels", 1600, 1066],
    headphones: ["cat-headphones.webp", "Photo by Aleksandar Spasojevic on Pexels", 1600, 1066],
    speaker: ["cat-speaker.webp", "Photo by Kaye RD on Pexels", 1600, 2000],
    camera: ["cat-desk.webp", "Photo by Helena Lopes on Pexels", 1600, 1066],
    keyboard: ["cat-desk.webp", "Photo by Helena Lopes on Pexels", 1600, 1066],
    mouse: ["cat-desk.webp", "Photo by Helena Lopes on Pexels", 1600, 1066],
    brush: ["cat-brush.webp", "Photo by Towfiqu barbhuiya on Pexels", 1600, 1066],
    shaver: ["cat-brush.webp", "Photo by Towfiqu barbhuiya on Pexels", 1600, 1066],
    watch: ["cat-watch.webp", "Photo by Mister Mister on Pexels", 1600, 2400],
    battery: ["cat-battery.webp", "Photo by Ayyeee Ayyeee on Pexels", 1600, 1066],
    plug: ["cat-battery.webp", "Photo by Ayyeee Ayyeee on Pexels", 1600, 1066],
    heater: ["hub-winter.webp", "Photo by Huy Phan on Pexels", 1600, 2400],
    humidifier: ["cat-humid.webp", "Photo by Phạm Tuấn Hải on Pexels", 1600, 2400],
    blanket: ["cat-blanket.webp", "Photo by Kate L on Pexels", 1600, 2400],
    snow: ["cat-snow.webp", "Photo by Erik Mclean on Pexels", 1600, 2400],
    bottle: ["cat-bottle.webp", "Photo by cottonbro studio on Pexels", 1600, 2400],
    purifier: ["cat-purifier.webp", "Photo by Cats Coming on Pexels", 1600, 2444],
    drop: ["cat-purifier.webp", "Photo by Cats Coming on Pexels", 1600, 2444],
    filter: ["cat-bottle.webp", "Photo by cottonbro studio on Pexels", 1600, 2400],
    pet: ["hub-pet.webp", "Photo by Amar Preciado on Pexels", 1600, 2400],
    feeder: ["hub-pet.webp", "Photo by Amar Preciado on Pexels", 1600, 2400],
    jumper: ["cat-battery.webp", "Photo by Ayyeee Ayyeee on Pexels", 1600, 1066],
    drill: ["cat-drill.webp", "Photo by Саша Алалыкин on Pexels", 1600, 1600],
    pump: ["cat-drill.webp", "Photo by Саша Алалыкин on Pexels", 1600, 1600],
    garage: ["hub-garage.webp", "Photo by Tima Miroshnichenko on Pexels", 1600, 2400],
    bed: ["cat-bed.webp", "Photo by Darya Grey_Owl on Pexels", 1600, 2400],
    moon: ["hub-sleep.webp", "Photo by Ron Lach on Pexels", 1600, 1066],
    scooter: ["season-toys.webp", "Photo by Antonius Ferret on Pexels", 1600, 1066],
    bricks: ["season-toys.webp", "Photo by Antonius Ferret on Pexels", 1600, 1066],
    thermo: ["season-thanksgiving.webp", "Photo by Zion Smith on Pexels", 1600, 1066],
    magnet: ["cat-alarm.webp", "Photo by Caleb Oquendo on Pexels", 1600, 1068],
    alarm: ["cat-alarm.webp", "Photo by Caleb Oquendo on Pexels", 1600, 1068],
    beads: ["season-toys.webp", "Photo by Antonius Ferret on Pexels", 1600, 1066],
    box: ["season-gifts.webp", "Photo by Nicolas Postiglioni on Pexels", 1600, 1060],
    robotvac: ["cat-robot.webp", "Photo by Kindel Media on Pexels", 1600, 1200],
    stickvac: ["cat-stick.webp", "Photo by Vedat \u00d6ncelik on Pexels", 1600, 2399]
  };

  function photoRecord(product) {
    var src = licensedSrc(product);
    if (src) {
      var model = product && product.imageKind === "model";
      return {
        src: src,
        kind: model ? "model" : "category",
        credit: (product && product.imageCredit) || "",
        alt: model ? ((product && product.title) || "Product") : "Category photo",
        width: 1200,
        height: 900
      };
    }
    var row = CATEGORY_PHOTOS[motifKey(product || {})] || CATEGORY_PHOTOS.box;
    return {
      src: "/images/photos/" + row[0],
      kind: "category",
      credit: row[1],
      alt: "Category photo",
      width: row[2],
      height: row[3]
    };
  }

  function visual(product, opts) {
    opts = opts || {};
    var photo = photoRecord(product);
    var load = opts.eager ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"';
    var caption = photo.kind === "model"
      ? (photo.credit || "")
      : ("Category photo" + (photo.credit ? " · " + photo.credit : ""));
    return '<img class="p-photo" src="' + esc(photo.src) + '" alt="' + esc(photo.alt) + '" width="' + photo.width + '" height="' + photo.height + '"' + load + ">" +
      (caption ? '<p class="img-credit">' + esc(caption) + "</p>" : "");
  }

  var SCENES = {
    home: ["hero-kitchen.webp", "A bright kitchen before a meal", "Photo by Mark McCammon on Pexels", 1600, 1066],
    kitchen: ["hub-cook.webp", "A cook at a kitchen counter", "Photo by cottonbro studio on Pexels", 1600, 2400],
    winter: ["hub-winter.webp", "A calm living room", "Photo by Huy Phan on Pexels", 1600, 2400],
    "car-garage": ["hub-garage.webp", "Hand tools on a rack", "Photo by Tima Miroshnichenko on Pexels", 1600, 2400],
    "air-water": ["cat-purifier.webp", "A white air purifier in a bright room", "Photo by Cats Coming on Pexels", 1600, 2444],
    pet: ["hub-pet.webp", "A dog waiting beside a food bowl", "Photo by Amar Preciado on Pexels", 1600, 2400],
    sleep: ["hub-sleep.webp", "A made bed in a bright bedroom", "Photo by Ron Lach on Pexels", 1600, 1066],
    "personal-tech": ["cat-headphones.webp", "Headphones on a white surface", "Photo by Aleksandar Spasojevic on Pexels", 1600, 1066],
    gifts: ["season-gifts.webp", "A holiday table", "Photo by Nicolas Postiglioni on Pexels", 1600, 1060],
    "winter-safety": ["cat-alarm.webp", "A ceiling smoke alarm", "Photo by Caleb Oquendo on Pexels", 1600, 1068],
    "toy-safety": ["season-toys.webp", "Children playing outdoors", "Photo by Antonius Ferret on Pexels", 1600, 1066],
    "black-friday": ["season-black-friday.webp", "A plain paper shopping bag", "Photo by Mikhail Nilov on Pexels", 1600, 2400],
    compare: ["hub-cook.webp", "A cook at a kitchen counter", "Photo by cottonbro studio on Pexels", 1600, 2400],
    recalls: ["cat-alarm.webp", "A ceiling smoke alarm", "Photo by Caleb Oquendo on Pexels", 1600, 1068],
    bin: ["cat-alarm.webp", "A ceiling smoke alarm", "Photo by Caleb Oquendo on Pexels", 1600, 1068],
    thanksgiving: ["season-thanksgiving.webp", "A Thanksgiving table set for a meal", "Photo by Zion Smith on Pexels", 1600, 1066],
    cleaning: ["hub-cleaning.webp", "A robot vacuum on a wood floor", "Photo by Ron Lach on Pexels", 1600, 2400]
  };

  function scene(name) {
    var row = SCENES[name] || SCENES.home;
    return '<figure class="scene-photo"><img src="/images/photos/' + row[0] + '" alt="' + esc(row[1]) + '" width="' + row[3] + '" height="' + row[4] + '" loading="lazy" decoding="async"><figcaption>' + esc(row[2]) + "</figcaption></figure>";
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
