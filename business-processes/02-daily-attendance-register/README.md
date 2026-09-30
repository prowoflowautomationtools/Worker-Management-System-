# 02 - Daily Attendance Register

## Business Purpose

Record worker attendance for each date and convert daily activity into payroll-ready time data.

## Practical Daily Use

- Select worker and attendance date.
- Record attendance status.
- Enter check-in and check-out time.
- Enter task units or task-rate override where applicable.
- Add attendance notes for site, shift, late reason, or supervisor remarks.
- Edit, clear, or delete attendance records.

## Current Technical Reference

- UI area: Attendance screen
- Attendance record rules: `outputs/attendance-payroll-app/app/02-daily-attendance-register/attendance-record-rules.js`
- Attendance form controller: `outputs/attendance-payroll-app/app/02-daily-attendance-register/attendance-form-controller.js`
- Key HTML IDs: `attendanceForm`, `attendanceWorker`, `attendanceDate`, `attendanceStatus`, `checkIn`, `checkOut`
- Key functions: `saveAttendance`, `buildAttendanceFromForm`, `editAttendance`, `deleteAttendance`, `renderAttendanceHistory`
- Storage: IndexedDB `attendance` store

## Planned Future File Names (Not Current Files)

- `daily-attendance-ui.js`
- `daily-attendance-rules.js`
- `daily-attendance-validation.js`
- `daily-attendance-storage.js`
- `daily-attendance-service.js`
- Attendance screen renderer: `outputs/attendance-payroll-app/app/02-daily-attendance-register/attendance-screen-renderer.js`
