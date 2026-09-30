(function (root) {
  "use strict";

  function numberValue(value, fallback) {
    var num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function timeToMinutes(value) {
    if (!value) return 0;
    var parts = value.split(":").map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }

  function validateTimes(checkIn, checkOut, breaks, needsTime) {
    if (!needsTime) return { ok: true };
    var start = timeToMinutes(checkIn);
    var end = timeToMinutes(checkOut);
    if (end <= start) return { ok: false, fieldKey: "checkOut", message: "Check-out must be after check-in for the same work date." };
    var ranges = [];
    for (var i = 0; i < breaks.length; i += 1) {
      var br = breaks[i];
      if (!br.startTime || !br.endTime) return { ok: false, fieldKey: "breakRows", message: "Each break needs both start and end time." };
      var bs = timeToMinutes(br.startTime);
      var be = timeToMinutes(br.endTime);
      if (br.type === "Other" && !br.note) return { ok: false, fieldKey: "breakRows", message: "Add a note when the break type is Other." };
      if (be <= bs) return { ok: false, fieldKey: "breakRows", message: "Break end must be after break start." };
      if (bs < start || be > end) return { ok: false, fieldKey: "breakRows", message: "Breaks must fall inside check-in and check-out time." };
      ranges.push([bs, be]);
    }
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    for (var j = 1; j < ranges.length; j += 1) {
      if (ranges[j][0] < ranges[j - 1][1]) return { ok: false, fieldKey: "breakRows", message: "Break times cannot overlap." };
    }
    return { ok: true };
  }

  function calculateAttendance(record, worker, settings) {
    settings = settings || {};
    worker = worker || {};
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

  root.WorkPayPayroll = {
    calculateAttendance: calculateAttendance,
    validateTimes: validateTimes,
    timeToMinutes: timeToMinutes,
    numberValue: numberValue
  };
}(typeof self !== "undefined" ? self : window));
