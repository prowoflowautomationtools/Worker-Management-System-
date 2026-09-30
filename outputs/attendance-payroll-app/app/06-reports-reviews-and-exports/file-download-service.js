(function (root) {
  "use strict";

  function createFileDownloadService(options) {
    options = options || {};
    var documentObject = options.document || root.document || document;
    var BlobConstructor = options.Blob || root.Blob || Blob;
    var urlObject = options.URL || root.URL || URL;

    function downloadFile(filename, content, type) {
      var blob = new BlobConstructor([content], { type: type });
      var url = urlObject.createObjectURL(blob);
      var link = documentObject.createElement("a");
      link.href = url;
      link.download = filename;
      documentObject.body.appendChild(link);
      link.click();
      link.remove();
      urlObject.revokeObjectURL(url);
    }

    return { downloadFile: downloadFile };
  }

  var defaultService = createFileDownloadService({});
  root.WorkPayFileDownload = {
    downloadFile: defaultService.downloadFile,
    createFileDownloadService: createFileDownloadService
  };
}(typeof self !== "undefined" ? self : window));
