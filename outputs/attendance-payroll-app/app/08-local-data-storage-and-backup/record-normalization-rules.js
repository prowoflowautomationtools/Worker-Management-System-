(function (root) {
  "use strict";

  function normalizePhone(value) {
    if (root.WorkPayShared && root.WorkPayShared.normalizePhone) return root.WorkPayShared.normalizePhone(value);
    return String(value || "").replace(/\D/g, "");
  }

  function createDefaultWorkerStatutoryProfile() {
    if (root.WorkPaySettings && root.WorkPaySettings.createDefaultWorkerStatutoryProfile) {
      return root.WorkPaySettings.createDefaultWorkerStatutoryProfile();
    }
    return {
      pfEligible: false,
      esiEligible: false,
      tdsApplicable: false,
      professionalTaxApplicable: false,
      identifiers: { uan: "", esiNumber: "", pan: "" }
    };
  }

  function getDayName(value) {
    return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
  }

  function normalizeWorkerRecord(worker) {
    var normalized = Object.assign({}, worker || {});
    normalized.name = String(normalized.name || "").trim();
    normalized.phone = normalizePhone(normalized.phone);
    normalized.whatsapp = normalizePhone(normalized.whatsapp) || normalized.phone;
    normalized.nameKey = normalized.name.toLowerCase();
    normalized.phoneDigits = normalized.phone;
    normalized.type = normalized.type || "Other";
    normalized.searchText = [normalized.name, normalized.phone, normalized.whatsapp, normalized.type, normalized.email || ""].join(" ").toLowerCase();
    normalized.statutoryProfile = Object.assign(createDefaultWorkerStatutoryProfile(), normalized.statutoryProfile || {});
    normalized.statutoryProfile.identifiers = Object.assign(createDefaultWorkerStatutoryProfile().identifiers, normalized.statutoryProfile.identifiers || {});
    return normalized;
  }

  function normalizeAttendanceRecord(row) {
    var normalized = Object.assign({}, row || {});
    normalized.breaks = Array.isArray(normalized.breaks) ? normalized.breaks.map(function (br) {
      return {
        startTime: br.startTime || "",
        endTime: br.endTime || "",
        type: br.type || "Lunch",
        note: String(br.note || "").trim()
      };
    }) : [];
    normalized.day = normalized.day || (normalized.date ? getDayName(normalized.date) : "");
    return normalized;
  }

  function normalizeLeaveRecord(row) {
    var normalized = Object.assign({}, row || {});
    normalized.reason = String(normalized.reason || "").trim();
    normalized.attachment = normalized.attachment || null;
    return normalized;
  }

  root.WorkPayRecords = {
    normalizeWorkerRecord: normalizeWorkerRecord,
    normalizeAttendanceRecord: normalizeAttendanceRecord,
    normalizeLeaveRecord: normalizeLeaveRecord
  };
}(typeof self !== "undefined" ? self : window));
