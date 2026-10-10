"use strict";

const http = require("node:http");
const { spawn } = require("node:child_process");

const target = process.env.NEXT_INTERNAL_ORIGIN || "http://127.0.0.1:3000";
const targetUrl = new URL(target);
const port = Number(process.env.HA_INGRESS_PORT || 8099);
const ingressProxyAddress = "172.30.32.2";
const routeNames = "api|_next|manifest\\.webmanifest|service-worker\\.js|icon\\.svg|finanzen|kostenrechnung|einkauf|berichte|einstellungen|prospekte|admin|docker|server|logs|home-assistant|netzwerk|nas";
const backend = spawn(process.execPath, ["server.js"], {
  cwd: "/app",
  env: { ...process.env, HOSTNAME: targetUrl.hostname, PORT: targetUrl.port || "3000" },
  stdio: "inherit",
});

function clientAddress(request) {
  return (request.socket.remoteAddress || "").replace(/^::ffff:/, "");
}

function ingressBase(request) {
  const header = request.headers["x-ingress-path"];
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== "string") return null;
  const base = value.replace(/\/+$/, "");
  return /^\/api\/hassio_ingress\/[A-Za-z0-9_-]+$/.test(base) ? base : null;
}

function upstreamPath(requestUrl, base) {
  const parsed = new URL(requestUrl || "/", "http://localhost");
  if (base && (parsed.pathname === base || parsed.pathname.startsWith(`${base}/`))) {
    parsed.pathname = parsed.pathname.slice(base.length) || "/";
  }
  return `${parsed.pathname}${parsed.search}`;
}

function addIngressPrefix(text, base, contentType = "text/html") {
  if (!base) return text;
  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alreadyPrefixed = new RegExp(`^${escapeRegExp(base)}(?:/|$)`);
  const prefixPath = (value) => alreadyPrefixed.test(value) ? value : `${base}${value}`;
  const attrs = /((?:href|src|action|poster|data-src)\s*=\s*["'])(\/(?!\/)[^"']*)/gi;
  const quotedRoutes = new RegExp(`(["'\x60])(\\/(?:${routeNames})(?=\\/|[?#"'\x60])[^"'\x60]*)`, "g");
  const cssUrls = /url\(\s*(["']?)(\/(?!\/)[^"')\s]+)\1\s*\)/gi;
  const rewritten = text
    .replace(attrs, (_match, start, path) => `${start}${prefixPath(path)}`)
    .replace(quotedRoutes, (_match, quote, path) => `${quote}${prefixPath(path)}`);
  // JavaScript URL(/regex/) calls are not CSS url(...) references.
  return /(?:text\/html|text\/css)/i.test(contentType)
    ? rewritten.replace(cssUrls, (_match, quote, path) => `url(${quote}${prefixPath(path)}${quote})`)
    : rewritten;
}

const server = http.createServer((incoming, outgoing) => {
  if (clientAddress(incoming) !== ingressProxyAddress) {
    outgoing.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    outgoing.end("Home Assistant ingress only");
    return;
  }

  const base = ingressBase(incoming);
  if (!base) {
    outgoing.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    outgoing.end("Missing Home Assistant ingress path");
    return;
  }

  const headers = { ...incoming.headers, host: targetUrl.host, "accept-encoding": "identity" };
  headers["x-forwarded-prefix"] = base;
  const proxyRequest = http.request({
    hostname: targetUrl.hostname,
    port: Number(targetUrl.port || 80),
    method: incoming.method,
    path: upstreamPath(incoming.url, base),
    headers,
  }, (proxyResponse) => {
    const contentType = String(proxyResponse.headers["content-type"] || "");
    // The PDF worker is third-party code, not an app page. Rewriting paths
    // inside its regex literals corrupts its JavaScript and prevents startup.
    const isPdfWorker = upstreamPath(incoming.url, base).split("?")[0] === "/cost-pdf.worker.min.mjs";
    if (isPdfWorker || !/(?:text\/|javascript|json)/i.test(contentType)) {
      outgoing.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
      proxyResponse.pipe(outgoing);
      return;
    }

    const chunks = [];
    proxyResponse.on("data", (chunk) => chunks.push(chunk));
    proxyResponse.on("end", () => {
      const body = addIngressPrefix(Buffer.concat(chunks).toString("utf8"), base, contentType);
      const responseHeaders = { ...proxyResponse.headers };
      delete responseHeaders["content-length"];
      delete responseHeaders["transfer-encoding"];
      delete responseHeaders.etag;
      delete responseHeaders["content-md5"];
      responseHeaders["content-length"] = Buffer.byteLength(body);
      outgoing.writeHead(proxyResponse.statusCode || 502, responseHeaders);
      outgoing.end(body);
    });
    proxyResponse.on("error", () => {
      if (!outgoing.headersSent) outgoing.writeHead(502);
      outgoing.end();
    });
  });

  proxyRequest.on("error", () => {
    if (!outgoing.headersSent) outgoing.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    outgoing.end("Cockpit backend is starting or unavailable");
  });
  incoming.pipe(proxyRequest);
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`HA ingress proxy listening on ${port}\n`);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    backend.kill(signal);
  });
}

backend.on("exit", (code) => {
  process.stderr.write(`Cockpit backend exited (${code ?? "signal"})\n`);
  server.close(() => process.exit(code || 1));
});
