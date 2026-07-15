(function () {
  "use strict";

  var DB_NAME = "workpay-india-db";
  var DB_VERSION = 2;
  var SETTINGS_KEY = "workpay.settings.v1";
  var REPORT_FILTER_KEY = "workpay.reportFilter.v1";
  var DEFAULT_TYPES = ["Mason", "Helper", "Electrician", "Plumber", "Carpenter", "Painter", "Driver", "Security", "Housekeeping", "Other"];
  var DEFAULT_BREAK_TYPES = ["Lunch", "Tea", "Rest", "Other"];
  var DEFAULT_CURRENCY = "INR";
  var reportWorkerState = { worker: null, pending: {}, sequence: 0 };
  var deferredReportTimer = 0;
  var reportRenderToken = 0;
  var db;
  var state = {
    workers: [],
    attendance: [],
    leaveRecords: [],
    settings: loadSettings(),
    activeView: getCookie("workpayView") || sessionStorage.getItem("workpay.activeView") || "dashboard",
    reportRows: []
  };

  var $ = function (id) {
    return document.getElementById(id);
  };

  var refs = {};
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheRefs();
    applyTheme();
    setupStaticDates();
    bindEvents();
    openDb()
      .then(function (database) {
        db = database;
        return refreshAll();
      })
      .then(function () {
        restoreSettingsForm();
        restoreReportFilter();
        switchView(state.activeView);
        addBreakRow();
        resetAttendanceForm();
        resetLeaveForm();
      })
      .catch(function (error) {
        console.error(error);
        showToast("Unable to open local database: " + error.message);
      });
  }

  function cacheRefs() {
    [
      "todayLabel", "viewTitle", "toast", "metricWorkers", "metricPresent", "metricHours", "metricWages",
      "todayTable", "upcomingLeaveList", "quickCheckInBtn", "quickLeaveBtn", "workerForm", "workerId",
      "workerFormTitle", "cancelWorkerEditBtn", "workerName", "workerPhone", "workerWhatsapp", "workerEmail",
      "workerWebsite", "workerOtherContact", "workerType", "customTypeWrap", "customWorkerType", "wageType",
      "standardHours", "hourlyRate", "dailyRate", "overtimeRate", "taskRate", "allowance", "compensationNotes",
      "seedDemoBtn", "workerSearch", "workerList", "attendanceForm", "attendanceId", "attendanceFormTitle",
      "cancelAttendanceEditBtn", "attendanceWorker", "attendanceDate", "attendanceDay", "attendanceStatus",
      "checkIn", "checkOut", "taskUnits", "taskRateOverride", "addBreakBtn", "breakRows", "attendanceNotes",
      "attendancePreview", "resetAttendanceBtn", "attendanceFilterWorker", "attendanceHistory", "leaveForm",
      "leaveId", "leaveFormTitle", "cancelLeaveEditBtn", "leaveWorker", "leaveType", "leaveStart", "leaveEnd",
      "leaveReason", "leaveAttachment", "attachmentInfo", "removeAttachmentBtn", "resetLeaveBtn", "leaveFilterWorker", "leaveList",
      "reportPreset", "reportFrom", "reportTo", "reportWorker", "exportCsvBtn", "reportDays", "reportNetHours",
      "reportOvertime", "reportWages", "workerReportRows", "categoryReportRows", "ledgerRows", "reportLeaveRows",
      "settingBusinessName", "settingCurrencyCode", "settingDefaultHours", "settingDailyPolicy", "settingOvertimeMode", "settingTheme", "settingTimeFormat", "settingDateFormat", "settingYearMode",
      "settingPublicHolidays", "settingEstablishmentState", "settingPfEnabled", "settingEsiEnabled", "settingTdsEnabled", "settingPtEnabled", "settingStatutoryNotes",
      "saveSettingsBtn", "workerTypeName", "saveWorkerTypeBtn", "workerTypeList", "breakTypeName", "saveBreakTypeBtn",
      "breakTypeList", "resetAllDataBtn", "exportJsonBtn", "importJsonInput"
    ].forEach(function (id) {
      refs[id] = $(id);
    });
  }

  function bindEvents() {
    document.querySelectorAll(".nav-item").forEach(function (button) {
      button.addEventListener("click", function () {
        switchView(button.dataset.view);
      });
    });

    refs.quickCheckInBtn.addEventListener("click", function () {
      switchView("attendance");
    });
    refs.quickLeaveBtn.addEventListener("click", function () {
      switchView("leave");
    });
    refs.workerForm.addEventListener("submit", saveWorker);
    refs.cancelWorkerEditBtn.addEventListener("click", resetWorkerForm);
    refs.workerType.addEventListener("change", toggleCustomType);
    refs.workerSearch.addEventListener("input", debounce(renderWorkers, 80));
    refs.seedDemoBtn.addEventListener("click", seedDemoData);

    refs.attendanceForm.addEventListener("submit", saveAttendance);
    refs.cancelAttendanceEditBtn.addEventListener("click", resetAttendanceForm);
    refs.resetAttendanceBtn.addEventListener("click", resetAttendanceForm);
    refs.addBreakBtn.addEventListener("click", function () {
      addBreakRow();
      updateAttendancePreview();
    });
    ["attendanceWorker", "attendanceDate", "attendanceStatus", "checkIn", "checkOut", "taskUnits", "taskRateOverride"].forEach(function (id) {
      refs[id].addEventListener("input", updateAttendancePreview);
      refs[id].addEventListener("change", function () {
        if (id === "attendanceDate") updateAttendanceDay();
        updateAttendancePreview();
      });
    });
    refs.attendanceFilterWorker.addEventListener("change", renderAttendanceHistory);

    refs.leaveForm.addEventListener("submit", saveLeaveRecord);
    refs.cancelLeaveEditBtn.addEventListener("click", resetLeaveForm);
    refs.resetLeaveBtn.addEventListener("click", resetLeaveForm);
    refs.leaveFilterWorker.addEventListener("change", renderLeaveRecords);
    refs.leaveAttachment.addEventListener("change", function () {
      var file = refs.leaveAttachment.files[0];
      refs.attachmentInfo.textContent = file ? file.name + " (" + formatBytes(file.size) + ")" : "";
      refs.removeAttachmentBtn.dataset.remove = "false";
      refs.removeAttachmentBtn.classList.add("hidden");
    });
    refs.removeAttachmentBtn.addEventListener("click", markAttachmentForRemoval);

    ["reportPreset", "reportFrom", "reportTo", "reportWorker"].forEach(function (id) {
      refs[id].addEventListener("change", function () {
        if (id === "reportPreset") applyReportPreset();
        saveReportFilter();
        renderReports();
      });
    });
    refs.exportCsvBtn.addEventListener("click", exportCsv);

    refs.saveSettingsBtn.addEventListener("click", saveSettingsForm);
    refs.saveWorkerTypeBtn.addEventListener("click", addWorkerType);
    refs.workerTypeName.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        addWorkerType();
      }
    });
    refs.saveBreakTypeBtn.addEventListener("click", addBreakType);
    refs.breakTypeName.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        addBreakType();
      }
    });
    refs.resetAllDataBtn.addEventListener("click", resetAllData);
    refs.exportJsonBtn.addEventListener("click", exportJson);
    refs.importJsonInput.addEventListener("change", importJson);

    [refs.workerForm, refs.attendanceForm, refs.leaveForm].forEach(bindValidationListeners);
    [refs.reportFrom, refs.reportTo, refs.settingPublicHolidays, refs.settingDefaultHours].forEach(function (field) {
      field.addEventListener("input", function () { clearFieldError(field); });
      field.addEventListener("change", function () { clearFieldError(field); });
    });
  }

  function openDb() {
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        var database = request.result;
        var workersStore = database.objectStoreNames.contains("workers")
          ? request.transaction.objectStore("workers")
          : database.createObjectStore("workers", { keyPath: "id" });
        ensureIndex(workersStore, "nameKey", "nameKey", false);
        ensureIndex(workersStore, "phoneDigits", "phoneDigits", false);
        ensureIndex(workersStore, "type", "type", false);

        var attendanceStore = database.objectStoreNames.contains("attendance")
          ? request.transaction.objectStore("attendance")
          : database.createObjectStore("attendance", { keyPath: "id" });
        ensureIndex(attendanceStore, "workerId", "workerId", false);
        ensureIndex(attendanceStore, "date", "date", false);
        ensureIndex(attendanceStore, "workerDate", ["workerId", "date"], false);
        ensureIndex(attendanceStore, "status", "status", false);

        var leaveStore = database.objectStoreNames.contains("leaveRecords")
          ? request.transaction.objectStore("leaveRecords")
          : database.createObjectStore("leaveRecords", { keyPath: "id" });
        ensureIndex(leaveStore, "workerId", "workerId", false);
        ensureIndex(leaveStore, "startDate", "startDate", false);
        ensureIndex(leaveStore, "endDate", "endDate", false);
        ensureIndex(leaveStore, "type", "type", false);
      };
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function getAll(storeName) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(storeName, "readonly");
      var request = tx.objectStore(storeName).getAll();
      request.onsuccess = function () {
        resolve(request.result || []);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function put(storeName, value) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(value);
      tx.oncomplete = function () {
        resolve(value);
      };
      tx.onerror = function () {
        reject(tx.error);
      };
    });
  }

  function remove(storeName, id) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = function () {
        reject(tx.error);
      };
    });
  }

  function clearStore(storeName) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).clear();
      tx.oncomplete = resolve;
      tx.onerror = function () {
        reject(tx.error);
      };
    });
  }

  function refreshAll() {
    return Promise.all([getAll("workers"), getAll("attendance"), getAll("leaveRecords")]).then(function (results) {
      state.workers = results[0].map(normalizeWorkerRecord).sort(byName);
      state.attendance = results[1].map(normalizeAttendanceRecord).sort(byDateDesc);
      state.leaveRecords = results[2].map(normalizeLeaveRecord).sort(byLeaveDateDesc);
      renderAll();
    });
  }

  function renderAll() {
    renderWorkerTypeOptions();
    renderWorkerSelects();
    renderMasterDataLists();
    renderDashboard();
    renderWorkers();
    renderAttendanceHistory();
    renderLeaveRecords();
    queueReportsRender();
  }

  function switchView(view) {
    if (!document.getElementById(view)) view = "dashboard";
    state.activeView = view;
    sessionStorage.setItem("workpay.activeView", view);
    setCookie("workpayView", view, 30);
    document.querySelectorAll(".view").forEach(function (el) {
      el.classList.toggle("active-view", el.id === view);
    });
    document.querySelectorAll(".nav-item").forEach(function (button) {
      button.classList.toggle("active", button.dataset.view === view);
      if (button.dataset.view === view) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
    refs.viewTitle.textContent = document.querySelector('.nav-item[data-view="' + view + '"]').textContent;
    document.title = refs.viewTitle.textContent + " | WorkPay India";
    if (view === "reports") queueReportsRender(true);
  }

  function setupStaticDates() {
    var today = new Date();
    refs.todayLabel.textContent = formatDateLong(toDateInput(today)) + " | " + getDayName(toDateInput(today));
  }

  function loadSettings() {
    var fallback = {
      businessName: "",
      currencyCode: DEFAULT_CURRENCY,
      defaultHours: 8,
      dailyPolicy: "prorated",
      overtimeMode: "standard",
      theme: "light",
      timeFormat: "24h",
      dateFormat: "ddmmyyyy",
      yearMode: "financial",
      publicHolidays: getDefaultPublicHolidays(),
      statutoryConfig: createDefaultStatutoryConfig(),
      workerTypes: DEFAULT_TYPES.slice(),
      breakTypes: DEFAULT_BREAK_TYPES.slice()
    };
    try {
      return normalizeSettings(Object.assign(fallback, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")));
    } catch (error) {
      return normalizeSettings(fallback);
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  }

  function restoreSettingsForm() {
    refs.settingBusinessName.value = state.settings.businessName || "";
    refs.settingCurrencyCode.value = state.settings.currencyCode || DEFAULT_CURRENCY;
    refs.settingDefaultHours.value = state.settings.defaultHours || 8;
    refs.settingDailyPolicy.value = state.settings.dailyPolicy || "prorated";
    refs.settingOvertimeMode.value = state.settings.overtimeMode || "standard";
    refs.settingTheme.value = state.settings.theme || "light";
    refs.settingTimeFormat.value = state.settings.timeFormat || "24h";
    refs.settingDateFormat.value = state.settings.dateFormat || "ddmmyyyy";
    refs.settingYearMode.value = state.settings.yearMode || "financial";
    refs.settingPublicHolidays.value = formatPublicHolidayLines(state.settings.publicHolidays);
    refs.settingEstablishmentState.value = state.settings.statutoryConfig.establishmentState || "";
    refs.settingPfEnabled.value = String(!!state.settings.statutoryConfig.modules.pf.enabled);
    refs.settingEsiEnabled.value = String(!!state.settings.statutoryConfig.modules.esi.enabled);
    refs.settingTdsEnabled.value = String(!!state.settings.statutoryConfig.modules.tds.enabled);
    refs.settingPtEnabled.value = String(!!state.settings.statutoryConfig.modules.professionalTax.enabled);
    refs.settingStatutoryNotes.value = state.settings.statutoryConfig.notes || "";
    syncReportPresetOption();
  }

  function saveSettingsForm() {
    clearFormErrors(refs.workerForm);
    clearFormErrors(refs.attendanceForm);
    clearFormErrors(refs.leaveForm);
    clearFieldError(refs.settingPublicHolidays);
    state.settings.businessName = refs.settingBusinessName.value.trim();
    state.settings.currencyCode = refs.settingCurrencyCode.value || DEFAULT_CURRENCY;
    state.settings.defaultHours = numberValue(refs.settingDefaultHours.value, 8);
    if (state.settings.defaultHours <= 0) {
      reportValidation(refs.settingDefaultHours, "Default standard hours must be greater than zero.");
      return;
    }
    state.settings.dailyPolicy = refs.settingDailyPolicy.value;
    state.settings.overtimeMode = refs.settingOvertimeMode.value;
    state.settings.theme = refs.settingTheme.value;
    state.settings.timeFormat = refs.settingTimeFormat.value || "24h";
    state.settings.dateFormat = refs.settingDateFormat.value;
    state.settings.yearMode = refs.settingYearMode.value || "financial";
    var holidayParse = parsePublicHolidayInput(refs.settingPublicHolidays.value);
    if (!holidayParse.ok) {
      setFieldError(refs.settingPublicHolidays, holidayParse.message);
      showToast(holidayParse.message);
      return;
    }
    state.settings.publicHolidays = holidayParse.holidays;
    state.settings.statutoryConfig = {
      establishmentState: refs.settingEstablishmentState.value.trim(),
      modules: {
        pf: { enabled: refs.settingPfEnabled.value === "true" },
        esi: { enabled: refs.settingEsiEnabled.value === "true" },
        tds: { enabled: refs.settingTdsEnabled.value === "true" },
        professionalTax: { enabled: refs.settingPtEnabled.value === "true" }
      },
      notes: refs.settingStatutoryNotes.value.trim()
    };
    state.settings = normalizeSettings(state.settings);
    normalizeMasterData();
    saveSettings();
    applyTheme();
    setupStaticDates();
    syncReportPresetOption();
    if (refs.reportPreset.value === "year" || refs.reportPreset.value === "fy") applyReportPreset();
    renderAll();
    showToast("Settings saved.");
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.settings.theme || "light";
  }

  function normalizeMasterData() {
    if (!Array.isArray(state.settings.workerTypes)) state.settings.workerTypes = DEFAULT_TYPES.slice();
    if (!Array.isArray(state.settings.breakTypes)) state.settings.breakTypes = DEFAULT_BREAK_TYPES.slice();
    state.settings.workerTypes = unique(state.settings.workerTypes).sort();
    state.settings.breakTypes = unique(state.settings.breakTypes).sort();
    if (!state.settings.workerTypes.length) state.settings.workerTypes = DEFAULT_TYPES.slice();
    if (!state.settings.breakTypes.length) state.settings.breakTypes = DEFAULT_BREAK_TYPES.slice();
    if (!state.settings.workerTypes.includes("Other")) state.settings.workerTypes.push("Other");
    if (!state.settings.breakTypes.includes("Other")) state.settings.breakTypes.push("Other");
  }

  function renderWorkerTypeOptions(selected) {
    normalizeMasterData();
    var existing = state.workers.map(function (worker) { return worker.type; }).filter(Boolean);
    var allTypes = unique((state.settings.workerTypes || DEFAULT_TYPES).concat(existing));
    if (!allTypes.includes("Other")) allTypes.push("Other");
    refs.workerType.innerHTML = allTypes.map(function (type) {
      return '<option value="' + escapeHtml(type) + '">' + escapeHtml(type) + '</option>';
    }).join("");
    refs.workerType.value = selected || refs.workerType.value || allTypes[0];
    toggleCustomType();
  }

  function renderBreakTypeOptions(selected) {
    normalizeMasterData();
    var options = state.settings.breakTypes.slice();
    if (selected && !options.includes(selected)) options.push(selected);
    return options.map(function (type) {
      return '<option value="' + escapeHtml(type) + '"' + (type === selected ? " selected" : "") + '>' + escapeHtml(type) + '</option>';
    }).join("");
  }

  function renderMasterDataLists() {
    normalizeMasterData();
    refs.workerTypeList.innerHTML = state.settings.workerTypes.map(function (type) {
      var count = state.workers.filter(function (worker) { return worker.type === type; }).length;
      return '<div class="master-row"><div><strong>' + escapeHtml(type) + '</strong><div class="muted">' + count + ' linked worker' + (count === 1 ? "" : "s") + '</div></div>' +
        '<div class="card-actions"><button class="text-button" data-edit-worker-type="' + escapeAttr(type) + '" type="button">Edit</button>' +
        '<button class="text-button danger-link" data-delete-worker-type="' + escapeAttr(type) + '" type="button">Delete</button></div></div>';
    }).join("");
    refs.breakTypeList.innerHTML = state.settings.breakTypes.map(function (type) {
      var count = state.attendance.reduce(function (sum, row) {
        return sum + (row.breaks || []).filter(function (br) { return br.type === type; }).length;
      }, 0);
      return '<div class="master-row"><div><strong>' + escapeHtml(type) + '</strong><div class="muted">' + count + ' linked break' + (count === 1 ? "" : "s") + '</div></div>' +
        '<div class="card-actions"><button class="text-button" data-edit-break-type="' + escapeAttr(type) + '" type="button">Edit</button>' +
        '<button class="text-button danger-link" data-delete-break-type="' + escapeAttr(type) + '" type="button">Delete</button></div></div>';
    }).join("");
    bindDynamicButtons(refs.workerTypeList);
    bindDynamicButtons(refs.breakTypeList);
  }

  function addWorkerType() {
    var value = refs.workerTypeName.value.trim();
    if (!value) return showToast("Enter a worker category name.");
    normalizeMasterData();
    if (state.settings.workerTypes.some(function (type) { return type.toLowerCase() === value.toLowerCase(); })) {
      return showToast("Worker category already exists.");
    }
    state.settings.workerTypes.push(value);
    saveSettings();
    refs.workerTypeName.value = "";
    renderAll();
    showToast("Worker category added.");
  }

  function editWorkerType(type) {
    var next = prompt("Rename worker category", type);
    if (next == null) return;
    next = next.trim();
    if (!next) return showToast("Worker category name cannot be blank.");
    if (next === type) return;
    normalizeMasterData();
    if (state.settings.workerTypes.some(function (existing) { return existing.toLowerCase() === next.toLowerCase(); })) {
      return showToast("Worker category already exists.");
    }
    state.settings.workerTypes = state.settings.workerTypes.map(function (existing) {
      return existing === type ? next : existing;
    });
    var changedWorkers = state.workers.filter(function (worker) { return worker.type === type; }).map(function (worker) {
      return Object.assign({}, worker, { type: next, updatedAt: new Date().toISOString() });
    });
    Promise.all(changedWorkers.map(function (worker) { return put("workers", worker); })).then(function () {
      saveSettings();
      return refreshAll();
    }).then(function () {
      showToast("Worker category updated.");
    }).catch(showError);
  }

  function deleteWorkerType(type) {
    if (type === "Other") return showToast("Other is required for custom categories.");
    var linked = state.workers.filter(function (worker) { return worker.type === type; }).length;
    if (linked) return showToast("Category is used by " + linked + " worker(s). Rename it or move workers first.");
    if (!confirm("Delete worker category '" + type + "'?")) return;
    state.settings.workerTypes = state.settings.workerTypes.filter(function (existing) { return existing !== type; });
    normalizeMasterData();
    saveSettings();
    renderAll();
    showToast("Worker category deleted.");
  }

  function addBreakType() {
    var value = refs.breakTypeName.value.trim();
    if (!value) return showToast("Enter a break type name.");
    normalizeMasterData();
    if (state.settings.breakTypes.some(function (type) { return type.toLowerCase() === value.toLowerCase(); })) {
      return showToast("Break type already exists.");
    }
    state.settings.breakTypes.push(value);
    saveSettings();
    refs.breakTypeName.value = "";
    renderAll();
    showToast("Break type added.");
  }

  function editBreakType(type) {
    var next = prompt("Rename break type", type);
    if (next == null) return;
    next = next.trim();
    if (!next) return showToast("Break type name cannot be blank.");
    if (next === type) return;
    normalizeMasterData();
    if (state.settings.breakTypes.some(function (existing) { return existing.toLowerCase() === next.toLowerCase(); })) {
      return showToast("Break type already exists.");
    }
    state.settings.breakTypes = state.settings.breakTypes.map(function (existing) {
      return existing === type ? next : existing;
    });
    var changedAttendance = state.attendance.filter(function (row) {
      return (row.breaks || []).some(function (br) { return br.type === type; });
    }).map(function (row) {
      var updated = Object.assign({}, row, {
        breaks: (row.breaks || []).map(function (br) {
          return br.type === type ? Object.assign({}, br, { type: next }) : br;
        }),
        updatedAt: new Date().toISOString()
      });
      updated.calculation = calculateAttendance(updated, getWorker(updated.workerId) || {});
      return updated;
    });
    Promise.all(changedAttendance.map(function (row) { return put("attendance", row); })).then(function () {
      saveSettings();
      return refreshAll();
    }).then(function () {
      showToast("Break type updated.");
    }).catch(showError);
  }

  function deleteBreakType(type) {
    if (type === "Other") return showToast("Other is required for custom break notes.");
    var linked = state.attendance.reduce(function (sum, row) {
      return sum + (row.breaks || []).filter(function (br) { return br.type === type; }).length;
    }, 0);
    if (linked) return showToast("Break type is used by " + linked + " break record(s). Rename it first.");
    if (!confirm("Delete break type '" + type + "'?")) return;
    state.settings.breakTypes = state.settings.breakTypes.filter(function (existing) { return existing !== type; });
    normalizeMasterData();
    saveSettings();
    renderAll();
    showToast("Break type deleted.");
  }

  function toggleCustomType() {
    refs.customTypeWrap.classList.toggle("hidden", refs.workerType.value !== "Other");
  }

  function renderWorkerSelects() {
    var options = '<option value="">Select worker</option>' + state.workers.map(function (worker) {
      return '<option value="' + worker.id + '">' + escapeHtml(worker.name) + " (" + escapeHtml(worker.type) + ")</option>";
    }).join("");
    refs.attendanceWorker.innerHTML = options;
    refs.leaveWorker.innerHTML = '<option value="">All workers / site holiday</option>' + options.replace('<option value="">Select worker</option>', "");
    refs.attendanceFilterWorker.innerHTML = '<option value="">All workers</option>' + options.replace('<option value="">Select worker</option>', "");
    refs.leaveFilterWorker.innerHTML = '<option value="">All workers</option>' + options.replace('<option value="">Select worker</option>', "");
    refs.reportWorker.innerHTML = '<option value="">All workers</option>' + options.replace('<option value="">Select worker</option>', "");
  }

  function saveWorker(event) {
    event.preventDefault();
    clearFormErrors(refs.workerForm);
    var id = refs.workerId.value || makeId();
    var name = refs.workerName.value.trim();
    var phone = normalizePhone(refs.workerPhone.value);
    var type = refs.workerType.value === "Other" ? refs.customWorkerType.value.trim() : refs.workerType.value;
    if (!name) return reportValidation(refs.workerName, "Worker full name is required.");
    if (!isValidIndianPhone(phone)) return reportValidation(refs.workerPhone, "Enter a valid mandatory Indian mobile number.");
    if (!type) return reportValidation(refs.workerType.value === "Other" ? refs.customWorkerType : refs.workerType, "Worker type is required.");
    var whatsapp = normalizePhone(refs.workerWhatsapp.value) || phone;
    if (refs.workerWhatsapp.value.trim() && !isValidIndianPhone(whatsapp)) return reportValidation(refs.workerWhatsapp, "Enter a valid WhatsApp mobile number or leave it blank.");

    if (!Array.isArray(state.settings.workerTypes)) state.settings.workerTypes = DEFAULT_TYPES.slice();
    if (!state.settings.workerTypes.includes(type)) {
      state.settings.workerTypes.push(type);
      saveSettings();
    }

    var existing = getExisting("workers", id);
    var worker = normalizeWorkerRecord({
      id: id,
      name: name,
      phone: phone,
      whatsapp: whatsapp,
      email: refs.workerEmail.value.trim(),
      website: refs.workerWebsite.value.trim(),
      otherContact: refs.workerOtherContact.value.trim(),
      type: type,
      wageType: refs.wageType.value,
      standardHours: numberValue(refs.standardHours.value, state.settings.defaultHours || 8),
      hourlyRate: numberValue(refs.hourlyRate.value, 0),
      dailyRate: numberValue(refs.dailyRate.value, 0),
      overtimeRate: numberValue(refs.overtimeRate.value, 0),
      taskRate: numberValue(refs.taskRate.value, 0),
      allowance: numberValue(refs.allowance.value, 0),
      compensationNotes: refs.compensationNotes.value.trim(),
      statutoryProfile: existing.statutoryProfile || createDefaultWorkerStatutoryProfile(),
      updatedAt: new Date().toISOString(),
      createdAt: existing.createdAt || new Date().toISOString()
    });
    var wageValidation = validateWorkerWageConfig(worker);
    if (!wageValidation.ok) return reportValidation(wageValidation.field, wageValidation.message);

    findDuplicateWorker(worker).then(function (duplicate) {
      if (duplicate) {
        reportValidation(refs.workerPhone, "Another worker already uses this phone number. Update the existing profile instead.");
        return null;
      }
      return put("workers", worker);
    }).then(function (saved) {
      if (!saved) return false;
      return refreshAll().then(function () { return true; });
    }).then(function (didSave) {
      if (!didSave) return;
      resetWorkerForm();
      showToast("Worker saved.");
    }).catch(showError);
  }

  function editWorker(id) {
    var worker = getWorker(id);
    if (!worker) return;
    renderWorkerTypeOptions(worker.type);
    refs.workerId.value = worker.id;
    refs.workerName.value = worker.name;
    refs.workerPhone.value = worker.phone;
    refs.workerWhatsapp.value = worker.whatsapp;
    refs.workerEmail.value = worker.email || "";
    refs.workerWebsite.value = worker.website || "";
    refs.workerOtherContact.value = worker.otherContact || "";
    if (!Array.isArray(state.settings.workerTypes)) state.settings.workerTypes = DEFAULT_TYPES.slice();
    refs.workerType.value = state.settings.workerTypes.includes(worker.type) ? worker.type : "Other";
    refs.customWorkerType.value = refs.workerType.value === "Other" ? worker.type : "";
    refs.wageType.value = worker.wageType;
    refs.standardHours.value = worker.standardHours;
    refs.hourlyRate.value = worker.hourlyRate;
    refs.dailyRate.value = worker.dailyRate;
    refs.overtimeRate.value = worker.overtimeRate;
    refs.taskRate.value = worker.taskRate || 0;
    refs.allowance.value = worker.allowance || 0;
    refs.compensationNotes.value = worker.compensationNotes || "";
    refs.workerFormTitle.textContent = "Edit Worker";
    refs.cancelWorkerEditBtn.classList.remove("hidden");
    toggleCustomType();
    switchView("workers");
  }

  function deleteWorker(id) {
    var hasAttendance = state.attendance.some(function (row) { return row.workerId === id; });
    var hasLeave = state.leaveRecords.some(function (row) { return row.workerId === id; });
    if (hasAttendance || hasLeave) {
      showToast("Worker has linked records. Keep the profile for report integrity.");
      return;
    }
    if (!confirm("Delete this worker profile?")) return;
    remove("workers", id).then(refreshAll).then(function () {
      showToast("Worker deleted.");
    }).catch(showError);
  }

  function resetWorkerForm() {
    refs.workerForm.reset();
    refs.workerId.value = "";
    refs.workerFormTitle.textContent = "Add Worker";
    refs.cancelWorkerEditBtn.classList.add("hidden");
    refs.standardHours.value = state.settings.defaultHours || 8;
    refs.hourlyRate.value = 0;
    refs.dailyRate.value = 0;
    refs.overtimeRate.value = 0;
    refs.taskRate.value = 0;
    refs.allowance.value = 0;
    clearFormErrors(refs.workerForm);
    renderWorkerTypeOptions();
  }

  function renderWorkers() {
    var query = (refs.workerSearch.value || "").trim().toLowerCase();
    var workers = state.workers.filter(function (worker) {
      return !query || (worker.searchText || [worker.name, worker.phone, worker.type, worker.email, worker.whatsapp].join(" ").toLowerCase()).includes(query);
    });
    refs.workerList.innerHTML = workers.length ? workers.map(function (worker) {
      return '<article class="worker-card">' +
        '<header><div><h3>' + escapeHtml(worker.name) + '</h3><div class="muted">' + escapeHtml(worker.type) + ' | ' + escapeHtml(worker.wageType) + '</div></div>' +
        '<div class="card-actions"><button class="text-button" data-edit-worker="' + worker.id + '" type="button">Edit</button>' +
        '<button class="text-button danger-link" data-delete-worker="' + worker.id + '" type="button">Delete</button></div></header>' +
        '<div class="tag-row">' +
        '<span class="tag">Phone: ' + escapeHtml(worker.phone) + '</span>' +
        '<span class="tag">WhatsApp: ' + escapeHtml(worker.whatsapp || worker.phone) + '</span>' +
        '<span class="tag">Std: ' + formatHours(worker.standardHours * 60) + '</span>' +
        '<span class="tag">Hourly: ' + formatMoney(worker.hourlyRate) + '</span>' +
        '<span class="tag">Daily: ' + formatMoney(worker.dailyRate) + '</span>' +
        '<span class="tag">OT: ' + formatMoney(worker.overtimeRate) + '/h</span>' +
        '</div>' +
        (worker.compensationNotes ? '<p class="muted">' + escapeHtml(worker.compensationNotes) + '</p>' : '') +
        '</article>';
    }).join("") : '<div class="empty-state">No workers found. Add a worker profile to start attendance.</div>';
    bindDynamicButtons(refs.workerList);
  }

  function resetAttendanceForm() {
    refs.attendanceForm.reset();
    refs.attendanceId.value = "";
    refs.attendanceFormTitle.textContent = "Record Attendance";
    refs.cancelAttendanceEditBtn.classList.add("hidden");
    refs.attendanceDate.value = toDateInput(new Date());
    refs.attendanceStatus.value = "present";
    refs.taskUnits.value = 0;
    refs.breakRows.innerHTML = "";
    addBreakRow();
    updateAttendanceDay();
    updateAttendancePreview();
  }

  function addBreakRow(data) {
    var row = document.createElement("div");
    row.className = "break-row";
    var selectedType = data && data.type || "Lunch";
    row.innerHTML = '<label>Start<input class="break-start" type="time" value="' + escapeAttr(data && data.startTime || "") + '"></label>' +
      '<label>End<input class="break-end" type="time" value="' + escapeAttr(data && data.endTime || "") + '"></label>' +
      '<label>Type<select class="break-type">' + renderBreakTypeOptions(selectedType) + '</select></label>' +
      '<label>Specify<input class="break-note" placeholder="If other" value="' + escapeAttr(data && data.note || "") + '"></label>' +
      '<button class="ghost-button small-button remove-break" type="button">Remove</button>';
    row.querySelectorAll("input, select").forEach(function (input) {
      input.addEventListener("input", updateAttendancePreview);
      input.addEventListener("change", updateAttendancePreview);
    });
    row.querySelector(".remove-break").addEventListener("click", function () {
      row.remove();
      if (!refs.breakRows.children.length) addBreakRow();
      updateAttendancePreview();
    });
    refs.breakRows.appendChild(row);
  }

  function collectBreaks() {
    return Array.from(refs.breakRows.querySelectorAll(".break-row")).map(function (row) {
      return {
        startTime: row.querySelector(".break-start").value,
        endTime: row.querySelector(".break-end").value,
        type: row.querySelector(".break-type").value,
        note: row.querySelector(".break-note").value.trim()
      };
    }).filter(function (br) {
      return br.startTime || br.endTime || br.note;
    });
  }

  function saveAttendance(event) {
    event.preventDefault();
    var record = buildAttendanceFromForm();
    if (!record) return;
    findDuplicateAttendance(record).then(function (duplicate) {
      if (duplicate) {
        reportValidation(refs.attendanceDate, "This worker already has an attendance record for that date.");
        return null;
      }
      return put("attendance", record);
    }).then(function (saved) {
      if (!saved) return false;
      return refreshAll().then(function () { return true; });
    }).then(function (didSave) {
      if (!didSave) return;
      resetAttendanceForm();
      showToast("Attendance saved.");
    }).catch(showError);
  }

  function buildAttendanceFromForm() {
    clearFormErrors(refs.attendanceForm);
    var worker = getWorker(refs.attendanceWorker.value);
    var status = refs.attendanceStatus.value;
    var date = refs.attendanceDate.value;
    if (!worker) {
      reportValidation(refs.attendanceWorker, "Select a worker.");
      return null;
    }
    if (!date) {
      reportValidation(refs.attendanceDate, "Select a date.");
      return null;
    }
    var needsTime = status === "present" || status === "half-day";
    var checkIn = refs.checkIn.value;
    var checkOut = refs.checkOut.value;
    if (needsTime && (!checkIn || !checkOut)) {
      reportValidation(!checkIn ? refs.checkIn : refs.checkOut, "Check-in and check-out are required for present or half-day attendance.");
      return null;
    }
    if (numberValue(refs.taskUnits.value, 0) < 0) {
      reportValidation(refs.taskUnits, "Task units cannot be negative.");
      return null;
    }
    if (refs.taskRateOverride.value !== "" && numberValue(refs.taskRateOverride.value, 0) < 0) {
      reportValidation(refs.taskRateOverride, "Task rate override cannot be negative.");
      return null;
    }
    var breaks = collectBreaks();
    var validation = validateTimes(checkIn, checkOut, breaks, needsTime);
    if (!validation.ok) {
      reportValidation(validation.field || refs.checkOut, validation.message);
      return null;
    }
    var id = refs.attendanceId.value || makeId();
    var record = {
      id: id,
      workerId: worker.id,
      date: date,
      day: getDayName(date),
      status: status,
      checkIn: needsTime ? checkIn : "",
      checkOut: needsTime ? checkOut : "",
      breaks: needsTime ? breaks : [],
      taskUnits: numberValue(refs.taskUnits.value, 0),
      taskRateOverride: refs.taskRateOverride.value === "" ? null : numberValue(refs.taskRateOverride.value, 0),
      notes: refs.attendanceNotes.value.trim(),
      updatedAt: new Date().toISOString(),
      createdAt: getExisting("attendance", id).createdAt || new Date().toISOString()
    };
    record.calculation = calculateAttendance(record, worker);
    return record;
  }

  function editAttendance(id) {
    var record = state.attendance.find(function (row) { return row.id === id; });
    if (!record) return;
    refs.attendanceId.value = record.id;
    refs.attendanceWorker.value = record.workerId;
    refs.attendanceDate.value = record.date;
    refs.attendanceStatus.value = record.status;
    refs.checkIn.value = record.checkIn || "";
    refs.checkOut.value = record.checkOut || "";
    refs.taskUnits.value = record.taskUnits || 0;
    refs.taskRateOverride.value = record.taskRateOverride == null ? "" : record.taskRateOverride;
    refs.attendanceNotes.value = record.notes || "";
    refs.breakRows.innerHTML = "";
    (record.breaks && record.breaks.length ? record.breaks : [{}]).forEach(addBreakRow);
    refs.attendanceFormTitle.textContent = "Edit Attendance";
    refs.cancelAttendanceEditBtn.classList.remove("hidden");
    updateAttendanceDay();
    updateAttendancePreview();
    clearFormErrors(refs.attendanceForm);
    switchView("attendance");
  }

  function deleteAttendance(id) {
    if (!confirm("Delete this attendance record?")) return;
    remove("attendance", id).then(refreshAll).then(function () {
      showToast("Attendance deleted.");
    }).catch(showError);
  }

  function updateAttendanceDay() {
    refs.attendanceDay.value = refs.attendanceDate.value ? getDayName(refs.attendanceDate.value) : "";
  }

  function updateAttendancePreview() {
    var worker = getWorker(refs.attendanceWorker.value);
    var preview = { breakMinutes: 0, netMinutes: 0, overtimeMinutes: 0, totalWage: 0 };
    if (worker) {
      var temp = {
        workerId: worker.id,
        date: refs.attendanceDate.value || toDateInput(new Date()),
        status: refs.attendanceStatus.value,
        checkIn: refs.checkIn.value,
        checkOut: refs.checkOut.value,
        breaks: collectBreaks(),
        taskUnits: numberValue(refs.taskUnits.value, 0),
        taskRateOverride: refs.taskRateOverride.value === "" ? null : numberValue(refs.taskRateOverride.value, 0)
      };
      preview = calculateAttendance(temp, worker);
    }
    refs.attendancePreview.innerHTML = '<div><span>Break duration</span><strong>' + formatMinutes(preview.breakMinutes) + '</strong></div>' +
      '<div><span>Net working hours</span><strong>' + formatMinutes(preview.netMinutes) + '</strong></div>' +
      '<div><span>Overtime</span><strong>' + formatMinutes(preview.overtimeMinutes) + '</strong></div>' +
      '<div><span>Estimated wage</span><strong>' + formatMoney(preview.totalWage) + '</strong></div>';
  }

  function validateTimes(checkIn, checkOut, breaks, needsTime) {
    if (!needsTime) return { ok: true };
    var start = timeToMinutes(checkIn);
    var end = timeToMinutes(checkOut);
    if (end <= start) return { ok: false, field: refs.checkOut, message: "Check-out must be after check-in for the same work date." };
    var ranges = [];
    for (var i = 0; i < breaks.length; i += 1) {
      var br = breaks[i];
      if (!br.startTime || !br.endTime) return { ok: false, field: refs.breakRows, message: "Each break needs both start and end time." };
      var bs = timeToMinutes(br.startTime);
      var be = timeToMinutes(br.endTime);
      if (br.type === "Other" && !br.note) return { ok: false, field: refs.breakRows, message: "Add a note when the break type is Other." };
      if (be <= bs) return { ok: false, field: refs.breakRows, message: "Break end must be after break start." };
      if (bs < start || be > end) return { ok: false, field: refs.breakRows, message: "Breaks must fall inside check-in and check-out time." };
      ranges.push([bs, be]);
    }
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    for (var j = 1; j < ranges.length; j += 1) {
      if (ranges[j][0] < ranges[j - 1][1]) return { ok: false, field: refs.breakRows, message: "Break times cannot overlap." };
    }
    return { ok: true };
  }

  function calculateAttendance(record, worker) {
    var active = record.status === "present" || record.status === "half-day";
    var grossMinutes = 0;
    var breakMinutes = 0;
    if (active && record.checkIn && record.checkOut) {
      grossMinutes = Math.max(0, timeToMinutes(record.checkOut) - timeToMinutes(record.checkIn));
      breakMinutes = (record.breaks || []).reduce(function (sum, br) {
        if (!br.startTime || !br.endTime) return sum;
        return sum + Math.max(0, timeToMinutes(br.endTime) - timeToMinutes(br.startTime));
      }, 0);
    }
    var netMinutes = Math.max(0, grossMinutes - breakMinutes);
    var standardMinutes = Math.round(numberValue(worker.standardHours, state.settings.defaultHours || 8) * 60);
    var overtimeMinutes = state.settings.overtimeMode === "none" ? 0 : Math.max(0, netMinutes - standardMinutes);
    var regularMinutes = Math.max(0, netMinutes - overtimeMinutes);
    var regularPay = 0;
    var taskPay = 0;
    var overtimePay = overtimeMinutes * numberValue(worker.overtimeRate, 0) / 60;
    var allowancePay = netMinutes > 0 ? numberValue(worker.allowance, 0) : 0;

    if (worker.wageType === "hourly") {
      regularPay = regularMinutes * numberValue(worker.hourlyRate, 0) / 60;
    } else if (worker.wageType === "daily") {
      if (state.settings.dailyPolicy === "full-day") {
        regularPay = netMinutes > 0 ? numberValue(worker.dailyRate, 0) : 0;
      } else {
        regularPay = standardMinutes > 0 ? numberValue(worker.dailyRate, 0) * Math.min(regularMinutes, standardMinutes) / standardMinutes : 0;
      }
    } else if (worker.wageType === "task") {
      taskPay = numberValue(record.taskUnits, 0) * numberValue(record.taskRateOverride == null ? worker.taskRate : record.taskRateOverride, 0);
    }

    return {
      grossMinutes: grossMinutes,
      breakMinutes: breakMinutes,
      netMinutes: netMinutes,
      standardMinutes: standardMinutes,
      overtimeMinutes: overtimeMinutes,
      regularMinutes: regularMinutes,
      regularPay: regularPay,
      overtimePay: overtimePay,
      taskPay: taskPay,
      allowancePay: allowancePay,
      totalWage: regularPay + overtimePay + taskPay + allowancePay
    };
  }

  function renderAttendanceHistory() {
    var workerId = refs.attendanceFilterWorker.value;
    var rows = state.attendance.filter(function (row) {
      return !workerId || row.workerId === workerId;
    });
    refs.attendanceHistory.innerHTML = rows.length ? rows.map(function (row) {
      var worker = getWorker(row.workerId) || {};
      var calc = calculateAttendance(row, worker);
      return '<tr><td>' + formatDateShort(row.date) + '<br><span class="muted">' + escapeHtml(row.day) + '</span></td>' +
        '<td>' + escapeHtml(worker.name || "Unknown") + '</td>' +
        '<td class="status-' + escapeAttr(row.status) + '">' + escapeHtml(labelStatus(row.status)) + '</td>' +
        '<td>' + (row.checkIn && row.checkOut ? escapeHtml(formatTime(row.checkIn) + " - " + formatTime(row.checkOut)) : "-") + '</td>' +
        '<td>' + formatMinutes(calc.netMinutes) + '</td>' +
        '<td>' + formatMoney(calc.totalWage) + '</td>' +
        '<td><button class="text-button" data-edit-attendance="' + row.id + '" type="button">Edit</button>' +
        '<button class="text-button danger-link" data-delete-attendance="' + row.id + '" type="button">Delete</button></td></tr>';
    }).join("") : '<tr><td colspan="7">No attendance records.</td></tr>';
    bindDynamicButtons(refs.attendanceHistory);
  }

  function saveLeaveRecord(event) {
    event.preventDefault();
    clearFormErrors(refs.leaveForm);
    var startDate = refs.leaveStart.value;
    var endDate = refs.leaveEnd.value;
    if (!startDate || !endDate) return reportValidation(!startDate ? refs.leaveStart : refs.leaveEnd, "Start and end date are required.");
    if (endDate < startDate) return reportValidation(refs.leaveEnd, "End date cannot be before start date.");
    if (!refs.leaveReason.value.trim()) return reportValidation(refs.leaveReason, "Reason or explanation is required.");
    readAttachment(refs.leaveAttachment.files[0]).then(function (attachment) {
      var id = refs.leaveId.value || makeId();
      var existing = getExisting("leaveRecords", id);
      var removeAttachment = refs.removeAttachmentBtn.dataset.remove === "true";
      var record = {
        id: id,
        workerId: refs.leaveWorker.value || "",
        type: refs.leaveType.value,
        startDate: startDate,
        endDate: endDate,
        reason: refs.leaveReason.value.trim(),
        attachment: removeAttachment ? null : attachment || existing.attachment || null,
        updatedAt: new Date().toISOString(),
        createdAt: existing.createdAt || new Date().toISOString()
      };
      return put("leaveRecords", record);
    }).then(refreshAll).then(function () {
      resetLeaveForm();
      showToast("Leave or holiday record saved.");
    }).catch(showError);
  }

  function readAttachment(file) {
    if (!file) return Promise.resolve(null);
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
      };
      reader.onerror = function () {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  }

  function resetLeaveForm() {
    refs.leaveForm.reset();
    refs.leaveId.value = "";
    refs.leaveFormTitle.textContent = "Record Leave or Holiday";
    refs.cancelLeaveEditBtn.classList.add("hidden");
    refs.leaveStart.value = toDateInput(new Date());
    refs.leaveEnd.value = toDateInput(new Date());
    refs.attachmentInfo.textContent = "";
    refs.removeAttachmentBtn.dataset.remove = "false";
    refs.removeAttachmentBtn.classList.add("hidden");
    clearFormErrors(refs.leaveForm);
  }

  function markAttachmentForRemoval() {
    refs.leaveAttachment.value = "";
    refs.removeAttachmentBtn.dataset.remove = "true";
    refs.removeAttachmentBtn.classList.add("hidden");
    refs.attachmentInfo.textContent = "Attachment marked for removal. Save the record to apply.";
  }

  function editLeave(id) {
    var record = state.leaveRecords.find(function (row) { return row.id === id; });
    if (!record) return;
    refs.leaveId.value = record.id;
    refs.leaveWorker.value = record.workerId || "";
    refs.leaveType.value = record.type;
    refs.leaveStart.value = record.startDate;
    refs.leaveEnd.value = record.endDate;
    refs.leaveReason.value = record.reason;
    refs.attachmentInfo.textContent = record.attachment ? "Current attachment: " + record.attachment.name + " (" + formatBytes(record.attachment.size) + ")" : "";
    refs.removeAttachmentBtn.dataset.remove = "false";
    refs.removeAttachmentBtn.classList.toggle("hidden", !record.attachment);
    refs.leaveFormTitle.textContent = "Edit Leave or Holiday";
    refs.cancelLeaveEditBtn.classList.remove("hidden");
    clearFormErrors(refs.leaveForm);
    switchView("leave");
  }

  function deleteLeave(id) {
    if (!confirm("Delete this leave or holiday record?")) return;
    remove("leaveRecords", id).then(refreshAll).then(function () {
      showToast("Leave or holiday record deleted.");
    }).catch(showError);
  }

  function renderLeaveRecords() {
    var workerId = refs.leaveFilterWorker.value;
    var rows = getAllLeaveSources().filter(function (row) {
      return !workerId || row.workerId === workerId || row.workerId === "";
    });
    refs.leaveList.innerHTML = rows.length ? rows.map(renderLeaveCard).join("") : '<div class="empty-state">No leave or holiday records.</div>';
    bindDynamicButtons(refs.leaveList);
  }

  function renderLeaveCard(row) {
    var worker = row.workerId ? getWorker(row.workerId) : null;
    var actions = row.source === "settings-holiday"
      ? '<div class="card-actions"><span class="tag">Manage in Settings</span></div>'
      : '<div class="card-actions"><button class="text-button" data-edit-leave="' + row.id + '" type="button">Edit</button>' +
        '<button class="text-button danger-link" data-delete-leave="' + row.id + '" type="button">Delete</button></div>';
    return '<article class="record-card">' +
      '<header><div><h3>' + escapeHtml(labelStatus(row.type)) + '</h3>' +
      '<div class="muted">' + formatDateShort(row.startDate) + ' to ' + formatDateShort(row.endDate) + ' | ' + escapeHtml(worker ? worker.name : "All workers / site") + '</div></div>' +
      actions + '</header>' +
      '<p>' + escapeHtml(row.reason) + '</p>' +
      (row.attachment ? '<a class="tag" href="' + row.attachment.dataUrl + '" download="' + escapeAttr(row.attachment.name) + '">Attachment: ' + escapeHtml(row.attachment.name) + '</a>' : '<span class="tag">No attachment</span>') +
      '</article>';
  }

  function renderDashboard() {
    var today = toDateInput(new Date());
    var todayRows = state.attendance.filter(function (row) { return row.date === today; });
    var totals = sumAttendance(todayRows);
    refs.metricWorkers.textContent = state.workers.length;
    refs.metricPresent.textContent = todayRows.filter(function (row) { return row.status === "present" || row.status === "half-day"; }).length;
    refs.metricHours.textContent = formatMinutes(totals.netMinutes);
    refs.metricWages.textContent = formatMoney(totals.totalWage);
    refs.todayTable.innerHTML = todayRows.length ? todayRows.map(function (row) {
      var worker = getWorker(row.workerId) || {};
      var calc = calculateAttendance(row, worker);
      return '<tr><td>' + escapeHtml(worker.name || "Unknown") + '</td><td>' + (row.checkIn ? escapeHtml(formatTime(row.checkIn)) : "-") + '</td><td>' + (row.checkOut ? escapeHtml(formatTime(row.checkOut)) : "-") + '</td><td>' + formatMinutes(calc.netMinutes) + '</td><td>' + formatMoney(calc.totalWage) + '</td>' +
        '<td><button class="text-button" data-edit-attendance="' + row.id + '" type="button">Edit</button><button class="text-button danger-link" data-delete-attendance="' + row.id + '" type="button">Delete</button></td></tr>';
    }).join("") : '<tr><td colspan="6">No attendance recorded for today.</td></tr>';
    bindDynamicButtons(refs.todayTable);

    var upcoming = getAllLeaveSources().filter(function (row) {
      return row.endDate >= today;
    }).slice(0, 5);
    refs.upcomingLeaveList.innerHTML = upcoming.length ? upcoming.map(renderLeaveCard).join("") : '<div class="empty-state">No upcoming leave or holiday records.</div>';
    bindDynamicButtons(refs.upcomingLeaveList);
  }

  function restoreReportFilter() {
    var saved = {};
    try {
      saved = JSON.parse(sessionStorage.getItem(REPORT_FILTER_KEY) || "{}");
    } catch (error) {
      saved = {};
    }
    refs.reportPreset.value = saved.preset === "fy" ? "year" : (saved.preset || "month");
    applyReportPreset(saved.from, saved.to);
    refs.reportWorker.value = saved.workerId || "";
  }

  function applyReportPreset(savedFrom, savedTo) {
    var preset = refs.reportPreset.value;
    var today = new Date();
    if (preset === "today") {
      refs.reportFrom.value = toDateInput(today);
      refs.reportTo.value = toDateInput(today);
    } else if (preset === "week") {
      refs.reportFrom.value = toDateInput(startOfWeek(today));
      refs.reportTo.value = toDateInput(endOfWeek(today));
    } else if (preset === "month") {
      refs.reportFrom.value = toDateInput(new Date(today.getFullYear(), today.getMonth(), 1));
      refs.reportTo.value = toDateInput(new Date(today.getFullYear(), today.getMonth() + 1, 0));
    } else if (preset === "year" || preset === "fy") {
      var range = getCurrentYearRange(today, state.settings.yearMode);
      refs.reportFrom.value = range.from;
      refs.reportTo.value = range.to;
    } else {
      refs.reportFrom.value = savedFrom || refs.reportFrom.value || toDateInput(today);
      refs.reportTo.value = savedTo || refs.reportTo.value || toDateInput(today);
    }
  }

  function saveReportFilter() {
    sessionStorage.setItem(REPORT_FILTER_KEY, JSON.stringify({
      preset: refs.reportPreset.value,
      from: refs.reportFrom.value,
      to: refs.reportTo.value,
      workerId: refs.reportWorker.value
    }));
  }

  function renderReports() {
    var token = ++reportRenderToken;
    var from = refs.reportFrom.value || toDateInput(new Date());
    var to = refs.reportTo.value || from;
    var workerId = refs.reportWorker.value;
    if (to < from) {
      setFieldError(refs.reportTo, "End date cannot be earlier than start date. The end date was adjusted.");
      refs.reportTo.value = from;
      to = from;
    } else {
      clearFieldError(refs.reportTo);
    }
    buildReportDataset(from, to, workerId).then(function (payload) {
      if (token !== reportRenderToken) return;
      state.reportRows = payload.rows;
      refs.reportDays.textContent = payload.attendanceDays;
      refs.reportNetHours.textContent = formatMinutes(payload.totals.netMinutes);
      refs.reportOvertime.textContent = formatMinutes(payload.totals.overtimeMinutes);
      refs.reportWages.textContent = formatMoney(payload.totals.totalWage);
      renderWorkerWise(payload.workerSummary);
      renderCategoryWise(payload.categorySummary);
      renderLedger(payload.rows);
      renderReportLeaves(from, to, workerId);
    }).catch(showError);
  }

  function renderWorkerWise(summary) {
    refs.workerReportRows.innerHTML = summary.length ? summary.map(function (row) {
      return '<tr><td>' + escapeHtml(row.name || "Unknown") + '</td><td>' + escapeHtml(row.type || "-") + '</td><td>' + row.days + '</td><td>' + formatMinutes(row.netMinutes) + '</td><td>' + formatMinutes(row.overtimeMinutes) + '</td><td>' + formatMoney(row.totalWage) + '</td></tr>';
    }).join("") : '<tr><td colspan="6">No records in selected range.</td></tr>';
  }

  function renderCategoryWise(summary) {
    refs.categoryReportRows.innerHTML = summary.length ? summary.map(function (row) {
      return '<tr><td>' + escapeHtml(row.category) + '</td><td>' + row.workerCount + '</td><td>' + row.days + '</td><td>' + formatMinutes(row.netMinutes) + '</td><td>' + formatMoney(row.totalWage) + '</td></tr>';
    }).join("") : '<tr><td colspan="5">No records in selected range.</td></tr>';
  }

  function renderLedger(rows) {
    refs.ledgerRows.innerHTML = rows.length ? rows.sort(byDateDesc).map(function (row) {
      var calc = row.calculation;
      return '<tr><td>' + formatDateShort(row.date) + '</td><td>' + escapeHtml(row.day) + '</td><td>' + escapeHtml(row.worker.name || "Unknown") + '</td><td class="status-' + escapeAttr(row.status) + '">' + escapeHtml(labelStatus(row.status)) + '</td><td>' + (row.checkIn && row.checkOut ? escapeHtml(formatTime(row.checkIn) + " - " + formatTime(row.checkOut)) : "-") + '</td><td>' + formatMinutes(calc.breakMinutes) + '</td><td>' + formatMinutes(calc.netMinutes) + '</td><td>' + formatMinutes(calc.overtimeMinutes) + '</td><td>' + formatMoney(calc.totalWage) + '</td>' +
        '<td><button class="text-button" data-edit-attendance="' + row.id + '" type="button">Edit</button><button class="text-button danger-link" data-delete-attendance="' + row.id + '" type="button">Delete</button></td></tr>';
    }).join("") : '<tr><td colspan="10">No attendance ledger rows.</td></tr>';
    bindDynamicButtons(refs.ledgerRows);
  }

  function renderReportLeaves(from, to, workerId) {
    var rows = getAllLeaveSources().filter(function (row) {
      var overlaps = row.startDate <= to && row.endDate >= from;
      var workerMatches = !workerId || row.workerId === workerId || row.workerId === "";
      return overlaps && workerMatches;
    });
    refs.reportLeaveRows.innerHTML = rows.length ? rows.map(renderLeaveCard).join("") : '<div class="empty-state">No leave or holiday records in this range.</div>';
    bindDynamicButtons(refs.reportLeaveRows);
  }

  function exportCsv() {
    if (!state.reportRows.length) return showToast("No report rows to export.");
    var header = ["Date", "Day", "Worker", "Category", "Status", "Check In", "Check Out", "Break Minutes", "Net Minutes", "Overtime Minutes", "Regular Pay", "Overtime Pay", "Task Pay", "Allowance", "Total Wage"];
    var body = state.reportRows.map(function (row) {
      var c = row.calculation;
      return [row.date, row.day, row.worker.name || "", row.worker.type || "", labelStatus(row.status), row.checkIn || "", row.checkOut || "", c.breakMinutes, c.netMinutes, c.overtimeMinutes, moneyRaw(c.regularPay), moneyRaw(c.overtimePay), moneyRaw(c.taskPay), moneyRaw(c.allowancePay), moneyRaw(c.totalWage)];
    });
    downloadFile("workpay-report.csv", toCsv([header].concat(body)), "text/csv");
  }

  function exportJson() {
    var payload = {
      exportedAt: new Date().toISOString(),
      app: "WorkPay India",
      version: 2,
      schemaVersion: DB_VERSION,
      settings: state.settings,
      workers: state.workers,
      attendance: state.attendance,
      leaveRecords: state.leaveRecords
    };
    downloadFile("workpay-backup.json", JSON.stringify(payload, null, 2), "application/json");
  }

  function importJson() {
    var file = refs.importJsonInput.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var payload = JSON.parse(reader.result);
        if (!Array.isArray(payload.workers) || !Array.isArray(payload.attendance) || !Array.isArray(payload.leaveRecords)) {
          throw new Error("Backup file is missing required arrays.");
        }
        if (!confirm("Import will replace local WorkPay data. Continue?")) return;
        Promise.all([clearStore("workers"), clearStore("attendance"), clearStore("leaveRecords")])
          .then(function () {
            state.settings = normalizeSettings(Object.assign(loadSettings(), payload.settings || {}));
            saveSettings();
            return Promise.all(payload.workers.map(function (row) { return put("workers", normalizeWorkerRecord(row)); })
              .concat(payload.attendance.map(function (row) { return put("attendance", normalizeAttendanceRecord(row)); }))
              .concat(payload.leaveRecords.map(function (row) { return put("leaveRecords", normalizeLeaveRecord(row)); })));
          })
          .then(refreshAll)
          .then(function () {
            restoreSettingsForm();
            applyTheme();
            showToast("Backup imported.");
          }).catch(showError);
      } catch (error) {
        showError(error);
      } finally {
        refs.importJsonInput.value = "";
      }
    };
    reader.readAsText(file);
  }

  function resetAllData() {
    if (!confirm("Delete all local WorkPay records, attachments, settings, and saved filters from this browser?")) return;
    Promise.all([clearStore("workers"), clearStore("attendance"), clearStore("leaveRecords")]).then(function () {
      localStorage.removeItem(SETTINGS_KEY);
      sessionStorage.removeItem(REPORT_FILTER_KEY);
      sessionStorage.removeItem("workpay.activeView");
      setCookie("workpayView", "", -1);
      state.settings = loadSettings();
      state.activeView = "dashboard";
      restoreSettingsForm();
      applyTheme();
      resetWorkerForm();
      resetAttendanceForm();
      resetLeaveForm();
      return refreshAll();
    }).then(function () {
      switchView("dashboard");
      showToast("All local records deleted.");
    }).catch(showError);
  }

  function seedDemoData() {
    if (state.workers.length && !confirm("Demo data will be added to existing data. Continue?")) return;
    var today = toDateInput(new Date());
    var yesterday = toDateInput(new Date(Date.now() - 86400000));
    var workers = [
      {
        id: makeId(), name: "Ramesh Kumar", phone: "9876543210", whatsapp: "9876543210", email: "",
        website: "", otherContact: "Site A supervisor: Manoj", type: "Mason", wageType: "daily",
        standardHours: 8, hourlyRate: 0, dailyRate: 900, overtimeRate: 150, taskRate: 0, allowance: 50,
        compensationNotes: "Daily wage with lunch allowance.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      },
      {
        id: makeId(), name: "Sita Devi", phone: "9123456780", whatsapp: "9123456780", email: "",
        website: "", otherContact: "", type: "Helper", wageType: "hourly",
        standardHours: 8, hourlyRate: 90, dailyRate: 0, overtimeRate: 130, taskRate: 0, allowance: 0,
        compensationNotes: "Hourly helper rate.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      },
      {
        id: makeId(), name: "Imran Shaikh", phone: "9988776655", whatsapp: "9988776655", email: "",
        website: "", otherContact: "", type: "Painter", wageType: "task",
        standardHours: 8, hourlyRate: 0, dailyRate: 0, overtimeRate: 120, taskRate: 35, allowance: 0,
        compensationNotes: "Paid per square metre completed.", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      }
    ];
    var attendance = [
      makeAttendanceSeed(workers[0], today, "08:45", "18:15", [{ startTime: "13:00", endTime: "13:45", type: "Lunch", note: "" }], 0),
      makeAttendanceSeed(workers[1], today, "09:05", "17:30", [{ startTime: "11:00", endTime: "11:15", type: "Tea", note: "" }, { startTime: "13:15", endTime: "14:00", type: "Lunch", note: "" }], 0),
      makeAttendanceSeed(workers[2], yesterday, "09:00", "16:30", [{ startTime: "13:00", endTime: "13:30", type: "Lunch", note: "" }], 42)
    ];
    var leaveRecords = [
      { id: makeId(), workerId: "", type: "festival-holiday", startDate: today, endDate: today, reason: "Regional festival/site holiday marker for planning.", attachment: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
    Promise.all(workers.map(function (worker) { return put("workers", worker); })
      .concat(attendance.map(function (row) { return put("attendance", row); }))
      .concat(leaveRecords.map(function (row) { return put("leaveRecords", row); })))
      .then(refreshAll)
      .then(function () {
        showToast("Demo data loaded.");
      }).catch(showError);
  }

  function makeAttendanceSeed(worker, date, checkIn, checkOut, breaks, taskUnits) {
    var record = {
      id: makeId(),
      workerId: worker.id,
      date: date,
      day: getDayName(date),
      status: "present",
      checkIn: checkIn,
      checkOut: checkOut,
      breaks: breaks,
      taskUnits: taskUnits,
      taskRateOverride: null,
      notes: "Demo record",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    record.calculation = calculateAttendance(record, worker);
    return record;
  }

  function bindDynamicButtons(root) {
    root.querySelectorAll("[data-edit-worker]").forEach(function (button) {
      button.addEventListener("click", function () { editWorker(button.dataset.editWorker); });
    });
    root.querySelectorAll("[data-delete-worker]").forEach(function (button) {
      button.addEventListener("click", function () { deleteWorker(button.dataset.deleteWorker); });
    });
    root.querySelectorAll("[data-edit-attendance]").forEach(function (button) {
      button.addEventListener("click", function () { editAttendance(button.dataset.editAttendance); });
    });
    root.querySelectorAll("[data-delete-attendance]").forEach(function (button) {
      button.addEventListener("click", function () { deleteAttendance(button.dataset.deleteAttendance); });
    });
    root.querySelectorAll("[data-edit-leave]").forEach(function (button) {
      button.addEventListener("click", function () { editLeave(button.dataset.editLeave); });
    });
    root.querySelectorAll("[data-delete-leave]").forEach(function (button) {
      button.addEventListener("click", function () { deleteLeave(button.dataset.deleteLeave); });
    });
    root.querySelectorAll("[data-edit-worker-type]").forEach(function (button) {
      button.addEventListener("click", function () { editWorkerType(button.dataset.editWorkerType); });
    });
    root.querySelectorAll("[data-delete-worker-type]").forEach(function (button) {
      button.addEventListener("click", function () { deleteWorkerType(button.dataset.deleteWorkerType); });
    });
    root.querySelectorAll("[data-edit-break-type]").forEach(function (button) {
      button.addEventListener("click", function () { editBreakType(button.dataset.editBreakType); });
    });
    root.querySelectorAll("[data-delete-break-type]").forEach(function (button) {
      button.addEventListener("click", function () { deleteBreakType(button.dataset.deleteBreakType); });
    });
  }

  function getWorker(id) {
    return state.workers.find(function (worker) { return worker.id === id; });
  }

  function getExisting(storeName, id) {
    if (!id) return {};
    var list = storeName === "workers" ? state.workers : storeName === "attendance" ? state.attendance : state.leaveRecords;
    return list.find(function (row) { return row.id === id; }) || {};
  }

  function sumAttendance(rows) {
    return sumCalculated(rows.map(function (row) {
      return { calculation: calculateAttendance(row, getWorker(row.workerId) || {}) };
    }));
  }

  function sumCalculated(rows) {
    return rows.reduce(function (sum, row) {
      var c = row.calculation || {};
      sum.netMinutes += c.netMinutes || 0;
      sum.overtimeMinutes += c.overtimeMinutes || 0;
      sum.totalWage += c.totalWage || 0;
      return sum;
    }, { netMinutes: 0, overtimeMinutes: 0, totalWage: 0 });
  }

  function groupBy(rows, mapper) {
    return rows.reduce(function (groups, row) {
      var key = mapper(row);
      groups[key] = groups[key] || [];
      groups[key].push(row);
      return groups;
    }, {});
  }

  function makeId() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }

  function numberValue(value, fallback) {
    var num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function timeToMinutes(value) {
    if (!value) return 0;
    var parts = value.split(":").map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }

  function formatMinutes(minutes) {
    var total = Math.round(minutes || 0);
    var sign = total < 0 ? "-" : "";
    total = Math.abs(total);
    return sign + Math.floor(total / 60) + "h " + String(total % 60).padStart(2, "0") + "m";
  }

  function formatHours(minutes) {
    return formatMinutes(minutes);
  }

  function formatMoney(value) {
    var currency = state.settings.currencyCode || DEFAULT_CURRENCY;
    try {
      return new Intl.NumberFormat(getCurrencyLocale(currency), {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(value) || 0);
    } catch (error) {
      return currency + " " + moneyRaw(value);
    }
  }

  function moneyRaw(value) {
    return (Math.round((Number(value) || 0) * 100) / 100).toFixed(2);
  }

  function formatDateShort(value) {
    if (!value) return "-";
    if ((state.settings && state.settings.dateFormat || "ddmmyyyy") === "ddmmyyyy") {
      return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kolkata" });
    }
    return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  }

  function formatDateLong(value) {
    return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  }

  function formatTime(value) {
    if (!value) return "-";
    if ((state.settings.timeFormat || "24h") === "24h") return value;
    var parts = value.split(":");
    var date = new Date();
    date.setHours(Number(parts[0] || 0), Number(parts[1] || 0), 0, 0);
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    }).format(date);
  }

  function getDayName(value) {
    return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });
  }

  function toDateInput(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function startOfWeek(date) {
    var copy = new Date(date);
    var day = copy.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    return copy;
  }

  function endOfWeek(date) {
    var start = startOfWeek(date);
    start.setDate(start.getDate() + 6);
    return start;
  }

  function byName(a, b) {
    return a.name.localeCompare(b.name);
  }

  function byDateDesc(a, b) {
    return (b.date || "").localeCompare(a.date || "") || (b.createdAt || "").localeCompare(a.createdAt || "");
  }

  function byLeaveDateDesc(a, b) {
    return (b.startDate || "").localeCompare(a.startDate || "");
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function getCurrencyLocale(currency) {
    return currency === "INR" ? "en-IN" : "en-US";
  }

  function labelStatus(value) {
    return String(value || "").split("-").map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(" ");
  }

  function isValidIndianPhone(value) {
    return /^[6-9]\d{9}$/.test(String(value || "").replace(/\D/g, ""));
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    var units = ["B", "KB", "MB", "GB"];
    var index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return (bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0) + " " + units[index];
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function showToast(message) {
    refs.toast.textContent = message;
    refs.toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      refs.toast.classList.remove("show");
    }, 3200);
  }

  function showError(error) {
    console.error(error);
    showToast(error && error.message ? error.message : "Something went wrong.");
  }

  function setCookie(name, value, days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 86400000);
    document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + date.toUTCString() + "; path=/; SameSite=Lax";
  }

  function getCookie(name) {
    return document.cookie.split(";").map(function (part) { return part.trim(); }).reduce(function (found, part) {
      if (found) return found;
      var pieces = part.split("=");
      return pieces[0] === name ? decodeURIComponent(pieces.slice(1).join("=")) : "";
    }, "");
  }

  function downloadFile(filename, content, type) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function toCsv(rows) {
    return rows.map(function (row) {
      return row.map(function (cell) {
        var value = String(cell == null ? "" : cell);
        return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
      }).join(",");
    }).join("\n");
  }

  function ensureIndex(store, name, keyPath, unique) {
    if (!store.indexNames.contains(name)) {
      store.createIndex(name, keyPath, { unique: !!unique });
    }
  }

  function createDefaultStatutoryConfig() {
    return {
      establishmentState: "",
      modules: {
        pf: { enabled: false },
        esi: { enabled: false },
        tds: { enabled: false },
        professionalTax: { enabled: false }
      },
      notes: ""
    };
  }

  function createDefaultWorkerStatutoryProfile() {
    return {
      pfEligible: false,
      esiEligible: false,
      tdsApplicable: false,
      professionalTaxApplicable: false,
      identifiers: {
        uan: "",
        esiNumber: "",
        pan: ""
      }
    };
  }

  function getDefaultPublicHolidays() {
    var year = new Date().getFullYear();
    return [year, year + 1].reduce(function (all, currentYear) {
      return all.concat([
        { date: currentYear + "-01-26", name: "Republic Day", type: "national-holiday" },
        { date: currentYear + "-08-15", name: "Independence Day", type: "national-holiday" },
        { date: currentYear + "-10-02", name: "Gandhi Jayanti", type: "national-holiday" }
      ]);
    }, []);
  }

  function normalizeSettings(settings) {
    var merged = Object.assign({}, settings);
    merged.currencyCode = merged.currencyCode || DEFAULT_CURRENCY;
    merged.timeFormat = merged.timeFormat === "12h" ? "12h" : "24h";
    merged.dateFormat = merged.dateFormat || "ddmmyyyy";
    merged.yearMode = merged.yearMode === "calendar" ? "calendar" : "financial";
    merged.publicHolidays = normalizeHolidayList(Array.isArray(merged.publicHolidays) ? merged.publicHolidays : getDefaultPublicHolidays());
    merged.statutoryConfig = normalizeStatutoryConfig(merged.statutoryConfig);
    if (!Array.isArray(merged.workerTypes)) merged.workerTypes = DEFAULT_TYPES.slice();
    if (!Array.isArray(merged.breakTypes)) merged.breakTypes = DEFAULT_BREAK_TYPES.slice();
    return merged;
  }

  function normalizeStatutoryConfig(config) {
    var merged = Object.assign(createDefaultStatutoryConfig(), config || {});
    merged.modules = Object.assign(createDefaultStatutoryConfig().modules, config && config.modules || {});
    merged.modules.pf = Object.assign({ enabled: false }, merged.modules.pf || {});
    merged.modules.esi = Object.assign({ enabled: false }, merged.modules.esi || {});
    merged.modules.tds = Object.assign({ enabled: false }, merged.modules.tds || {});
    merged.modules.professionalTax = Object.assign({ enabled: false }, merged.modules.professionalTax || {});
    return merged;
  }

  function normalizeHolidayList(list) {
    return unique((Array.isArray(list) ? list : []).map(function (row) {
      if (!row || !row.date) return "";
      return JSON.stringify({
        date: row.date,
        name: String(row.name || "").trim() || "Holiday",
        type: normalizeHolidayType(row.type)
      });
    })).map(function (row) {
      return JSON.parse(row);
    }).sort(function (a, b) {
      return a.date.localeCompare(b.date) || a.name.localeCompare(b.name);
    });
  }

  function normalizeHolidayType(value) {
    return ["national-holiday", "festival-holiday", "site-holiday"].includes(value) ? value : "site-holiday";
  }

  function parsePublicHolidayInput(text) {
    var lines = String(text || "").split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
    var seen = {};
    var holidays = [];
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i];
      var parts = line.split("|").map(function (part) { return part.trim(); }).filter(Boolean);
      if (parts.length < 2 || parts.length > 3) {
        return { ok: false, message: "Holiday line " + (i + 1) + " must use: YYYY-MM-DD | Holiday name | type" };
      }
      var date = parts[0];
      var name = parts[1];
      var type = normalizeHolidayType(parts[2] || "national-holiday");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date + "T00:00:00").getTime())) {
        return { ok: false, message: "Holiday line " + (i + 1) + " has an invalid date." };
      }
      var key = date + "|" + name.toLowerCase();
      if (seen[key]) {
        return { ok: false, message: "Holiday line " + (i + 1) + " duplicates an earlier holiday entry." };
      }
      seen[key] = true;
      holidays.push({ date: date, name: name, type: type });
    }
    return { ok: true, holidays: normalizeHolidayList(holidays) };
  }

  function formatPublicHolidayLines(list) {
    return normalizeHolidayList(list).map(function (row) {
      return [row.date, row.name, row.type].join(" | ");
    }).join("\n");
  }

  function normalizeWorkerRecord(worker) {
    var normalized = Object.assign({}, worker || {});
    normalized.name = String(normalized.name || "").trim();
    normalized.phone = normalizePhone(normalized.phone);
    normalized.whatsapp = normalizePhone(normalized.whatsapp) || normalized.phone;
    normalized.nameKey = normalized.name.toLowerCase();
    normalized.phoneDigits = normalized.phone;
    normalized.type = normalized.type || "Other";
    normalized.searchText = [normalized.name, normalized.phone, normalized.whatsapp, normalized.type, normalized.email || ""].join(" ").toLowerCase();
    normalized.statutoryProfile = Object.assign(createDefaultWorkerStatutoryProfile(), normalized.statutoryProfile || {});
    normalized.statutoryProfile.identifiers = Object.assign(createDefaultWorkerStatutoryProfile().identifiers, normalized.statutoryProfile.identifiers || {});
    return normalized;
  }

  function normalizeAttendanceRecord(row) {
    var normalized = Object.assign({}, row || {});
    normalized.breaks = Array.isArray(normalized.breaks) ? normalized.breaks.map(function (br) {
      return {
        startTime: br.startTime || "",
        endTime: br.endTime || "",
        type: br.type || "Lunch",
        note: String(br.note || "").trim()
      };
    }) : [];
    normalized.day = normalized.day || (normalized.date ? getDayName(normalized.date) : "");
    return normalized;
  }

  function normalizeLeaveRecord(row) {
    var normalized = Object.assign({}, row || {});
    normalized.reason = String(normalized.reason || "").trim();
    normalized.attachment = normalized.attachment || null;
    return normalized;
  }

  function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function validateWorkerWageConfig(worker) {
    if ((worker.wageType === "hourly" || worker.wageType === "daily") && numberValue(worker.standardHours, 0) <= 0) {
      return { ok: false, field: refs.standardHours, message: "Standard hours must be greater than zero for hourly or daily wages." };
    }
    if (worker.wageType === "hourly" && numberValue(worker.hourlyRate, 0) <= 0) {
      return { ok: false, field: refs.hourlyRate, message: "Hourly workers need an hourly rate greater than zero." };
    }
    if (worker.wageType === "daily" && numberValue(worker.dailyRate, 0) <= 0) {
      return { ok: false, field: refs.dailyRate, message: "Daily workers need a daily rate greater than zero." };
    }
    if (worker.wageType === "task" && numberValue(worker.taskRate, 0) <= 0) {
      return { ok: false, field: refs.taskRate, message: "Task-based workers need a task rate greater than zero." };
    }
    if (numberValue(worker.overtimeRate, 0) < 0 || numberValue(worker.allowance, 0) < 0) {
      return { ok: false, field: refs.overtimeRate, message: "Overtime and allowance values cannot be negative." };
    }
    return { ok: true };
  }

  function bindValidationListeners(form) {
    if (!form) return;
    form.addEventListener("input", function (event) {
      if (event.target && event.target.form === form) clearFieldError(event.target);
    });
    form.addEventListener("change", function (event) {
      if (event.target && event.target.form === form) clearFieldError(event.target);
    });
  }

  function reportValidation(field, message) {
    setFieldError(field, message);
    showToast(message);
    if (field && field.focus) field.focus();
    return null;
  }

  function setFieldError(field, message) {
    if (!field) return;
    var container = getFieldContainer(field);
    var errorNode = container.querySelector('.field-error[data-for="' + (field.id || container.id || "field") + '"]');
    if (!errorNode) {
      errorNode = document.createElement("div");
      errorNode.className = "field-error";
      errorNode.dataset.for = field.id || container.id || "field";
      container.appendChild(errorNode);
    }
    errorNode.textContent = message;
    field.classList.add("input-error");
    field.setAttribute("aria-invalid", "true");
    container.classList.add("label-error");
  }

  function clearFieldError(field) {
    if (!field) return;
    var container = getFieldContainer(field);
    var selector = '.field-error[data-for="' + (field.id || container.id || "field") + '"]';
    var errorNode = container.querySelector(selector);
    if (errorNode) errorNode.remove();
    field.classList.remove("input-error");
    field.removeAttribute("aria-invalid");
    if (!container.querySelector(".field-error")) container.classList.remove("label-error");
  }

  function clearFormErrors(form) {
    if (!form) return;
    form.querySelectorAll(".field-error").forEach(function (node) { node.remove(); });
    form.querySelectorAll(".input-error").forEach(function (field) {
      field.classList.remove("input-error");
      field.removeAttribute("aria-invalid");
    });
    form.querySelectorAll(".label-error").forEach(function (node) {
      node.classList.remove("label-error");
    });
  }

  function getFieldContainer(field) {
    return field.closest("label") || field.parentElement || field;
  }

  function getCurrentYearRange(today, yearMode) {
    var year = today.getFullYear();
    if (yearMode === "calendar") {
      return {
        from: toDateInput(new Date(year, 0, 1)),
        to: toDateInput(new Date(year, 11, 31))
      };
    }
    var fyStartYear = today.getMonth() >= 3 ? year : year - 1;
    return {
      from: toDateInput(new Date(fyStartYear, 3, 1)),
      to: toDateInput(new Date(fyStartYear + 1, 2, 31))
    };
  }

  function syncReportPresetOption() {
    var option = refs.reportPreset.querySelector('option[value="year"]') || refs.reportPreset.querySelector('option[value="fy"]');
    if (!option) return;
    option.value = "year";
    option.textContent = state.settings.yearMode === "calendar" ? "Current calendar year" : "Current financial year";
  }

  function getAllLeaveSources() {
    return state.leaveRecords.concat(getConfiguredHolidayRecords()).sort(byLeaveDateDesc);
  }

  function getConfiguredHolidayRecords() {
    return (state.settings.publicHolidays || []).map(function (row) {
      return {
        id: "holiday-" + row.date + "-" + row.name.toLowerCase().replace(/\s+/g, "-"),
        workerId: "",
        type: row.type,
        startDate: row.date,
        endDate: row.date,
        reason: row.name,
        attachment: null,
        source: "settings-holiday",
        createdAt: row.date + "T00:00:00.000Z",
        updatedAt: row.date + "T00:00:00.000Z"
      };
    });
  }

  function queueReportsRender(immediate) {
    window.clearTimeout(deferredReportTimer);
    if (immediate || state.activeView === "reports") {
      renderReports();
      return;
    }
    deferredReportTimer = window.setTimeout(renderReports, 140);
  }

  function buildReportDataset(from, to, workerId) {
    var worker = ensureReportWorker();
    if (!worker) return Promise.resolve(buildReportDatasetSync(from, to, workerId));
    return new Promise(function (resolve, reject) {
      var requestId = "report-" + (++reportWorkerState.sequence);
      reportWorkerState.pending[requestId] = { resolve: resolve, reject: reject };
      worker.postMessage({
        type: "build-report",
        requestId: requestId,
        from: from,
        to: to,
        workerId: workerId,
        settings: {
          defaultHours: state.settings.defaultHours,
          overtimeMode: state.settings.overtimeMode,
          dailyPolicy: state.settings.dailyPolicy
        },
        workers: state.workers,
        attendance: state.attendance
      });
    });
  }

  function ensureReportWorker() {
    if (location.protocol === "file:" || !window.Worker) return null;
    if (reportWorkerState.worker) return reportWorkerState.worker;
    try {
      reportWorkerState.worker = new Worker("report-worker.js");
      reportWorkerState.worker.onmessage = function (event) {
        var payload = event.data || {};
        var pending = reportWorkerState.pending[payload.requestId];
        if (!pending) return;
        delete reportWorkerState.pending[payload.requestId];
        pending.resolve(payload.result);
      };
      reportWorkerState.worker.onerror = function (error) {
        Object.keys(reportWorkerState.pending).forEach(function (key) {
          reportWorkerState.pending[key].reject(error);
          delete reportWorkerState.pending[key];
        });
        reportWorkerState.worker = null;
      };
      return reportWorkerState.worker;
    } catch (error) {
      console.warn("Report worker unavailable, falling back to main thread.", error);
      reportWorkerState.worker = null;
      return null;
    }
  }

  function buildReportDatasetSync(from, to, workerId) {
    var rows = state.attendance.filter(function (row) {
      return row.date >= from && row.date <= to && (!workerId || row.workerId === workerId);
    }).map(function (row) {
      var worker = getWorker(row.workerId) || {};
      var calc = calculateAttendance(row, worker);
      return Object.assign({}, row, { worker: worker, calculation: calc });
    });
    var workerGroups = {};
    var categoryGroups = {};
    rows.forEach(function (row) {
      var worker = row.worker || {};
      var workerKey = row.workerId || "unknown";
      var workerGroup = workerGroups[workerKey] || (workerGroups[workerKey] = {
        name: worker.name || "Unknown",
        type: worker.type || "-",
        days: 0,
        netMinutes: 0,
        overtimeMinutes: 0,
        totalWage: 0
      });
      workerGroup.days += 1;
      workerGroup.netMinutes += row.calculation.netMinutes || 0;
      workerGroup.overtimeMinutes += row.calculation.overtimeMinutes || 0;
      workerGroup.totalWage += row.calculation.totalWage || 0;

      var category = worker.type || "Unknown";
      var categoryGroup = categoryGroups[category] || (categoryGroups[category] = {
        category: category,
        workerIds: {},
        days: 0,
        netMinutes: 0,
        totalWage: 0
      });
      categoryGroup.workerIds[workerKey] = true;
      categoryGroup.days += 1;
      categoryGroup.netMinutes += row.calculation.netMinutes || 0;
      categoryGroup.totalWage += row.calculation.totalWage || 0;
    });
    return {
      rows: rows,
      attendanceDays: rows.filter(function (row) { return row.status === "present" || row.status === "half-day"; }).length,
      totals: sumCalculated(rows),
      workerSummary: Object.keys(workerGroups).map(function (key) { return workerGroups[key]; }).sort(function (a, b) { return a.name.localeCompare(b.name); }),
      categorySummary: Object.keys(categoryGroups).map(function (key) {
        return {
          category: categoryGroups[key].category,
          workerCount: Object.keys(categoryGroups[key].workerIds).length,
          days: categoryGroups[key].days,
          netMinutes: categoryGroups[key].netMinutes,
          totalWage: categoryGroups[key].totalWage
        };
      }).sort(function (a, b) { return a.category.localeCompare(b.category); })
    };
  }

  function findDuplicateAttendance(record) {
    if (!db || !record) return Promise.resolve(state.attendance.find(function (row) {
      return row.id !== record.id && row.workerId === record.workerId && row.date === record.date;
    }) || null);
    return getByIndex("attendance", "workerDate", [record.workerId, record.date]).then(function (matches) {
      matches = matches.filter(function (row) { return row.id !== record.id; });
      return matches[0] || state.attendance.find(function (row) {
        return row.id !== record.id && row.workerId === record.workerId && row.date === record.date;
      }) || null;
    });
  }

  function findDuplicateWorker(worker) {
    var fallback = state.workers.find(function (row) {
      return row.id !== worker.id && row.phoneDigits === worker.phoneDigits;
    }) || null;
    if (!db || !worker || !worker.phoneDigits) return Promise.resolve(fallback);
    return getByIndex("workers", "phoneDigits", worker.phoneDigits).then(function (matches) {
      matches = matches.filter(function (row) { return row.id !== worker.id; });
      return matches[0] || fallback;
    });
  }

  function getByIndex(storeName, indexName, query) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction(storeName, "readonly");
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

  function debounce(fn, wait) {
    var timer = 0;
    return function () {
      var args = arguments;
      var context = this;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        fn.apply(context, args);
      }, wait);
    };
  }

  window.WorkPay = {
    state: state,
    storage: {
      refreshAll: refreshAll,
      getAll: getAll,
      put: put,
      remove: remove,
      clearStore: clearStore
    },
    payroll: {
      calculateAttendance: calculateAttendance,
      validateTimes: validateTimes,
      timeToMinutes: timeToMinutes
    },
    ui: {
      switchView: switchView,
      renderAll: renderAll,
      showToast: showToast
    },
    utils: {
      formatMoney: formatMoney,
      formatMinutes: formatMinutes,
      formatDateShort: formatDateShort,
      toDateInput: toDateInput
    }
  };
})();
