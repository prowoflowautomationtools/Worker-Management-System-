# Contributing to Worker Management System

## Before Editing

Read `docs/architecture-map.md` and the README for the business workflow affected by the change. Keep the deployable application in `outputs/attendance-payroll-app/` working at every step.

Use the business-process folders to locate rules and documentation:

- `01-worker-profiles`
- `02-attendance-management`
- `03-break-management`
- `04-leave-and-holidays`
- `05-wage-and-payroll-calculation`
- `06-reports-reviews-and-exports`
- `07-settings-master-data-and-policies`
- `08-local-data-storage-and-backup`
- `09-user-interface-and-design-system`
- `10-offline-support-and-deployment`
- `11-security-validation-and-quality-checks`

## Safe Change Rules

- Preserve existing IndexedDB store names, record fields, and import/export compatibility.
- Keep payroll calculations accurate to the minute and preserve existing wage policies.
- Prefer extracting pure rules before moving UI or storage orchestration.
- When adding a runtime file, update `index.html` and `service-worker.js` together.
- Bump the service-worker cache version whenever an offline asset changes.
- Do not open `index.html` directly for production-like testing; use GitHub Pages or an HTTP server.

## Verification

Run the project quality gate from the repository root:

```powershell
npm run verify
```

The command runs `tools/quality-checks/verify-runtime.js`, which checks deployable assets, script ordering, syntax, bootstrap behavior, payroll rules, validation rules, normalization, exports, and the service-worker manifest.

For local browser testing on Windows, double-click `START-LOCAL-APP.cmd`, or run `npm run serve` and open `http://127.0.0.1:4173/`. The launcher uses Node.js when available and falls back to Python. This avoids the restricted `file://` origin.

If `npm` is unavailable, run the verification script directly with Node:

```powershell
node tools/quality-checks/verify-runtime.js
```

Do not include local databases, credentials, personal worker information, or generated browser storage in a commit.

## Pull Requests

Describe the business workflow affected, the compatibility risk, verification performed, and any migration or deployment notes. Keep unrelated formatting and refactors out of the same change.
