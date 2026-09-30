(function (root) {
  "use strict";

  function createApplicationStorageAdapter(options) {
    options = options || {};
    var storageService = options.storageService;

    return {
      openDb: function () { return storageService.openDb(); },
      getAll: function (storeName) { return storageService.getAll(storeName); },
      put: function (storeName, value) { return storageService.put(storeName, value); },
      remove: function (storeName, id) { return storageService.remove(storeName, id); },
      clearStore: function (storeName) { return storageService.clearStore(storeName); }
    };
  }

  root.WorkPayApplicationStorage = {
    createApplicationStorageAdapter: createApplicationStorageAdapter
  };
}(typeof self !== "undefined" ? self : window));
