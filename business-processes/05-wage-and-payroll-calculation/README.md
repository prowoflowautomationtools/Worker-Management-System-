# 05 - Wage and Payroll Calculation

## Business Purpose

Convert attendance, breaks, task units, wage settings, and overtime rules into payroll-ready wage amounts.

## Practical Daily Use

- Calculate total time between check-in and check-out.
- Deduct all break durations.
- Compare net working time with standard working hours.
- Calculate overtime where applicable.
- Calculate hourly, daily, task-based, allowance, and overtime pay.
- Display estimated wage before saving attendance.

## Current Technical Reference

- UI area: Attendance preview and Reports
- Payroll rules module: `outputs/attendance-payroll-app/app/05-wage-and-payroll-calculation/payroll-calculation-rules.js`
- Key functions: `calculateAttendance`, `validateTimes`, `sumAttendance`, `sumCalculated`, `validateWorkerWageConfig`
- Worker configuration source: IndexedDB `workers` store
- Settings source: Local Storage settings object
- Report worker consumer: `outputs/attendance-payroll-app/report-worker.js`

## Planned Future File Names (Not Current Files)

- `payroll-calculation-rules.js`
- `payroll-calculation-validation.js`
- `payroll-calculation-service.js`
- `payroll-preview-ui.js`
- `payroll-reporting-adapter.js`
