# WorkPay India - Worker Attendance & Payroll

A browser-based Worker Attendance & Payroll Tracking web app built with HTML, CSS, vanilla JavaScript, IndexedDB, Local Storage, Session Storage, Cache Storage, and cookies.

## App

The deployable app lives in:

`outputs/attendance-payroll-app/`

Publish it through the included GitHub Pages workflow. For local testing on Windows, double-click `START-LOCAL-APP.cmd`; it starts an HTTP server using Node.js or Python and opens `http://127.0.0.1:4173/`. You can also run `npm run serve`. Do not open the HTML file directly because `file://` pages have restricted origin behavior and cannot fully exercise PWA features.

## Repository

https://github.com/prowoflowautomationtools/Worker-Management-System-.git

## GitHub Pages Deployment

This repository includes `.github/workflows/pages.yml`. When pushed to GitHub, the workflow publishes `outputs/attendance-payroll-app` to GitHub Pages.

After the repository is pushed:

1. Open the GitHub repository.
2. Go to `Settings` -> `Pages`.
3. Set `Build and deployment` source to `GitHub Actions`.
4. Run the `Deploy WorkPay India to GitHub Pages` workflow, or push to `main`.

The live URL will be:

`https://prowoflowautomationtools.github.io/Worker-Management-System-/`

## Version Log

See [CHANGELOG.md](CHANGELOG.md).

## Architecture and Customization

This project is documented in business-process order so non-technical stakeholders and technical contributors can understand and customize it more easily.

Start with [docs/README.md](docs/README.md).

The business-process folder structure for public understanding and future AI-assisted customization is available at [business-processes/README.md](business-processes/README.md).
For public contribution and AI-assisted maintenance guidance, see [CONTRIBUTING.md](CONTRIBUTING.md).
