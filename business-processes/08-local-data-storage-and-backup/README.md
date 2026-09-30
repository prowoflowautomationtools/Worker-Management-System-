# 08 - Local Data Storage and Backup

## Business Purpose

Keep worker, attendance, leave, holiday, settings, and backup data reliable in the user's browser.

## Practical Daily Use

- Store daily operational records offline.
- Keep settings and master data available after reload.
- Store last report filters for user convenience.
- Export JSON backup.
- Import JSON backup.
- Delete all local records when needed.

## Current Technical Reference

- IndexedDB stores: `workers`, `attendance`, `leaveRecords`
- IndexedDB service: `outputs/attendance-payroll-app/app/08-local-data-storage-and-backup/local-database.js`
- Settings storage service: `outputs/attendance-payroll-app/app/08-local-data-storage-and-backup/settings-storage.js`
- Session state storage service: `outputs/attendance-payroll-app/app/08-local-data-storage-and-backup/session-state-storage.js`
- Data refresh service: `outputs/attendance-payroll-app/app/08-local-data-storage-and-backup/data-refresh-service.js`
- Record normalization module: `outputs/attendance-payroll-app/app/08-local-data-storage-and-backup/record-normalization-rules.js`
- Local Storage: settings and master data
- Session Storage: report filter state
- Cache Storage: PWA assets
- Cookies: last opened view
- Key functions: `normalizeWorkerRecord`, `normalizeAttendanceRecord`, `normalizeLeaveRecord`, `openDb`, `getAll`, `put`, `remove`, `clearStore`, `loadSettings`, `saveSettings`

## Future File Names

- `local-database.js`
- `record-normalization-rules.js`
- `backup-export-service.js`
- `backup-import-service.js`
- `settings-storage.js`
- `browser-storage-policy.md`
