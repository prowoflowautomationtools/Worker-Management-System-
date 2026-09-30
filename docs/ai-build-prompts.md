# AI Build Prompt Playbook

This playbook converts the original development conversation into a clean, chronological sequence of reusable prompts. Repeated status requests such as “continue”, “resume”, and “everything working” have been intentionally removed.

Use the prompts in order. For an existing project, begin with the first applicable audit prompt instead of rebuilding working features.

## 1. Build The Initial Application

### Original intent

Build a Worker Attendance & Payroll Tracking Web App using HTML5, CSS3, vanilla JavaScript, and suitable browser storage. Include worker profiles, attendance, check-in/check-out, multiple breaks, leave and holidays, wage calculation, overtime, payroll, reports, Indian Rupee support, validation, offline support, and a scalable architecture.

### Reusable prompt

```text
Build a browser-based Worker Management System for the Indian context.

Use HTML5, CSS3, and vanilla JavaScript only. Use IndexedDB as the primary structured database and use Local Storage, Session Storage, Cache Storage, cookies, and a Service Worker only where appropriate. Keep the application fully functional offline after the first load.

Implement these business workflows:

1. Worker profiles: full name, mandatory primary phone number, optional additional phone numbers, WhatsApp number, email, website, worker type/category, custom worker types, wage type, standard daily hours, hourly rate, daily rate, overtime rate, task rate, and additional compensation.
2. Attendance: date, day, worker, status, check-in, check-out, notes, and complete worker-wise history.
3. Breaks: multiple breaks per workday with start time, end time, type, and custom description.
4. Leave and holidays: type, date or date range, reason, optional attachment, and worker association where applicable.
5. Payroll: minute-accurate gross time, break duration, net working time, standard hours, overtime, regular pay, overtime pay, task pay, allowances, and total wages.
6. Reports: worker, category, date, week, month, and custom range summaries with attendance, times, breaks, net hours, overtime, wages, leave, and holidays.
7. Import/export: JSON backup and restore, plus report export suitable for spreadsheet use.
8. Indian settings: INR currency, configurable date and time formats, Indian financial year, calendar year, and configurable public holidays.

Add CRUD operations for every record type. Validate required fields, duplicate workers, duplicate attendance, invalid check-out, overlapping breaks, negative durations, invalid wage configurations, and invalid date ranges. Display clear inline corrective guidance.

Use a clean, responsive, high-information-density interface for desktop, tablet, and mobile. Keep calculations and data structures extensible for future sites, departments, GPS, QR attendance, biometric integration, PF, ESI, TDS, and Professional Tax without tightly coupling statutory modules to current payroll logic.

Before finishing, test storage, calculations, validation, offline loading, import/export, and all primary workflows.
```

## 2. Add Complete CRUD Operations

### Original intent

Add CRUD operations across the entire application features and functionalities.

### Reusable prompt

```text
Add complete create, read, update, and delete operations to every existing business record without changing existing calculations or storage compatibility.

Cover workers, attendance, breaks, leave, holidays, worker categories, break types, settings, and imported records. Every list must support view, edit, delete, and clear empty states. Use confirmation dialogs for destructive actions, preserve referential integrity, validate edits the same way as creation, and maintain compatibility with existing IndexedDB, Local Storage, and backup data.

Do not replace working business logic. First map each existing form, record model, storage operation, and UI action, then implement only the missing CRUD paths. Test create, edit, delete, cancel, validation failure, and refresh persistence for each workflow.
```

## 3. Establish The Business-Process Architecture

### Original intent

Organize the application using understandable business workflow naming while retaining technical references for developers and AI-assisted contributors.

### Reusable prompt

```text
Refactor the project into a business-process-first structure without breaking the current deployable application.

Keep one stable deployable folder at outputs/attendance-payroll-app/. Use numbered, universally understandable business folders such as:

00-start-here-app-overview
01-worker-records-and-onboarding
02-daily-attendance-register
03-work-breaks-register
04-leave-and-holiday-register
05-wage-and-payroll-calculation
06-reports-reviews-and-exports
07-settings-master-data-and-policies
08-local-data-storage-and-backup
09-user-interface-and-design-system
10-offline-app-and-github-pages-deployment
11-security-validation-and-quality-checks

Inside workflow areas, use technical suffixes such as -controller.js, -renderer.js, -rules.js, -service.js, and -storage.js. Add architecture documentation mapping business terminology to technical files.

Migrate incrementally. Preserve the existing entry point, storage keys, data schemas, browser compatibility, GitHub Pages paths, and user-visible behavior. Use ES modules only where they work reliably under the selected deployment model. Do not over-fragment working code without tests.
```

