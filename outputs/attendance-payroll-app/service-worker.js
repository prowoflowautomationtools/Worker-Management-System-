"use strict";

const CACHE_NAME = "workpay-india-shell-v59";
const APP_SHELL = [
  "./",
  "./index.html",
  "./app/00-start-here-app-overview/shared-utilities.js",
  "./app/00-start-here-app-overview/ui-feedback.js",
  "./app/00-start-here-app-overview/navigation-controller.js",
  "./app/00-start-here-app-overview/demo-data-rules.js",
  "./app/00-start-here-app-overview/dynamic-action-binding.js",
  "./app/00-start-here-app-overview/dashboard-screen-renderer.js",
  "./app/00-start-here-app-overview/event-bindings.js",
  "./app/01-worker-records-and-onboarding/worker-record-rules.js",
  "./app/01-worker-records-and-onboarding/worker-screen-renderer.js",
  "./app/01-worker-records-and-onboarding/worker-profile-controller.js",
  "./app/01-worker-records-and-onboarding/worker-profile-controller.js",
  "./app/02-daily-attendance-register/attendance-record-rules.js",
  "./app/02-daily-attendance-register/attendance-screen-renderer.js",
  "./app/02-daily-attendance-register/attendance-form-controller.js",
  "./app/03-work-breaks-register/break-record-rules.js",
  "./app/03-work-breaks-register/attendance-break-controller.js",
  "./app/04-leave-and-holiday-register/leave-record-rules.js",
  "./app/04-leave-and-holiday-register/attachment-file-reader.js",
  "./app/04-leave-and-holiday-register/leave-holiday-rules.js",
  "./app/04-leave-and-holiday-register/leave-screen-renderer.js",
  "./app/04-leave-and-holiday-register/leave-form-controller.js",
  "./app/05-wage-and-payroll-calculation/payroll-calculation-rules.js",
  "./app/06-reports-reviews-and-exports/report-aggregation-rules.js",
  "./app/06-reports-reviews-and-exports/backup-export-rules.js",
  "./app/06-reports-reviews-and-exports/report-screen-renderer.js",
  "./app/06-reports-reviews-and-exports/report-filter-controller.js",
  "./app/06-reports-reviews-and-exports/import-export-controller.js",
  "./app/06-reports-reviews-and-exports/report-worker-client.js",
  "./app/06-reports-reviews-and-exports/file-download-service.js",
  "./app/06-reports-reviews-and-exports/backup-import-service.js",
  "./app/07-settings-master-data-and-policies/settings-master-data-rules.js",
  "./app/07-settings-master-data-and-policies/master-data-rules.js",
  "./app/07-settings-master-data-and-policies/master-data-screen-renderer.js",
  "./app/07-settings-master-data-and-policies/settings-form-controller.js",
  "./app/07-settings-master-data-and-policies/master-data-controller.js",
  "./app/08-local-data-storage-and-backup/settings-storage.js",
  "./app/08-local-data-storage-and-backup/session-state-storage.js",
  "./app/08-local-data-storage-and-backup/local-database.js",
  "./app/08-local-data-storage-and-backup/record-normalization-rules.js",
  "./app/08-local-data-storage-and-backup/data-refresh-service.js",
  "./app/08-local-data-storage-and-backup/application-storage-adapter.js",
  "./app/11-security-validation-and-quality-checks/validation-rules.js",
  "./app/11-security-validation-and-quality-checks/duplicate-record-rules.js",
  "./styles.css",
  "./app.js",
  "./report-worker.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
