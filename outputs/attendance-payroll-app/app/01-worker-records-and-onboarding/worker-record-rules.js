(function (root) {
  "use strict";

  function buildWorkerRecord(input) {
    input = input || {};
    var shared = root.WorkPayShared || {};
    var settings = root.WorkPaySettings || {};
    var records = root.WorkPayRecords || {};
    var existing = input.existing || {};
    var numberValue = shared.numberValue || function (value, fallback) { return Number(value) || fallback; };
    var normalizePhone = shared.normalizePhone || function (value) { return String(value || "").replace(/\D/g, ""); };
    var now = input.now || new Date().toISOString();
    var phone = normalizePhone(input.phone);
    var whatsapp = normalizePhone(input.whatsapp) || phone;
    var statutoryProfile = existing.statutoryProfile || (settings.createDefaultWorkerStatutoryProfile ? settings.createDefaultWorkerStatutoryProfile() : undefined);
    var worker = {
      id: input.id,
      name: String(input.name || "").trim(),
      phone: phone,
      whatsapp: whatsapp,
      email: String(input.email || "").trim(),
      website: String(input.website || "").trim(),
      otherContact: String(input.otherContact || "").trim(),
      type: input.type || "Other",
      wageType: input.wageType,
      standardHours: numberValue(input.standardHours, input.defaultHours || 8),
      hourlyRate: numberValue(input.hourlyRate, 0),
      dailyRate: numberValue(input.dailyRate, 0),
      overtimeRate: numberValue(input.overtimeRate, 0),
      taskRate: numberValue(input.taskRate, 0),
      allowance: numberValue(input.allowance, 0),
      compensationNotes: String(input.compensationNotes || "").trim(),
      statutoryProfile: statutoryProfile,
      updatedAt: now,
      createdAt: existing.createdAt || now
    };
    return records.normalizeWorkerRecord ? records.normalizeWorkerRecord(worker) : worker;
  }

  root.WorkPayWorkerRecords = {
    buildWorkerRecord: buildWorkerRecord
  };
}(typeof self !== "undefined" ? self : window));
