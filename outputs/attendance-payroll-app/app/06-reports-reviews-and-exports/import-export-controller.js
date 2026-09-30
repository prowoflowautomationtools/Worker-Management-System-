(function (root) {
  "use strict";

  function createImportExportController(options) {
    options = options || {};
    var state = options.state;
    var refs = options.refs;

    function exportCsv() {
      if (!state.reportRows.length) return options.showToast("No report rows to export.");
      var rows = options.buildReportCsvRows(state.reportRows, options.labelStatus, options.moneyRaw);
      options.downloadFile("workpay-report.csv", options.toCsv(rows), "text/csv");
    }

    function exportJson() {
      var payload = options.buildBackupPayload({ schemaVersion: options.dbVersion, settings: state.settings, workers: state.workers, attendance: state.attendance, leaveRecords: state.leaveRecords });
      options.downloadFile("workpay-backup.json", JSON.stringify(payload, null, 2), "application/json");
    }

    function importJson() {
      var file = refs.importJsonInput.files[0];
      if (!file) return;
      options.readJsonBackup(file).then(function (payload) {
        if (!Array.isArray(payload.workers) || !Array.isArray(payload.attendance) || !Array.isArray(payload.leaveRecords)) throw new Error("Backup file is missing required arrays.");
        if (!confirm("Import will replace local WorkPay data. Continue?")) return false;
        return Promise.all([options.clearStore("workers"), options.clearStore("attendance"), options.clearStore("leaveRecords")]).then(function () {
          state.settings = options.normalizeSettings(Object.assign(options.loadSettings(), payload.settings || {}));
          options.saveSettings();
          return Promise.all(payload.workers.map(function (row) { return options.put("workers", options.normalizeWorkerRecord(row)); })
            .concat(payload.attendance.map(function (row) { return options.put("attendance", options.normalizeAttendanceRecord(row)); }))
            .concat(payload.leaveRecords.map(function (row) { return options.put("leaveRecords", options.normalizeLeaveRecord(row)); })));
        }).then(options.refreshAll).then(function () { return true; });
      }).then(function (imported) {
        if (!imported) return;
        options.restoreSettingsForm();
        options.applyTheme();
        options.showToast("Backup imported.");
      }).catch(options.showError).finally(function () { refs.importJsonInput.value = ""; });
    }

    return { exportCsv: exportCsv, exportJson: exportJson, importJson: importJson };
  }

  root.WorkPayImportExportController = { createImportExportController: createImportExportController };
}(typeof self !== "undefined" ? self : window));
