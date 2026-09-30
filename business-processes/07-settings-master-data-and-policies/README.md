# 07 - Settings, Master Data, and Policies

## Business Purpose

Configure app-wide business preferences and reusable master data without changing code.

## Practical Daily Use

- Set currency, including INR and other currencies.
- Set date format and time format.
- Select financial year or calendar year reporting.
- Configure Indian public holidays.
- Manage worker categories and break types.
- Prepare future statutory compliance settings for PF, ESI, TDS, and Professional Tax.

## Current Technical Reference

- UI area: Settings screen
- Settings rules module: `outputs/attendance-payroll-app/app/07-settings-master-data-and-policies/settings-master-data-rules.js`
- Key HTML IDs: `settingCurrencyCode`, `settingDateFormat`, `settingTimeFormat`, `settingYearMode`, `settingPublicHolidays`
- Key functions: `normalizeSettings`, `parsePublicHolidayInput`, `formatPublicHolidayLines`, `saveSettingsForm`, `addWorkerType`, `editWorkerType`, `deleteWorkerType`, `addBreakType`, `editBreakType`, `deleteBreakType`
- Pure settings update mapping: `buildSettingsUpdate`
- Storage: Local Storage settings and master data

## Planned Future File Names (Not Current Files)

- `settings-ui.js`
- `master-data-rules.js`
- `settings-validation.js`
- `settings-storage.js`
- `policy-configuration-service.js`
## Current Technical Reference

- Settings rules: `outputs/attendance-payroll-app/app/07-settings-master-data-and-policies/settings-master-data-rules.js`
- Master-data rules: `outputs/attendance-payroll-app/app/07-settings-master-data-and-policies/master-data-rules.js`
- Master-data screen renderer: `outputs/attendance-payroll-app/app/07-settings-master-data-and-policies/master-data-screen-renderer.js`
- Settings form controller: `outputs/attendance-payroll-app/app/07-settings-master-data-and-policies/settings-form-controller.js`
- Master-data controller: `outputs/attendance-payroll-app/app/07-settings-master-data-and-policies/master-data-controller.js`

The master-data rules preserve default categories and break types while enforcing case-insensitive duplicate checks.
