(function (root) {
  "use strict";

  function createDashboardScreenRenderer(options) {
    options = options || {};
    var state = options.state;
    var refs = options.refs;
    var toDateInput = options.toDateInput;
    var sumAttendance = options.sumAttendance;
    var getWorker = options.getWorker;
    var getAllLeaveSources = options.getAllLeaveSources;
    var calculateAttendance = options.calculateAttendance;
    var formatMinutes = options.formatMinutes;
    var formatMoney = options.formatMoney;
    var formatTime = options.formatTime;
    var escapeHtml = options.escapeHtml;
    var renderLeaveCard = options.renderLeaveCard;
    var bindDynamicButtons = options.bindDynamicButtons;

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

    return { renderDashboard: renderDashboard };
  }

  root.WorkPayDashboardScreen = {
    createDashboardScreenRenderer: createDashboardScreenRenderer
  };
}(typeof self !== "undefined" ? self : window));
