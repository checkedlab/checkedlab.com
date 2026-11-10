(function () {
  var input = document.querySelector("[data-model-search]");
  if (!input) return;
  var items = document.querySelectorAll("[data-catalog]");
  var empty = document.querySelector("[data-search-empty]");
  function run() {
    var q = input.value.trim().toLowerCase();
    var shown = 0;
    items.forEach(function (el) {
      var name = (el.getAttribute("data-name") || "").toLowerCase();
      var hit = !q || name.indexOf(q) !== -1;
      el.hidden = !hit;
      if (hit) shown += 1;
    });
    if (empty) empty.hidden = shown !== 0;
  }
  input.addEventListener("input", run);
})();
