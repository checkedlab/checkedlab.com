/* Store buttons and recall status. No price, stock, or check time is rendered.
   Cards already in the HTML stay put when they match the region. */
(function () {
  var KEY = "checkedlab-region";

  function region() {
    return document.documentElement.dataset.region === "CA" ? "CA" : "US";
  }

  var POPULAR = ["vitamix-e310", "kitchenaid-artisan", "instant-pot-duo-plus", "coway-ap-1512hh", "sony-wh-1000xm5", "gopro-hero13", "ninja-crispi-fn101", "breville-bes870xl"];

  function isBin(product) {
    var recall = product.recall || {};
    return (recall.us || {}).status === "bin" || (recall.ca || {}).status === "bin" || (product.bin && product.bin.length);
  }

  function blob(product) {
    return [product.title, product.meta, product.id, product.category, product.searchQuery].join(" ").toLowerCase();
  }

  function paint(mount, html, reg) {
    if (!mount) return;
    mount.innerHTML = html;
    mount.setAttribute("data-rendered-region", reg);
    reveal(mount);
  }

  function reveal(root) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var scope = root && root.querySelectorAll ? root : document;
    var nodes = scope.querySelectorAll ? scope.querySelectorAll(".product-grid, .hero, .recall-band") : [];
    if (!nodes.length && root && root.classList && root.classList.contains("product-grid")) nodes = [root];
    if (!window.CheckedLabReveal) {
      window.CheckedLabReveal = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          window.CheckedLabReveal.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
    }
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.querySelector && el.querySelector('[fetchpriority="high"]')) return;
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92) return;
      el.classList.add("reveal");
      window.CheckedLabReveal.observe(el);
    });
  }

  function mountProducts(list) {
    if (!window.CheckedLabCard) return;
    var page = document.body.dataset.page;
    var category = document.body.dataset.category;
    var reg = region();
    if (page === "home") {
      var input = document.querySelector("[data-model-search]");
      var q = input ? input.value.trim().toLowerCase() : "";
      var title = document.getElementById("popular-title");
      var empty = document.getElementById("search-empty");
      var popular = q
        ? list.filter(function (product) { return blob(product).indexOf(q) !== -1; })
        : POPULAR.map(function (id) {
          return list.find(function (product) { return product.id === id; });
        }).filter(Boolean);
      var recalls = list.filter(isBin).filter(function (product) {
        return !q || blob(product).indexOf(q) !== -1;
      });
      if (title) title.textContent = q ? "Matches" : "Start here";
      if (empty) empty.hidden = popular.length !== 0;
      paint(document.getElementById("popular-mount"), popular.map(function (product) {
        return window.CheckedLabCard.card(product, reg);
      }).join(""), reg);
      paint(document.getElementById("recall-mount"), recalls.length
        ? recalls.map(function (product) { return window.CheckedLabCard.card(product, reg); }).join("")
        : '<p class="empty">No official model recall matches that.</p>', reg);
      return;
    }
    var mount = document.getElementById("product-mount");
    if (!mount) return;
    var shown = list;
    if (page === "category") {
      shown = list.filter(function (product) { return product.category === category; });
    } else if (page === "bin") {
      shown = list.filter(isBin);
    } else {
      return;
    }
    if (mount.querySelector(".product-grid, .product-row") && mount.getAttribute("data-rendered-region") === reg) return;
    if (!shown.length) {
      paint(mount, page === "bin"
        ? '<p class="empty">Nothing is on the BIN list. A product lands here only when a recall record matches its brand and model. An unconfirmed model is not a BIN.</p>'
        : '<p class="empty">No products in this category yet. Recall-checked and maker-sourced. More picks coming.</p>', reg);
      return;
    }
    paint(mount, shown.map(function (product) { return window.CheckedLabCard.card(product, reg); }).join(""), reg);
  }

  var products = [];

  function render() {
    var mount = document.getElementById("product-mount");
    if (mount && !products.length && mount.querySelector(".product-grid, .product-row")) return;
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

  document.addEventListener("input", function (event) {
    if (!event.target || !event.target.hasAttribute("data-model-search")) return;
    mountProducts(products);
  });

  reveal(document);

  if (document.getElementById("product-mount") || document.getElementById("popular-mount")) {
    fetch("/products.json")
      .then(function (response) { return response.json(); })
      .then(function (data) {
        products = Array.isArray(data) ? data : [];
        render();
      })
      .catch(function (error) { console.error(error); });
  }
})();
