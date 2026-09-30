(function (root) {
  "use strict";

  function createSettingsFormController(options) {
    options = options || {};
    var state = options.state;
    var refs = options.refs;

    function restoreSettingsForm() {
      refs.settingBusinessName.value = state.settings.businessName || "";
      refs.settingCurrencyCode.value = state.settings.currencyCode || options.defaultCurrency;
      refs.settingDefaultHours.value = state.settings.defaultHours || 8;
      refs.settingDailyPolicy.value = state.settings.dailyPolicy || "prorated";
      refs.settingOvertimeMode.value = state.settings.overtimeMode || "standard";
      refs.settingTheme.value = state.settings.theme || "light";
      refs.settingTimeFormat.value = state.settings.timeFormat || "24h";
      refs.settingDateFormat.value = state.settings.dateFormat || "ddmmyyyy";
      refs.settingYearMode.value = state.settings.yearMode || "financial";
      refs.settingPublicHolidays.value = options.formatPublicHolidayLines(state.settings.publicHolidays);
      refs.settingEstablishmentState.value = state.settings.statutoryConfig.establishmentState || "";
      refs.settingPfEnabled.value = String(!!state.settings.statutoryConfig.modules.pf.enabled);
      refs.settingEsiEnabled.value = String(!!state.settings.statutoryConfig.modules.esi.enabled);
      refs.settingTdsEnabled.value = String(!!state.settings.statutoryConfig.modules.tds.enabled);
      refs.settingPtEnabled.value = String(!!state.settings.statutoryConfig.modules.professionalTax.enabled);
      refs.settingStatutoryNotes.value = state.settings.statutoryConfig.notes || "";
      options.syncReportPresetOption();
    }

    function saveSettingsForm() {
      options.clearFormErrors(refs.workerForm);
      options.clearFormErrors(refs.attendanceForm);
      options.clearFormErrors(refs.leaveForm);
      options.clearFieldError(refs.settingPublicHolidays);
      var defaultHours = options.numberValue(refs.settingDefaultHours.value, 8);
      if (defaultHours <= 0) {
        options.reportValidation(refs.settingDefaultHours, "Default standard hours must be greater than zero.");
        return;
      }
      var holidayParse = options.parsePublicHolidayInput(refs.settingPublicHolidays.value);
      if (!holidayParse.ok) {
        options.setFieldError(refs.settingPublicHolidays, holidayParse.message);
        options.showToast(holidayParse.message);
        return;
      }
      state.settings = options.buildSettingsUpdate(state.settings, {
        businessName: refs.settingBusinessName.value,
        currencyCode: refs.settingCurrencyCode.value,
        defaultHours: defaultHours,
        dailyPolicy: refs.settingDailyPolicy.value,
        overtimeMode: refs.settingOvertimeMode.value,
        theme: refs.settingTheme.value,
        timeFormat: refs.settingTimeFormat.value,
        dateFormat: refs.settingDateFormat.value,
        yearMode: refs.settingYearMode.value,
        publicHolidays: holidayParse.holidays,
        statutoryConfig: {
          establishmentState: refs.settingEstablishmentState.value,
          modules: {
            pf: { enabled: refs.settingPfEnabled.value === "true" },
            esi: { enabled: refs.settingEsiEnabled.value === "true" },
            tds: { enabled: refs.settingTdsEnabled.value === "true" },
            professionalTax: { enabled: refs.settingPtEnabled.value === "true" }
          },
          notes: refs.settingStatutoryNotes.value
        }
      });
      options.normalizeMasterData();
      options.saveSettings();
      options.applyTheme();
      options.setupStaticDates();
      options.syncReportPresetOption();
      if (refs.reportPreset.value === "year" || refs.reportPreset.value === "fy") options.applyReportPreset();
      options.renderAll();
      options.showToast("Settings saved.");
    }

    return { restoreSettingsForm: restoreSettingsForm, saveSettingsForm: saveSettingsForm };
  }

  root.WorkPaySettingsController = { createSettingsFormController: createSettingsFormController };
}(typeof self !== "undefined" ? self : window));
