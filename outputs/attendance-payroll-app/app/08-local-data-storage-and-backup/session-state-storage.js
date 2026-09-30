(function (root) {
  "use strict";

  function loadJson(key, fallback) {
    try {
      return JSON.parse(root.sessionStorage.getItem(key) || "null") || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    root.sessionStorage.setItem(key, JSON.stringify(value));
  }

  function remove(key) {
    root.sessionStorage.removeItem(key);
  }

  function loadActiveView(key, fallback) {
    return root.sessionStorage.getItem(key) || fallback;
  }

  function saveActiveView(key, view) {
    root.sessionStorage.setItem(key, view);
  }

  root.WorkPaySessionStorage = {
    loadJson: loadJson,
    saveJson: saveJson,
    remove: remove,
    loadActiveView: loadActiveView,
    saveActiveView: saveActiveView
  };
})(window);
