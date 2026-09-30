(function (root) {
  "use strict";

  function sumCalculated(rows) {
    return rows.reduce(function (sum, row) {
      var c = row.calculation || {};
      sum.netMinutes += c.netMinutes || 0;
      sum.overtimeMinutes += c.overtimeMinutes || 0;
      sum.totalWage += c.totalWage || 0;
      return sum;
    }, { netMinutes: 0, overtimeMinutes: 0, totalWage: 0 });
  }

  function toDateInput(date) {
    if (root.WorkPayShared && root.WorkPayShared.toDateInput) return root.WorkPayShared.toDateInput(date);
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function startOfWeek(date) {
    if (root.WorkPayShared && root.WorkPayShared.startOfWeek) return root.WorkPayShared.startOfWeek(date);
    var copy = new Date(date);
    var day = copy.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    return copy;
  }

  function endOfWeek(date) {
    if (root.WorkPayShared && root.WorkPayShared.endOfWeek) return root.WorkPayShared.endOfWeek(date);
    var start = startOfWeek(date);
    start.setDate(start.getDate() + 6);
    return start;
  }

  function getCurrentYearRange(today, yearMode) {
    var year = today.getFullYear();
    if (yearMode === "calendar") {
      return {
        from: toDateInput(new Date(year, 0, 1)),
        to: toDateInput(new Date(year, 11, 31))
      };
    }
    var fyStartYear = today.getMonth() >= 3 ? year : year - 1;
    return {
      from: toDateInput(new Date(fyStartYear, 3, 1)),
      to: toDateInput(new Date(fyStartYear + 1, 2, 31))
    };
  }

  function getPresetDateRange(preset, today, yearMode, currentFrom, currentTo, savedFrom, savedTo) {
    if (preset === "today") {
      return { from: toDateInput(today), to: toDateInput(today) };
    }
    if (preset === "week") {
      return { from: toDateInput(startOfWeek(today)), to: toDateInput(endOfWeek(today)) };
    }
    if (preset === "month") {
      return {
        from: toDateInput(new Date(today.getFullYear(), today.getMonth(), 1)),
        to: toDateInput(new Date(today.getFullYear(), today.getMonth() + 1, 0))
      };
    }
    if (preset === "year" || preset === "fy") {
      return getCurrentYearRange(today, yearMode);
    }
    return {
      from: savedFrom || currentFrom || toDateInput(today),
      to: savedTo || currentTo || toDateInput(today)
    };
  }

  function buildReportDataset(attendance, workers, settings, from, to, workerId) {
    var workersById = workers.reduce(function (map, worker) {
      map[worker.id] = worker || {};
      return map;
    }, {});
    var rows = attendance.filter(function (row) {
      return row.date >= from && row.date <= to && (!workerId || row.workerId === workerId);
    }).map(function (row) {
      var worker = workersById[row.workerId] || {};
      var calculation = root.WorkPayPayroll.calculateAttendance(row, worker, settings || {});
      return Object.assign({}, row, { worker: worker, calculation: calculation });
    });

    var workerGroups = {};
    var categoryGroups = {};
    rows.forEach(function (row) {
      var worker = row.worker || {};
      var workerKey = row.workerId || "unknown";
      var workerGroup = workerGroups[workerKey] || (workerGroups[workerKey] = {
        name: worker.name || "Unknown",
        type: worker.type || "-",
        days: 0,
        netMinutes: 0,
        overtimeMinutes: 0,
        totalWage: 0
      });
      workerGroup.days += 1;
      workerGroup.netMinutes += row.calculation.netMinutes || 0;
      workerGroup.overtimeMinutes += row.calculation.overtimeMinutes || 0;
      workerGroup.totalWage += row.calculation.totalWage || 0;

      var category = worker.type || "Unknown";
      var categoryGroup = categoryGroups[category] || (categoryGroups[category] = {
        category: category,
        workerIds: {},
        days: 0,
        netMinutes: 0,
        totalWage: 0
      });
      categoryGroup.workerIds[workerKey] = true;
      categoryGroup.days += 1;
      categoryGroup.netMinutes += row.calculation.netMinutes || 0;
      categoryGroup.totalWage += row.calculation.totalWage || 0;
    });

    return {
      rows: rows,
      attendanceDays: rows.filter(function (row) { return row.status === "present" || row.status === "half-day"; }).length,
      totals: sumCalculated(rows),
      workerSummary: Object.keys(workerGroups).map(function (key) { return workerGroups[key]; }).sort(function (a, b) { return a.name.localeCompare(b.name); }),
      categorySummary: Object.keys(categoryGroups).map(function (key) {
        return {
          category: categoryGroups[key].category,
          workerCount: Object.keys(categoryGroups[key].workerIds).length,
          days: categoryGroups[key].days,
          netMinutes: categoryGroups[key].netMinutes,
          totalWage: categoryGroups[key].totalWage
        };
      }).sort(function (a, b) { return a.category.localeCompare(b.category); })
    };
  }

  root.WorkPayReports = {
    buildReportDataset: buildReportDataset,
    sumCalculated: sumCalculated,
    getCurrentYearRange: getCurrentYearRange,
    getPresetDateRange: getPresetDateRange
  };
}(typeof self !== "undefined" ? self : window));
