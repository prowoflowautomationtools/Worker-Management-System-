# Business Process Project Structure

This folder explains the Worker Management System in practical business language first, with technical references alongside it.

The working application still lives in `outputs/attendance-payroll-app/`. Do not move production files into these folders until there is a tested migration plan.

## Folder Naming Standard

Each folder follows this pattern:

```text
number-business-process-name/
```

Example:

```text
02-daily-attendance-register/
```

This keeps the workflow order clear for business users and keeps the names stable for technical contributors, GitHub users, and AI-assisted customization.

## Recommended File Naming Standard

Inside each workflow folder, use simple business names and one technical suffix:

```text
workflow-overview.md
screen-and-form-map.md
business-rules.md
validation-checks.md
data-fields.md
technical-reference.md
```

When code is later extracted from the current app, use:

```text
*-ui.js
*-rules.js
*-validation.js
*-storage.js
*-service.js
```

## Business Workflow Folders

| Order | Folder | Business meaning |
|---|---|---|
| 00 | `00-start-here-app-overview/` | App purpose, navigation, deployment, and safe customization entry point |
| 01 | `01-worker-records-and-onboarding/` | Worker master data, contact details, category, and wage setup |
| 02 | `02-daily-attendance-register/` | Daily check-in, check-out, status, task units, and attendance notes |
| 03 | `03-work-breaks-register/` | Lunch, tea, rest, and other break records within attendance |
| 04 | `04-leave-and-holiday-register/` | Leave, holidays, reasons, dates, and supporting documents |
| 05 | `05-wage-and-payroll-calculation/` | Net working time, overtime, hourly/daily/task wages, and allowances |
| 06 | `06-reports-reviews-and-exports/` | Worker reports, category reports, date ranges, CSV, and JSON backup |
| 07 | `07-settings-master-data-and-policies/` | Currency, date/time format, year mode, categories, break types, and policies |
| 08 | `08-local-data-storage-and-backup/` | IndexedDB, Local Storage, Session Storage, Cache Storage, cookies, import/export |
| 09 | `09-user-interface-and-design-system/` | Layout, typography, forms, tables, responsive behavior, and accessibility |
| 10 | `10-offline-app-and-github-pages-deployment/` | PWA, service worker, manifest, GitHub Pages, and offline behavior |
| 11 | `11-security-validation-and-quality-checks/` | Validation, data safety, regression checks, and release review |

## Current Source of Truth

The `business-processes/` folder is documentation for business users and contributors. The technical documentation lives in `docs/`. The deployable runtime source remains under `outputs/attendance-payroll-app/`.

The deployable source remains:

```text
outputs/attendance-payroll-app/
  index.html
  styles.css
  app.js
  pwa.js
  report-worker.js
  service-worker.js
  manifest.webmanifest
  icon.svg
  VERSION.txt
```

