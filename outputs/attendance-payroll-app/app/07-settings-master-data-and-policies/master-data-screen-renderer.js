(function (root) {
  "use strict";

  function createMasterDataScreenRenderer(options) {
    options = options || {};
    var state = options.state;
    var refs = options.refs;
    var normalizeMasterData = options.normalizeMasterData;
    var escapeHtml = options.escapeHtml;
    var escapeAttr = options.escapeAttr;
    var bindDynamicButtons = options.bindDynamicButtons;

    function renderMasterDataLists() {
      normalizeMasterData();
      refs.workerTypeList.innerHTML = state.settings.workerTypes.map(function (type) {
        var count = state.workers.filter(function (worker) { return worker.type === type; }).length;
        return '<div class="master-row"><div><strong>' + escapeHtml(type) + '</strong><div class="muted">' + count + ' linked worker' + (count === 1 ? "" : "s") + '</div></div>' +
          '<div class="card-actions"><button class="text-button" data-edit-worker-type="' + escapeAttr(type) + '" type="button">Edit</button>' +
          '<button class="text-button danger-link" data-delete-worker-type="' + escapeAttr(type) + '" type="button">Delete</button></div></div>';
      }).join("");
      refs.breakTypeList.innerHTML = state.settings.breakTypes.map(function (type) {
        var count = state.attendance.reduce(function (sum, row) {
          return sum + (row.breaks || []).filter(function (br) { return br.type === type; }).length;
        }, 0);
        return '<div class="master-row"><div><strong>' + escapeHtml(type) + '</strong><div class="muted">' + count + ' linked break' + (count === 1 ? "" : "s") + '</div></div>' +
          '<div class="card-actions"><button class="text-button" data-edit-break-type="' + escapeAttr(type) + '" type="button">Edit</button>' +
          '<button class="text-button danger-link" data-delete-break-type="' + escapeAttr(type) + '" type="button">Delete</button></div></div>';
      }).join("");
      bindDynamicButtons(refs.workerTypeList);
      bindDynamicButtons(refs.breakTypeList);
    }

    return { renderMasterDataLists: renderMasterDataLists };
  }

  root.WorkPayMasterDataScreen = {
    createMasterDataScreenRenderer: createMasterDataScreenRenderer
  };
}(typeof self !== "undefined" ? self : window));
