# 03 - Work Breaks Register

## Business Purpose

Record all workday breaks so net working time and wage calculations stay accurate.

## Practical Daily Use

- Add multiple breaks for the same attendance day.
- Record break start time and end time.
- Select break type such as Lunch, Tea, Rest, or Other.
- Specify details when the type is Other.
- Remove incorrect break rows.

## Current Technical Reference

- UI area: Break rows inside Attendance screen
- Break record rules: `outputs/attendance-payroll-app/app/03-work-breaks-register/break-record-rules.js`
- Attendance break controller: `outputs/attendance-payroll-app/app/03-work-breaks-register/attendance-break-controller.js`
- Key HTML area: `breakRows`
- Key functions: `addBreakRow`, `collectBreaks`, `renderBreakTypeOptions`, `validateTimes`
- Calculation dependency: `calculateAttendance`

## Planned Future File Names (Not Current Files)

- `work-breaks-ui.js`
- `work-breaks-rules.js`
- `work-breaks-validation.js`
- `work-breaks-storage.js`
- `work-breaks-service.js`
