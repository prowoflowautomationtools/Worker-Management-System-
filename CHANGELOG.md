# Version Log

All notable changes to this project are documented here.

## Unreleased

### Added
- Added pure CSV export row and JSON backup payload rules under the reports and exports workflow folder.
- Added a repeatable local runtime verification script for future safe refactors.
- Expanded the verification coverage for payroll timing, breaks, worker normalization, and wage validation.
- Moved the generic worker-search debounce helper into shared page utilities without changing its timing behavior.
- Routed dashboard totals through the canonical reports aggregation rule to remove duplicate wage-total logic.
- Removed confirmed unused app-shell helper code without changing runtime behavior.
- Added deployable asset presence checks to the repeatable runtime verification gate.
- Added a dependency-free `npm run verify` command for the project quality gate.
- Added contributor guidance for safe business-process refactoring and public forks.
- Added a dependency-free local HTTP server command for browser and PWA testing.
- Added a Windows one-click local app launcher for users who do not use PowerShell.
- Added a Python fallback to the Windows local launcher when Node.js is unavailable.
- Extracted IndexedDB schema, CRUD, and indexed-read operations into the local database service while preserving the existing app-shell wrappers.
- Extracted worker-profile record construction and normalization coordination into the worker records rules module.
- Extracted attendance record construction into the daily attendance rules module while preserving existing validation and storage wrappers.
- Extracted break record normalization and empty-row filtering into the work breaks rules module.
- Extracted leave record construction and attachment retention/removal semantics into the leave records rules module.
- Centralized settings form-to-model mapping in the settings rules module while preserving existing validation and persistence flow.
- Extracted settings JSON local-storage reads and writes into the settings storage service while preserving fallback and normalization behavior.
- Extracted report-filter and active-view session persistence into the session state storage service while preserving existing session keys.
- Extracted lazy report worker lifecycle and main-thread fallback handling into the report worker client without changing report payloads or calculations.
- Extracted in-memory duplicate worker and attendance matching into reusable validation rules while preserving IndexedDB index lookups.
- Extracted leave attachment file reading while preserving the saved attachment data format and existing leave workflow.
- Extracted shared UI feedback behavior for toasts and inline validation without changing messages, focus behavior, ARIA state, or timing.
- Extracted browser file-download handling while preserving existing CSV and JSON export behavior.
- Extracted navigation state and active-view coordination while preserving cookie/session persistence and report refresh behavior.
- Extracted reusable master-data list normalization and case-insensitive duplicate checks for worker categories and break types.
- Extracted the IndexedDB load, record normalization, sort, and render-refresh pipeline into the data refresh service.
- Added injectable file-download verification so browser export behavior is regression-tested without requiring a download event from the test harness.
- Extracted JSON backup file reading and parsing while preserving the existing backup schema validation and restore workflow.
- Extracted demo worker, attendance, break, and holiday record construction while preserving the existing optional demo-data workflow.
- Extracted dynamic CRUD button binding while preserving existing data attributes and callback behavior.
- Centralized form validation listeners in the shared UI feedback service while preserving existing error-clearing behavior.
- Extracted worker category options and worker-card rendering into the worker screen renderer while preserving worker CRUD behavior.
- Extracted attendance history and break-type option rendering while preserving attendance validation and payroll calculations.
- Extracted leave-card and leave-list rendering while preserving leave CRUD and attachment behavior.
- Extracted worker-category and break-type list rendering while preserving master-data CRUD side effects.

