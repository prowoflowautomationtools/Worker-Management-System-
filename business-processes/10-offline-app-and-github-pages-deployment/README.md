# 10 - Offline App and GitHub Pages Deployment

## Business Purpose

Make the app available online through GitHub Pages and keep supported offline behavior for users.

## Practical Daily Use

- Publish the app for access from phone, tablet, laptop, or desktop.
- Cache app shell assets for repeat visits.
- Support installable PWA behavior on HTTPS or localhost.
- Keep local file opening functional without service worker errors.

## Current Technical Reference

- PWA registration: `outputs/attendance-payroll-app/pwa.js`
- Cache logic: `outputs/attendance-payroll-app/service-worker.js`
- App manifest: `outputs/attendance-payroll-app/manifest.webmanifest`
- GitHub Pages source: `outputs/attendance-payroll-app/`
- Push helper: `PUSH-TO-GITHUB.cmd`

## Planned Future File Names (Not Current Files)

The current workflow is `.github/workflows/pages.yml`; the names below are planning examples only.

- `deployment-guide.md`
- `github-pages-workflow.yml`
- `offline-cache-rules.js`
- `pwa-installation-service.js`
- `release-checklist.md`

