(function (root) {
  "use strict";

  function createEventBinder(options) {
    options = options || {};
    var document = options.document;
    var refs = options.refs;
    var debounce = options.debounce;
    var callbacks = options.callbacks || {};

    function bindEvents() {
      document.querySelectorAll(".nav-item").forEach(function (button) {
        button.addEventListener("click", function () { callbacks.switchView(button.dataset.view); });
      });
      refs.quickCheckInBtn.addEventListener("click", function () { callbacks.switchView("attendance"); });
      refs.quickLeaveBtn.addEventListener("click", function () { callbacks.switchView("leave"); });
      refs.workerForm.addEventListener("submit", callbacks.saveWorker);
      refs.cancelWorkerEditBtn.addEventListener("click", callbacks.resetWorkerForm);
      refs.workerType.addEventListener("change", callbacks.toggleCustomType);
      refs.workerSearch.addEventListener("input", debounce(callbacks.renderWorkers, 80));
      refs.seedDemoBtn.addEventListener("click", callbacks.seedDemoData);

      refs.attendanceForm.addEventListener("submit", callbacks.saveAttendance);
      refs.cancelAttendanceEditBtn.addEventListener("click", callbacks.resetAttendanceForm);
      refs.resetAttendanceBtn.addEventListener("click", callbacks.resetAttendanceForm);
      refs.addBreakBtn.addEventListener("click", function () {
        callbacks.addBreakRow();
        callbacks.updateAttendancePreview();
      });
      ["attendanceWorker", "attendanceDate", "attendanceStatus", "checkIn", "checkOut", "taskUnits", "taskRateOverride"].forEach(function (id) {
        refs[id].addEventListener("input", callbacks.updateAttendancePreview);
        refs[id].addEventListener("change", function () {
          if (id === "attendanceDate") callbacks.updateAttendanceDay();
          callbacks.updateAttendancePreview();
        });
      });
      refs.attendanceFilterWorker.addEventListener("change", callbacks.renderAttendanceHistory);

      refs.leaveForm.addEventListener("submit", callbacks.saveLeaveRecord);
      refs.cancelLeaveEditBtn.addEventListener("click", callbacks.resetLeaveForm);
      refs.resetLeaveBtn.addEventListener("click", callbacks.resetLeaveForm);
      refs.leaveFilterWorker.addEventListener("change", callbacks.renderLeaveRecords);
      refs.leaveAttachment.addEventListener("change", function () {
        var file = refs.leaveAttachment.files[0];
        refs.attachmentInfo.textContent = file ? file.name + " (" + callbacks.formatBytes(file.size) + ")" : "";
        refs.removeAttachmentBtn.dataset.remove = "false";
        refs.removeAttachmentBtn.classList.add("hidden");
      });
      refs.removeAttachmentBtn.addEventListener("click", callbacks.markAttachmentForRemoval);

      ["reportPreset", "reportFrom", "reportTo", "reportWorker"].forEach(function (id) {
        refs[id].addEventListener("change", function () {
          if (id === "reportPreset") callbacks.applyReportPreset();
          callbacks.saveReportFilter();
          callbacks.renderReports();
        });
      });
      refs.exportCsvBtn.addEventListener("click", callbacks.exportCsv);
      refs.saveSettingsBtn.addEventListener("click", callbacks.saveSettingsForm);
      refs.saveWorkerTypeBtn.addEventListener("click", callbacks.addWorkerType);
      refs.workerTypeName.addEventListener("keydown", function (event) {
        if (event.key === "Enter") { event.preventDefault(); callbacks.addWorkerType(); }
      });
      refs.saveBreakTypeBtn.addEventListener("click", callbacks.addBreakType);
      refs.breakTypeName.addEventListener("keydown", function (event) {
        if (event.key === "Enter") { event.preventDefault(); callbacks.addBreakType(); }
      });
      refs.resetAllDataBtn.addEventListener("click", callbacks.resetAllData);
      refs.exportJsonBtn.addEventListener("click", callbacks.exportJson);
      refs.importJsonInput.addEventListener("change", callbacks.importJson);

      [refs.workerForm, refs.attendanceForm, refs.leaveForm].forEach(callbacks.bindValidationListeners);
      [refs.reportFrom, refs.reportTo, refs.settingPublicHolidays, refs.settingDefaultHours].forEach(function (field) {
        field.addEventListener("input", function () { callbacks.clearFieldError(field); });
        field.addEventListener("change", function () { callbacks.clearFieldError(field); });
      });
    }

    return { bindEvents: bindEvents };
  }

  root.WorkPayEventBindings = { createEventBinder: createEventBinder };
}(typeof self !== "undefined" ? self : window));
