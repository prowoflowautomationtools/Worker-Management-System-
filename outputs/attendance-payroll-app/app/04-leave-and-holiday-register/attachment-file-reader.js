(function (root) {
  "use strict";

  function readAttachment(file, FileReaderConstructor) {
    if (!file) return Promise.resolve(null);
    return new Promise(function (resolve, reject) {
      var reader = new FileReaderConstructor();
      reader.onload = function () {
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result
        });
      };
      reader.onerror = function () {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  }

  root.WorkPayLeaveAttachments = {
    readAttachment: readAttachment
  };
}(typeof self !== "undefined" ? self : window));
