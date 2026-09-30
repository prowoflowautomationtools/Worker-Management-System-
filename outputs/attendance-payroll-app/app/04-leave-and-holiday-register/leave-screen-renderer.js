(function (root) {
  "use strict";

  function createLeaveScreenRenderer(options) {
    options = options || {};
    var state = options.state;
    var refs = options.refs;
    var getAllLeaveSources = options.getAllLeaveSources;
    var getWorker = options.getWorker;
    var labelStatus = options.labelStatus;
    var formatDateShort = options.formatDateShort;
    var escapeHtml = options.escapeHtml;
    var escapeAttr = options.escapeAttr;
    var bindDynamicButtons = options.bindDynamicButtons;

    function renderLeaveCard(row) {
      var worker = row.workerId ? getWorker(row.workerId) : null;
      var actions = row.source === "settings-holiday"
        ? '<div class="card-actions"><span class="tag">Manage in Settings</span></div>'
        : '<div class="card-actions"><button class="text-button" data-edit-leave="' + row.id + '" type="button">Edit</button>' +
          '<button class="text-button danger-link" data-delete-leave="' + row.id + '" type="button">Delete</button></div>';
      return '<article class="record-card">' +
        '<header><div><h3>' + escapeHtml(labelStatus(row.type)) + '</h3>' +
        '<div class="muted">' + formatDateShort(row.startDate) + ' to ' + formatDateShort(row.endDate) + ' | ' + escapeHtml(worker ? worker.name : "All workers / site") + '</div></div>' +
        actions + '</header>' +
        '<p>' + escapeHtml(row.reason) + '</p>' +
        (row.attachment ? '<a class="tag" href="' + row.attachment.dataUrl + '" download="' + escapeAttr(row.attachment.name) + '">Attachment: ' + escapeHtml(row.attachment.name) + '</a>' : '<span class="tag">No attachment</span>') +
        '</article>';
    }

    function renderLeaveRecords() {
      var workerId = refs.leaveFilterWorker.value;
      var rows = getAllLeaveSources().filter(function (row) {
        return !workerId || row.workerId === workerId || row.workerId === "";
      });
      refs.leaveList.innerHTML = rows.length ? rows.map(renderLeaveCard).join("") : '<div class="empty-state">No leave or holiday records.</div>';
      bindDynamicButtons(refs.leaveList);
    }

    return {
      renderLeaveCard: renderLeaveCard,
      renderLeaveRecords: renderLeaveRecords
    };
  }

  root.WorkPayLeaveScreen = {
    createLeaveScreenRenderer: createLeaveScreenRenderer
  };
}(typeof self !== "undefined" ? self : window));
