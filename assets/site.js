/* Store buttons and recall status. No price, stock, or check time is rendered. */
(function () {
  var KEY = "checkedlab-region";
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

  function region() {
    return document.documentElement.dataset.region === "CA" ? "CA" : "US";
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
      var u = new URL(url, window.location.origin);
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
      var html = '<p class="recall">No recall found as of ' + esc(rec.checkedAt) + ".</p>";
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
      return '<p class="recall">' + esc(rec.detail || "Recall status is not confirmed for this listing.") +
        (rec.checkedAt ? " Checked " + esc(rec.checkedAt) + "." : "") +
        (links ? " " + links : "") + "</p>";
    }
    return '<p class="recall">A recall check has not been recorded for this listing.</p>';
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

  function card(product, reg) {
    var recall = (product.recall || {})[regionKey(reg)] || { status: "not_recorded" };
    var waiting = recall.status === "unconfirmed" || recall.status === "not_recorded" || !recall.status;
    var badge = recall.status === "bin"
      ? '<span class="badge badge-bin">BIN</span>'
      : waiting
        ? '<span class="badge">CHECK MODEL</span>'
        : '<span class="badge">RECALL-CHECKED</span>';
    var hasSpecs = product.evidence && product.evidence.length;
    var honest = waiting
      ? "The model on this card still needs a recall check."
      : "Recall-checked against CPSC and Health Canada." + (hasSpecs ? " Specs are from the maker." : "");
    var image = product.image
      ? '<img src="/' + esc(String(product.image).replace(/^\/+/, "")) + '" alt="' + esc(product.title) + '">'
      : '<div class="no-photo"><b>' + esc(product.model || product.title) + '</b><span>Match the model on the store listing.</span></div>';
    return '<article class="product-grid" id="' + esc(product.id) + '" data-category="' + esc(product.category || "") + '">' +
      '<div class="p-main">' +
        badge +
        '<h2 class="p-title">' + esc(product.title) + "</h2>" +
        '<p class="p-meta">' + esc(product.meta || "") + "</p>" +
        '<p class="p-note">' + esc(honest) + "</p>" +
        '<p class="price-note">Prices change often, check the current price at the store.</p>' +
        '<p class="affiliate-note">Amazon link is an affiliate link</p>' +
        storeButtons(product, reg) +
        recallBlock(recall) +
        checkList(product) +
        evidenceList(product) +
      "</div>" +
      '<div class="p-side"><div class="p-img">' + image + "</div></div>" +
    "</article>";
  }

  function mountProducts(list) {
    var mount = document.getElementById("product-mount");
    if (!mount) return;
    var page = document.body.dataset.page;
    var category = document.body.dataset.category;
    var reg = region();
    var shown = list;
    if (page === "category") {
      shown = list.filter(function (product) { return product.category === category; });
    } else if (page === "home") {
      var limit = parseInt(document.body.dataset.limit || "3", 10);
      if (!limit || limit < 1) limit = 3;
      shown = list.filter(function (product) { return product.category === "kitchen"; }).slice(0, limit);
    } else if (page === "bin") {
      shown = list.filter(function (product) {
        var recall = product.recall || {};
        return (recall.us || {}).status === "bin" || (recall.ca || {}).status === "bin" || (product.bin && product.bin.length);
      });
    } else {
      return;
    }
    if (!shown.length) {
      mount.innerHTML = page === "bin"
        ? '<p class="empty">Nothing is on the BIN list. A product lands here only when a recall record matches its brand and model. An unconfirmed model is not a BIN.</p>'
        : '<p class="empty">No products in this category yet. Recall-checked and maker-sourced. More picks coming.</p>';
      return;
    }
    mount.innerHTML = shown.map(function (product) { return card(product, reg); }).join("");
  }

  var products = [];

  function render() {
    mountProducts(products);
  }

  function setRegion(next, persist) {
    if (next !== "US" && next !== "CA") next = "US";
    document.documentElement.dataset.region = next;
    if (persist) {
      try { localStorage.setItem(KEY, next); } catch (e) {}
    }
    render();
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-region-set]");
    if (!button) return;
    setRegion(button.getAttribute("data-region-set"), true);
  });

  window.CheckedLab = { setRegion: setRegion, render: render };

  if (document.getElementById("product-mount")) {
    fetch("/products.json")
      .then(function (response) { return response.json(); })
      .then(function (data) {
        products = data;
        render();
      })
      .catch(function (error) { console.error(error); });
  }
})();
