/* Renders Price Truth cards from products.json. Prices stay empty unless the file has a real number. */
(function () {
  var KEY = "checkedlab-region";
  var STORES = {
    US: ["Amazon.com", "Best Buy", "Walmart", "Target", "Home Depot"],
    CA: ["Amazon.ca", "Best Buy CA", "Canadian Tire", "Walmart.ca", "Wayfair.ca"]
  };
  var CURRENCY = { US: "USD", CA: "CAD" };

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

  function blankPrice(offer) {
    return offer.price == null || offer.price === "";
  }

  function priceText(offer) {
    if (blankPrice(offer)) return "not checked yet";
    var currency = offer.currency || CURRENCY[region()];
    return currency + " " + offer.price;
  }

  function whenText(value) {
    return value ? String(value) : "not checked yet";
  }

  function stockText(offer) {
    if (offer.inStock === true) return "in stock";
    if (offer.inStock === false) return "out of stock";
    return "not checked yet";
  }

  function rowsFor(product, reg) {
    var have = ((product.offers || {})[regionKey(reg)] || []).slice();
    return STORES[reg].map(function (name) {
      var found = null;
      for (var i = 0; i < have.length; i++) {
        if (have[i].store === name) found = have[i];
      }
      return found || {
        store: name,
        url: null,
        price: null,
        currency: CURRENCY[reg],
        checkedAt: null,
        inStock: null
      };
    });
  }

  function historyFor(product, reg) {
    var history = product.priceHistory;
    if (!history) return null;
    var row = history[regionKey(reg)];
    if (!row || row.low90 == null || row.typicalSale == null || !row.source) return null;
    return row;
  }

  function currentPrice(product, reg) {
    var rows = rowsFor(product, reg);
    for (var i = 0; i < rows.length; i++) {
      if (!blankPrice(rows[i])) return rows[i];
    }
    return null;
  }

  function linkHtml(url, label, sponsored) {
    var href = safeUrl(url);
    if (!href) return esc(label);
    var rel = sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer";
    return '<a href="' + esc(href) + '" target="_blank" rel="' + rel + '">' + esc(label) + "</a>";
  }

  function isAmazon(url) {
    return typeof url === "string" && /amazon\.(com|ca)/.test(url) && /[?&]tag=checkedlab/.test(url);
  }

  function recallBlock(rec) {
    rec = rec || { status: "not_checked" };
    if (rec.status === "bin") {
      var source = rec.url ? " " + linkHtml(rec.url, "Recall notice", false) : "";
      return '<p class="recall recall-bin"><strong>BIN.</strong> ' + esc(rec.detail || "A recall matches this model.") + source + "</p>";
    }
    if (rec.status === "none" && rec.checkedAt) {
      var html = '<p class="recall">No recall found as of ' + esc(rec.checkedAt) + ".</p>";
      var other = rec.other || [];
      if (other.length) {
        html += '<p class="recall-other">Other recalls for this brand did not match this model: ' +
          other.map(function (item) {
            return linkHtml(item.url, item.title || "Recall", false);
          }).join("; ") + "</p>";
      }
      return html;
    }
    if (rec.status === "unconfirmed") {
      var links = (rec.other || []).map(function (item) {
        return linkHtml(item.url, item.title || "Recall", false);
      }).join("; ");
      return '<p class="recall">' + esc(rec.detail || "Recall status is not confirmed for this listing.") +
        (rec.checkedAt ? " Checked " + esc(rec.checkedAt) + "." : "") +
        (links ? " " + links : "") + "</p>";
    }
    return '<p class="recall">Recall: not checked yet.</p>';
  }

  function meterBlock(product, reg) {
    var history = historyFor(product, reg);
    if (!history) return "";
    var price = currentPrice(product, reg);
    var decision = "not checked yet";
    if (price && Number(price.price) <= Number(history.low90)) decision = "BUY NOW";
    else if (price) decision = "WAIT";
    var source = history.url ? " Source: " + linkHtml(history.url, history.source, false) : " Source: " + esc(history.source);
    var flag = '<p class="fake-flag">Fake-sale flag: not checked yet.</p>';
    if (history.fakeSale === true && history.fakeSaleUrl) {
      flag = '<p class="fake-flag">Fake-sale flag: the compared “was” price was not in the checked history. ' +
        linkHtml(history.fakeSaleUrl, "Source", false) + "</p>";
    } else if (history.fakeSale === false && history.fakeSaleUrl) {
      flag = '<p class="fake-flag">Fake-sale flag: not raised on the checked history. ' +
        linkHtml(history.fakeSaleUrl, "Source", false) + "</p>";
    }
    return '<p class="meter">' + esc(decision) + ". 90-day low " + esc(history.currency || CURRENCY[reg]) + " " +
      esc(history.low90) + ". Typical sale " + esc(history.currency || CURRENCY[reg]) + " " +
      esc(history.typicalSale) + "." + source + "</p>" + flag;
  }

  function evidenceList(product) {
    var items = product.evidence || [];
    if (!items.length) {
      return "<p class=\"p-note\">No sourced evidence lines are on this card yet.</p>";
    }
    return "<ul class=\"evidence\">" + items.map(function (item) {
      var agrees = item.agrees === true ? " The linked page states this." : " Not cross-checked against a second source.";
      var source = item.url ? linkHtml(item.url, item.source || "Source", false) : esc(item.source || "Source");
      return "<li>" + esc(item.claim || "") + " " + source + "." + esc(agrees) + "</li>";
    }).join("") + "</ul>";
  }

  function card(product, reg) {
    var recall = (product.recall || {})[regionKey(reg)] || { status: "not_checked" };
    var badge = recall.status === "bin"
      ? '<span class="badge badge-bin">BIN</span>'
      : '<span class="badge">' + (product.badge === "bought" ? "BOUGHT BY US" : "CHECKED BY US") + "</span>";
    var rows = rowsFor(product, reg).map(function (offer) {
      return "<tr><td>" + linkHtml(offer.url, offer.store, isAmazon(offer.url)) + "</td><td>" +
        esc(priceText(offer)) + "</td><td>" + esc(whenText(offer.checkedAt)) + "</td><td>" +
        esc(stockText(offer)) + "</td></tr>";
    }).join("");
    var amazon = null;
    rowsFor(product, reg).forEach(function (offer) {
      if (!amazon && offer.url && /amazon\./.test(offer.url)) amazon = offer;
    });
    var button = amazon
      ? '<a class="btn" href="' + esc(safeUrl(amazon.url)) + '" target="_blank" rel="sponsored noopener noreferrer">Shop on ' + esc(amazon.store) + "</a>"
      : "";
    var boughtNote = product.badge === "bought"
      ? "Bought by us. A receipt is linked on this card."
      : "Checked by us means we checked sources and recalls. It is not a hands-on test, and we did not buy this product.";
    return '<article class="product-grid" id="' + esc(product.id) + '">' +
      '<div class="p-main">' +
        '<section class="price-truth">' +
          '<div class="pt-kicker">PRICE TRUTH · ' + (reg === "CA" ? "CAD" : "USD") + "</div>" +
          '<p class="pt-verdict">' + esc(product.verdict || "Not bought or lab-tested by Checked Lab.") + "</p>" +
          '<div class="pt-table-wrap"><table class="pt-table"><thead><tr><th>STORE</th><th>PRICE</th><th>CHECKED</th><th>STOCK</th></tr></thead><tbody>' +
          rows + "</tbody></table></div>" +
          meterBlock(product, reg) +
          recallBlock(recall) +
        "</section>" +
        badge +
        '<h2 class="p-title">' + esc(product.title) + "</h2>" +
        '<p class="p-note">' + esc(boughtNote) + "</p>" +
        '<p class="p-meta">' + esc(product.meta || "") + "</p>" +
        evidenceList(product) +
        button +
      "</div>" +
      '<div class="p-side"><div class="p-img"><img src="/' + esc(String(product.image || "").replace(/^\/+/, "")) + '" alt="' + esc(product.title) + '"></div></div>' +
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
      shown = list.filter(function (product) { return product.category === "kitchen"; });
    } else if (page === "bin") {
      shown = list.filter(function (product) {
        var recall = product.recall || {};
        var us = (recall.us || {}).status === "bin";
        var ca = (recall.ca || {}).status === "bin";
        return us || ca || (product.bin && product.bin.length);
      });
    } else {
      return;
    }
    if (!shown.length) {
      mount.innerHTML = page === "bin"
        ? '<p class="empty">Nothing is on the BIN list. A product lands here only when a recall record matches its brand and model, or when a sourced evidence check fails. An unconfirmed model is not a BIN.</p>'
        : '<p class="empty">No products in this category yet. This is not a ranking and not a test.</p>';
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
