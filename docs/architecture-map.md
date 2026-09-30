# Architecture Map

This map connects business-process naming to the current technical implementation. It is intended for non-technical stakeholders, technical contributors, and AI-assisted development workflows.

## Current Stable Deployment Structure

```text
outputs/
  attendance-payroll-app/
    index.html
    app/
      00-start-here-app-overview/
        shared-utilities.js
        ui-feedback.js
        navigation-controller.js
        demo-data-rules.js
        dynamic-action-binding.js
        dashboard-screen-renderer.js
        event-bindings.js
      01-worker-records-and-onboarding/
        worker-record-rules.js
        worker-screen-renderer.js
        worker-profile-controller.js
      02-daily-attendance-register/
        attendance-record-rules.js
        attendance-screen-renderer.js
        attendance-form-controller.js
      03-work-breaks-register/
        break-record-rules.js
        attendance-break-controller.js
      04-leave-and-holiday-register/
        leave-record-rules.js
        attachment-file-reader.js
        leave-holiday-rules.js
        leave-screen-renderer.js
        leave-form-controller.js
      05-wage-and-payroll-calculation/
        payroll-calculation-rules.js
      06-reports-reviews-and-exports/
        report-aggregation-rules.js
        backup-export-rules.js
        report-screen-renderer.js
        report-filter-controller.js
        import-export-controller.js
        report-worker-client.js
        file-download-service.js
        backup-import-service.js
      07-settings-master-data-and-policies/
        settings-master-data-rules.js
        master-data-rules.js
        master-data-screen-renderer.js
        settings-form-controller.js
        master-data-controller.js
      08-local-data-storage-and-backup/
        settings-storage.js
        session-state-storage.js
        local-database.js
        record-normalization-rules.js
        data-refresh-service.js
        application-storage-adapter.js
      11-security-validation-and-quality-checks/
        validation-rules.js
        duplicate-record-rules.js
    styles.css
    app.js
    report-worker.js
    pwa.js
    service-worker.js
    manifest.webmanifest
    icon.svg
    VERSION.txt
```

The GitHub Pages workflow publishes only:

```text
outputs/attendance-payroll-app/
```

## Business Workflow to Technical Reference

