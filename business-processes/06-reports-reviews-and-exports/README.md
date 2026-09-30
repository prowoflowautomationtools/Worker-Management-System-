# 06 - Reports, Reviews, and Exports

## Business Purpose

Review attendance, leave, holidays, working hours, overtime, and wages by worker, category, and date range.

## Practical Daily Use

- Select daily, weekly, monthly, financial year, calendar year, or custom date range.
- Filter reports by worker.
- Review worker-wise and category-wise summaries.
- Review the detailed attendance ledger.
- Export CSV for accounting, audit, or further analysis.
- Export JSON for full backup.

## Current Technical Reference

- Report aggregation rules: `outputs/attendance-payroll-app/app/06-reports-reviews-and-exports/report-aggregation-rules.js`
- Report screen renderer: `outputs/attendance-payroll-app/app/06-reports-reviews-and-exports/report-screen-renderer.js`
- Report filter controller: `outputs/attendance-payroll-app/app/06-reports-reviews-and-exports/report-filter-controller.js`
- Import/export controller: `outputs/attendance-payroll-app/app/06-reports-reviews-and-exports/import-export-controller.js`
- Report worker client: `outputs/attendance-payroll-app/app/06-reports-reviews-and-exports/report-worker-client.js`
- File download service: `outputs/attendance-payroll-app/app/06-reports-reviews-and-exports/file-download-service.js`
- Backup import service: `outputs/attendance-payroll-app/app/06-reports-reviews-and-exports/backup-import-service.js`
- Backup and export rules: `outputs/attendance-payroll-app/app/06-reports-reviews-and-exports/backup-export-rules.js`

The report worker client runs expensive report preparation off the main UI thread when the application is served over HTTP or HTTPS. When workers are unavailable, it preserves the existing main-thread calculation fallback.

- UI area: Reports screen and dashboard summary
- Report aggregation module: `outputs/attendance-payroll-app/app/06-reports-reviews-and-exports/report-aggregation-rules.js`
- Backup and export module: `outputs/attendance-payroll-app/app/06-reports-reviews-and-exports/backup-export-rules.js`
- Key HTML IDs: `reportPreset`, `reportFrom`, `reportTo`, `reportWorker`, `exportCsvBtn`
- Key functions: `buildReportDataset`, `getPresetDateRange`, `getCurrentYearRange`, `renderReports`, `renderWorkerWise`, `renderCategoryWise`, `renderLedger`, `exportCsv`, `exportJson`, `importJson`
- Worker thread: `outputs/attendance-payroll-app/report-worker.js`
- Payroll dependency: `outputs/attendance-payroll-app/app/05-wage-and-payroll-calculation/payroll-calculation-rules.js`

## Future File Names

- `reports-ui.js`
- `report-aggregation-rules.js`
- `backup-export-rules.js`
- `reports-export-service.js`
- `reports-worker-service.js`
- `reports-filter-state.js`
