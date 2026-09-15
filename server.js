/*
 * Zero-dependency static file server for the 3DS/PSP emulator.
 *
 * The azahar (3DS) and ppsspp (PSP) cores are multi-threaded WASM builds,
 * which means the page needs SharedArrayBuffer, which in turn means the
 * response headers below (Cross-Origin-Opener-Policy / Embedder-Policy)
 * have to be present. Most simple static servers don't set these, so a
 * plain `python -m http.server` will NOT work here — use this instead.
 *
 * Usage:
 *   node server.js [port]
 * Then open the printed URL in a browser (Chrome/Firefox/Edge; Safari's
 * support for this is inconsistent).
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.argv[2]) || 8080;
const ROOT = __dirname;

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".wasm": "application/wasm",
    ".data": "application/octet-stream",
    ".zip": "application/zip",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".map": "application/json; charset=utf-8",
};

const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";

    const filePath = path.normalize(path.join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404);
            res.end("Not found: " + urlPath);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            "Content-Type": MIME[ext] || "application/octet-stream",
            "Content-Length": stats.size,
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Resource-Policy": "same-origin",
            "Cache-Control": "no-cache",
        });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`Serving on http://localhost:${PORT}/`);
});
