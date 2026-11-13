(function () {
  function fallbackPhoto(img) {
    if (!img || !img.classList || !img.classList.contains("p-photo") || img.dataset.fellback) return;
    if (!window.CheckedLabCard || !window.CheckedLabCard.tile) return;
    img.dataset.fellback = "1";
    var html = window.CheckedLabCard.tile({
      sourceName: img.getAttribute("data-brand") || "",
      model: img.getAttribute("data-model") || "",
      category: img.getAttribute("data-category") || "",
      title: img.getAttribute("alt") || ""
    });
    var holder = document.createElement("div");
    holder.innerHTML = html;
    var tile = holder.firstElementChild;
    if (!tile) return;
    var credit = img.nextElementSibling;
    if (credit && credit.classList.contains("img-credit")) credit.remove();
    img.replaceWith(tile);
  }
  document.addEventListener("error", function (event) { fallbackPhoto(event.target); }, true);
  document.querySelectorAll("img.p-photo").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) fallbackPhoto(img);
  });
})();

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
    if (!("IntersectionObserver" in window)) return;
    var scope = root && root.querySelectorAll ? root : document;
    var nodes = scope.querySelectorAll ? scope.querySelectorAll(".product-grid, .hero, .recall-band, .guide-pick, .bf-model, .season-card, .quiz, .recall-widget, .hero-art, .catalogue-pick") : [];
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
    if (window.CheckedLabCard.beginPage) window.CheckedLabCard.beginPage();
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
      if (title) title.textContent = q ? "Matches" : "Recently recall-checked";
      if (empty) empty.hidden = popular.length !== 0;
      paint(document.getElementById("popular-mount"), popular.map(function (product, index) {
        return window.CheckedLabCard.card(product, reg, index === 0 ? { eager: true } : {});
      }).join(""), reg);
      paint(document.getElementById("recall-mount"), recalls.length
        ? recalls.map(function (product) { return window.CheckedLabCard.card(product, reg); }).join("")
        : '<p class="empty">No official model recall matches that.</p>', reg);
      return;
    }
    var mount = document.getElementById("product-mount");
    if (!mount) return;
    var shown = list;
    var query = "";
    var search = document.querySelector("[data-model-search]");
    if (search) query = search.value.trim().toLowerCase();
    if (page === "category") {
      shown = list.filter(function (product) { return product.category === category; });
      if (query) shown = shown.filter(function (product) { return blob(product).indexOf(query) !== -1; });
    } else if (page === "bin") {
      shown = list.filter(isBin);
    } else {
      return;
    }
    if (!query && mount.querySelector(".product-grid, .product-row") && mount.getAttribute("data-rendered-region") === reg) return;
    if (!shown.length) {
      paint(mount, page === "bin"
        ? '<p class="empty">Nothing is on the BIN list. A product lands here only when a recall record matches its brand and model. An unconfirmed model is not a BIN.</p>'
        : '<p class="empty">No products in this category yet. Recall-checked and maker-sourced. More picks coming.</p>', reg);
      return;
    }
    paint(mount, shown.map(function (product, index) {
      return window.CheckedLabCard.card(product, reg, index === 0 ? { eager: true } : {});
    }).join(""), reg);
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

  var preset = "";
  try { preset = new URLSearchParams(window.location.search).get("q") || ""; } catch (e) {}
  if (preset) {
    var boxes = document.querySelectorAll("[data-model-search]");
    Array.prototype.forEach.call(boxes, function (box) { if (!box.value) box.value = preset; });
  }

  if (document.getElementById("product-mount") || document.getElementById("popular-mount")) {
    fetch("/products.json")
      .then(function (response) { return response.json(); })
      .then(function (data) {
        products = Array.isArray(data) ? data : [];
        window.CheckedLabProducts = products;
        document.dispatchEvent(new Event("checkedlab-products"));
        render();
      })
      .catch(function (error) { console.error(error); });
  }
})();

