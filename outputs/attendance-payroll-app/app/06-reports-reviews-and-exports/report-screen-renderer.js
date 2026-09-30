(function (root) {
  "use strict";

  function createReportScreenRenderer(options) {
    options = options || {};
    var state = options.state;
    var refs = options.refs;
    var buildReportDataset = options.buildReportDataset;
    var getAllLeaveSources = options.getAllLeaveSources;
    var formatDateShort = options.formatDateShort;
    var formatTime = options.formatTime;
    var formatMinutes = options.formatMinutes;
    var formatMoney = options.formatMoney;
    var escapeHtml = options.escapeHtml;
    var escapeAttr = options.escapeAttr;
    var labelStatus = options.labelStatus;
    var byDateDesc = options.byDateDesc;
    var setFieldError = options.setFieldError;
    var clearFieldError = options.clearFieldError;
    var bindDynamicButtons = options.bindDynamicButtons;

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
      refs.reportLeaveRows.innerHTML = rows.length ? rows.map(options.renderLeaveCard).join("") : '<div class="empty-state">No leave or holiday records in this range.</div>';
      bindDynamicButtons(refs.reportLeaveRows);
    }

    function renderReports() {
      var token = options.nextRenderToken();
      var from = refs.reportFrom.value || options.toDateInput(new Date());
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
        if (!options.isCurrentRenderToken(token)) return;
        state.reportRows = payload.rows;
        refs.reportDays.textContent = payload.attendanceDays;
        refs.reportNetHours.textContent = formatMinutes(payload.totals.netMinutes);
        refs.reportOvertime.textContent = formatMinutes(payload.totals.overtimeMinutes);
        refs.reportWages.textContent = formatMoney(payload.totals.totalWage);
        renderWorkerWise(payload.workerSummary);
        renderCategoryWise(payload.categorySummary);
        renderLedger(payload.rows);
        renderReportLeaves(from, to, workerId);
      }).catch(options.showError);
    }

    return {
      renderReports: renderReports,
      renderWorkerWise: renderWorkerWise,
      renderCategoryWise: renderCategoryWise,
      renderLedger: renderLedger,
      renderReportLeaves: renderReportLeaves
    };
  }

  root.WorkPayReportScreen = {
    createReportScreenRenderer: createReportScreenRenderer
  };
}(typeof self !== "undefined" ? self : window));
