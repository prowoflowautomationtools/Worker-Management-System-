(function (root) {
  "use strict";

  function buildLeaveRecord(input) {
    input = input || {};
    var existing = input.existing || {};
    var now = input.now || new Date().toISOString();
    var attachment = input.removeAttachment ? null : input.attachment || existing.attachment || null;
    return {
      id: input.id,
      workerId: input.workerId || "",
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: String(input.reason || "").trim(),
      attachment: attachment,
      updatedAt: now,
      createdAt: existing.createdAt || now
    };
  }

  root.WorkPayLeaveRecords = {
    buildLeaveRecord: buildLeaveRecord
  };
}(typeof self !== "undefined" ? self : window));