## 4. Premium UI And UX Modernization

### Original intent

Completely redesign and modernize the application into a premium enterprise SaaS-quality PWA while preserving 100% functional parity.

### Reusable prompt

```text
Modernize the entire interface without rewriting or simplifying business behavior.

Create a reusable design system using semantic CSS custom properties for colors, typography, spacing, borders, radius, shadows, motion, z-index, and layout. Apply it consistently to navigation, dashboard, forms, tables, cards, reports, dialogs, menus, notifications, filters, empty states, loading states, and error states.

Use a professional, precise, premium visual language inspired by modern SaaS products, but do not copy any specific brand. Keep the application information-dense and operational rather than marketing-oriented.

Improve keyboard navigation, focus management, semantic HTML, screen-reader labels, contrast, reduced-motion behavior, responsive layouts, mobile workflows, and touch targets. Fix overflow, overlap, alignment, spacing, and viewport issues at desktop, tablet, and mobile widths. Specifically verify the Attendance break-row layout on desktop.

Preserve all existing forms, workflows, validation, calculations, storage, imports, exports, and data compatibility. Refactor UI code only after understanding the existing implementation. Verify every view before and after changes.
```

## 5. Terminology And Contextual Guidance

### Original intent

Standardize terminology and add tooltips, Learn More dialogs, inline helper text, consistent controls, and responsive fixes without changing behavior.

### Reusable prompt

```text
Perform a terminology and interaction consistency pass across the whole application.

Use simple professional language with consistent capitalization, labels, button names, validation messages, empty states, confirmation messages, and notifications. Add brief tooltips for unfamiliar controls, inline helper text where it prevents errors, and accessible Learn More links that open consistent modal dialogs for detailed explanations.

Standardize dropdowns, popovers, menus, dialogs, date inputs, time inputs, notifications, focus behavior, animations, and validation presentation. Preserve existing branding and architecture. Audit desktop, tablet, and mobile layouts for overflow, overlap, broken alignment, and inaccessible controls. Do not remove or alter business functionality.
```

## 6. Indian Settings, Performance, And Validation

### Original intent

Implement configurable currency, date/time, financial year, Indian holidays, future statutory data structures, performance targets, web workers, and critical validation.

### Reusable prompt

```text
Add or verify these configuration capabilities for the Indian context:

- Multi-currency with INR as the default and support for other currencies.
- Configurable DD/MM/YYYY and other date formats.
- Configurable 12-hour and 24-hour time display.
- Indian financial year from 1 April to 31 March and calendar year from 1 January to 31 December.
- Configurable Indian public holidays.
- Extensible compliance metadata for PF, ESI, TDS, and Professional Tax without coupling current payroll calculations to future statutory rules.

Meet these performance goals where measurable: FCP under 1.5 seconds, LCP under 2.5 seconds, interaction latency under 100 ms, screen transitions under 200 ms, and search results under 100 ms. Add IndexedDB indexes for frequent queries, lazy-load non-critical modules, defer expensive work, and use Web Workers for heavy report aggregation or calculations without freezing the UI.

Validate duplicate attendance, invalid check-out, overlapping breaks, negative durations, invalid wage configurations, duplicate workers, missing mandatory fields, and incorrect date ranges. Use inline messages with clear corrective guidance. Preserve all existing records and behavior.
```

## 7. Console Errors And Browser Runtime Fixes

### Original intent

Resolve console errors shown in the browser, including file-origin manifest errors and favicon 404s, while fixing the desktop break layout.

### Reusable prompt

```text
Run the application through a local HTTP server, not by opening index.html with file://. Inspect the browser console, network panel, and application panel.

Resolve all application-owned console errors, failed resources, missing favicon requests, invalid manifest references, Service Worker registration issues, and incorrect relative asset paths. Do not hide errors or weaken security policies.

Add a valid favicon and ensure the manifest and Service Worker are served through HTTP. Explain which file:// security messages are browser limitations and which are real application defects. Verify the desktop Attendance break-row layout and all core workflows after the fixes.
```

## 8. Regression Audit And Safe Refactoring

### Original intent

Safely refactor the app without regressions, preserving the previous stable version and verifying the latest changes.

### Reusable prompt

