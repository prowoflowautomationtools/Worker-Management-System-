(function (root) {
  "use strict";

  function createAttendanceBreakController(options) {
    options = options || {};
    var refs = options.refs;
    var state = options.state;

    function addBreakRow(data) {
      var row = document.createElement("div");
      row.className = "break-row";
      var selectedType = data && data.type || "Lunch";
      row.innerHTML = '<label>Start<input class="break-start" type="time" value="' + options.escapeAttr(data && data.startTime || "") + '"></label>' +
        '<label>End<input class="break-end" type="time" value="' + options.escapeAttr(data && data.endTime || "") + '"></label>' +
        '<label>Type<select class="break-type">' + options.renderBreakTypeOptions(selectedType) + '</select></label>' +
        '<label>Specify<input class="break-note" placeholder="If other" value="' + options.escapeAttr(data && data.note || "") + '"></label>' +
        '<button class="ghost-button small-button remove-break" type="button">Remove</button>';
      row.querySelectorAll("input, select").forEach(function (input) {
        input.addEventListener("input", options.updateAttendancePreview);
        input.addEventListener("change", options.updateAttendancePreview);
      });
      row.querySelector(".remove-break").addEventListener("click", function () {
        row.remove();
        if (!refs.breakRows.children.length) addBreakRow();
        options.updateAttendancePreview();
      });
      refs.breakRows.appendChild(row);
    }

    function collectBreaks() {
      return Array.from(refs.breakRows.querySelectorAll(".break-row")).map(function (row) {
        return options.buildBreakRecord({
          startTime: row.querySelector(".break-start").value,
          endTime: row.querySelector(".break-end").value,
          type: row.querySelector(".break-type").value,
          note: row.querySelector(".break-note").value.trim()
        });
      }).filter(options.hasBreakInput);
    }

    function updateAttendancePreview() {
      var worker = options.getWorker(refs.attendanceWorker.value);
      var preview = { breakMinutes: 0, netMinutes: 0, overtimeMinutes: 0, totalWage: 0 };
      if (worker) {
        preview = options.calculateAttendance({
          workerId: worker.id,
          date: refs.attendanceDate.value || options.toDateInput(new Date()),
          status: refs.attendanceStatus.value,
          checkIn: refs.checkIn.value,
          checkOut: refs.checkOut.value,
          breaks: collectBreaks(),
          taskUnits: options.numberValue(refs.taskUnits.value, 0),
          taskRateOverride: refs.taskRateOverride.value === "" ? null : options.numberValue(refs.taskRateOverride.value, 0)
        }, worker);
      }
      refs.attendancePreview.innerHTML = '<div><span>Break duration</span><strong>' + options.formatMinutes(preview.breakMinutes) + '</strong></div>' +
        '<div><span>Net working hours</span><strong>' + options.formatMinutes(preview.netMinutes) + '</strong></div>' +
        '<div><span>Overtime</span><strong>' + options.formatMinutes(preview.overtimeMinutes) + '</strong></div>' +
        '<div><span>Estimated wage</span><strong>' + options.formatMoney(preview.totalWage) + '</strong></div>';
    }

    return { addBreakRow: addBreakRow, collectBreaks: collectBreaks, updateAttendancePreview: updateAttendancePreview };
  }

  root.WorkPayAttendanceBreaks = { createAttendanceBreakController: createAttendanceBreakController };
}(typeof self !== "undefined" ? self : window));