| Business Workflow | Current UI Area | Current Technical Reference |
|---|---|---|
| 00 - Start Here | App shell, navigation, import/export, shared utilities, display formatting, user feedback | `index.html`, `app/00-start-here-app-overview/shared-utilities.js`, `app/00-start-here-app-overview/ui-feedback.js`, `app/00-start-here-app-overview/navigation-controller.js`, `app/00-start-here-app-overview/demo-data-rules.js`, `app/00-start-here-app-overview/dynamic-action-binding.js`, `app/00-start-here-app-overview/dashboard-screen-renderer.js`, `app/00-start-here-app-overview/event-bindings.js`, `switchView`, `exportJson`, `importJson` |
| 01 - Worker Profiles | Workers screen | `app/01-worker-records-and-onboarding/worker-record-rules.js`, `app/01-worker-records-and-onboarding/worker-screen-renderer.js`, `app/01-worker-records-and-onboarding/worker-profile-controller.js`, `workerForm`, `saveWorker`, `editWorker`, `deleteWorker`, `renderWorkers` |
| 02 - Attendance Management | Attendance screen | `app/02-daily-attendance-register/attendance-record-rules.js`, `app/02-daily-attendance-register/attendance-screen-renderer.js`, `app/02-daily-attendance-register/attendance-form-controller.js`, `attendanceForm`, `saveAttendance`, `buildAttendanceFromForm`, `renderAttendanceHistory` |
| 03 - Break Management | Break rows inside attendance | `app/03-work-breaks-register/break-record-rules.js`, `app/03-work-breaks-register/attendance-break-controller.js`, `addBreakRow`, `collectBreaks`, `validateTimes` |
| 04 - Leave and Holidays | Leave & Holidays screen | `app/04-leave-and-holiday-register/leave-record-rules.js`, `app/04-leave-and-holiday-register/attachment-file-reader.js`, `app/04-leave-and-holiday-register/leave-holiday-rules.js`, `app/04-leave-and-holiday-register/leave-screen-renderer.js`, `app/04-leave-and-holiday-register/leave-form-controller.js`, `leaveForm`, `saveLeaveRecord`, `editLeave`, `deleteLeave`, `renderLeaveRecords` |
| 05 - Payroll and Wages | Calculation preview, reports | `app/05-wage-and-payroll-calculation/payroll-calculation-rules.js`, `calculateAttendance`, `sumAttendance`, `sumCalculated` |
| 06 - Reports and Exports | Reports screen, report date ranges, CSV and JSON exports | `app/06-reports-reviews-and-exports/report-aggregation-rules.js`, `app/06-reports-reviews-and-exports/backup-export-rules.js`, `app/06-reports-reviews-and-exports/report-screen-renderer.js`, `app/06-reports-reviews-and-exports/report-filter-controller.js`, `app/06-reports-reviews-and-exports/import-export-controller.js`, `app/06-reports-reviews-and-exports/report-worker-client.js`, `app/06-reports-reviews-and-exports/file-download-service.js`, `app/06-reports-reviews-and-exports/backup-import-service.js`, `getPresetDateRange`, `renderReports`, `renderWorkerWise`, `renderCategoryWise`, `renderLedger`, `exportCsv` |
| 07 - Settings and Master Data | Settings screen | `app/07-settings-master-data-and-policies/settings-master-data-rules.js`, `app/07-settings-master-data-and-policies/master-data-rules.js`, `app/07-settings-master-data-and-policies/master-data-screen-renderer.js`, `app/07-settings-master-data-and-policies/settings-form-controller.js`, `app/07-settings-master-data-and-policies/master-data-controller.js`, `buildSettingsUpdate`, `saveSettingsForm`, `addWorkerType`, `editWorkerType`, `deleteWorkerType`, `addBreakType`, `editBreakType`, `deleteBreakType` |
| 08 - Local Data Storage | Browser storage | `app/08-local-data-storage-and-backup/settings-storage.js`, `app/08-local-data-storage-and-backup/session-state-storage.js`, `app/08-local-data-storage-and-backup/local-database.js`, `app/08-local-data-storage-and-backup/record-normalization-rules.js`, `app/08-local-data-storage-and-backup/data-refresh-service.js`, `app/08-local-data-storage-and-backup/application-storage-adapter.js`, `openDb`, `getAll`, `put`, `remove`, `clearStore`, `loadSettings`, `saveSettings`, cookies/session storage helpers |
| 09 - Design System | Whole UI | `styles.css` |
| 10 - PWA and Deployment | PWA/GitHub Pages | `pwa.js`, `service-worker.js`, `manifest.webmanifest`, `.github/workflows/pages.yml` |
| 11 - Security and Validation | Validation and regression checks | `app/11-security-validation-and-quality-checks/validation-rules.js`, `app/11-security-validation-and-quality-checks/duplicate-record-rules.js`, `validateWorkerWageConfig`, `validateTimes`, `findDuplicateWorker`, `findDuplicateAttendance` |

## Future Refactor Target

The repository now includes a documentation-first business-process structure at:

```text
business-processes/
```

Use it as the public, stakeholder-friendly map for GitHub users, non-technical reviewers, and AI-assisted customization.

When the app is ready for a controlled module refactor, use this business-first folder structure as the migration target:

```text
business-processes/
  00-start-here-app-overview/
  01-worker-records-and-onboarding/
  02-daily-attendance-register/
  03-work-breaks-register/
  04-leave-and-holiday-register/
  05-wage-and-payroll-calculation/
  06-reports-reviews-and-exports/
  07-settings-master-data-and-policies/
  08-local-data-storage-and-backup/
  09-user-interface-and-design-system/
  10-offline-app-and-github-pages-deployment/
  11-security-validation-and-quality-checks/
```

