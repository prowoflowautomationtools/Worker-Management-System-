(function (root) {
  "use strict";

  var DEFAULT_TYPES = ["Mason", "Helper", "Electrician", "Plumber", "Carpenter", "Painter", "Driver", "Security", "Housekeeping", "Other"];
  var DEFAULT_BREAK_TYPES = ["Lunch", "Tea", "Rest", "Other"];
  var DEFAULT_CURRENCY = "INR";

  function unique(values) {
    if (root.WorkPayShared && root.WorkPayShared.unique) return root.WorkPayShared.unique(values);
    return Array.from(new Set(values.filter(Boolean)));
  }

  function createDefaultStatutoryConfig() {
    return {
      establishmentState: "",
      modules: {
        pf: { enabled: false },
        esi: { enabled: false },
        tds: { enabled: false },
        professionalTax: { enabled: false }
      },
      notes: ""
    };
  }

  function createDefaultWorkerStatutoryProfile() {
    return {
      pfEligible: false,
      esiEligible: false,
      tdsApplicable: false,
      professionalTaxApplicable: false,
      identifiers: {
        uan: "",
        esiNumber: "",
        pan: ""
      }
    };
  }

  function getDefaultPublicHolidays() {
    var year = new Date().getFullYear();
    return [year, year + 1].reduce(function (all, currentYear) {
      return all.concat([
        { date: currentYear + "-01-26", name: "Republic Day", type: "national-holiday" },
        { date: currentYear + "-08-15", name: "Independence Day", type: "national-holiday" },
        { date: currentYear + "-10-02", name: "Gandhi Jayanti", type: "national-holiday" }
      ]);
    }, []);
  }

  function normalizeSettings(settings) {
    var merged = Object.assign({}, settings);
    merged.currencyCode = merged.currencyCode || DEFAULT_CURRENCY;
    merged.timeFormat = merged.timeFormat === "12h" ? "12h" : "24h";
    merged.dateFormat = merged.dateFormat || "ddmmyyyy";
    merged.yearMode = merged.yearMode === "calendar" ? "calendar" : "financial";
    merged.publicHolidays = normalizeHolidayList(Array.isArray(merged.publicHolidays) ? merged.publicHolidays : getDefaultPublicHolidays());
    merged.statutoryConfig = normalizeStatutoryConfig(merged.statutoryConfig);
    if (!Array.isArray(merged.workerTypes)) merged.workerTypes = DEFAULT_TYPES.slice();
    if (!Array.isArray(merged.breakTypes)) merged.breakTypes = DEFAULT_BREAK_TYPES.slice();
    return merged;
  }

  function buildSettingsUpdate(current, input) {
    input = input || {};
    var next = Object.assign({}, current || {}, {
      businessName: String(input.businessName || "").trim(),
      currencyCode: input.currencyCode || DEFAULT_CURRENCY,
      defaultHours: input.defaultHours,
      dailyPolicy: input.dailyPolicy,
      overtimeMode: input.overtimeMode,
      theme: input.theme,
      timeFormat: input.timeFormat || "24h",
      dateFormat: input.dateFormat || "ddmmyyyy",
      yearMode: input.yearMode || "financial",
      publicHolidays: input.publicHolidays || [],
      statutoryConfig: input.statutoryConfig || createDefaultStatutoryConfig()
    });
    return normalizeSettings(next);
  }

  function normalizeStatutoryConfig(config) {
    var merged = Object.assign(createDefaultStatutoryConfig(), config || {});
    merged.modules = Object.assign(createDefaultStatutoryConfig().modules, config && config.modules || {});
    merged.modules.pf = Object.assign({ enabled: false }, merged.modules.pf || {});
    merged.modules.esi = Object.assign({ enabled: false }, merged.modules.esi || {});
    merged.modules.tds = Object.assign({ enabled: false }, merged.modules.tds || {});
    merged.modules.professionalTax = Object.assign({ enabled: false }, merged.modules.professionalTax || {});
    return merged;
  }

  function normalizeHolidayList(list) {
    return unique((Array.isArray(list) ? list : []).map(function (row) {
      if (!row || !row.date) return "";
      return JSON.stringify({
        date: row.date,
        name: String(row.name || "").trim() || "Holiday",
        type: normalizeHolidayType(row.type)
      });
    })).map(function (row) {
      return JSON.parse(row);
    }).sort(function (a, b) {
      return a.date.localeCompare(b.date) || a.name.localeCompare(b.name);
    });
  }

  function normalizeHolidayType(value) {
    return ["national-holiday", "festival-holiday", "site-holiday"].includes(value) ? value : "site-holiday";
  }

  function parsePublicHolidayInput(text) {
    var lines = String(text || "").split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
    var seen = {};
    var holidays = [];
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i];
      var parts = line.split("|").map(function (part) { return part.trim(); }).filter(Boolean);
      if (parts.length < 2 || parts.length > 3) {
        return { ok: false, message: "Holiday line " + (i + 1) + " must use: YYYY-MM-DD | Holiday name | type" };
      }
      var date = parts[0];
      var name = parts[1];
      var type = normalizeHolidayType(parts[2] || "national-holiday");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + "T00:00:00").getTime())) {
        return { ok: false, message: "Holiday line " + (i + 1) + " has an invalid date." };
      }
      var key = date + "|" + name.toLowerCase();
      if (seen[key]) {
        return { ok: false, message: "Holiday line " + (i + 1) + " duplicates an earlier holiday entry." };
      }
      seen[key] = true;
      holidays.push({ date: date, name: name, type: type });
    }
    return { ok: true, holidays: normalizeHolidayList(holidays) };
  }

  function formatPublicHolidayLines(list) {
    return normalizeHolidayList(list).map(function (row) {
      return [row.date, row.name, row.type].join(" | ");
    }).join("\n");
  }

  root.WorkPaySettings = {
    DEFAULT_TYPES: DEFAULT_TYPES,
    DEFAULT_BREAK_TYPES: DEFAULT_BREAK_TYPES,
    DEFAULT_CURRENCY: DEFAULT_CURRENCY,
    createDefaultStatutoryConfig: createDefaultStatutoryConfig,
    createDefaultWorkerStatutoryProfile: createDefaultWorkerStatutoryProfile,
    getDefaultPublicHolidays: getDefaultPublicHolidays,
    normalizeSettings: normalizeSettings,
    buildSettingsUpdate: buildSettingsUpdate,
    normalizeStatutoryConfig: normalizeStatutoryConfig,
    normalizeHolidayList: normalizeHolidayList,
    normalizeHolidayType: normalizeHolidayType,
    parsePublicHolidayInput: parsePublicHolidayInput,
    formatPublicHolidayLines: formatPublicHolidayLines
  };
}(typeof self !== "undefined" ? self : window));