### Fixed
- Corrected worker wage-validation field mapping so invalid wage configurations show inline guidance on the relevant field.
- Hardened shared ID generation for restricted runtimes where the Web Crypto global is unavailable.
- Added a business-process project structure under `business-processes/` for stakeholder-friendly architecture discovery, public GitHub users, and future AI-assisted customization.
- Added the first safe runtime module at `outputs/attendance-payroll-app/app/00-start-here-app-overview/shared-utilities.js` for stateless shared utilities.
- Added a leave and holiday rules module at `outputs/attendance-payroll-app/app/04-leave-and-holiday-register/leave-holiday-rules.js`.
- Added a payroll calculation rules module at `outputs/attendance-payroll-app/app/05-wage-and-payroll-calculation/payroll-calculation-rules.js`.
- Added a report aggregation rules module at `outputs/attendance-payroll-app/app/06-reports-reviews-and-exports/report-aggregation-rules.js`.
- Extracted report summary, ledger, and leave presentation into `report-screen-renderer.js` without changing report calculations or export behavior.
- Extracted dashboard metrics, today's attendance table, and upcoming leave presentation into `dashboard-screen-renderer.js` without changing calculations or CRUD actions.
- Added a worker profile controller for worker form validation, duplicate detection, CRUD persistence, and edit/reset workflows while preserving existing app-shell callbacks.
- Added an attendance form controller for attendance CRUD, time validation coordination, duplicate detection, break-row restoration, and form reset behavior.
- Added a leave form controller for leave and holiday CRUD, attachment coordination, date validation, edit, delete, and reset workflows.
- Removed temporary duplicate worker, attendance, and leave CRUD implementations from `app.js` after controller verification.
- Added an explicit SVG favicon reference so browsers do not request a missing `/favicon.ico` resource.
- Advanced the service-worker cache version to `v46` so the favicon and updated app shell are refreshed for PWA users.
- Extracted DOM event wiring into `event-bindings.js` while preserving existing callbacks, selectors, validation listeners, and interaction timing.
- Removed the temporary duplicate event-binding implementation from `app.js` after verifying the extracted event binder.
- Extracted attendance break-row creation, break collection, and live payroll preview rendering into `attendance-break-controller.js`.
- Removed the temporary duplicate break-row and attendance-preview implementations from `app.js` after controller verification.
- Added a settings form controller for Indian configuration fields, holiday parsing, statutory toggles, and settings persistence coordination.
- Removed the temporary duplicate settings form implementation from `app.js` after controller verification.
- Added a master-data controller for worker-category and break-type CRUD, rename propagation, linked-record safeguards, and persistence coordination.
- Removed the temporary duplicate master-data CRUD implementations from `app.js` after controller verification.
- Added a report filter controller for preset ranges, financial-year handling, and session filter persistence.
- Removed the temporary duplicate report-filter implementations from `app.js` after controller verification.
- Added an import/export controller for CSV reports, JSON backups, backup validation, and local data restoration coordination.
- Removed the temporary duplicate import/export implementations from `app.js` after controller verification.
- Added an application storage adapter for the app-shell IndexedDB lifecycle and CRUD wrappers.
- Added an application lifecycle module for coordinated data refresh and full-screen rendering.
- Added a settings and master-data rules module at `outputs/attendance-payroll-app/app/07-settings-master-data-and-policies/settings-master-data-rules.js`.
- Added a record normalization module at `outputs/attendance-payroll-app/app/08-local-data-storage-and-backup/record-normalization-rules.js`.
- Added a validation rules module at `outputs/attendance-payroll-app/app/11-security-validation-and-quality-checks/validation-rules.js`.

### Changed
- Refactored generic helper functions out of `app.js` while keeping the deployed app folder, browser script loading, and GitHub Pages compatibility intact.
- Refactored money, date, time, and day-name display formatting into shared utilities while preserving existing render function names.
- Refactored configured public holidays into reusable leave/holiday record rules for dashboards and reports.
- Refactored attendance time validation and payroll calculation logic so the main app and report worker use the same rules module.
- Refactored worker-wise and category-wise report aggregation so the main app fallback and report worker use the same report rules module.
- Refactored report preset date-range rules into the reports module.
- Refactored settings defaults, public holiday parsing, master-data defaults, and future statutory defaults out of `app.js`.
- Refactored worker, attendance, and leave record normalization out of `app.js` while preserving the existing IndexedDB record shape.
- Refactored worker wage configuration validation out of `app.js` while preserving existing inline validation messages and field focus behavior.

## v1.0.0 - 2026-06-30

### Added
- Worker profile management with wage configuration.
- Attendance records with check-in/check-out, status, task units, and notes.
- Multiple break records per attendance day.
- Leave and holiday records with optional attachments.
- Payroll and wage calculations with net working time and overtime.
- Worker-wise, category-wise, date range, weekly, monthly, and financial-year reporting.
- CSV report export and JSON backup/import.
- IndexedDB persistence with Local Storage, Session Storage, Cache Storage support, and cookies where appropriate.
- Settings for wage policy, overtime handling, theme, date display, worker categories, break types, and local data reset.
- PWA support files for GitHub Pages or other HTTP(S) hosting.

### Fixed
- Prevented `file://` manifest/service-worker/cache loading errors by loading PWA assets only on supported non-file origins.
- Fixed the desktop Attendance -> Break row layout so break inputs, dropdowns, and actions no longer overlap.

### Notes
- The app remains fully functional from a local `file://` URL.
- Service worker and installable PWA behavior require `localhost` or HTTPS hosting.
