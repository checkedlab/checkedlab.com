/* Default region: saved choice, then browser locale, then a Canadian time zone, else US. */
(function () {
  var KEY = "checkedlab-region";
  var CA_TZ = {
    "America/St_Johns": 1,
    "America/Halifax": 1,
    "America/Glace_Bay": 1,
    "America/Moncton": 1,
    "America/Goose_Bay": 1,
    "America/Blanc-Sablon": 1,
    "America/Toronto": 1,
    "America/Montreal": 1,
    "America/Nipigon": 1,
    "America/Thunder_Bay": 1,
    "America/Iqaluit": 1,
    "America/Pangnirtung": 1,
    "America/Atikokan": 1,
    "America/Winnipeg": 1,
    "America/Rainy_River": 1,
    "America/Resolute": 1,
    "America/Rankin_Inlet": 1,
    "America/Regina": 1,
    "America/Swift_Current": 1,
    "America/Edmonton": 1,
    "America/Cambridge_Bay": 1,
    "America/Yellowknife": 1,
    "America/Inuvik": 1,
    "America/Dawson_Creek": 1,
    "America/Fort_Nelson": 1,
    "America/Creston": 1,
    "America/Whitehorse": 1,
    "America/Dawson": 1,
    "America/Vancouver": 1,
    "America/Coral_Harbour": 1
  };

  function fromLanguages(langs) {
    var primary = String(langs[0] || "").toUpperCase().split("-");
    if (primary[1] === "CA") return "CA";
    if (primary[1] === "US") return "US";
    for (var i = 1; i < langs.length; i++) {
      var part = String(langs[i] || "").toUpperCase().split("-");
      if (part[1] === "CA") return "CA";
      if (part[1] === "US") return "US";
    }
    return null;
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var region = saved === "US" || saved === "CA" ? saved : null;
  if (!region) {
    var langs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ""];
    region = fromLanguages(langs);
  }
  if (!region) {
    var tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    region = CA_TZ[tz] ? "CA" : "US";
  }
  document.documentElement.dataset.region = region;
})();
