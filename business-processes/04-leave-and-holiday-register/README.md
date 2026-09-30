# 04 - Leave and Holiday Register

## Business Purpose

Record worker leave, site holidays, festival holidays, national holidays, reasons, and supporting documents.

## Practical Daily Use

- Select worker or record a site-level holiday.
- Select leave or holiday type.
- Enter start date and end date.
- Capture reason or explanation.
- Attach a supporting document where needed.
- Edit or delete leave and holiday records where allowed.

## Current Technical Reference

- UI area: Leave and Holidays screen
- Leave and holiday rules module: `outputs/attendance-payroll-app/app/04-leave-and-holiday-register/leave-holiday-rules.js`
- Leave record rules: `outputs/attendance-payroll-app/app/04-leave-and-holiday-register/leave-record-rules.js`
- Attachment file reader: `outputs/attendance-payroll-app/app/04-leave-and-holiday-register/attachment-file-reader.js`
- Leave screen renderer: `outputs/attendance-payroll-app/app/04-leave-and-holiday-register/leave-screen-renderer.js`
- Leave form controller: `outputs/attendance-payroll-app/app/04-leave-and-holiday-register/leave-form-controller.js`
- Key HTML IDs: `leaveForm`, `leaveWorker`, `leaveType`, `leaveStart`, `leaveEnd`, `leaveReason`, `leaveAttachment`
- Key functions: `getConfiguredHolidayRecords`, `getAllLeaveSources`, `saveLeaveRecord`, `editLeave`, `deleteLeave`, `renderLeaveRecords`, `readAttachment`
- Storage: IndexedDB `leaveRecords` store

## Future File Names

- `leave-holiday-ui.js`
- `leave-holiday-rules.js`
- `leave-holiday-validation.js`
- `leave-holiday-storage.js`
- `leave-holiday-service.js`
