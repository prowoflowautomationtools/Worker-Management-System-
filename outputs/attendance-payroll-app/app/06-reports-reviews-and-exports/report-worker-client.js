(function (root) {
  "use strict";

  function createReportWorkerClient(options) {
    options = options || {};
    var worker = null;
    var pending = {};
    var sequence = 0;

    function rejectPending(error) {
      Object.keys(pending).forEach(function (key) {
        pending[key].reject(error);
        delete pending[key];
      });
    }

    function ensureWorker() {
      if (options.protocol === "file:" || !options.Worker) return null;
      if (worker) return worker;
      try {
        worker = new options.Worker(options.scriptUrl || "report-worker.js");
        worker.onmessage = function (event) {
          var payload = event.data || {};
          var request = pending[payload.requestId];
          if (!request) return;
          delete pending[payload.requestId];
          request.resolve(payload.result);
        };
        worker.onerror = function (error) {
          rejectPending(error);
          worker = null;
        };
        return worker;
      } catch (error) {
        if (options.logger && options.logger.warn) options.logger.warn("Report worker unavailable, falling back to main thread.", error);
        worker = null;
        return null;
      }
    }

    function build(payload, fallback) {
      var currentWorker = ensureWorker();
      if (!currentWorker) return Promise.resolve(fallback());
      return new Promise(function (resolve, reject) {
        var requestId = "report-" + (++sequence);
        pending[requestId] = { resolve: resolve, reject: reject };
        currentWorker.postMessage(Object.assign({}, payload, { requestId: requestId }));
      });
    }

    return {
      build: build,
      dispose: function () {
        rejectPending(new Error("Report worker disposed."));
        if (worker && worker.terminate) worker.terminate();
        worker = null;
      }
    };
  }

  root.WorkPayReportWorkerClient = {
    createReportWorkerClient: createReportWorkerClient
  };
}(typeof self !== "undefined" ? self : window));
