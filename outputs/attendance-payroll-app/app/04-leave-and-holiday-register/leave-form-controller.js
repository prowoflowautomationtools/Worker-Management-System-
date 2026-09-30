(function (root) {
  "use strict";

  function createLeaveFormController(options) {
    options = options || {};
    var state = options.state;
    var refs = options.refs;

    function saveLeaveRecord(event) {
      event.preventDefault();
      options.clearFormErrors(refs.leaveForm);
      var startDate = refs.leaveStart.value;
      var endDate = refs.leaveEnd.value;
      if (!startDate || !endDate) return options.reportValidation(!startDate ? refs.leaveStart : refs.leaveEnd, "Start and end date are required.");
      if (endDate < startDate) return options.reportValidation(refs.leaveEnd, "End date cannot be before start date.");
      if (!refs.leaveReason.value.trim()) return options.reportValidation(refs.leaveReason, "Reason or explanation is required.");
      options.readAttachment(refs.leaveAttachment.files[0]).then(function (attachment) {
        var id = refs.leaveId.value || options.makeId();
        var record = options.buildLeaveRecord({
          id: id,
          workerId: refs.leaveWorker.value,
          type: refs.leaveType.value,
          startDate: startDate,
          endDate: endDate,
          reason: refs.leaveReason.value,
          attachment: attachment,
          removeAttachment: refs.removeAttachmentBtn.dataset.remove === "true",
          existing: options.getExisting("leaveRecords", id)
        });
        return options.put("leaveRecords", record);
      }).then(options.refreshAll).then(function () {
        resetLeaveForm();
        options.showToast("Leave or holiday record saved.");
      }).catch(options.showError);
    }

    function resetLeaveForm() {
      refs.leaveForm.reset();
      refs.leaveId.value = "";
      refs.leaveFormTitle.textContent = "Record Leave or Holiday";
      refs.cancelLeaveEditBtn.classList.add("hidden");
      refs.leaveStart.value = options.toDateInput(new Date());
      refs.leaveEnd.value = options.toDateInput(new Date());
      refs.attachmentInfo.textContent = "";
      refs.removeAttachmentBtn.dataset.remove = "false";
      refs.removeAttachmentBtn.classList.add("hidden");
      options.clearFormErrors(refs.leaveForm);
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
      refs.attachmentInfo.textContent = record.attachment ? "Current attachment: " + record.attachment.name + " (" + options.formatBytes(record.attachment.size) + ")" : "";
      refs.removeAttachmentBtn.dataset.remove = "false";
      refs.removeAttachmentBtn.classList.toggle("hidden", !record.attachment);
      refs.leaveFormTitle.textContent = "Edit Leave or Holiday";
      refs.cancelLeaveEditBtn.classList.remove("hidden");
      options.clearFormErrors(refs.leaveForm);
      options.switchView("leave");
    }

    function deleteLeave(id) {
      if (!confirm("Delete this leave or holiday record?")) return;
      options.remove("leaveRecords", id).then(options.refreshAll).then(function () {
        options.showToast("Leave or holiday record deleted.");
      }).catch(options.showError);
    }

    return { saveLeaveRecord: saveLeaveRecord, resetLeaveForm: resetLeaveForm, editLeave: editLeave, deleteLeave: deleteLeave };
  }

  root.WorkPayLeaveController = { createLeaveFormController: createLeaveFormController };
}(typeof self !== "undefined" ? self : window));
