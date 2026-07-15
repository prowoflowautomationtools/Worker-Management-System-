"use strict";

self.onmessage = function (event) {
  var payload = event.data || {};
  if (payload.type !== "build-report") return;
  var result = buildReportDataset(payload.attendance || [], payload.workers || [], payload.settings || {}, payload.from, payload.to, payload.workerId);
  self.postMessage({ requestId: payload.requestId, result: result });
};

function buildReportDataset(attendance, workers, settings, from, to, workerId) {
  var workersById = workers.reduce(function (map, worker) {
    map[worker.id] = worker || {};
    return map;
  }, {});
  var rows = attendance.filter(function (row) {
    return row.date >= from && row.date <= to && (!workerId || row.workerId === workerId);
  }).map(function (row) {
    var worker = workersById[row.workerId] || {};
    var calculation = calculateAttendance(row, worker, settings);
    return {
      id: row.id,
      workerId: row.workerId,
      date: row.date,
      day: row.day,
      status: row.status,
      checkIn: row.checkIn || "",
      checkOut: row.checkOut || "",
      worker: {
        id: worker.id || "",
        name: worker.name || "Unknown",
        type: worker.type || "-"
      },
      calculation: calculation
    };
  });

  var workerGroups = {};
  var categoryGroups = {};
  rows.forEach(function (row) {
    var workerGroup = workerGroups[row.workerId] || (workerGroups[row.workerId] = {
      name: row.worker.name || "Unknown",
      type: row.worker.type || "-",
      days: 0,
      netMinutes: 0,
      overtimeMinutes: 0,
      totalWage: 0
    });
    workerGroup.days += 1;
    workerGroup.netMinutes += row.calculation.netMinutes || 0;
    workerGroup.overtimeMinutes += row.calculation.overtimeMinutes || 0;
    workerGroup.totalWage += row.calculation.totalWage || 0;

    var category = row.worker.type || "Unknown";
    var categoryGroup = categoryGroups[category] || (categoryGroups[category] = {
      category: category,
      workerIds: {},
      days: 0,
      netMinutes: 0,
      totalWage: 0
    });
    categoryGroup.workerIds[row.workerId] = true;
    categoryGroup.days += 1;
    categoryGroup.netMinutes += row.calculation.netMinutes || 0;
    categoryGroup.totalWage += row.calculation.totalWage || 0;
  });

  return {
    rows: rows,
    attendanceDays: rows.filter(function (row) {
      return row.status === "present" || row.status === "half-day";
    }).length,
    totals: sumCalculated(rows),
    workerSummary: Object.keys(workerGroups).map(function (key) {
      return workerGroups[key];
    }).sort(function (a, b) {
      return a.name.localeCompare(b.name);
    }),
    categorySummary: Object.keys(categoryGroups).map(function (key) {
      var row = categoryGroups[key];
      return {
        category: row.category,
        workerCount: Object.keys(row.workerIds).length,
        days: row.days,
        netMinutes: row.netMinutes,
        totalWage: row.totalWage
      };
    }).sort(function (a, b) {
      return a.category.localeCompare(b.category);
    })
  };
}

function calculateAttendance(record, worker, settings) {
  var active = record.status === "present" || record.status === "half-day";
  var grossMinutes = 0;
  var breakMinutes = 0;
  if (active && record.checkIn && record.checkOut) {
    grossMinutes = Math.max(0, timeToMinutes(record.checkOut) - timeToMinutes(record.checkIn));
    breakMinutes = (record.breaks || []).reduce(function (sum, br) {
      if (!br.startTime || !br.endTime) return sum;
      return sum + Math.max(0, timeToMinutes(br.endTime) - timeToMinutes(br.startTime));
    }, 0);
  }
  var netMinutes = Math.max(0, grossMinutes - breakMinutes);
  var standardMinutes = Math.round(numberValue(worker.standardHours, settings.defaultHours || 8) * 60);
  var overtimeMinutes = settings.overtimeMode === "none" ? 0 : Math.max(0, netMinutes - standardMinutes);
  var regularMinutes = Math.max(0, netMinutes - overtimeMinutes);
  var regularPay = 0;
  var taskPay = 0;
  var overtimePay = overtimeMinutes * numberValue(worker.overtimeRate, 0) / 60;
  var allowancePay = netMinutes > 0 ? numberValue(worker.allowance, 0) : 0;

  if (worker.wageType === "hourly") {
    regularPay = regularMinutes * numberValue(worker.hourlyRate, 0) / 60;
  } else if (worker.wageType === "daily") {
    if (settings.dailyPolicy === "full-day") {
      regularPay = netMinutes > 0 ? numberValue(worker.dailyRate, 0) : 0;
    } else {
      regularPay = standardMinutes > 0 ? numberValue(worker.dailyRate, 0) * Math.min(regularMinutes, standardMinutes) / standardMinutes : 0;
    }
  } else if (worker.wageType === "task") {
    taskPay = numberValue(record.taskUnits, 0) * numberValue(record.taskRateOverride == null ? worker.taskRate : record.taskRateOverride, 0);
  }

  return {
    grossMinutes: grossMinutes,
    breakMinutes: breakMinutes,
    netMinutes: netMinutes,
    standardMinutes: standardMinutes,
    overtimeMinutes: overtimeMinutes,
    regularMinutes: regularMinutes,
    regularPay: regularPay,
    overtimePay: overtimePay,
    taskPay: taskPay,
    allowancePay: allowancePay,
    totalWage: regularPay + overtimePay + taskPay + allowancePay
  };
}

function sumCalculated(rows) {
  return rows.reduce(function (sum, row) {
    var c = row.calculation || {};
    sum.netMinutes += c.netMinutes || 0;
    sum.overtimeMinutes += c.overtimeMinutes || 0;
    sum.totalWage += c.totalWage || 0;
    return sum;
  }, { netMinutes: 0, overtimeMinutes: 0, totalWage: 0 });
}

function timeToMinutes(value) {
  if (!value) return 0;
  var parts = value.split(":").map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function numberValue(value, fallback) {
  var num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}
