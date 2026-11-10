/* Store buttons and recall status. No price, stock, or check time is rendered.
   Cards already in the HTML stay put when they match the region. */
(function () {
  var KEY = "checkedlab-region";

  function region() {
    return document.documentElement.dataset.region === "CA" ? "CA" : "US";
  }

  function mountProducts(list) {
    var mount = document.getElementById("product-mount");
    if (!mount || !window.CheckedLabCard) return;
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
    if (mount.querySelector(".product-grid") && mount.getAttribute("data-rendered-region") === reg) return;
    if (!shown.length) {
      mount.innerHTML = page === "bin"
        ? '<p class="empty">Nothing is on the BIN list. A product lands here only when a recall record matches its brand and model. An unconfirmed model is not a BIN.</p>'
        : '<p class="empty">No products in this category yet. Recall-checked and maker-sourced. More picks coming.</p>';
      mount.setAttribute("data-rendered-region", reg);
      return;
    }
    mount.innerHTML = shown.map(function (product) { return window.CheckedLabCard.card(product, reg); }).join("");
    mount.setAttribute("data-rendered-region", reg);
  }

  var products = [];

  function render() {
    var mount = document.getElementById("product-mount");
    if (mount && !products.length && mount.querySelector(".product-grid")) return;
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
        products = Array.isArray(data) ? data : [];
        render();
      })
      .catch(function (error) { console.error(error); });
  }
})();
