(function (root) {
  "use strict";

  function createWorkerProfileController(options) {
    options = options || {};
    var state = options.state;
    var refs = options.refs;
    var buildWorkerRecord = options.buildWorkerRecord;
    var normalizePhone = options.normalizePhone;
    var isValidIndianPhone = options.isValidIndianPhone;
    var makeId = options.makeId;
    var getExisting = options.getExisting;
    var getWorker = options.getWorker;
    var findDuplicateWorker = options.findDuplicateWorker;
    var put = options.put;
    var remove = options.remove;
    var refreshAll = options.refreshAll;
    var saveSettings = options.saveSettings;
    var validateWorkerWageConfig = options.validateWorkerWageConfig;
    var reportValidation = options.reportValidation;
    var clearFormErrors = options.clearFormErrors;
    var renderWorkerTypeOptions = options.renderWorkerTypeOptions;
    var toggleCustomType = options.toggleCustomType;
    var switchView = options.switchView;
    var showToast = options.showToast;
    var showError = options.showError;
    var defaultTypes = options.defaultTypes || [];

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

      if (!Array.isArray(state.settings.workerTypes)) state.settings.workerTypes = defaultTypes.slice();
      if (!state.settings.workerTypes.includes(type)) {
        state.settings.workerTypes.push(type);
        saveSettings();
      }

      var worker = buildWorkerRecord({
        id: id,
        name: name,
        phone: phone,
        whatsapp: whatsapp,
        email: refs.workerEmail.value,
        website: refs.workerWebsite.value,
        otherContact: refs.workerOtherContact.value,
        type: type,
        wageType: refs.wageType.value,
        standardHours: refs.standardHours.value,
        defaultHours: state.settings.defaultHours || 8,
        hourlyRate: refs.hourlyRate.value,
        dailyRate: refs.dailyRate.value,
        overtimeRate: refs.overtimeRate.value,
        taskRate: refs.taskRate.value,
        allowance: refs.allowance.value,
        compensationNotes: refs.compensationNotes.value,
        existing: getExisting("workers", id)
      });
      var wageValidation = validateWorkerWageConfig(worker);
      if (!wageValidation.ok) return reportValidation(refs[wageValidation.fieldKey], wageValidation.message);

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
        options.resetWorkerForm();
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
      if (!Array.isArray(state.settings.workerTypes)) state.settings.workerTypes = defaultTypes.slice();
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

    return { saveWorker: saveWorker, editWorker: editWorker, deleteWorker: deleteWorker, resetWorkerForm: resetWorkerForm };
  }

  root.WorkPayWorkerController = { createWorkerProfileController: createWorkerProfileController };
}(typeof self !== "undefined" ? self : window));
