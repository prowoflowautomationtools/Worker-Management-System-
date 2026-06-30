(function () {
  "use strict";

  var CACHE_NAME = "workpay-india-runtime-v2";
  var ASSETS = [
    "./index.html",
    "./styles.css",
    "./app.js",
    "./manifest.webmanifest",
    "./icon.svg"
  ];

  if (location.protocol === "file:") {
    return;
  }

  var manifest = document.createElement("link");
  manifest.rel = "manifest";
  manifest.href = "manifest.webmanifest";
  document.head.appendChild(manifest);

  if ("caches" in window) {
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    }).catch(function () {
      /* Cache Storage is optional on file:// and private browsing contexts. */
    });
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js").catch(function () {
        /* The app remains fully functional without service worker registration. */
      });
    });
  }
})();
