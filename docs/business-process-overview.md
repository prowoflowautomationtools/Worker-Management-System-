# Business Process Overview

The app is organized around the actual workflow followed by a business, accountant, auditor, payroll reviewer, or compliance professional.

## 00 - Start Here

Purpose: Open the app, navigate between workflows, backup/restore data, and access the deployed version.

Current technical location:

- App shell: `outputs/attendance-payroll-app/index.html`
- Main logic: `outputs/attendance-payroll-app/app.js`
- Styling: `outputs/attendance-payroll-app/styles.css`
- PWA support: `outputs/attendance-payroll-app/pwa.js`, `service-worker.js`, `manifest.webmanifest`

## 01 - Worker Profiles

Purpose: Maintain worker master records, contact details, worker category, wage type, rates, standard hours, overtime rate, task rate, and allowances.

Typical users:

- Business owner
- Accountant
- Payroll assistant
- CA article assistant
- Audit team

Business value:

- Creates a single source of truth for worker data.
- Reduces payment errors caused by unclear wage terms.
- Supports worker-wise and category-wise reporting.

## 02 - Attendance Management

Purpose: Record date, day, status, check-in time, check-out time, task units, and attendance notes.

Business value:

- Converts manual attendance records into structured data.
- Supports wage and overtime calculations.
- Creates an audit trail for review and reconciliation.

## 03 - Break Management

Purpose: Record one or more breaks within a workday, including start time, end time, type, and notes.

Business value:

- Calculates net working hours correctly.
- Prevents wage overstatement from unpaid/deducted breaks.
- Supports clear documentation for disputes or review.

## 04 - Leave and Holidays

Purpose: Record paid leave, unpaid leave, sick leave, festival holidays, national holidays, site holidays, and supporting attachments.

Business value:

- Keeps leave/holiday records connected to worker or site-level context.
- Supports documentation for payroll and audit review.

## 05 - Payroll and Wages

Purpose: Calculate net minutes, overtime minutes, regular pay, overtime pay, task pay, allowances, and total wage.

Business value:

- Reduces manual calculation errors.
- Supports hourly, daily, and task-based wage structures.
- Calculates wages to the minute.

## 06 - Reports and Exports

Purpose: Generate summaries by worker, category, day, week, month, financial year, and custom date range.

Business value:

- Helps accountants, auditors, and business owners review labour cost.
- Supports CSV export for further analysis.
- Provides worker-wise and category-wise visibility.

## 07 - Settings and Master Data

Purpose: Configure daily wage policy, overtime policy, date display, worker categories, break types, and local data reset.

Business value:

- Allows customization without code changes.
- Keeps master data consistent across the app.

## 08 - Local Data Storage

Purpose: Store data locally in the browser using IndexedDB, Local Storage, Session Storage, Cache Storage, and cookies where appropriate.

Business value:

- Works without a backend server.
- Supports offline-first usage.
- Keeps data on the user's device unless exported/imported.

## 09 - Design System

Purpose: Maintain consistent layout, forms, buttons, tables, cards, responsive behavior, and theme support.

Business value:

- Makes the app easier to use.
- Reduces UI inconsistencies during future customization.

## 10 - PWA and Deployment

Purpose: Make the app deployable through GitHub Pages and support installable/offline behavior on supported origins.

Business value:

- Enables online access from any device.
- Keeps deployment simple and low-cost.