Suggested technical naming inside each business folder:

```text
*-ui.js
*-storage.js
*-rules.js
*-validation.js
*-service.js
```

Example:

```text
02-attendance-management/
  attendance-ui.js
  attendance-storage.js
  attendance-validation.js
```

## Refactor Rule

Move code in small, testable steps only. Keep `outputs/attendance-payroll-app/` deployable at all times, update `index.html` and `service-worker.js` whenever a runtime file is added, and run the static smoke checks after every extraction.

The first safe runtime extraction is:

```text
outputs/attendance-payroll-app/app/00-start-here-app-overview/shared-utilities.js
outputs/attendance-payroll-app/app/04-leave-and-holiday-register/leave-holiday-rules.js
outputs/attendance-payroll-app/app/05-wage-and-payroll-calculation/payroll-calculation-rules.js
outputs/attendance-payroll-app/app/06-reports-reviews-and-exports/report-aggregation-rules.js
outputs/attendance-payroll-app/app/07-settings-master-data-and-policies/settings-master-data-rules.js
outputs/attendance-payroll-app/app/08-local-data-storage-and-backup/settings-storage.js
outputs/attendance-payroll-app/app/08-local-data-storage-and-backup/record-normalization-rules.js
outputs/attendance-payroll-app/app/11-security-validation-and-quality-checks/validation-rules.js
```

The shared utilities module contains stateless helper functions, display formatting, and page-level debouncing used by `app.js`. The UI feedback module centralizes toast messaging, inline form errors, ARIA invalid state, focus behavior, and error clearing across all forms without changing existing messages or timing. The navigation controller centralizes active-view styling, cookie/session persistence, document titles, and report-view refresh requests. The demo-data module builds the existing sample workers, attendance, breaks, and holiday records while persistence remains controlled by `app.js`. The dynamic-action module centralizes bindings for existing worker, attendance, leave, category, and break CRUD buttons while preserving their data attributes and callbacks. The dashboard screen renderer owns dashboard metrics, today attendance rows, and upcoming leave presentation while persistence and calculations remain in `app.js`. The worker screen renderer owns worker category options and worker-card rendering while worker persistence and validation remain in `app.js`. The data refresh service loads the three IndexedDB stores, normalizes records, applies the existing sort order, and triggers the existing render pipeline. The leave attachment module reads browser files into the existing attachment metadata and data-URL format. The leave/holiday module converts configured public holidays into leave-style records for dashboards and reports. The payroll module contains reusable attendance time validation and wage calculation rules used by both `app.js` and `report-worker.js`. The reports module contains reusable report date-range rules, canonical calculated-total aggregation, and worker/category/date-range aggregation used by both the main-thread fallback and report worker. The report worker client manages lazy worker creation, request correlation, error recovery, and main-thread fallback without changing report payloads. The settings module contains reusable defaults, public holiday parsing, master-data normalization, and future statutory configuration defaults. The master-data module centralizes case-insensitive duplicate checks and default-preserving list normalization for worker categories and break types. The settings storage module contains the JSON local-storage read/write boundary while preserving the existing fallback and normalization behavior. The session storage module contains report-filter and active-view persistence while preserving the existing browser session keys. The record normalization module standardizes worker, attendance, and leave records during IndexedDB reads and JSON import. The validation module contains reusable wage and time validation rules. The duplicate-record module contains reusable in-memory matching for worker phone numbers and worker/date attendance keys; IndexedDB indexed lookups remain controlled by `app.js`. Business workflows, IndexedDB transactions, and UI behavior remain controlled by the existing app.

## Repeatable Quality Check

Run `npm run verify` from the project root before publishing a refactor. It runs `tools/quality-checks/verify-runtime.js`, which verifies deployment asset presence, script ordering, JavaScript syntax, browser-style bootstrap, sample Indian payroll calculations, invalid timing and overlapping-break validation, worker normalization, wage configuration validation, export row construction, and the service-worker cache manifest without modifying local worker data. The project has no package dependencies.
