# Data Storage Design

The app uses browser-side storage. There is no server database in the current version.

## IndexedDB

Primary durable storage for business records.

Object stores:

- `workers`
- `attendance`
- `leaveRecords`

Important references:

- `openDb`
- `getAll`
- `put`
- `remove`
- `clearStore`

## Local Storage

Stores long-lived preferences and master data.

Key:

- `workpay.settings.v1`

Examples:

- Business/site name
- Default standard hours
- Daily wage policy
- Overtime mode
- Theme
- Date format
- Worker categories
- Break types

## Session Storage

Stores temporary UI state for the current browser session.

Keys:

- `workpay.reportFilter.v1`
- `workpay.activeView`

## Cookies

Stores the last opened view for convenient return.

Key:

- `workpayView`

## Cache Storage and Service Worker

Used only on supported non-`file://` origins such as GitHub Pages or localhost.

References:

- `pwa.js`
- `service-worker.js`
- `manifest.webmanifest`

Important behavior:

- The app avoids loading PWA assets from `file://` because browsers treat local files as unique security origins.
- GitHub Pages supports service worker and installable PWA behavior over HTTPS.

