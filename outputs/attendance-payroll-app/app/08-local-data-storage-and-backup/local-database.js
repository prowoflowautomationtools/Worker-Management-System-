(function (root) {
  "use strict";

  function createStorageService(config) {
    config = config || {};
    var database = null;
    var ensureIndex = config.ensureIndex || function () {};

    function openDb() {
      return new Promise(function (resolve, reject) {
        var request = root.indexedDB.open(config.dbName, config.dbVersion);
        request.onupgradeneeded = function () {
          var databaseResult = request.result;
          var transaction = request.transaction;
          var workersStore = databaseResult.objectStoreNames.contains("workers")
            ? transaction.objectStore("workers")
            : databaseResult.createObjectStore("workers", { keyPath: "id" });
          ensureIndex(workersStore, "nameKey", "nameKey", false);
          ensureIndex(workersStore, "phoneDigits", "phoneDigits", false);
          ensureIndex(workersStore, "type", "type", false);

          var attendanceStore = databaseResult.objectStoreNames.contains("attendance")
            ? transaction.objectStore("attendance")
            : databaseResult.createObjectStore("attendance", { keyPath: "id" });
          ensureIndex(attendanceStore, "workerId", "workerId", false);
          ensureIndex(attendanceStore, "date", "date", false);
          ensureIndex(attendanceStore, "workerDate", ["workerId", "date"], false);
          ensureIndex(attendanceStore, "status", "status", false);

          var leaveStore = databaseResult.objectStoreNames.contains("leaveRecords")
            ? transaction.objectStore("leaveRecords")
            : databaseResult.createObjectStore("leaveRecords", { keyPath: "id" });
          ensureIndex(leaveStore, "workerId", "workerId", false);
          ensureIndex(leaveStore, "startDate", "startDate", false);
          ensureIndex(leaveStore, "endDate", "endDate", false);
          ensureIndex(leaveStore, "type", "type", false);
        };
        request.onsuccess = function () {
          database = request.result;
          resolve(database);
        };
        request.onerror = function () {
          reject(request.error);
        };
      });
    }

    function getAll(storeName) {
      return new Promise(function (resolve, reject) {
        var tx = database.transaction(storeName, "readonly");
        var request = tx.objectStore(storeName).getAll();
        request.onsuccess = function () { resolve(request.result || []); };
        request.onerror = function () { reject(request.error); };
      });
    }

    function put(storeName, value) {
      return new Promise(function (resolve, reject) {
        var tx = database.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(value);
        tx.oncomplete = function () { resolve(value); };
        tx.onerror = function () { reject(tx.error); };
      });
    }

    function remove(storeName, id) {
      return new Promise(function (resolve, reject) {
        var tx = database.transaction(storeName, "readwrite");
        tx.objectStore(storeName).delete(id);
        tx.oncomplete = resolve;
        tx.onerror = function () { reject(tx.error); };
      });
    }

    function clearStore(storeName) {
      return new Promise(function (resolve, reject) {
        var tx = database.transaction(storeName, "readwrite");
        tx.objectStore(storeName).clear();
        tx.oncomplete = resolve;
        tx.onerror = function () { reject(tx.error); };
      });
    }

    function getByIndex(storeName, indexName, query) {
      return new Promise(function (resolve, reject) {
        var tx = database.transaction(storeName, "readonly");
        var store = tx.objectStore(storeName);
        if (!store.indexNames.contains(indexName)) {
          resolve([]);
          return;
        }
        var request = store.index(indexName).getAll(query);
        request.onsuccess = function () { resolve(request.result || []); };
        request.onerror = function () { reject(request.error); };
      });
    }

    return {
      openDb: openDb,
      getAll: getAll,
      put: put,
      remove: remove,
      clearStore: clearStore,
      getByIndex: getByIndex
    };
  }

  root.WorkPayStorage = {
    createStorageService: createStorageService
  };
}(typeof self !== "undefined" ? self : window));
