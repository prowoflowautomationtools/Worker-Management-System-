(function (root) {
  "use strict";

  function loadSettings(key, fallback, normalize) {
    try {
      return normalize(Object.assign(fallback, JSON.parse(root.localStorage.getItem(key) || "{}")));
    } catch (error) {
      return normalize(fallback);
    }
  }

  function saveSettings(key, settings) {
    root.localStorage.setItem(key, JSON.stringify(settings));
  }

  root.WorkPaySettingsStorage = {
    loadSettings: loadSettings,
    saveSettings: saveSettings
  };
}(typeof self !== "undefined" ? self : window));
