(function (root) {
  "use strict";

  function createWorkerScreenRenderer(options) {
    options = options || {};
    var state = options.state;
    var refs = options.refs;
    var normalizeMasterData = options.normalizeMasterData;
    var defaultTypes = options.defaultTypes;
    var unique = options.unique;
    var escapeHtml = options.escapeHtml;
    var formatHours = options.formatHours;
    var formatMoney = options.formatMoney;
    var toggleCustomType = options.toggleCustomType;
    var bindDynamicButtons = options.bindDynamicButtons;

    function renderWorkerTypeOptions(selected) {
      normalizeMasterData();
      var existing = state.workers.map(function (worker) { return worker.type; }).filter(Boolean);
      var allTypes = unique((state.settings.workerTypes || defaultTypes).concat(existing));
      if (!allTypes.includes("Other")) allTypes.push("Other");
      refs.workerType.innerHTML = allTypes.map(function (type) {
        return '<option value="' + escapeHtml(type) + '">' + escapeHtml(type) + '</option>';
      }).join("");
      refs.workerType.value = selected || refs.workerType.value || allTypes[0];
      toggleCustomType();
    }

    function renderWorkers() {
      var query = (refs.workerSearch.value || "").trim().toLowerCase();
      var workers = state.workers.filter(function (worker) {
        return !query || (worker.searchText || [worker.name, worker.phone, worker.type, worker.email, worker.whatsapp].join(" ").toLowerCase()).includes(query);
      });
      refs.workerList.innerHTML = workers.length ? workers.map(function (worker) {
        return '<article class="worker-card">' +
          '<header><div><h3>' + escapeHtml(worker.name) + '</h3><div class="muted">' + escapeHtml(worker.type) + ' | ' + escapeHtml(worker.wageType) + '</div></div>' +
          '<div class="card-actions"><button class="text-button" data-edit-worker="' + worker.id + '" type="button">Edit</button>' +
          '<button class="text-button danger-link" data-delete-worker="' + worker.id + '" type="button">Delete</button></div></header>' +
          '<div class="tag-row">' +
          '<span class="tag">Phone: ' + escapeHtml(worker.phone) + '</span>' +
          '<span class="tag">WhatsApp: ' + escapeHtml(worker.whatsapp || worker.phone) + '</span>' +
          '<span class="tag">Std: ' + formatHours(worker.standardHours * 60) + '</span>' +
          '<span class="tag">Hourly: ' + formatMoney(worker.hourlyRate) + '</span>' +
          '<span class="tag">Daily: ' + formatMoney(worker.dailyRate) + '</span>' +
          '<span class="tag">OT: ' + formatMoney(worker.overtimeRate) + '/h</span>' +
          '</div>' +
          (worker.compensationNotes ? '<p class="muted">' + escapeHtml(worker.compensationNotes) + '</p>' : '') +
          '</article>';
      }).join("") : '<div class="empty-state">No workers found. Add a worker profile to start attendance.</div>';
      bindDynamicButtons(refs.workerList);
    }

    return {
      renderWorkerTypeOptions: renderWorkerTypeOptions,
      renderWorkers: renderWorkers
    };
  }

  root.WorkPayWorkerScreen = {
    createWorkerScreenRenderer: createWorkerScreenRenderer
  };
}(typeof self !== "undefined" ? self : window));
