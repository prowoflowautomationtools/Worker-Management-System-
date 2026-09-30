(function (window) {
  "use strict";

  function buildReportCsvRows(reportRows, getStatusLabel, getMoneyRaw) {
    var header = ["Date", "Day", "Worker", "Category", "Status", "Check In", "Check Out", "Break Minutes", "Net Minutes", "Overtime Minutes", "Regular Pay", "Overtime Pay", "Task Pay", "Allowance", "Total Wage"];
    var body = (reportRows || []).map(function (row) {
      var calculation = row.calculation || {};
      return [row.date, row.day, row.worker && row.worker.name || "", row.worker && row.worker.type || "", getStatusLabel(row.status), row.checkIn || "", row.checkOut || "", calculation.breakMinutes, calculation.netMinutes, calculation.overtimeMinutes, getMoneyRaw(calculation.regularPay), getMoneyRaw(calculation.overtimePay), getMoneyRaw(calculation.taskPay), getMoneyRaw(calculation.allowancePay), getMoneyRaw(calculation.totalWage)];
    });
    return [header].concat(body);
  }

  function buildBackupPayload(data) {
    return {
      exportedAt: new Date().toISOString(),
      app: "WorkPay India",
      version: 2,
      schemaVersion: data.schemaVersion,
      settings: data.settings,
      workers: data.workers,
      attendance: data.attendance,
      leaveRecords: data.leaveRecords
    };
  }

  window.WorkPayBackupExport = {
    buildReportCsvRows: buildReportCsvRows,
    buildBackupPayload: buildBackupPayload
  };
})(window);
