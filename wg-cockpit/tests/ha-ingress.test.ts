import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Load the real proxy without launching its backend or opening a server port.
const context = vm.createContext({
  URL,
  process: { env: {}, execPath: "node", on() {} },
  require(name: string) {
    if (name === "node:http") return { createServer: () => ({ listen() {} }) };
    if (name === "node:child_process") return { spawn: () => ({ on() {} }) };
    throw new Error(`Unexpected dependency: ${name}`);
  },
});
vm.runInContext(readFileSync(new URL("../ha-ingress-proxy.cjs", import.meta.url), "utf8"), context);
const rewrite = vm.runInContext("addIngressPrefix", context) as (text: string, base: string | null) => string;
const upstream = vm.runInContext("upstreamPath", context) as (url: string, base: string) => string;
const base = "/api/hassio_ingress/test-token";

test("Kostenrechnung menu and client routes stay inside HA ingress", () => {
  for (const path of ["/kostenrechnung", "/kostenrechnung?month=2026-09", "/kostenrechnung/details", "/api/kostenrechnung", "/api/kostenrechnung/session"]) {
    assert.equal(rewrite(`href:"${path}"`, base), `href:"${base}${path}"`);
    assert.equal(upstream(`${base}${path}`, base), path);
  }
  assert.equal(rewrite('<a href="/kostenrechnung">Kostenrechnung</a>', base), `<a href="${base}/kostenrechnung">Kostenrechnung</a>`);
});

test("existing routes and already prefixed links remain correct", () => {
  for (const path of ["/finanzen", "/einkauf", "/berichte", "/einstellungen", "/_next/static/app.js"]) {
    const source = `"${path}"`;
    const expected = `"${base}${path}"`;
    assert.equal(rewrite(source, base), expected);
    assert.equal(rewrite(expected, base), expected);
    assert.equal(rewrite(source, null), source);
  }
  assert.equal(rewrite('href="/"', base), `href="${base}/"`);
  // The PDF loader already adds the ingress base at runtime.
  assert.equal(rewrite('ingress+"/cost-pdf.worker.min.mjs"', base), 'ingress+"/cost-pdf.worker.min.mjs"');
  assert.equal(rewrite('"https://example.com/kostenrechnung"', base), '"https://example.com/kostenrechnung"');
});
