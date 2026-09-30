# 11 - Security, Validation, and Quality Checks

## Business Purpose

Protect user data, prevent invalid records, and reduce regressions before releasing changes.

## Practical Daily Use

- Check duplicate attendance.
- Check invalid check-out time.
- Check overlapping breaks.
- Check negative durations.
- Check invalid wage settings.
- Check duplicate worker records.
- Check missing mandatory fields.
- Check incorrect date ranges.
- Review import/export safety.
- Run browser and console checks before release.

## Current Technical Reference

- Validation rules module: `outputs/attendance-payroll-app/app/11-security-validation-and-quality-checks/validation-rules.js`
- Validation functions: `validateTimes`, `validateWorkerWageConfig`, `findDuplicateWorker`, `parsePublicHolidayInput`
- Import/export functions: `importJson`, `exportJson`
- Runtime files to parse-check: `app.js`, `pwa.js`, `service-worker.js`, `report-worker.js`

## Planned Future File Names (Not Current Files)

- `validation-checklist.md`
- `validation-rules.js`
- `security-review-checklist.md`
- `regression-test-plan.md`
- `release-qa-checklist.md`
- `data-safety-rules.js`
## Repeatable Check

The technical verification script is at `tools/quality-checks/verify-runtime.js`. Run `npm run verify` from the project root before publishing structural changes. It does not modify IndexedDB data or browser settings, and the project has no package dependencies.
## Current Technical Reference

- Validation rules: `outputs/attendance-payroll-app/app/11-security-validation-and-quality-checks/validation-rules.js`
- Duplicate record rules: `outputs/attendance-payroll-app/app/11-security-validation-and-quality-checks/duplicate-record-rules.js`

Duplicate worker and attendance checks continue to use IndexedDB indexes when available. The extracted rules module provides the same in-memory fallback for offline and test scenarios.
