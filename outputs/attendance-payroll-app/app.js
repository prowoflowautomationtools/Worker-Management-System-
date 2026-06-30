(function () {
  "use strict";

  var DB_NAME = "workpay-india-db";
  var DB_VERSION = 1;
  var SETTINGS_KEY = "workpay.settings.v1";
  var REPORT_FILTER_KEY = "workpay.reportFilter.v1";
  var DEFAULT_TYPES = ["Mason", "Helper", "Electrician", "Plumber", "Carpenter", "Painter", "Driver", "Security", "Housekeeping", "Other"];
  var DEFAULT_BREAK_TYPES = ["Lunch", "Tea", "Rest", "Other"];
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
      "settingBusinessName", "settingDefaultHours", "settingDailyPolicy", "settingOvertimeMode", "settingTheme", "settingDateFormat",
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
    refs.workerSearch.addEventListener("input", renderWorkers);
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
  }

  function openDb() {
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        var database = request.result;
        if (!database.objectStoreNames.contains("workers")) {
          database.createObjectStore("workers", { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains("attendance")) {
          var attendanceStore = database.createObjectStore("attendance", { keyPath: "id" });
          attendanceStore.createIndex("workerId", "workerId", { unique: false });
          attendanceStore.createIndex("date", "date", { unique: false });
        }
        if (!database.objectStoreNames.contains("leaveRecords")) {
          var leaveStore = database.createObjectStore("leaveRecords", { keyPath: "id" });
          leaveStore.createIndex("workerId", "workerId", { unique: false });
          leaveStore.createIndex("startDate", "startDate", { unique: false });
          leaveStore.createIndex("endDate", "endDate", { unique: false });
        }
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
      state.workers = results[0].sort(byName);
      state.attendance = results[1].sort(byDateDesc);
      state.leaveRecords = results[2].sort(byLeaveDateDesc);
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
    renderReports();
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
  }

  function setupStaticDates() {
    var today = new Date();
    refs.todayLabel.textContent = formatDateLong(toDateInput(today)) + " | " + getDayName(toDateInput(today));
  }

  function loadSettings() {
    var fallback = {
      businessName: "",
      defaultHours: 8,
      dailyPolicy: "prorated",
      overtimeMode: "standard",
      theme: "light",
      dateFormat: "ddmmyyyy",
      workerTypes: DEFAULT_TYPES.slice(),
      breakTypes: DEFAULT_BREAK_TYPES.slice()
    };
    try {
      var merged = Object.assign(fallback, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));
      if (!Array.isArray(merged.workerTypes)) merged.workerTypes = DEFAULT_TYPES.slice();
      if (!Array.isArray(merged.breakTypes)) merged.breakTypes = DEFAULT_BREAK_TYPES.slice();
      return merged;
    } catch (error) {
      return fallback;
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  }

  function restoreSettingsForm() {
    refs.settingBusinessName.value = state.settings.businessName || "";
    refs.settingDefaultHours.value = state.settings.defaultHours || 8;
    refs.settingDailyPolicy.value = state.settings.dailyPolicy || "prorated";
    refs.settingOvertimeMode.value = state.settings.overtimeMode || "standard";
    refs.settingTheme.value = state.settings.theme || "light";
    refs.settingDateFormat.value = state.settings.dateFormat || "ddmmyyyy";
  }

  function saveSettingsForm() {
    state.settings.businessName = refs.settingBusinessName.value.trim();
    state.settings.defaultHours = numberValue(refs.settingDefaultHours.value, 8);
    state.settings.dailyPolicy = refs.settingDailyPolicy.value;
    state.settings.overtimeMode = refs.settingOvertimeMode.value;
    state.settings.theme = refs.settingTheme.value;
    state.settings.dateFormat = refs.settingDateFormat.value;
    normalizeMasterData();
    saveSettings();
    applyTheme();
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
    var id = refs.workerId.value || makeId();
    var name = refs.workerName.value.trim();
    var phone = refs.workerPhone.value.trim();
    var type = refs.workerType.value === "Other" ? refs.customWorkerType.value.trim() : refs.workerType.value;
    if (!name) return showToast("Worker full name is required.");
    if (!isValidIndianPhone(phone)) return showToast("Enter a valid mandatory Indian mobile number.");
    if (!type) return showToast("Worker type is required.");
    var whatsapp = refs.workerWhatsapp.value.trim() || phone;
    if (!isValidIndianPhone(whatsapp)) return showToast("Enter a valid WhatsApp mobile number or leave it blank.");

    if (!Array.isArray(state.settings.workerTypes)) state.settings.workerTypes = DEFAULT_TYPES.slice();
    if (!state.settings.workerTypes.includes(type)) {
      state.settings.workerTypes.push(type);
      saveSettings();
    }

    var worker = {
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
      updatedAt: new Date().toISOString(),
      createdAt: getExisting("workers", id).createdAt || new Date().toISOString()
    };

    put("workers", worker).then(refreshAll).then(function () {
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
    renderWorkerTypeOptions();
  }

  function renderWorkers() {
    var query = (refs.workerSearch.value || "").trim().toLowerCase();
    var workers = state.workers.filter(function (worker) {
      return !query || [worker.name, worker.phone, worker.type, worker.email, worker.whatsapp].join(" ").toLowerCase().includes(query);
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
    var duplicate = state.attendance.find(function (row) {
      return row.id !== record.id && row.workerId === record.workerId && row.date === record.date;
    });
    if (duplicate) {
      showToast("This worker already has an attendance record for that date.");
      return;
    }
    put("attendance", record).then(refreshAll).then(function () {
      resetAttendanceForm();
      showToast("Attendance saved.");
    }).catch(showError);
  }

  function buildAttendanceFromForm() {
    var worker = getWorker(refs.attendanceWorker.value);
    var status = refs.attendanceStatus.value;
    var date = refs.attendanceDate.value;
    if (!worker) {
      showToast("Select a worker.");
      return null;
    }
    if (!date) {
      showToast("Select a date.");
      return null;
    }
    var needsTime = status === "present" || status === "half-day";
    var checkIn = refs.checkIn.value;
    var checkOut = refs.checkOut.value;
    if (needsTime && (!checkIn || !checkOut)) {
      showToast("Check-in and check-out are required for present or half-day attendance.");
      return null;
    }
    var breaks = collectBreaks();
    var validation = validateTimes(checkIn, checkOut, breaks, needsTime);
    if (!validation.ok) {
      showToast(validation.message);
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
    if (end <= start) return { ok: false, message: "Check-out must be after check-in for the same work date." };
    var ranges = [];
    for (var i = 0; i < breaks.length; i += 1) {
      var br = breaks[i];
      if (!br.startTime || !br.endTime) return { ok: false, message: "Each break needs both start and end time." };
      var bs = timeToMinutes(br.startTime);
      var be = timeToMinutes(br.endTime);
      if (be <= bs) return { ok: false, message: "Break end must be after break start." };
      if (bs < start || be > end) return { ok: false, message: "Breaks must fall inside check-in and check-out time." };
      ranges.push([bs, be]);
    }
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    for (var j = 1; j < ranges.length; j += 1) {
      if (ranges[j][0] < ranges[j - 1][1]) return { ok: false, message: "Break times cannot overlap." };
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
        '<td>' + (row.checkIn && row.checkOut ? escapeHtml(row.checkIn + " - " + row.checkOut) : "-") + '</td>' +
        '<td>' + formatMinutes(calc.netMinutes) + '</td>' +
        '<td>' + formatMoney(calc.totalWage) + '</td>' +
        '<td><button class="text-button" data-edit-attendance="' + row.id + '" type="button">Edit</button>' +
        '<button class="text-button danger-link" data-delete-attendance="' + row.id + '" type="button">Delete</button></td></tr>';
    }).join("") : '<tr><td colspan="7">No attendance records.</td></tr>';
    bindDynamicButtons(refs.attendanceHistory);
  }

  function saveLeaveRecord(event) {
    event.preventDefault();
    var startDate = refs.leaveStart.value;
    var endDate = refs.leaveEnd.value;
    if (!startDate || !endDate) return showToast("Start and end date are required.");
    if (endDate < startDate) return showToast("End date cannot be before start date.");
    if (!refs.leaveReason.value.trim()) return showToast("Reason or explanation is required.");
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
    var rows = state.leaveRecords.filter(function (row) {
      return !workerId || row.workerId === workerId;
    });
    refs.leaveList.innerHTML = rows.length ? rows.map(renderLeaveCard).join("") : '<div class="empty-state">No leave or holiday records.</div>';
    bindDynamicButtons(refs.leaveList);
  }

  function renderLeaveCard(row) {
    var worker = row.workerId ? getWorker(row.workerId) : null;
    return '<article class="record-card">' +
      '<header><div><h3>' + escapeHtml(labelStatus(row.type)) + '</h3>' +
      '<div class="muted">' + formatDateShort(row.startDate) + ' to ' + formatDateShort(row.endDate) + ' | ' + escapeHtml(worker ? worker.name : "All workers / site") + '</div></div>' +
      '<div class="card-actions"><button class="text-button" data-edit-leave="' + row.id + '" type="button">Edit</button>' +
      '<button class="text-button danger-link" data-delete-leave="' + row.id + '" type="button">Delete</button></div></header>' +
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
      return '<tr><td>' + escapeHtml(worker.name || "Unknown") + '</td><td>' + (row.checkIn || "-") + '</td><td>' + (row.checkOut || "-") + '</td><td>' + formatMinutes(calc.netMinutes) + '</td><td>' + formatMoney(calc.totalWage) + '</td>' +
        '<td><button class="text-button" data-edit-attendance="' + row.id + '" type="button">Edit</button><button class="text-button danger-link" data-delete-attendance="' + row.id + '" type="button">Delete</button></td></tr>';
    }).join("") : '<tr><td colspan="6">No attendance recorded for today.</td></tr>';
    bindDynamicButtons(refs.todayTable);

    var upcoming = state.leaveRecords.filter(function (row) {
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
    refs.reportPreset.value = saved.preset || "month";
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
    } else if (preset === "fy") {
      var fyStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
      refs.reportFrom.value = toDateInput(new Date(fyStartYear, 3, 1));
      refs.reportTo.value = toDateInput(new Date(fyStartYear + 1, 2, 31));
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
    var from = refs.reportFrom.value || toDateInput(new Date());
    var to = refs.reportTo.value || from;
    var workerId = refs.reportWorker.value;
    if (to < from) {
      refs.reportTo.value = from;
      to = from;
    }
    var rows = state.attendance.filter(function (row) {
      return row.date >= from && row.date <= to && (!workerId || row.workerId === workerId);
    }).map(function (row) {
      var worker = getWorker(row.workerId) || {};
      var calc = calculateAttendance(row, worker);
      return Object.assign({}, row, { worker: worker, calculation: calc });
    });
    state.reportRows = rows;
    var totals = sumCalculated(rows);
    refs.reportDays.textContent = rows.filter(function (row) { return row.status === "present" || row.status === "half-day"; }).length;
    refs.reportNetHours.textContent = formatMinutes(totals.netMinutes);
    refs.reportOvertime.textContent = formatMinutes(totals.overtimeMinutes);
    refs.reportWages.textContent = formatMoney(totals.totalWage);
    renderWorkerWise(rows);
    renderCategoryWise(rows);
    renderLedger(rows);
    renderReportLeaves(from, to, workerId);
  }

  function renderWorkerWise(rows) {
    var grouped = groupBy(rows, function (row) { return row.workerId; });
    refs.workerReportRows.innerHTML = Object.keys(grouped).length ? Object.keys(grouped).map(function (id) {
      var list = grouped[id];
      var worker = list[0].worker || {};
      var totals = sumCalculated(list);
      return '<tr><td>' + escapeHtml(worker.name || "Unknown") + '</td><td>' + escapeHtml(worker.type || "-") + '</td><td>' + list.length + '</td><td>' + formatMinutes(totals.netMinutes) + '</td><td>' + formatMinutes(totals.overtimeMinutes) + '</td><td>' + formatMoney(totals.totalWage) + '</td></tr>';
    }).join("") : '<tr><td colspan="6">No records in selected range.</td></tr>';
  }

  function renderCategoryWise(rows) {
    var grouped = groupBy(rows, function (row) { return row.worker.type || "Unknown"; });
    refs.categoryReportRows.innerHTML = Object.keys(grouped).length ? Object.keys(grouped).map(function (category) {
      var list = grouped[category];
      var totals = sumCalculated(list);
      var workerCount = unique(list.map(function (row) { return row.workerId; })).length;
      return '<tr><td>' + escapeHtml(category) + '</td><td>' + workerCount + '</td><td>' + list.length + '</td><td>' + formatMinutes(totals.netMinutes) + '</td><td>' + formatMoney(totals.totalWage) + '</td></tr>';
    }).join("") : '<tr><td colspan="5">No records in selected range.</td></tr>';
  }

  function renderLedger(rows) {
    refs.ledgerRows.innerHTML = rows.length ? rows.sort(byDateDesc).map(function (row) {
      var calc = row.calculation;
      return '<tr><td>' + formatDateShort(row.date) + '</td><td>' + escapeHtml(row.day) + '</td><td>' + escapeHtml(row.worker.name || "Unknown") + '</td><td class="status-' + escapeAttr(row.status) + '">' + escapeHtml(labelStatus(row.status)) + '</td><td>' + (row.checkIn && row.checkOut ? escapeHtml(row.checkIn + " - " + row.checkOut) : "-") + '</td><td>' + formatMinutes(calc.breakMinutes) + '</td><td>' + formatMinutes(calc.netMinutes) + '</td><td>' + formatMinutes(calc.overtimeMinutes) + '</td><td>' + formatMoney(calc.totalWage) + '</td>' +
        '<td><button class="text-button" data-edit-attendance="' + row.id + '" type="button">Edit</button><button class="text-button danger-link" data-delete-attendance="' + row.id + '" type="button">Delete</button></td></tr>';
    }).join("") : '<tr><td colspan="10">No attendance ledger rows.</td></tr>';
    bindDynamicButtons(refs.ledgerRows);
  }

  function renderReportLeaves(from, to, workerId) {
    var rows = state.leaveRecords.filter(function (row) {
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
      version: 1,
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
            state.settings = Object.assign(loadSettings(), payload.settings || {});
            saveSettings();
            return Promise.all(payload.workers.map(function (row) { return put("workers", row); })
              .concat(payload.attendance.map(function (row) { return put("attendance", row); }))
              .concat(payload.leaveRecords.map(function (row) { return put("leaveRecords", row); })));
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
    return "\u20B9" + moneyRaw(value);
  }

  function moneyRaw(value) {
    return (Math.round((Number(value) || 0) * 100) / 100).toFixed(2);
  }

  function formatDateShort(value) {
    if (!value) return "-";
    if ((state.settings && state.settings.dateFormat || "ddmmyyyy") === "ddmmyyyy") {
      return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
    return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function formatDateLong(value) {
    return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  }

  function getDayName(value) {
    return new Date(value + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long" });
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
