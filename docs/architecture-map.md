# Architecture Map

This map connects business-process naming to the current technical implementation. It is intended for non-technical stakeholders, technical contributors, and AI-assisted development workflows.

## Current Stable Deployment Structure

```text
outputs/
  attendance-payroll-app/
    index.html
    styles.css
    app.js
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
| 00 - Start Here | App shell, navigation, import/export | `index.html`, `switchView`, `exportJson`, `importJson` |
| 01 - Worker Profiles | Workers screen | `workerForm`, `saveWorker`, `editWorker`, `deleteWorker`, `renderWorkers` |
| 02 - Attendance Management | Attendance screen | `attendanceForm`, `saveAttendance`, `buildAttendanceFromForm`, `renderAttendanceHistory` |
| 03 - Break Management | Break rows inside attendance | `addBreakRow`, `collectBreaks`, `validateTimes` |
| 04 - Leave and Holidays | Leave & Holidays screen | `leaveForm`, `saveLeaveRecord`, `editLeave`, `deleteLeave`, `renderLeaveRecords` |
| 05 - Payroll and Wages | Calculation preview, reports | `calculateAttendance`, `sumAttendance`, `sumCalculated` |
| 06 - Reports and Exports | Reports screen | `renderReports`, `renderWorkerWise`, `renderCategoryWise`, `renderLedger`, `exportCsv` |
| 07 - Settings and Master Data | Settings screen | `saveSettingsForm`, `addWorkerType`, `editWorkerType`, `deleteWorkerType`, `addBreakType`, `editBreakType`, `deleteBreakType` |
| 08 - Local Data Storage | Browser storage | `openDb`, `getAll`, `put`, `remove`, `clearStore`, `loadSettings`, `saveSettings`, cookies/session storage helpers |
| 09 - Design System | Whole UI | `styles.css` |
| 10 - PWA and Deployment | PWA/GitHub Pages | `pwa.js`, `service-worker.js`, `manifest.webmanifest`, `.github/workflows/pages.yml` |

## Future Refactor Target

When the app is ready for a controlled module refactor, use this business-first folder structure:

```text
app/
  00-start-here/
  01-worker-profiles/
  02-attendance-management/
  03-break-management/
  04-leave-and-holidays/
  05-payroll-and-wages/
  06-reports-and-exports/
  07-settings-and-master-data/
  08-local-data-storage/
  09-design-system/
  10-pwa-and-deployment/
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

Do not move code into this future structure until there is a testable migration plan. The current deployed app is stable and should remain the source of truth until each module is extracted safely.

