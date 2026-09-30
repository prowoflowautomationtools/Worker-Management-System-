"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "outputs", "attendance-payroll-app");
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent((requestUrl || "/").split("?")[0]);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = path.resolve(root, relativePath);
  return target.startsWith(root + path.sep) ? target : null;
}

const server = http.createServer((request, response) => {
  const target = resolveRequestPath(request.url);
  if (!target) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  fs.stat(target, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": contentTypes[path.extname(target)] || "application/octet-stream" });
    fs.createReadStream(target).pipe(response);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log("WorkPay local server: http://127.0.0.1:" + port + "/");
});
