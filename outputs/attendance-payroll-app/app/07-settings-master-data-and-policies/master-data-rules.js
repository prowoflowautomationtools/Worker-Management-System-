(function (root) {
  "use strict";

  function normalizeList(values, defaults) {
    var unique = root.WorkPayShared && root.WorkPayShared.unique ? root.WorkPayShared.unique : function (items) {
      return Array.from(new Set(items.filter(Boolean)));
    };
    var list = unique(Array.isArray(values) ? values : []).sort();
    if (!list.length) list = defaults.slice();
    if (!list.includes("Other")) list.push("Other");
    return list;
  }

  function includesIgnoreCase(values, value) {
    var target = String(value || "").toLowerCase();
    return (values || []).some(function (item) {
      return String(item).toLowerCase() === target;
    });
  }

  root.WorkPayMasterData = {
    normalizeList: normalizeList,
    includesIgnoreCase: includesIgnoreCase
  };
}(typeof self !== "undefined" ? self : window));
