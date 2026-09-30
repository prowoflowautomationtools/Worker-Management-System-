(function () {
  "use strict";

  function makeId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }

  function numberValue(value, fallback) {
    var num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function timeToMinutes(value) {
    if (!value) return 0;
    var parts = value.split(":").map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }

  function formatMinutes(minutes) {
    var total = Math.round(minutes || 0);
    var sign = total < 0 ? "-" : "";
    total = Math.abs(total);
    return sign + Math.floor(total / 60) + "h " + String(total % 60).padStart(2, "0") + "m";
  }

  function formatHours(minutes) {
    return formatMinutes(minutes);
  }

  function moneyRaw(value) {
    return (Math.round((Number(value) || 0) * 100) / 100).toFixed(2);
  }

  function toDateInput(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function startOfWeek(date) {
    var copy = new Date(date);
    var day = copy.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    return copy;
  }

  function endOfWeek(date) {
    var start = startOfWeek(date);
    start.setDate(start.getDate() + 6);
    return start;
  }

  function byName(a, b) {
    return a.name.localeCompare(b.name);
  }

  function byDateDesc(a, b) {
    return (b.date || "").localeCompare(a.date || "") || (b.createdAt || "").localeCompare(a.createdAt || "");
  }

  function byLeaveDateDesc(a, b) {
    return (b.startDate || "").localeCompare(a.startDate || "");
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function getCurrencyLocale(currency) {
    return currency === "INR" ? "en-IN" : "en-US";
  }

  function formatMoney(value, currency) {
    currency = currency || "INR";
    try {
      return new Intl.NumberFormat(getCurrencyLocale(currency), {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(value) || 0);
    } catch (error) {
      return currency + " " + moneyRaw(value);
    }
  }

  function formatDateShort(value, dateFormat) {
    if (!value) return "-";
    if ((dateFormat || "ddmmyyyy") === "ddmmyyyy") {
      return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kolkata" });
    }
    return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  }

  function formatDateLong(value) {
    return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  }

  function formatTime(value, timeFormat) {
    if (!value) return "-";
    if ((timeFormat || "24h") === "24h") return value;
    var parts = value.split(":");
    var date = new Date();
    date.setHours(Number(parts[0] || 0), Number(parts[1] || 0), 0, 0);
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    }).format(date);
  }

  function getDayName(value) {
    return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
  }

  function labelStatus(value) {
    return String(value || "").split("-").map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(" ");
  }

  function isValidIndianPhone(value) {
    return /^[6-9]\d{9}$/.test(String(value || "").replace(/\D/g, ""));
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    var units = ["B", "KB", "MB", "GB"];
    var index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return (bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0) + " " + units[index];
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function setCookie(name, value, days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 86400000);
    document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + date.toUTCString() + "; path=/; SameSite=Lax";
  }

  function getCookie(name) {
    return document.cookie.split(";").map(function (part) { return part.trim(); }).reduce(function (found, part) {
      if (found) return found;
      var pieces = part.split("=");
      return pieces[0] === name ? decodeURIComponent(pieces.slice(1).join("=")) : "";
    }, "");
  }

  function toCsv(rows) {
    return rows.map(function (row) {
      return row.map(function (cell) {
        var value = String(cell == null ? "" : cell);
        return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
      }).join(",");
    }).join("\n");
  }

  function ensureIndex(store, name, keyPath, unique) {
    if (!store.indexNames.contains(name)) {
      store.createIndex(name, keyPath, { unique: !!unique });
    }
  }

  function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function debounce(fn, wait) {
    var timer = 0;
    return function () {
      var args = arguments;
      var context = this;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        fn.apply(context, args);
      }, wait);
    };
  }

  window.WorkPayShared = {
    makeId: makeId,
    numberValue: numberValue,
    timeToMinutes: timeToMinutes,
    formatMinutes: formatMinutes,
    formatHours: formatHours,
    moneyRaw: moneyRaw,
    toDateInput: toDateInput,
    startOfWeek: startOfWeek,
    endOfWeek: endOfWeek,
    byName: byName,
    byDateDesc: byDateDesc,
    byLeaveDateDesc: byLeaveDateDesc,
    unique: unique,
    getCurrencyLocale: getCurrencyLocale,
    formatMoney: formatMoney,
    formatDateShort: formatDateShort,
    formatDateLong: formatDateLong,
    formatTime: formatTime,
    getDayName: getDayName,
    labelStatus: labelStatus,
    isValidIndianPhone: isValidIndianPhone,
    formatBytes: formatBytes,
    escapeHtml: escapeHtml,
    escapeAttr: escapeAttr,
    setCookie: setCookie,
    getCookie: getCookie,
    toCsv: toCsv,
    ensureIndex: ensureIndex,
    normalizePhone: normalizePhone,
    debounce: debounce
  };
}());
