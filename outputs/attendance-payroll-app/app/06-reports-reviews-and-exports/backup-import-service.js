(function (root) {
  "use strict";

  function readJsonBackup(file, FileReaderConstructor) {
    if (!file) return Promise.resolve(null);
    return new Promise(function (resolve, reject) {
      var reader = new FileReaderConstructor();
      reader.onload = function () {
        try {
          resolve(JSON.parse(reader.result));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = function () {
        reject(reader.error);
      };
      reader.readAsText(file);
    });
  }

  root.WorkPayBackupImport = {
    readJsonBackup: readJsonBackup
  };
}(typeof self !== "undefined" ? self : window));
