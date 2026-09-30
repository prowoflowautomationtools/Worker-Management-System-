"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..", "..");
const appDirectory = path.join(root, "outputs", "attendance-payroll-app");
const runtimeFiles = [
  "app/00-start-here-app-overview/shared-utilities.js",
  "app/00-start-here-app-overview/ui-feedback.js",
  "app/00-start-here-app-overview/navigation-controller.js",
  "app/00-start-here-app-overview/demo-data-rules.js",
  "app/00-start-here-app-overview/dynamic-action-binding.js",
  "app/00-start-here-app-overview/dashboard-screen-renderer.js",
  "app/00-start-here-app-overview/event-bindings.js",
  "app/01-worker-records-and-onboarding/worker-record-rules.js",
  "app/01-worker-records-and-onboarding/worker-screen-renderer.js",
  "app/01-worker-records-and-onboarding/worker-profile-controller.js",
  "app/02-daily-attendance-register/attendance-record-rules.js",
  "app/02-daily-attendance-register/attendance-screen-renderer.js",
  "app/02-daily-attendance-register/attendance-form-controller.js",
  "app/03-work-breaks-register/break-record-rules.js",
  "app/03-work-breaks-register/attendance-break-controller.js",
  "app/04-leave-and-holiday-register/leave-record-rules.js",
  "app/04-leave-and-holiday-register/attachment-file-reader.js",
  "app/04-leave-and-holiday-register/leave-holiday-rules.js",
  "app/04-leave-and-holiday-register/leave-screen-renderer.js",
  "app/04-leave-and-holiday-register/leave-form-controller.js",
  "app/05-wage-and-payroll-calculation/payroll-calculation-rules.js",
  "app/06-reports-reviews-and-exports/report-aggregation-rules.js",
  "app/06-reports-reviews-and-exports/backup-export-rules.js",
  "app/06-reports-reviews-and-exports/report-screen-renderer.js",
  "app/06-reports-reviews-and-exports/report-filter-controller.js",
  "app/06-reports-reviews-and-exports/import-export-controller.js",
  "app/06-reports-reviews-and-exports/report-worker-client.js",
  "app/06-reports-reviews-and-exports/file-download-service.js",
  "app/06-reports-reviews-and-exports/backup-import-service.js",
  "app/07-settings-master-data-and-policies/settings-master-data-rules.js",
  "app/07-settings-master-data-and-policies/master-data-rules.js",
  "app/07-settings-master-data-and-policies/master-data-screen-renderer.js",
  "app/07-settings-master-data-and-policies/settings-form-controller.js",
  "app/07-settings-master-data-and-policies/master-data-controller.js",
  "app/08-local-data-storage-and-backup/settings-storage.js",
  "app/08-local-data-storage-and-backup/session-state-storage.js",
  "app/08-local-data-storage-and-backup/local-database.js",
  "app/08-local-data-storage-and-backup/record-normalization-rules.js",
  "app/08-local-data-storage-and-backup/data-refresh-service.js",
  "app/08-local-data-storage-and-backup/application-storage-adapter.js",
  "app/11-security-validation-and-quality-checks/validation-rules.js",
  "app/11-security-validation-and-quality-checks/duplicate-record-rules.js",
  "app.js",
  "report-worker.js",
  "pwa.js",
  "service-worker.js"
];
const deploymentAssets = [
  "index.html",
  ...runtimeFiles.filter((relativePath) => relativePath !== "service-worker.js"),
  "styles.css",
  "manifest.webmanifest",
  "icon.svg"
];

