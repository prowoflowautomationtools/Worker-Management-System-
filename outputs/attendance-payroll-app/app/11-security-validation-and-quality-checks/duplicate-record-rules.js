(function (root) {
  "use strict";

  function findDuplicateAttendance(records, record) {
    if (!record) return null;
    return (records || []).find(function (row) {
      return row.id !== record.id && row.workerId === record.workerId && row.date === record.date;
    }) || null;
  }

  function findDuplicateWorker(records, worker) {
    if (!worker || !worker.phoneDigits) return null;
    return (records || []).find(function (row) {
      return row.id !== worker.id && row.phoneDigits === worker.phoneDigits;
    }) || null;
  }

  root.WorkPayDuplicateRecords = {
    findDuplicateAttendance: findDuplicateAttendance,
    findDuplicateWorker: findDuplicateWorker
  };
}(typeof self !== "undefined" ? self : window));
