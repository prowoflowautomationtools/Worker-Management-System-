(function (root) {
  "use strict";

  function createAttendanceScreenRenderer(options) {
    options = options || {};
    var state = options.state;
    var refs = options.refs;
    var normalizeMasterData = options.normalizeMasterData;
    var defaultBreakTypes = options.defaultBreakTypes;
    var escapeHtml = options.escapeHtml;
    var escapeAttr = options.escapeAttr;
    var formatDateShort = options.formatDateShort;
    var formatTime = options.formatTime;
    var formatMinutes = options.formatMinutes;
    var formatMoney = options.formatMoney;
    var labelStatus = options.labelStatus;
    var getWorker = options.getWorker;
    var calculateAttendance = options.calculateAttendance;
    var bindDynamicButtons = options.bindDynamicButtons;

    function renderBreakTypeOptions(selected) {
      normalizeMasterData();
      var optionsList = state.settings.breakTypes.slice();
      if (selected && !optionsList.includes(selected)) optionsList.push(selected);
      return optionsList.map(function (type) {
        return '<option value="' + escapeHtml(type) + '"' + (type === selected ? " selected" : "") + '>' + escapeHtml(type) + '</option>';
      }).join("");
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

    return {
      renderBreakTypeOptions: renderBreakTypeOptions,
      renderAttendanceHistory: renderAttendanceHistory
    };
  }

  root.WorkPayAttendanceScreen = {
    createAttendanceScreenRenderer: createAttendanceScreenRenderer
  };
}(typeof self !== "undefined" ? self : window));
