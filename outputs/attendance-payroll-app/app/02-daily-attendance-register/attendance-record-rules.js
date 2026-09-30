(function (root) {
  "use strict";

  function buildAttendanceRecord(input) {
    input = input || {};
    var shared = root.WorkPayShared || {};
    var numberValue = shared.numberValue || function (value, fallback) { return Number(value) || fallback; };
    var getDayName = shared.getDayName || function (value) { return value; };
    var status = input.status || "present";
    var needsTime = status === "present" || status === "half-day";
    var now = input.now || new Date().toISOString();
    var existing = input.existing || {};
    var breaks = Array.isArray(input.breaks) ? input.breaks : [];
    var record = {
      id: input.id,
      workerId: input.workerId,
      date: input.date,
      day: getDayName(input.date),
      status: status,
      checkIn: needsTime ? input.checkIn || "" : "",
      checkOut: needsTime ? input.checkOut || "" : "",
      breaks: needsTime ? breaks : [],
      taskUnits: numberValue(input.taskUnits, 0),
      taskRateOverride: input.taskRateOverride === "" || input.taskRateOverride == null ? null : numberValue(input.taskRateOverride, 0),
      notes: String(input.notes || "").trim(),
      updatedAt: now,
      createdAt: existing.createdAt || now
    };
    if (input.calculation) record.calculation = input.calculation;
    return record;
  }

  root.WorkPayAttendanceRecords = {
    buildAttendanceRecord: buildAttendanceRecord
  };
}(typeof self !== "undefined" ? self : window));
