# Version Log

All notable changes to this project are documented here.

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
