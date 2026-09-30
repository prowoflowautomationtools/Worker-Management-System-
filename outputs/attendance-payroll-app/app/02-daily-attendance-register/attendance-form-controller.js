(function (root) {
  "use strict";

  function createAttendanceFormController(options) {
    options = options || {};
    var state = options.state;
    var refs = options.refs;
    function resetAttendanceForm() {
      refs.attendanceForm.reset();
      refs.attendanceId.value = "";
      refs.attendanceFormTitle.textContent = "Record Attendance";
      refs.cancelAttendanceEditBtn.classList.add("hidden");
      refs.attendanceDate.value = options.toDateInput(new Date());
      refs.attendanceStatus.value = "present";
      refs.taskUnits.value = 0;
      refs.breakRows.innerHTML = "";
      options.addBreakRow();
      options.updateAttendanceDay();
      options.updateAttendancePreview();
    }

    function saveAttendance(event) {
      event.preventDefault();
      var record = options.buildAttendanceFromForm();
      if (!record) return;
      options.findDuplicateAttendance(record).then(function (duplicate) {
        if (duplicate) {
          options.reportValidation(refs.attendanceDate, "This worker already has an attendance record for that date.");
          return null;
        }
        return options.put("attendance", record);
      }).then(function (saved) {
        if (!saved) return false;
        return options.refreshAll().then(function () { return true; });
      }).then(function (didSave) {
        if (!didSave) return;
        resetAttendanceForm();
        options.showToast("Attendance saved.");
      }).catch(options.showError);
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
      (record.breaks && record.breaks.length ? record.breaks : [{}]).forEach(options.addBreakRow);
      refs.attendanceFormTitle.textContent = "Edit Attendance";
      refs.cancelAttendanceEditBtn.classList.remove("hidden");
      options.updateAttendanceDay();
      options.updateAttendancePreview();
      options.clearFormErrors(refs.attendanceForm);
      options.switchView("attendance");
    }

    function deleteAttendance(id) {
      if (!confirm("Delete this attendance record?")) return;
      options.remove("attendance", id).then(options.refreshAll).then(function () {
        options.showToast("Attendance deleted.");
      }).catch(options.showError);
    }

    return {
      resetAttendanceForm: resetAttendanceForm,
      saveAttendance: saveAttendance,
      editAttendance: editAttendance,
      deleteAttendance: deleteAttendance
    };
  }

  root.WorkPayAttendanceController = { createAttendanceFormController: createAttendanceFormController };
}(typeof self !== "undefined" ? self : window));
