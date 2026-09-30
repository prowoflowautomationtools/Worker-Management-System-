"use strict";

importScripts("app/05-wage-and-payroll-calculation/payroll-calculation-rules.js");
importScripts("app/06-reports-reviews-and-exports/report-aggregation-rules.js");

self.onmessage = function (event) {
  var payload = event.data || {};
  if (payload.type !== "build-report") return;
  var result = self.WorkPayReports.buildReportDataset(payload.attendance || [], payload.workers || [], payload.settings || {}, payload.from, payload.to, payload.workerId);
  self.postMessage({ requestId: payload.requestId, result: result });
};
