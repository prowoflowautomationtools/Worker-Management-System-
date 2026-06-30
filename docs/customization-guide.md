# Customization Guide

This guide explains how users can safely customize the app without breaking core workflows.

## Safe Customizations

These are low-risk changes:

- Change labels, placeholder text, headings, and help text in `index.html`.
- Adjust colors, spacing, fonts, and responsive layout in `styles.css`.
- Add default worker categories or break types in `app.js`.
- Update README and documentation.
- Change GitHub Pages or repository text.

## Medium-Risk Customizations

These require testing after changes:

- Add new attendance status values.
- Add new leave/holiday types.
- Change date formats.
- Change report columns.
- Add new export formats.
- Modify PWA/service-worker caching.

## High-Risk Customizations

These can affect payroll accuracy or stored data compatibility:

- Changing `calculateAttendance`.
- Changing `validateTimes`.
- Changing IndexedDB store names or record keys.
- Changing wage policies.
- Changing how break minutes are deducted.
- Changing import/export JSON structure.

## Recommended AI-Assisted Workflow

When using AI tools to modify the app, ask for changes using both business and technical references.

Example prompt:

```text
Modify 03 - Break Management.
Technical references: addBreakRow, collectBreaks, validateTimes.
Requirement: Add a new default break type called Prayer without changing existing records or payroll calculations.
```

## Regression Checklist

After any change, verify:

- Worker add/edit/delete still works.
- Attendance add/edit/delete still works.
- Break start/end validation still works.
- Leave/holiday add/edit/delete still works.
- Wage calculation still matches expected output.
- CSV export still downloads.
- JSON backup/import still works.
- GitHub Pages deployment still serves the app.