```text
Treat the currently working version as the source of truth. Before editing, inspect the repository, Git history, data models, storage keys, deployed output, and current UI behavior.

Create a regression checklist covering navigation, worker CRUD, attendance, check-in/check-out, multiple breaks, payroll, overtime, leave, holidays, attachments, settings, reports, filters, search, import/export, validation, offline loading, and Service Worker updates.

Refactor only one ownership boundary at a time. Keep changes small, preserve backward-compatible data normalization, and do not remove working fallback behavior until replacement behavior has been tested. Run static verification and browser smoke tests after every meaningful step. Keep the last stable commit recoverable and never use destructive Git commands without explicit authorization.
```

## 9. Local Testing And Release Verification

### Original intent

Test the latest changes, resolve server/favicon issues, and confirm the application works end to end.

### Reusable prompt

```text
Start the application using a local HTTP server and test it as an end user.

Verify the initial page load, navigation, dashboard, worker CRUD, attendance form, break-row add/remove/edit behavior, leave and holiday records, payroll calculations, reports and filters, settings, import/export, offline reload, favicon, manifest, Service Worker, and browser console.

Use harmless test data or an exported backup and do not destroy existing user data. Record pass/fail results, reproduction steps, console errors, network failures, and screenshots for any issue. Do not claim release readiness until runtime verification and browser smoke testing both pass.
```

## 10. GitHub Repository And Pages Deployment

### Original intent

Create a Git version log, push the app to the Worker Management System repository, and host it on GitHub Pages for access from any device.

### Reusable prompt

```text
Prepare this static web application for safe GitHub distribution and GitHub Pages deployment.

Keep the deployable application in outputs/attendance-payroll-app/. Add a README, CHANGELOG, architecture documentation, contribution guidance, a local HTTP server helper, a runtime verification script, and a GitHub Pages workflow that publishes only the deployable output folder.

Use the repository remote supplied by the owner. Preserve existing Git history and never force-push over remote work. If local and remote histories diverge, fetch first, inspect both histories, then merge or rebase deliberately. Keep local browser data separate from source control and document JSON backup/export.

Configure GitHub Pages to use GitHub Actions. After pushing, verify the workflow, the deployment URL, cache invalidation, Service Worker update, and a production smoke test from desktop and mobile.
```

## 11. Production Audit And Continuity Handoff

### Original intent

Audit the live version for vulnerabilities and regressions, confirm stable-version preservation, clean irrelevant files, and make the project understandable to future contributors and AI tools.

### Reusable prompt

```text
Audit the live and local versions without changing behavior.

Review client-side security, unsafe HTML generation, attachment handling, imported JSON validation, storage boundaries, Service Worker caching, dependency and workflow permissions, exposed secrets, privacy risks, and regression risk. Compare the deployed output with the verified local version and Git history.

Remove only files proven to be irrelevant and not required by deployment, documentation, backups, or development. Do not delete user data or historical stable versions. Update the README, CHANGELOG, architecture map, business-process documentation, and contributor guidance.

Finish with a continuity report containing: current stable commit, deployment URL, test commands, data-backup procedure, known limitations, pending work, and exact instructions for another AI model to read the repository before editing.
```

## Recommended Handoff Prompt For Any Future AI

```text
You are working on the Worker Management System repository.

Before changing code, read README.md, CHANGELOG.md, CONTRIBUTING.md, docs/README.md, docs/architecture-map.md, docs/ai-build-prompts.md, and business-processes/README.md. Inspect the current Git status and recent history. Treat the deployed output and existing behavior as the source of truth.

Preserve worker CRUD, attendance, breaks, leave, holidays, payroll, overtime, reports, settings, storage compatibility, import/export, offline support, validation, and GitHub Pages deployment. Do not make broad refactors without a regression plan. Run `npm run verify` and browser smoke tests through an HTTP server before committing. Explain any data, schema, deployment, or compatibility risk before making a change.
```

## Build Order Summary

1. Build the functional business workflows.
2. Add complete CRUD and validation.
3. Establish business-process documentation and structure.
4. Modernize UI and responsive behavior.
5. Add terminology guidance and accessibility refinement.
6. Add Indian settings, performance improvements, and worker-based processing.
7. Resolve browser runtime and console issues.
8. Perform controlled refactoring and regression testing.
9. Prepare GitHub, GitHub Pages, versioning, and backup documentation.
10. Audit production and create a continuity handoff.
