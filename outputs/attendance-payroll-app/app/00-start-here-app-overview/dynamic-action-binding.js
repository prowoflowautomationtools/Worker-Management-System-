(function (root) {
  "use strict";

  function createDynamicActionBinder(handlers) {
    handlers = handlers || {};
    var actionMap = {
      "data-edit-worker": handlers.editWorker,
      "data-delete-worker": handlers.deleteWorker,
      "data-edit-attendance": handlers.editAttendance,
      "data-delete-attendance": handlers.deleteAttendance,
      "data-edit-leave": handlers.editLeave,
      "data-delete-leave": handlers.deleteLeave,
      "data-edit-worker-type": handlers.editWorkerType,
      "data-delete-worker-type": handlers.deleteWorkerType,
      "data-edit-break-type": handlers.editBreakType,
      "data-delete-break-type": handlers.deleteBreakType
    };

    function bind(rootElement) {
      Object.keys(actionMap).forEach(function (attribute) {
        var handler = actionMap[attribute];
        if (!handler || !rootElement) return;
        var datasetKey = attribute.slice(5).replace(/-([a-z])/g, function (match, letter) { return letter.toUpperCase(); });
        rootElement.querySelectorAll("[" + attribute + "]").forEach(function (button) {
          button.addEventListener("click", function () {
            handler(button.dataset[datasetKey]);
          });
        });
      });
    }

    return { bind: bind };
  }

  root.WorkPayDynamicActions = {
    createDynamicActionBinder: createDynamicActionBinder
  };
}(typeof self !== "undefined" ? self : window));