/* Recall search, gift finder, saved checklists, sticky CTA, back to top. */
(function () {
  var GUIDES = {
    cook: ["/gifts/for-the-home-cook/", "Gifts for the home cook"],
    coffee: ["/gifts/for-coffee-lovers/", "Gifts for coffee lovers"],
    home: ["/gifts/for-the-home/", "Gifts for the home"],
    garage: ["/gifts/for-the-garage/", "Gifts for the garage"],
    pet: ["/gifts/for-pet-owners/", "Gifts for pet owners"],
    sleep: ["/gifts/for-better-sleep/", "Gifts for better sleep"],
    tech: ["/gifts/tech-and-gadgets/", "Tech and gadgets"],
    kids: ["/gifts/for-kids/", "Gifts for kids"],
    host: ["/gifts/for-the-host/", "Gifts for the host"]
  };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function region() {
    return document.documentElement.dataset.region === "CA" ? "CA" : "US";
  }

  function catalogue(cb) {
    if (window.CheckedLabProducts && window.CheckedLabProducts.length) {
      cb(window.CheckedLabProducts);
      return;
    }
    var input = document.querySelector("[data-recall-search]");
    if (!input) return;
    fetch("/products.json")
      .then(function (response) { return response.json(); })
      .then(function (data) {
        window.CheckedLabProducts = Array.isArray(data) ? data : [];
        cb(window.CheckedLabProducts);
      })
      .catch(function () { cb([]); });
  }

  function recallStatus(product) {
    var rec = (product.recall || {})[region() === "CA" ? "ca" : "us"] || {};
    if (rec.status === "bin") return "Official recall found";
    if (rec.status === "none") return "Recall checked";
    return "Check model";
  }

  function searchRecall(list) {
    var input = document.querySelector("[data-recall-search]");
    var out = document.querySelector("[data-recall-results]");
    if (!input || !out) return;
    var q = input.value.trim().toLowerCase();
    if (!q) {
      out.innerHTML = "";
      return;
    }
    var hits = list.filter(function (product) {
      return [product.title, product.meta, product.id, product.category, product.searchQuery].join(" ").toLowerCase().indexOf(q) !== -1;
    }).slice(0, 8);
    if (!hits.length) {
      out.innerHTML = '<p class="empty">No catalogue model matches that. Use the official search links.</p>';
      return;
    }
    out.innerHTML = '<ul class="recall-hits">' + hits.map(function (product) {
      var href = "/" + product.category + "/" + product.id + "/";
      var label = recallStatus(product);
      var tone = label === "Official recall found" ? "badge-bin" : label === "Recall checked" ? "badge-clear" : "badge-wait";
      return '<li><a href="' + esc(href) + '">' + esc(product.title) + '</a> <span class="badge ' + tone + '">' + esc(label) + "</span></li>";
    }).join("") + "</ul>";
  }

  var recallList = [];
  if (document.querySelector("[data-recall-search]")) {
    catalogue(function (list) {
      recallList = list;
      searchRecall(list);
    });
    document.addEventListener("input", function (event) {
      if (!event.target || !event.target.hasAttribute("data-recall-search")) return;
      searchRecall(recallList);
    });
    document.addEventListener("checkedlab-products", function () {
      recallList = window.CheckedLabProducts || recallList;
    });
  }

  document.querySelectorAll("[data-gift-quiz]").forEach(function (quiz) {
    var who = "";
    var steps = {
      who: quiz.querySelector('[data-quiz-step="who"]'),
      budget: quiz.querySelector('[data-quiz-step="budget"]'),
      interest: quiz.querySelector('[data-quiz-step="interest"]')
    };
    var result = quiz.querySelector("[data-quiz-result]");
    function show(name) {
      Object.keys(steps).forEach(function (key) {
        if (steps[key]) steps[key].hidden = key !== name;
      });
      if (result) result.hidden = true;
    }
    quiz.addEventListener("click", function (event) {
      var choice = event.target.closest("[data-quiz-value]");
      var next = event.target.closest("[data-quiz-next]");
      if (choice && choice.getAttribute("data-quiz-step-value") === "who") {
        who = choice.getAttribute("data-quiz-value");
        show("budget");
        return;
      }
      if (next) {
        show("interest");
        return;
      }
      if (choice && choice.getAttribute("data-quiz-step-value") === "interest") {
        var pick = GUIDES[choice.getAttribute("data-quiz-value")] || GUIDES[who];
        if (!pick || !result) return;
        result.hidden = false;
        result.innerHTML = '<a class="store-btn store-primary" href="' + esc(pick[0]) + '">Open ' + esc(pick[1]) + "</a>";
        if (steps.interest) steps.interest.hidden = true;
      }
    });
  });

  document.querySelectorAll(".checklist").forEach(function (list) {
    Array.prototype.forEach.call(list.children, function (li, index) {
      if (!li || li.tagName !== "LI" || li.querySelector("input")) return;
      var key = "checkedlab-check:" + location.pathname + ":" + index;
      var input = document.createElement("input");
      input.type = "checkbox";
      input.className = "check-box";
      input.setAttribute("aria-label", "Mark this step done");
      try { input.checked = localStorage.getItem(key) === "1"; } catch (e) {}
      li.classList.toggle("is-done", input.checked);
      input.addEventListener("change", function () {
        li.classList.toggle("is-done", input.checked);
        try { localStorage.setItem(key, input.checked ? "1" : "0"); } catch (e) {}
      });
      li.classList.add("check-row");
      li.insertBefore(input, li.firstChild);
    });
  });

  var toggle = document.querySelector("[data-nav-toggle]");
  var panel = document.querySelector("[data-nav-panel]");
  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      panel.classList.toggle("is-open", open);
    });
  }
  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || !form.querySelector || !form.querySelector("[data-model-search]")) return;
    if (document.body.dataset.page !== "home") return;
    event.preventDefault();
    var dest = document.getElementById("popular");
    if (!dest) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    dest.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  });

  var dock = document.querySelector("[data-dock]");
  var top = dock && dock.querySelector("[data-to-top]");
  if (top) {
    top.setAttribute("aria-label", "Back to top");
    function paintTop() { top.hidden = window.scrollY < 480; }
    paintTop();
    window.addEventListener("scroll", paintTop, { passive: true });
    top.addEventListener("click", function () {
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      var skip = document.querySelector(".skip");
      if (skip) skip.focus();
    });
  }
})();
