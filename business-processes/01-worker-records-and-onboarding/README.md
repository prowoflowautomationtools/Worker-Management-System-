# 01 - Worker Records and Onboarding

## Business Purpose

Maintain worker master records before recording attendance or calculating wages.

## Practical Daily Use

- Add a worker.
- Capture mandatory phone number and optional WhatsApp, email, website, and other contact details.
- Select or create a worker category.
- Configure wage type, standard hours, rates, overtime rate, task rate, and allowances.
- Edit or delete worker records where allowed.

## Current Technical Reference

- UI area: Workers screen
- Worker record rules: `outputs/attendance-payroll-app/app/01-worker-records-and-onboarding/worker-record-rules.js`
- Key HTML IDs: `workerForm`, `workerName`, `workerPhone`, `workerType`, `wageType`
- Key functions: `saveWorker`, `editWorker`, `deleteWorker`, `renderWorkers`, `findDuplicateWorker`
- Storage: IndexedDB `workers` store

## Planned Future File Names (Not Current Files)

- `worker-records-ui.js`
- `worker-records-rules.js`
- `worker-records-validation.js`
- `worker-records-storage.js`
- `worker-records-service.js`
- Worker screen renderer: `outputs/attendance-payroll-app/app/01-worker-records-and-onboarding/worker-screen-renderer.js`
- Worker profile controller: `outputs/attendance-payroll-app/app/01-worker-records-and-onboarding/worker-profile-controller.js`
