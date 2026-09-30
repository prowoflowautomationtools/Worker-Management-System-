(function (root) {
  "use strict";

  function createDataRefreshService(options) {
    options = options || {};
    var storageService = options.storageService;
    var normalizeWorkerRecord = options.normalizeWorkerRecord;
    var normalizeAttendanceRecord = options.normalizeAttendanceRecord;
    var normalizeLeaveRecord = options.normalizeLeaveRecord;
    var byName = options.byName;
    var byDateDesc = options.byDateDesc;
    var byLeaveDateDesc = options.byLeaveDateDesc;

    function refresh(state, onRefreshed) {
      return Promise.all([
        storageService.getAll("workers"),
        storageService.getAll("attendance"),
        storageService.getAll("leaveRecords")
      ]).then(function (results) {
        state.workers = results[0].map(normalizeWorkerRecord).sort(byName);
        state.attendance = results[1].map(normalizeAttendanceRecord).sort(byDateDesc);
        state.leaveRecords = results[2].map(normalizeLeaveRecord).sort(byLeaveDateDesc);
        if (onRefreshed) onRefreshed();
      });
    }

    return { refresh: refresh };
  }

  root.WorkPayDataRefresh = {
    createDataRefreshService: createDataRefreshService
  };
}(typeof self !== "undefined" ? self : window));
