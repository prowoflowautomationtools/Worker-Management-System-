(function (root) {
  "use strict";

  function buildBreakRecord(input) {
    input = input || {};
    return {
      startTime: input.startTime || "",
      endTime: input.endTime || "",
      type: input.type || "Lunch",
      note: String(input.note || "").trim()
    };
  }

  function hasBreakInput(record) {
    return !!(record && (record.startTime || record.endTime || record.note));
  }

  root.WorkPayBreakRecords = {
    buildBreakRecord: buildBreakRecord,
    hasBreakInput: hasBreakInput
  };
}(typeof self !== "undefined" ? self : window));