function readAppFile(relativePath) {
  return fs.readFileSync(path.join(appDirectory, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createBrowserContext() {
  const sessionValues = {};
  const context = {
    console,
    document: {
      cookie: "",
      addEventListener() {},
      getElementById() { return null; },
      querySelector() { return { textContent: "" }; },
      documentElement: { dataset: {} }
    },
    localStorage: { getItem() { return null; }, setItem() {} },
    sessionStorage: {
      getItem(key) { return Object.prototype.hasOwnProperty.call(sessionValues, key) ? sessionValues[key] : null; },
      setItem(key, value) { sessionValues[key] = String(value); },
      removeItem(key) { delete sessionValues[key]; }
    },
    crypto: { randomUUID() { return "test-id"; } },
    indexedDB: {},
    Intl,
    Date,
    Number,
    String,
    Math,
    Array,
    Object,
    JSON,
    RegExp,
    Set,
    URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} },
    Blob: function Blob() {},
    setTimeout() { return 1; },
    clearTimeout() {},
    location: { protocol: "file:" }
  };
  context.window = context;
  return context;
}

function verifyScriptOrder(indexHtml) {
  let previousIndex = -1;
  runtimeFiles.slice(0, 43).forEach((relativePath) => {
    const scriptTag = '<script src="' + relativePath + '"></script>';
    const index = indexHtml.indexOf(scriptTag);
    assert(index >= 0, "Missing script tag: " + relativePath);
    assert(index > previousIndex, "Incorrect script order: " + relativePath);
    previousIndex = index;
  });
  assert(indexHtml.includes('<script src="app.js"></script>'), "Missing app shell script tag.");
  assert(indexHtml.includes('pwaScript.src = "pwa.js"'), "Missing conditional PWA script reference.");
  assert(indexHtml.includes('<link rel="icon" href="icon.svg" type="image/svg+xml">'), "Missing favicon reference.");
}

function verifyDeploymentAssets() {
  deploymentAssets.forEach((relativePath) => {
    assert(fs.existsSync(path.join(appDirectory, relativePath)), "Missing deployable asset: " + relativePath);
  });
}

function verifyRuntimeSyntax() {
  runtimeFiles.forEach((relativePath) => {
    new Function(readAppFile(relativePath));
  });
}

function verifyBrowserBootstrap() {
  const context = createBrowserContext();
  vm.createContext(context);
  runtimeFiles.slice(0, 43).forEach((relativePath) => {
    vm.runInContext(readAppFile(relativePath), context, { filename: relativePath });
  });

  assert(context.WorkPayShared, "Shared utilities did not load.");
  assert(context.WorkPayUiFeedback && typeof context.WorkPayUiFeedback.createUiFeedback === "function", "UI feedback module did not load.");
  assert(typeof context.WorkPayUiFeedback.createUiFeedback === "function", "UI feedback factory changed.");
  assert(context.WorkPayNavigation && typeof context.WorkPayNavigation.createNavigationController === "function", "Navigation controller did not load.");
  assert(context.WorkPayDemoData && typeof context.WorkPayDemoData.buildDemoData === "function", "Demo data rules did not load.");
  assert(context.WorkPayDynamicActions && typeof context.WorkPayDynamicActions.createDynamicActionBinder === "function", "Dynamic action binder did not load.");
  assert(context.WorkPayWorkerRecords && typeof context.WorkPayWorkerRecords.buildWorkerRecord === "function", "Worker record rules did not load.");
  assert(context.WorkPayWorkerScreen && typeof context.WorkPayWorkerScreen.createWorkerScreenRenderer === "function", "Worker screen renderer did not load.");
  assert(context.WorkPayWorkerController && typeof context.WorkPayWorkerController.createWorkerProfileController === "function", "Worker profile controller did not load.");
  assert(context.WorkPayAttendanceRecords && typeof context.WorkPayAttendanceRecords.buildAttendanceRecord === "function", "Attendance record rules did not load.");
  assert(context.WorkPayAttendanceScreen && typeof context.WorkPayAttendanceScreen.createAttendanceScreenRenderer === "function", "Attendance screen renderer did not load.");
  assert(context.WorkPayAttendanceController && typeof context.WorkPayAttendanceController.createAttendanceFormController === "function", "Attendance form controller did not load.");
  assert(context.WorkPayBreakRecords && typeof context.WorkPayBreakRecords.buildBreakRecord === "function", "Break record rules did not load.");
  assert(context.WorkPayLeaveRecords && typeof context.WorkPayLeaveRecords.buildLeaveRecord === "function", "Leave record rules did not load.");
  assert(context.WorkPayLeaveScreen && typeof context.WorkPayLeaveScreen.createLeaveScreenRenderer === "function", "Leave screen renderer did not load.");
  assert(context.WorkPayLeaveController && typeof context.WorkPayLeaveController.createLeaveFormController === "function", "Leave form controller did not load.");
  assert(context.WorkPayLeaveAttachments && typeof context.WorkPayLeaveAttachments.readAttachment === "function", "Leave attachment reader did not load.");
  assert(context.WorkPaySettings && typeof context.WorkPaySettings.buildSettingsUpdate === "function", "Settings update rules did not load.");
  assert(context.WorkPayMasterData && typeof context.WorkPayMasterData.normalizeList === "function", "Master data rules did not load.");
  assert(context.WorkPayMasterDataScreen && typeof context.WorkPayMasterDataScreen.createMasterDataScreenRenderer === "function", "Master data screen renderer did not load.");
  assert(context.WorkPayReportScreen && typeof context.WorkPayReportScreen.createReportScreenRenderer === "function", "Report screen renderer did not load.");
  assert(context.WorkPayDashboardScreen && typeof context.WorkPayDashboardScreen.createDashboardScreenRenderer === "function", "Dashboard screen renderer did not load.");
  assert(context.WorkPayEventBindings && typeof context.WorkPayEventBindings.createEventBinder === "function", "Event binding module did not load.");
  assert(context.WorkPayAttendanceBreaks && typeof context.WorkPayAttendanceBreaks.createAttendanceBreakController === "function", "Attendance break controller did not load.");
  assert(context.WorkPaySettingsController && typeof context.WorkPaySettingsController.createSettingsFormController === "function", "Settings form controller did not load.");
  assert(context.WorkPayMasterDataController && typeof context.WorkPayMasterDataController.createMasterDataController === "function", "Master-data controller did not load.");
  assert(context.WorkPayReportFilters && typeof context.WorkPayReportFilters.createReportFilterController === "function", "Report filter controller did not load.");
  assert(context.WorkPayImportExportController && typeof context.WorkPayImportExportController.createImportExportController === "function", "Import/export controller did not load.");
  assert(context.WorkPayApplicationStorage && typeof context.WorkPayApplicationStorage.createApplicationStorageAdapter === "function", "Application storage adapter did not load.");
  assert(context.WorkPayDataRefresh && typeof context.WorkPayDataRefresh.createDataRefreshService === "function", "Data refresh service did not load.");
  const normalizedMasterData = context.WorkPayMasterData.normalizeList(["Tea", "Lunch"], ["Default"]);
  assert(normalizedMasterData.join(",") === "Lunch,Tea,Other" && context.WorkPayMasterData.includesIgnoreCase(normalizedMasterData, "tea"), "Master data normalization changed.");
  assert(context.WorkPaySettingsStorage && typeof context.WorkPaySettingsStorage.loadSettings === "function", "Settings storage did not load.");
  assert(context.WorkPaySessionStorage && typeof context.WorkPaySessionStorage.loadJson === "function", "Session storage did not load.");
  assert(context.WorkPayReportWorkerClient && typeof context.WorkPayReportWorkerClient.createReportWorkerClient === "function", "Report worker client did not load.");
  assert(context.WorkPayFileDownload && typeof context.WorkPayFileDownload.downloadFile === "function", "File download service did not load.");
  assert(context.WorkPayBackupImport && typeof context.WorkPayBackupImport.readJsonBackup === "function", "Backup import service did not load.");
  assert(typeof context.WorkPayFileDownload.createFileDownloadService === "function", "File download factory did not load.");
  let clickedDownload = false;
  let revokedDownload = false;
  const fakeDownloadService = context.WorkPayFileDownload.createFileDownloadService({
    document: {
      body: { appendChild() {} },
      createElement() {
        return { click() { clickedDownload = true; }, remove() {} };
      }
    },
    Blob: function FakeBlob() {},
    URL: { createObjectURL() { return "blob:test-download"; }, revokeObjectURL() { revokedDownload = true; } }
  });
  fakeDownloadService.downloadFile("test.json", "{}", "application/json");
  assert(clickedDownload && revokedDownload, "File download service behavior changed.");
  assert(context.WorkPayDuplicateRecords && typeof context.WorkPayDuplicateRecords.findDuplicateWorker === "function", "Duplicate record rules did not load.");
  context.WorkPaySessionStorage.saveJson("test.filters", { preset: "month", workerId: "worker-test" });
  const savedFilters = context.WorkPaySessionStorage.loadJson("test.filters", {});
  assert(savedFilters.preset === "month" && savedFilters.workerId === "worker-test", "Session JSON persistence changed.");
  context.WorkPaySessionStorage.saveActiveView("test.view", "reports");
  assert(context.WorkPaySessionStorage.loadActiveView("test.view", "dashboard") === "reports", "Active view persistence changed.");
  context.WorkPaySessionStorage.remove("test.filters");
  assert(context.WorkPaySessionStorage.loadJson("test.filters", {}) .preset === undefined, "Session state removal changed.");
  assert(context.WorkPayStorage && typeof context.WorkPayStorage.createStorageService === "function", "Storage service did not load.");
  assert(typeof context.WorkPayShared.debounce === "function", "Shared debounce helper did not load.");
  assert(context.WorkPayPayroll, "Payroll rules did not load.");
  assert(context.WorkPayBackupExport, "Backup and export rules did not load.");
  assert(context.WorkPayShared.formatMoney(1250.5, "INR").includes("1,250.50"), "Indian currency formatting changed.");
  const updatedSettings = context.WorkPaySettings.buildSettingsUpdate({}, { businessName: "  Site Office  ", currencyCode: "USD", defaultHours: 7.5, timeFormat: "12h", yearMode: "calendar", publicHolidays: [] });
  assert(updatedSettings.businessName === "Site Office" && updatedSettings.currencyCode === "USD" && updatedSettings.defaultHours === 7.5 && updatedSettings.timeFormat === "12h" && updatedSettings.yearMode === "calendar", "Settings update mapping changed.");

  const calculation = context.WorkPayPayroll.calculateAttendance({
    status: "present",
    checkIn: "09:00",
    checkOut: "18:00",
    breaks: [{ startTime: "13:00", endTime: "13:30" }],
    taskUnits: 0
  }, {
    wageType: "hourly",
    standardHours: 8,
    hourlyRate: 100,
    overtimeRate: 150,
    allowance: 0
  }, {});
  assert(calculation.netMinutes === 510, "Net attendance minutes calculation changed.");
  assert(calculation.overtimeMinutes === 30, "Overtime calculation changed.");
  assert(calculation.totalWage === 875, "Hourly wage calculation changed.");

  const invalidCheckout = context.WorkPayPayroll.validateTimes("09:00", "09:00", [], true);
  assert(!invalidCheckout.ok && invalidCheckout.fieldKey === "checkOut", "Invalid check-out validation changed.");
  const overlappingBreaks = context.WorkPayPayroll.validateTimes("09:00", "18:00", [
    { startTime: "12:30", endTime: "13:30", type: "Lunch", note: "" },
    { startTime: "13:00", endTime: "13:15", type: "Tea", note: "" }
  ], true);
  assert(!overlappingBreaks.ok && overlappingBreaks.message === "Break times cannot overlap.", "Overlapping break validation changed.");
  const invalidOtherBreak = context.WorkPayPayroll.validateTimes("09:00", "18:00", [
    { startTime: "12:30", endTime: "13:00", type: "Other", note: "" }
  ], true);
  assert(!invalidOtherBreak.ok, "Other break note validation changed.");

  const normalizedWorker = context.WorkPayRecords.normalizeWorkerRecord({
    name: "  Test Worker  ",
    phone: "+91 98765 43210",
    type: ""
  });
  assert(normalizedWorker.name === "Test Worker" && normalizedWorker.phone === "919876543210", "Worker normalization changed.");
  assert(normalizedWorker.type === "Other" && normalizedWorker.whatsapp === "919876543210", "Worker default values changed.");
  const builtWorker = context.WorkPayWorkerRecords.buildWorkerRecord({
    id: "worker-test",
    name: "  Built Worker  ",
    phone: "9876543210",
    whatsapp: "",
    type: "Helper",
    wageType: "hourly",
    standardHours: "8",
    hourlyRate: "100",
    defaultHours: 8,
    existing: {},
    now: "2026-07-27T00:00:00.000Z"
  });
  assert(builtWorker.id === "worker-test" && builtWorker.name === "Built Worker" && builtWorker.hourlyRate === 100, "Worker record builder changed.");
  const builtAttendance = context.WorkPayAttendanceRecords.buildAttendanceRecord({
    id: "attendance-test",
    workerId: "worker-test",
    date: "2026-07-27",
    status: "present",
    checkIn: "09:00",
    checkOut: "17:00",
    breaks: [{ startTime: "13:00", endTime: "13:30", type: "Lunch", note: "" }],
    taskUnits: "4",
    taskRateOverride: "",
    notes: "  Site A  ",
    existing: {},
    now: "2026-07-27T00:00:00.000Z"
  });
  assert(builtAttendance.id === "attendance-test" && builtAttendance.day === "Monday" && builtAttendance.taskUnits === 4, "Attendance record builder changed.");
  assert(builtAttendance.taskRateOverride === null && builtAttendance.notes === "Site A", "Attendance defaults changed.");
  const builtBreak = context.WorkPayBreakRecords.buildBreakRecord({ startTime: "13:00", endTime: "13:30", type: "Other", note: "  Site call  " });
  assert(builtBreak.type === "Other" && builtBreak.note === "Site call" && context.WorkPayBreakRecords.hasBreakInput(builtBreak), "Break record builder changed.");
  assert(!context.WorkPayBreakRecords.hasBreakInput(context.WorkPayBreakRecords.buildBreakRecord({})), "Empty break filtering changed.");
  const attachment = { name: "proof.pdf", type: "application/pdf", size: 10, dataUrl: "data:application/pdf;base64,test" };
  const builtLeave = context.WorkPayLeaveRecords.buildLeaveRecord({ id: "leave-test", workerId: "worker-test", type: "sick-leave", startDate: "2026-07-27", endDate: "2026-07-27", reason: "  Medical visit  ", attachment: attachment, existing: { createdAt: "2026-07-01T00:00:00.000Z" }, now: "2026-07-27T00:00:00.000Z" });
  assert(builtLeave.reason === "Medical visit" && builtLeave.attachment === attachment && builtLeave.createdAt === "2026-07-01T00:00:00.000Z", "Leave record builder changed.");
  const removedAttachmentLeave = context.WorkPayLeaveRecords.buildLeaveRecord({ id: "leave-test", attachment: attachment, removeAttachment: true, existing: { attachment: attachment } });
  assert(removedAttachmentLeave.attachment === null, "Leave attachment removal changed.");
  const invalidWage = context.WorkPayValidation.validateWorkerWageConfig({
    wageType: "hourly",
    standardHours: 8,
    hourlyRate: 0,
    overtimeRate: 0,
    allowance: 0
  });
  assert(!invalidWage.ok && invalidWage.fieldKey === "hourlyRate", "Wage configuration validation changed.");
  assert(invalidWage.fieldKey === "hourlyRate" && invalidWage.message.includes("hourly rate"), "Wage validation field mapping changed.");
  assert(context.WorkPayDuplicateRecords.findDuplicateWorker([{ id: "other", phoneDigits: builtWorker.phoneDigits }], builtWorker).id === "other", "Duplicate worker detection changed.");
  assert(context.WorkPayDuplicateRecords.findDuplicateAttendance([{ id: "other", workerId: "worker-test", date: "2026-07-27" }], builtAttendance).id === "other", "Duplicate attendance detection changed.");

  const csvRows = context.WorkPayBackupExport.buildReportCsvRows([{
    date: "2026-07-22",
    day: "Wednesday",
    worker: { name: "Test Worker", type: "Helper" },
    status: "present",
    checkIn: "09:00",
    checkOut: "17:00",
    calculation: { breakMinutes: 30, netMinutes: 450, overtimeMinutes: 0, regularPay: 900, overtimePay: 0, taskPay: 0, allowancePay: 0, totalWage: 900 }
  }], (value) => value, (value) => String(value));
  assert(csvRows.length === 2 && csvRows[1][14] === "900", "CSV export rows changed.");
}

function verifyServiceWorker() {
  const serviceWorker = readAppFile("service-worker.js");
  assert(serviceWorker.includes("workpay-india-shell-v59"), "Service worker cache version is not v59.");
  runtimeFiles.slice(0, 43).forEach((relativePath) => {
    assert(serviceWorker.includes('"./' + relativePath + '"'), "Service worker is missing: " + relativePath);
  });
}

verifyScriptOrder(readAppFile("index.html"));
verifyDeploymentAssets();
verifyRuntimeSyntax();
verifyBrowserBootstrap();
verifyServiceWorker();
console.log("WorkPay runtime verification passed.");
