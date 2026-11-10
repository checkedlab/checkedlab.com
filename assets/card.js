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
      return '<p class="recall recall-bin"><strong>BIN.</strong> ' + esc(rec.detail || "A recall matches this model.") + source + "</p>";
    }
    if (rec.status === "none" && rec.checkedAt) {
      var html = '<p class="recall recall-clear">No recall found as of ' + esc(rec.checkedAt) + ".</p>";
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
        (rec.checkedAt ? " Checked " + esc(rec.checkedAt) + "." : "") +
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
      return '<a class="store-btn" href="' + esc(safeUrl(url)) + '" target="_blank" rel="' + REL + '">' + esc(store.label) + "</a>";
    }).join("") + "</div>";
  }

  function recallFor(product, reg) {
    return (product.recall || {})[regionKey(reg)] || { status: "not_recorded" };
  }

  function badgeHtml(recall) {
    var waiting = recall.status === "unconfirmed" || recall.status === "not_recorded" || !recall.status;
    if (recall.status === "bin") return '<span class="badge badge-bin">BIN</span>';
    if (waiting) return '<span class="badge badge-wait">CHECK MODEL</span>';
    return '<span class="badge badge-clear">RECALL-CHECKED</span>';
  }

  function honestLine(product, recall) {
    var waiting = recall.status === "unconfirmed" || recall.status === "not_recorded" || !recall.status;
    var hasSpecs = product.evidence && product.evidence.length;
    return waiting
      ? "The model on this card still needs a recall check."
      : "Recall-checked against CPSC and Health Canada." + (hasSpecs ? " Specs are from the maker." : "");
  }

  function imageHtml(product) {
    if (!product.image) return "";
    return '<img src="/' + esc(String(product.image).replace(/^\/+/, "")) + '" alt="' + esc(product.title) + '">';
  }

  function photoColumn(product) {
    var img = imageHtml(product);
    if (!img) return "";
    return '<div class="p-side"><div class="p-img">' + img + "</div></div>";
  }

  function productPath(product) {
    return "/" + String(product.category || "") + "/" + String(product.id || "") + "/";
  }

  /* Visible titles only. A hyphen between letters or digits is a model token
     (AP-1512HH, 70-N1000s) and must not be a line-break opportunity. */
  function visibleTitle(title) {
    return esc(title).replace(/([A-Za-z0-9])-([A-Za-z0-9])/g, "$1\u2011$2");
  }

  function card(product, reg) {
    var recall = recallFor(product, reg);
    return '<article class="product-grid" id="' + esc(product.id) + '" data-category="' + esc(product.category || "") + '">' +
      '<div class="p-main">' +
        badgeHtml(recall) +
        '<h2 class="p-title"><a href="' + esc(productPath(product)) + '">' + visibleTitle(product.title) + "</a></h2>" +
        '<p class="p-meta">' + esc(product.meta || "") + "</p>" +
        '<p class="p-note">' + esc(honestLine(product, recall)) + "</p>" +
        '<p class="price-note">Prices change often, check the current price at the store.</p>' +
        '<p class="affiliate-note">Amazon link is an affiliate link</p>' +
        storeButtons(product, reg) +
        recallBlock(recall) +
        checkList(product) +
        evidenceList(product) +
      "</div>" +
      photoColumn(product) +
    "</article>";
  }

  return {
    card: card,
    storeButtons: storeButtons,
    recallBlock: recallBlock,
    evidenceList: evidenceList,
    checkList: checkList,
    badgeHtml: badgeHtml,
    honestLine: honestLine,
    imageHtml: imageHtml,
    recallFor: recallFor,
    productPath: productPath,
    visibleTitle: visibleTitle,
    esc: esc
  };
});
