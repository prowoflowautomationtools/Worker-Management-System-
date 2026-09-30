# 00 - Start Here: App Overview

## Business Purpose

This is the entry point for understanding the Worker Management System, how the app is opened, how users move between workflows, and how the project is safely customized.

## Practical Daily Use

- Open the app locally or from GitHub Pages.
- Navigate between Dashboard, Workers, Attendance, Leave, Reports, and Settings.
- Export and import app data for backup or transfer.
- Confirm which folder contains the production app.

## Current Technical Reference

- App shell: `outputs/attendance-payroll-app/index.html`
- Shared utilities: `outputs/attendance-payroll-app/app/00-start-here-app-overview/shared-utilities.js`
- Shared display formatting: money, date, time, day name, duration, CSV, escaping, and browser helpers
- Application coordinator: `outputs/attendance-payroll-app/app.js`
- Business modules: `outputs/attendance-payroll-app/app/` (numbered workflow modules)
- Styling: `outputs/attendance-payroll-app/styles.css`
- Version marker: `outputs/attendance-payroll-app/VERSION.txt`
- Deployment helper: `PUSH-TO-GITHUB.cmd`

## Planned Future File Names (Not Current Files)

- `app-overview.md`
- `navigation-map.md`
- `shared-utilities.js`
- `release-and-version-log.md`
- `technical-reference.md`
## Current Technical Reference

- Shared utilities: `outputs/attendance-payroll-app/app/00-start-here-app-overview/shared-utilities.js`
- UI feedback: `outputs/attendance-payroll-app/app/00-start-here-app-overview/ui-feedback.js`
- Navigation controller: `outputs/attendance-payroll-app/app/00-start-here-app-overview/navigation-controller.js`
- Demo data rules: `outputs/attendance-payroll-app/app/00-start-here-app-overview/demo-data-rules.js`
- Dynamic action binding: `outputs/attendance-payroll-app/app/00-start-here-app-overview/dynamic-action-binding.js`
- Dashboard screen renderer: `outputs/attendance-payroll-app/app/00-start-here-app-overview/dashboard-screen-renderer.js`
- Event bindings: `outputs/attendance-payroll-app/app/00-start-here-app-overview/event-bindings.js`

UI feedback keeps toast notifications and inline validation behavior consistent across all workflows.
