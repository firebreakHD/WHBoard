#!/bin/sh
set -eu
if [ -f /data/options.json ]; then
  configured_sync_seconds="$(node -e 'const fs=require("fs");const value=Number(JSON.parse(fs.readFileSync("/data/options.json","utf8")).sync_interval_seconds);process.stdout.write(String(Number.isFinite(value)?Math.min(10,Math.max(1,Math.round(value))):2))')"
else
  configured_sync_seconds=2
fi
export WG_SYNC_INTERVAL_MS=$((configured_sync_seconds * 1000))
exec node /app/ha-ingress-proxy.cjs
