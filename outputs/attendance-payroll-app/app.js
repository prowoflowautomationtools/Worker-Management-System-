(function () {
  "use strict";

  var DB_NAME = "workpay-india-db";
  var DB_VERSION = 2;
  var SETTINGS_KEY = "workpay.settings.v1";
  var REPORT_FILTER_KEY = "workpay.reportFilter.v1";
  var shared = window.WorkPayShared || {};
  var workerRecordRules = window.WorkPayWorkerRecords || {};
  var attendanceRecordRules = window.WorkPayAttendanceRecords || {};
  var breakRecordRules = window.WorkPayBreakRecords || {};
  var attendanceBreakRules = window.WorkPayAttendanceBreaks || {};
  var attendanceBreakController;
  var leaveRecordRules = window.WorkPayLeaveRecords || {};
  var leaveAttachmentRules = window.WorkPayLeaveAttachments || {};
  var settingsRules = window.WorkPaySettings || {};
  var masterDataRules = window.WorkPayMasterData || {};
  var DEFAULT_TYPES = settingsRules.DEFAULT_TYPES || ["Mason", "Helper", "Electrician", "Plumber", "Carpenter", "Painter", "Driver", "Security", "Housekeeping", "Other"];
  var DEFAULT_BREAK_TYPES = settingsRules.DEFAULT_BREAK_TYPES || ["Lunch", "Tea", "Rest", "Other"];
  var DEFAULT_CURRENCY = settingsRules.DEFAULT_CURRENCY || "INR";
  var createDefaultStatutoryConfig = settingsRules.createDefaultStatutoryConfig;
  var createDefaultWorkerStatutoryProfile = settingsRules.createDefaultWorkerStatutoryProfile;
  var getDefaultPublicHolidays = settingsRules.getDefaultPublicHolidays;
  var normalizeSettings = settingsRules.normalizeSettings;
  var buildSettingsUpdate = settingsRules.buildSettingsUpdate;
  var normalizeHolidayType = settingsRules.normalizeHolidayType;
  var parsePublicHolidayInput = settingsRules.parsePublicHolidayInput;
  var formatPublicHolidayLines = settingsRules.formatPublicHolidayLines;
  var makeId = shared.makeId;
  var numberValue = shared.numberValue;
  var timeToMinutes = shared.timeToMinutes;
  var formatMinutes = shared.formatMinutes;
  var formatHours = shared.formatHours;
  var moneyRaw = shared.moneyRaw;
  var toDateInput = shared.toDateInput;
  var startOfWeek = shared.startOfWeek;
  var endOfWeek = shared.endOfWeek;
  var byName = shared.byName;
  var byDateDesc = shared.byDateDesc;
  var byLeaveDateDesc = shared.byLeaveDateDesc;
  var unique = shared.unique;
  var labelStatus = shared.labelStatus;
  var isValidIndianPhone = shared.isValidIndianPhone;
  var formatBytes = shared.formatBytes;
  var escapeHtml = shared.escapeHtml;
  var escapeAttr = shared.escapeAttr;
  var setCookie = shared.setCookie;
  var getCookie = shared.getCookie;
  var toCsv = shared.toCsv;
  var ensureIndex = shared.ensureIndex;
  var normalizePhone = shared.normalizePhone;
  var debounce = shared.debounce;
  var payrollRules = window.WorkPayPayroll || {};
  var reportRules = window.WorkPayReports || {};
  var backupExportRules = window.WorkPayBackupExport || {};
  var recordRules = window.WorkPayRecords || {};
  var validationRules = window.WorkPayValidation || {};
  var duplicateRecordRules = window.WorkPayDuplicateRecords || {};
  var leaveHolidayRules = window.WorkPayLeaveHoliday || {};
  var storageRules = window.WorkPayStorage || {};
  var settingsStorage = window.WorkPaySettingsStorage || {};
  var sessionStorageRules = window.WorkPaySessionStorage || {};
  var storageService = storageRules.createStorageService({ dbName: DB_NAME, dbVersion: DB_VERSION, ensureIndex: ensureIndex });
  var applicationStorageRules = window.WorkPayApplicationStorage || {};
  var applicationStorageAdapter = applicationStorageRules.createApplicationStorageAdapter({ storageService: storageService });
  var dataRefreshRules = window.WorkPayDataRefresh || {};
  var dataRefreshService;
  var reportWorkerClientRules = window.WorkPayReportWorkerClient || {};
  var fileDownloadRules = window.WorkPayFileDownload || {};
  var backupImportRules = window.WorkPayBackupImport || {};
  var reportWorkerClient = reportWorkerClientRules.createReportWorkerClient ? reportWorkerClientRules.createReportWorkerClient({
    protocol: location.protocol,
    Worker: window.Worker,
    scriptUrl: "report-worker.js",
    logger: console
  }) : null;
  var deferredReportTimer = 0;
  var reportRenderToken = 0;
  var db;
  var state = {
    workers: [],
    attendance: [],
    leaveRecords: [],
    settings: loadSettings(),
    activeView: getCookie("workpayView") || sessionStorageRules.loadActiveView("workpay.activeView", "dashboard"),
    reportRows: []
  };

  var $ = function (id) {
    return document.getElementById(id);
  };

  var refs = {};
  var uiFeedback;
  var navigationController;
  var demoDataRules = window.WorkPayDemoData || {};
  var dynamicActionRules = window.WorkPayDynamicActions || {};
  var dynamicActionBinder;
  var workerScreenRules = window.WorkPayWorkerScreen || {};
  var workerScreenRenderer;
  var workerControllerRules = window.WorkPayWorkerController || {};
  var workerProfileController;
  var attendanceScreenRules = window.WorkPayAttendanceScreen || {};
  var attendanceScreenRenderer;
  var attendanceControllerRules = window.WorkPayAttendanceController || {};
  var attendanceFormController;
  var leaveScreenRules = window.WorkPayLeaveScreen || {};
  var leaveScreenRenderer;
  var leaveControllerRules = window.WorkPayLeaveController || {};
  var leaveFormController;
  var masterDataScreenRules = window.WorkPayMasterDataScreen || {};
  var masterDataScreenRenderer;
  var settingsControllerRules = window.WorkPaySettingsController || {};
  var settingsFormController;
  var masterDataControllerRules = window.WorkPayMasterDataController || {};
  var masterDataController;
  var reportScreenRules = window.WorkPayReportScreen || {};
  var reportScreenRenderer;
  var reportFilterRules = window.WorkPayReportFilters || {};
  var reportFilterController;
  var importExportRules = window.WorkPayImportExportController || {};
  var importExportController;
  var dashboardScreenRules = window.WorkPayDashboardScreen || {};
  var dashboardScreenRenderer;
  var eventBindingRules = window.WorkPayEventBindings || {};
  var eventBinder;
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheRefs();
    uiFeedback = window.WorkPayUiFeedback.createUiFeedback({ toast: refs.toast, document: document, window: window });
    navigationController = window.WorkPayNavigation.createNavigationController({
      document: document,
      setCookie: setCookie,
      sessionStorageRules: sessionStorageRules,
      getState: function () { return state; },
      viewTitle: refs.viewTitle,
      onReportsRequested: function (immediate) { queueReportsRender(immediate); }
    });
    dataRefreshService = dataRefreshRules.createDataRefreshService({
      storageService: storageService,
      normalizeWorkerRecord: normalizeWorkerRecord,
      normalizeAttendanceRecord: normalizeAttendanceRecord,
      normalizeLeaveRecord: normalizeLeaveRecord,
      byName: byName,
      byDateDesc: byDateDesc,
      byLeaveDateDesc: byLeaveDateDesc
    });
    dynamicActionBinder = dynamicActionRules.createDynamicActionBinder({
      editWorker: editWorker,
      deleteWorker: deleteWorker,
      editAttendance: editAttendance,
      deleteAttendance: deleteAttendance,
      editLeave: editLeave,
      deleteLeave: deleteLeave,
      editWorkerType: editWorkerType,
      deleteWorkerType: deleteWorkerType,
      editBreakType: editBreakType,
      deleteBreakType: deleteBreakType
    });
    workerScreenRenderer = workerScreenRules.createWorkerScreenRenderer({
      state: state,
      refs: refs,
      normalizeMasterData: normalizeMasterData,
      defaultTypes: DEFAULT_TYPES,
      unique: unique,
      escapeHtml: escapeHtml,
      formatHours: formatHours,
      formatMoney: formatMoney,
      toggleCustomType: toggleCustomType,
      bindDynamicButtons: bindDynamicButtons
    });
    workerProfileController = workerControllerRules.createWorkerProfileController({
      state: state,
      refs: refs,
      buildWorkerRecord: workerRecordRules.buildWorkerRecord,
      normalizePhone: normalizePhone,
      isValidIndianPhone: isValidIndianPhone,
      makeId: makeId,
      getExisting: getExisting,
      getWorker: getWorker,
      findDuplicateWorker: findDuplicateWorker,
      put: put,
      remove: remove,
      refreshAll: refreshAll,
      saveSettings: saveSettings,
      validateWorkerWageConfig: validateWorkerWageConfig,
      reportValidation: reportValidation,
      clearFormErrors: clearFormErrors,
      renderWorkerTypeOptions: renderWorkerTypeOptions,
      toggleCustomType: toggleCustomType,
      switchView: switchView,
      showToast: showToast,
      showError: showError,
      resetWorkerForm: function () { workerProfileController.resetWorkerForm(); },
      defaultTypes: DEFAULT_TYPES
    });
    attendanceBreakController = attendanceBreakRules.createAttendanceBreakController({
      state: state,
      refs: refs,
      escapeAttr: escapeAttr,
      renderBreakTypeOptions: renderBreakTypeOptions,
      updateAttendancePreview: updateAttendancePreview,
      buildBreakRecord: breakRecordRules.buildBreakRecord,
      hasBreakInput: breakRecordRules.hasBreakInput,
      getWorker: getWorker,
      calculateAttendance: calculateAttendance,
      numberValue: numberValue,
      toDateInput: toDateInput,
      formatMinutes: formatMinutes,
      formatMoney: formatMoney
    });
    attendanceScreenRenderer = attendanceScreenRules.createAttendanceScreenRenderer({
      state: state,
      refs: refs,
      normalizeMasterData: normalizeMasterData,
      defaultBreakTypes: DEFAULT_BREAK_TYPES,
      escapeHtml: escapeHtml,
      escapeAttr: escapeAttr,
      formatDateShort: formatDateShort,
      formatTime: formatTime,
      formatMinutes: formatMinutes,
      formatMoney: formatMoney,
      labelStatus: labelStatus,
      getWorker: getWorker,
      calculateAttendance: calculateAttendance,
      bindDynamicButtons: bindDynamicButtons
    });
    attendanceFormController = attendanceControllerRules.createAttendanceFormController({
      state: state,
      refs: refs,
      toDateInput: toDateInput,
      addBreakRow: addBreakRow,
      updateAttendanceDay: updateAttendanceDay,
      updateAttendancePreview: updateAttendancePreview,
      buildAttendanceFromForm: buildAttendanceFromForm,
      findDuplicateAttendance: findDuplicateAttendance,
      put: put,
      remove: remove,
      refreshAll: refreshAll,
      reportValidation: reportValidation,
      clearFormErrors: clearFormErrors,
      switchView: switchView,
      showToast: showToast,
      showError: showError
    });
    leaveScreenRenderer = leaveScreenRules.createLeaveScreenRenderer({
      state: state,
      refs: refs,
      getAllLeaveSources: getAllLeaveSources,
      getWorker: getWorker,
      labelStatus: labelStatus,
      formatDateShort: formatDateShort,
      escapeHtml: escapeHtml,
      escapeAttr: escapeAttr,
      bindDynamicButtons: bindDynamicButtons
    });
    leaveFormController = leaveControllerRules.createLeaveFormController({
      state: state,
      refs: refs,
      makeId: makeId,
      toDateInput: toDateInput,
      getExisting: getExisting,
      readAttachment: readAttachment,
      buildLeaveRecord: leaveRecordRules.buildLeaveRecord,
      put: put,
      remove: remove,
      refreshAll: refreshAll,
      reportValidation: reportValidation,
      clearFormErrors: clearFormErrors,
      formatBytes: formatBytes,
      switchView: switchView,
      showToast: showToast,
      showError: showError
    });
    masterDataScreenRenderer = masterDataScreenRules.createMasterDataScreenRenderer({
      state: state,
      refs: refs,
      normalizeMasterData: normalizeMasterData,
      escapeHtml: escapeHtml,
      escapeAttr: escapeAttr,
      bindDynamicButtons: bindDynamicButtons
    });
    reportScreenRenderer = reportScreenRules.createReportScreenRenderer({
      state: state,
      refs: refs,
      buildReportDataset: buildReportDataset,
      getAllLeaveSources: getAllLeaveSources,
      renderLeaveCard: renderLeaveCard,
      formatDateShort: formatDateShort,
      formatTime: formatTime,
      formatMinutes: formatMinutes,
      formatMoney: formatMoney,
      escapeHtml: escapeHtml,
      escapeAttr: escapeAttr,
      labelStatus: labelStatus,
      byDateDesc: byDateDesc,
      setFieldError: setFieldError,
      clearFieldError: clearFieldError,
      bindDynamicButtons: bindDynamicButtons,
      nextRenderToken: function () { return ++reportRenderToken; },
      isCurrentRenderToken: function (token) { return token === reportRenderToken; },
      toDateInput: toDateInput,
      showError: showError
    });
    reportFilterController = reportFilterRules.createReportFilterController({
      refs: refs,
      storageKey: REPORT_FILTER_KEY,
      sessionStorageRules: sessionStorageRules,
      getPresetDateRange: reportRules.getPresetDateRange,
      getYearMode: function () { return state.settings.yearMode; }
    });
    importExportController = importExportRules.createImportExportController({
      state: state,
      refs: refs,
      dbVersion: DB_VERSION,
      buildReportCsvRows: backupExportRules.buildReportCsvRows,
      buildBackupPayload: backupExportRules.buildBackupPayload,
      readJsonBackup: function (file) { return backupImportRules.readJsonBackup(file, FileReader); },
      downloadFile: downloadFile,
      toCsv: toCsv,
      labelStatus: labelStatus,
      moneyRaw: moneyRaw,
      clearStore: clearStore,
      normalizeSettings: normalizeSettings,
      loadSettings: loadSettings,
      saveSettings: saveSettings,
      put: put,
      normalizeWorkerRecord: normalizeWorkerRecord,
      normalizeAttendanceRecord: normalizeAttendanceRecord,
      normalizeLeaveRecord: normalizeLeaveRecord,
      refreshAll: refreshAll,
      restoreSettingsForm: restoreSettingsForm,
      applyTheme: applyTheme,
      showToast: showToast,
      showError: showError
    });
    dashboardScreenRenderer = dashboardScreenRules.createDashboardScreenRenderer({
      state: state,
      refs: refs,
      toDateInput: toDateInput,
      sumAttendance: sumAttendance,
      getWorker: getWorker,
      getAllLeaveSources: getAllLeaveSources,
      calculateAttendance: calculateAttendance,
      formatMinutes: formatMinutes,
      formatMoney: formatMoney,
      formatTime: formatTime,
      escapeHtml: escapeHtml,
      renderLeaveCard: renderLeaveCard,
      bindDynamicButtons: bindDynamicButtons
    });
    settingsFormController = settingsControllerRules.createSettingsFormController({
      state: state,
      refs: refs,
      defaultCurrency: DEFAULT_CURRENCY,
      formatPublicHolidayLines: formatPublicHolidayLines,
      syncReportPresetOption: syncReportPresetOption,
      clearFormErrors: clearFormErrors,
      clearFieldError: clearFieldError,
      numberValue: numberValue,
      reportValidation: reportValidation,
      parsePublicHolidayInput: parsePublicHolidayInput,
      setFieldError: setFieldError,
      showToast: showToast,
      buildSettingsUpdate: buildSettingsUpdate,
      normalizeMasterData: normalizeMasterData,
      saveSettings: saveSettings,
      applyTheme: applyTheme,
      setupStaticDates: setupStaticDates,
      applyReportPreset: applyReportPreset,
      renderAll: renderAll
    });
    masterDataController = masterDataControllerRules.createMasterDataController({
      state: state,
      refs: refs,
      normalizeMasterData: normalizeMasterData,
      includesIgnoreCase: masterDataRules.includesIgnoreCase,
      saveSettings: saveSettings,
      renderAll: renderAll,
      put: put,
      refreshAll: refreshAll,
      calculateAttendance: calculateAttendance,
      getWorker: getWorker,
      showToast: showToast,
      showError: showError
    });
    eventBinder = eventBindingRules.createEventBinder({
      document: document,
      refs: refs,
      debounce: debounce,
      callbacks: {
        switchView: switchView,
        saveWorker: saveWorker,
        resetWorkerForm: resetWorkerForm,
        toggleCustomType: toggleCustomType,
        renderWorkers: renderWorkers,
        seedDemoData: seedDemoData,
        saveAttendance: saveAttendance,
        resetAttendanceForm: resetAttendanceForm,
        addBreakRow: addBreakRow,
        updateAttendancePreview: updateAttendancePreview,
        updateAttendanceDay: updateAttendanceDay,
        renderAttendanceHistory: renderAttendanceHistory,
        saveLeaveRecord: saveLeaveRecord,
        resetLeaveForm: resetLeaveForm,
        renderLeaveRecords: renderLeaveRecords,
        formatBytes: formatBytes,
        markAttachmentForRemoval: markAttachmentForRemoval,
        applyReportPreset: applyReportPreset,
        saveReportFilter: saveReportFilter,
        renderReports: renderReports,
        exportCsv: exportCsv,
        saveSettingsForm: saveSettingsForm,
        addWorkerType: addWorkerType,
        addBreakType: addBreakType,
        resetAllData: resetAllData,
        exportJson: exportJson,
        importJson: importJson,
        bindValidationListeners: bindValidationListeners,
        clearFieldError: clearFieldError
      }
    });
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
    return eventBinder.bindEvents();
  }

  function openDb() {
    return applicationStorageAdapter.openDb();
  }

  function getAll(storeName) {
    return applicationStorageAdapter.getAll(storeName);
  }

  function put(storeName, value) {
    return applicationStorageAdapter.put(storeName, value);
  }

  function remove(storeName, id) {
    return applicationStorageAdapter.remove(storeName, id);
  }

  function clearStore(storeName) {
    return applicationStorageAdapter.clearStore(storeName);
  }

  function refreshAll() {
    return dataRefreshService.refresh(state, renderAll);
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
    return navigationController.switchView(view);
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
    return settingsStorage.loadSettings(SETTINGS_KEY, fallback, normalizeSettings);
  }

  function saveSettings() {
    settingsStorage.saveSettings(SETTINGS_KEY, state.settings);
  }

  function restoreSettingsForm() {
    return settingsFormController.restoreSettingsForm();
  }

  function saveSettingsForm() {
    return settingsFormController.saveSettingsForm();
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.settings.theme || "light";
  }

  function normalizeMasterData() {
    if (!Array.isArray(state.settings.workerTypes)) state.settings.workerTypes = DEFAULT_TYPES.slice();
    if (!Array.isArray(state.settings.breakTypes)) state.settings.breakTypes = DEFAULT_BREAK_TYPES.slice();
    state.settings.workerTypes = masterDataRules.normalizeList(state.settings.workerTypes, DEFAULT_TYPES);
    state.settings.breakTypes = masterDataRules.normalizeList(state.settings.breakTypes, DEFAULT_BREAK_TYPES);
  }

  function renderWorkerTypeOptions(selected) {
    return workerScreenRenderer.renderWorkerTypeOptions(selected);
  }

  function renderBreakTypeOptions(selected) {
    return attendanceScreenRenderer.renderBreakTypeOptions(selected);
  }

  function renderMasterDataLists() {
    return masterDataScreenRenderer.renderMasterDataLists();
  }

  function addWorkerType() {
    return masterDataController.addWorkerType();
  }

  function editWorkerType(type) {
    return masterDataController.editWorkerType(type);
  }

  function deleteWorkerType(type) {
    return masterDataController.deleteWorkerType(type);
  }

  function addBreakType() {
    return masterDataController.addBreakType();
  }

  function editBreakType(type) {
    return masterDataController.editBreakType(type);
  }

  function deleteBreakType(type) {
    return masterDataController.deleteBreakType(type);
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
    return workerProfileController.saveWorker(event);
  }

  function editWorker(id) {
    return workerProfileController.editWorker(id);
  }

  function deleteWorker(id) {
    return workerProfileController.deleteWorker(id);
  }

  function resetWorkerForm() {
    return workerProfileController.resetWorkerForm();
  }

  function renderWorkers() {
    return workerScreenRenderer.renderWorkers();
  }

  function resetAttendanceForm() {
    return attendanceFormController.resetAttendanceForm();
  }

  function addBreakRow(data) {
    return attendanceBreakController.addBreakRow(data);
  }

  function collectBreaks() {
    return attendanceBreakController.collectBreaks();
  }

  function saveAttendance(event) {
    return attendanceFormController.saveAttendance(event);
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
    var record = attendanceRecordRules.buildAttendanceRecord({
      id: id,
      workerId: worker.id,
      date: date,
      status: status,
      checkIn: checkIn,
      checkOut: checkOut,
      breaks: breaks,
      taskUnits: refs.taskUnits.value,
      taskRateOverride: refs.taskRateOverride.value,
      notes: refs.attendanceNotes.value,
      existing: getExisting("attendance", id)
    });
    record.calculation = calculateAttendance(record, worker);
    return record;
  }

  function editAttendance(id) {
    return attendanceFormController.editAttendance(id);
  }

  function deleteAttendance(id) {
    return attendanceFormController.deleteAttendance(id);
  }

  function updateAttendanceDay() {
    refs.attendanceDay.value = refs.attendanceDate.value ? getDayName(refs.attendanceDate.value) : "";
  }

  function updateAttendancePreview() {
    return attendanceBreakController.updateAttendancePreview();
  }

  function validateTimes(checkIn, checkOut, breaks, needsTime) {
    var result = payrollRules.validateTimes(checkIn, checkOut, breaks, needsTime);
    if (!result.ok) result.field = result.fieldKey === "checkOut" ? refs.checkOut : refs.breakRows;
    return result;
  }

  function calculateAttendance(record, worker) {
    return payrollRules.calculateAttendance(record, worker, state.settings);
  }

  function renderAttendanceHistory() {
    return attendanceScreenRenderer.renderAttendanceHistory();
  }

  function saveLeaveRecord(event) {
    return leaveFormController.saveLeaveRecord(event);
  }

  function readAttachment(file) {
    return leaveAttachmentRules.readAttachment(file, FileReader);
  }

  function resetLeaveForm() {
    return leaveFormController.resetLeaveForm();
  }

  function markAttachmentForRemoval() {
    refs.leaveAttachment.value = "";
    refs.removeAttachmentBtn.dataset.remove = "true";
    refs.removeAttachmentBtn.classList.add("hidden");
    refs.attachmentInfo.textContent = "Attachment marked for removal. Save the record to apply.";
  }

  function editLeave(id) {
    return leaveFormController.editLeave(id);
  }

  function deleteLeave(id) {
    return leaveFormController.deleteLeave(id);
  }

  function renderLeaveRecords() {
    return leaveScreenRenderer.renderLeaveRecords();
  }

  function renderLeaveCard(row) {
    return leaveScreenRenderer.renderLeaveCard(row);
  }

  function renderDashboard() {
    return dashboardScreenRenderer.renderDashboard();
  }

  function restoreReportFilter() {
    return reportFilterController.restoreReportFilter();
  }

  function applyReportPreset(savedFrom, savedTo) {
    return reportFilterController.applyReportPreset(savedFrom, savedTo);
  }

  function saveReportFilter() {
    return reportFilterController.saveReportFilter();
  }

  function renderReports() {
    return reportScreenRenderer.renderReports();
  }

  function renderWorkerWise(summary) {
    return reportScreenRenderer.renderWorkerWise ? reportScreenRenderer.renderWorkerWise(summary) : undefined;
  }

  function renderCategoryWise(summary) {
    return reportScreenRenderer.renderCategoryWise ? reportScreenRenderer.renderCategoryWise(summary) : undefined;
  }

  function renderLedger(rows) {
    return reportScreenRenderer.renderLedger ? reportScreenRenderer.renderLedger(rows) : undefined;
  }

  function renderReportLeaves(from, to, workerId) {
    return reportScreenRenderer.renderReportLeaves(from, to, workerId);
  }

  function exportCsv() {
    return importExportController.exportCsv();
  }

  function exportJson() {
    return importExportController.exportJson();
  }

  function importJson() {
    return importExportController.importJson();
  }

  function resetAllData() {
    if (!confirm("Delete all local WorkPay records, attachments, settings, and saved filters from this browser?")) return;
    Promise.all([clearStore("workers"), clearStore("attendance"), clearStore("leaveRecords")]).then(function () {
      localStorage.removeItem(SETTINGS_KEY);
      sessionStorageRules.remove(REPORT_FILTER_KEY);
      sessionStorageRules.remove("workpay.activeView");
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
    var demoData = demoDataRules.buildDemoData({
      makeId: makeId,
      calculateAttendance: calculateAttendance,
      getDayName: getDayName,
      today: today,
      yesterday: yesterday
    });
    Promise.all(demoData.workers.map(function (worker) { return put("workers", worker); })
      .concat(demoData.attendance.map(function (row) { return put("attendance", row); }))
      .concat(demoData.leaveRecords.map(function (row) { return put("leaveRecords", row); })))
      .then(refreshAll)
      .then(function () {
        showToast("Demo data loaded.");
      }).catch(showError);
  }

  function bindDynamicButtons(root) {
    return dynamicActionBinder.bind(root);
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
    return reportRules.sumCalculated(rows);
  }

  function formatMoney(value) {
    return shared.formatMoney(value, state.settings.currencyCode || DEFAULT_CURRENCY);
  }

  function formatDateShort(value) {
    return shared.formatDateShort(value, state.settings && state.settings.dateFormat || "ddmmyyyy");
  }

  function formatDateLong(value) {
    return shared.formatDateLong(value);
  }

  function formatTime(value) {
    return shared.formatTime(value, state.settings.timeFormat || "24h");
  }

  function getDayName(value) {
    return shared.getDayName(value);
  }

  function showToast(message) {
    return uiFeedback.showToast(message);
  }

  function showError(error) {
    return uiFeedback.showError(error);
  }

  function downloadFile(filename, content, type) {
    return fileDownloadRules.downloadFile(filename, content, type);
  }

  function normalizeWorkerRecord(worker) {
    return recordRules.normalizeWorkerRecord(worker);
  }

  function normalizeAttendanceRecord(row) {
    return recordRules.normalizeAttendanceRecord(row);
  }

  function normalizeLeaveRecord(row) {
    return recordRules.normalizeLeaveRecord(row);
  }

  function validateWorkerWageConfig(worker) {
    var result = validationRules.validateWorkerWageConfig(worker);
    if (!result.ok) result.field = refs[result.fieldKey] || refs.standardHours;
    return result;
  }

  function bindValidationListeners(form) {
    return uiFeedback.bindValidationListeners(form);
  }

  function reportValidation(field, message) {
    return uiFeedback.reportValidation(field, message);
  }

  function setFieldError(field, message) {
    return uiFeedback.setFieldError(field, message);
  }

  function clearFieldError(field) {
    return uiFeedback.clearFieldError(field);
  }

  function clearFormErrors(form) {
    return uiFeedback.clearFormErrors(form);
  }

  function getCurrentYearRange(today, yearMode) {
    return reportRules.getCurrentYearRange(today, yearMode);
  }

  function syncReportPresetOption() {
    var option = refs.reportPreset.querySelector('option[value="year"]') || refs.reportPreset.querySelector('option[value="fy"]');
    if (!option) return;
    option.value = "year";
    option.textContent = state.settings.yearMode === "calendar" ? "Current calendar year" : "Current financial year";
  }

  function getAllLeaveSources() {
    return leaveHolidayRules.getAllLeaveSources(state.leaveRecords, state.settings.publicHolidays);
  }

  function getConfiguredHolidayRecords() {
    return leaveHolidayRules.getConfiguredHolidayRecords(state.settings.publicHolidays);
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
    var payload = {
        type: "build-report",
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
      };
    return reportWorkerClient ? reportWorkerClient.build(payload, function () {
      return buildReportDatasetSync(from, to, workerId);
    }) : Promise.resolve(buildReportDatasetSync(from, to, workerId));
  }

  function buildReportDatasetSync(from, to, workerId) {
    return reportRules.buildReportDataset(state.attendance, state.workers, state.settings, from, to, workerId);
  }

  function findDuplicateAttendance(record) {
    if (!db || !record) return Promise.resolve(duplicateRecordRules.findDuplicateAttendance(state.attendance, record));
    return getByIndex("attendance", "workerDate", [record.workerId, record.date]).then(function (matches) {
      matches = matches.filter(function (row) { return row.id !== record.id; });
      return matches[0] || duplicateRecordRules.findDuplicateAttendance(state.attendance, record);
    });
  }

  function findDuplicateWorker(worker) {
    var fallback = duplicateRecordRules.findDuplicateWorker(state.workers, worker);
    if (!db || !worker || !worker.phoneDigits) return Promise.resolve(fallback);
    return getByIndex("workers", "phoneDigits", worker.phoneDigits).then(function (matches) {
      matches = matches.filter(function (row) { return row.id !== worker.id; });
      return matches[0] || fallback;
    });
  }

  function getByIndex(storeName, indexName, query) {
    return storageService.getByIndex(storeName, indexName, query);
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
