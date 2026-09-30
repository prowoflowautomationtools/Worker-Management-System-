(function (root) {
  "use strict";

  function createReportFilterController(options) {
    options = options || {};
    var refs = options.refs;
    var sessionStorageRules = options.sessionStorageRules;

    function restoreReportFilter() {
      var saved = sessionStorageRules.loadJson(options.storageKey, {});
      refs.reportPreset.value = saved.preset === "fy" ? "year" : (saved.preset || "month");
      applyReportPreset(saved.from, saved.to);
      refs.reportWorker.value = saved.workerId || "";
    }

    function applyReportPreset(savedFrom, savedTo) {
      var preset = refs.reportPreset.value;
      var range = options.getPresetDateRange(preset, new Date(), options.getYearMode(), refs.reportFrom.value, refs.reportTo.value, savedFrom, savedTo);
      refs.reportFrom.value = range.from;
      refs.reportTo.value = range.to;
    }

    function saveReportFilter() {
      sessionStorageRules.saveJson(options.storageKey, {
        preset: refs.reportPreset.value,
        from: refs.reportFrom.value,
        to: refs.reportTo.value,
        workerId: refs.reportWorker.value
      });
    }

    return { restoreReportFilter: restoreReportFilter, applyReportPreset: applyReportPreset, saveReportFilter: saveReportFilter };
  }

  root.WorkPayReportFilters = { createReportFilterController: createReportFilterController };
}(typeof self !== "undefined" ? self : window));
