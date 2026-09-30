(function (root) {
  "use strict";

  function createMasterDataController(options) {
    options = options || {};
    var state = options.state;
    var refs = options.refs;

    function addWorkerType() {
      var value = refs.workerTypeName.value.trim();
      if (!value) return options.showToast("Enter a worker category name.");
      options.normalizeMasterData();
      if (options.includesIgnoreCase(state.settings.workerTypes, value)) return options.showToast("Worker category already exists.");
      state.settings.workerTypes.push(value);
      options.saveSettings();
      refs.workerTypeName.value = "";
      options.renderAll();
      options.showToast("Worker category added.");
    }

    function editWorkerType(type) {
      var next = prompt("Rename worker category", type);
      if (next == null) return;
      next = next.trim();
      if (!next) return options.showToast("Worker category name cannot be blank.");
      if (next === type) return;
      options.normalizeMasterData();
      if (options.includesIgnoreCase(state.settings.workerTypes, next)) return options.showToast("Worker category already exists.");
      state.settings.workerTypes = state.settings.workerTypes.map(function (existing) { return existing === type ? next : existing; });
      var changedWorkers = state.workers.filter(function (worker) { return worker.type === type; }).map(function (worker) {
        return Object.assign({}, worker, { type: next, updatedAt: new Date().toISOString() });
      });
      Promise.all(changedWorkers.map(function (worker) { return options.put("workers", worker); })).then(function () {
        options.saveSettings();
        return options.refreshAll();
      }).then(function () { options.showToast("Worker category updated."); }).catch(options.showError);
    }

    function deleteWorkerType(type) {
      if (type === "Other") return options.showToast("Other is required for custom categories.");
      var linked = state.workers.filter(function (worker) { return worker.type === type; }).length;
      if (linked) return options.showToast("Category is used by " + linked + " worker(s). Rename it or move workers first.");
      if (!confirm("Delete worker category '" + type + "'?")) return;
      state.settings.workerTypes = state.settings.workerTypes.filter(function (existing) { return existing !== type; });
      options.normalizeMasterData();
      options.saveSettings();
      options.renderAll();
      options.showToast("Worker category deleted.");
    }

    function addBreakType() {
      var value = refs.breakTypeName.value.trim();
      if (!value) return options.showToast("Enter a break type name.");
      options.normalizeMasterData();
      if (options.includesIgnoreCase(state.settings.breakTypes, value)) return options.showToast("Break type already exists.");
      state.settings.breakTypes.push(value);
      options.saveSettings();
      refs.breakTypeName.value = "";
      options.renderAll();
      options.showToast("Break type added.");
    }

    function editBreakType(type) {
      var next = prompt("Rename break type", type);
      if (next == null) return;
      next = next.trim();
      if (!next) return options.showToast("Break type name cannot be blank.");
      if (next === type) return;
      options.normalizeMasterData();
      if (options.includesIgnoreCase(state.settings.breakTypes, next)) return options.showToast("Break type already exists.");
      state.settings.breakTypes = state.settings.breakTypes.map(function (existing) { return existing === type ? next : existing; });
      var changedAttendance = state.attendance.filter(function (row) {
        return (row.breaks || []).some(function (br) { return br.type === type; });
      }).map(function (row) {
        var updated = Object.assign({}, row, {
          breaks: (row.breaks || []).map(function (br) { return br.type === type ? Object.assign({}, br, { type: next }) : br; }),
          updatedAt: new Date().toISOString()
        });
        updated.calculation = options.calculateAttendance(updated, options.getWorker(updated.workerId) || {});
        return updated;
      });
      Promise.all(changedAttendance.map(function (row) { return options.put("attendance", row); })).then(function () {
        options.saveSettings();
        return options.refreshAll();
      }).then(function () { options.showToast("Break type updated."); }).catch(options.showError);
    }

    function deleteBreakType(type) {
      if (type === "Other") return options.showToast("Other is required for custom break notes.");
      var linked = state.attendance.reduce(function (sum, row) { return sum + (row.breaks || []).filter(function (br) { return br.type === type; }).length; }, 0);
      if (linked) return options.showToast("Break type is used by " + linked + " break record(s). Rename it first.");
      if (!confirm("Delete break type '" + type + "'?")) return;
      state.settings.breakTypes = state.settings.breakTypes.filter(function (existing) { return existing !== type; });
      options.normalizeMasterData();
      options.saveSettings();
      options.renderAll();
      options.showToast("Break type deleted.");
    }

    return { addWorkerType: addWorkerType, editWorkerType: editWorkerType, deleteWorkerType: deleteWorkerType, addBreakType: addBreakType, editBreakType: editBreakType, deleteBreakType: deleteBreakType };
  }

  root.WorkPayMasterDataController = { createMasterDataController: createMasterDataController };
}(typeof self !== "undefined" ? self : window));
