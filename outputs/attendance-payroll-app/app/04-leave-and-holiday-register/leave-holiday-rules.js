(function (root) {
  "use strict";

  function byLeaveDateDesc(a, b) {
    if (root.WorkPayShared && root.WorkPayShared.byLeaveDateDesc) return root.WorkPayShared.byLeaveDateDesc(a, b);
    return (b.startDate || "").localeCompare(a.startDate || "");
  }

  function getConfiguredHolidayRecords(publicHolidays) {
    return (publicHolidays || []).map(function (row) {
      return {
        id: "holiday-" + row.date + "-" + row.name.toLowerCase().replace(/\s+/g, "-"),
        workerId: "",
        type: row.type,
        startDate: row.date,
        endDate: row.date,
        reason: row.name,
        attachment: null,
        source: "settings-holiday",
        createdAt: row.date + "T00:00:00.000Z",
        updatedAt: row.date + "T00:00:00.000Z"
      };
    });
  }

  function getAllLeaveSources(leaveRecords, publicHolidays) {
    return (leaveRecords || []).concat(getConfiguredHolidayRecords(publicHolidays)).sort(byLeaveDateDesc);
  }

  root.WorkPayLeaveHoliday = {
    getConfiguredHolidayRecords: getConfiguredHolidayRecords,
    getAllLeaveSources: getAllLeaveSources
  };
}(typeof self !== "undefined" ? self : window));
