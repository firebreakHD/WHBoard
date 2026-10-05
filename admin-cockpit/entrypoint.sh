#!/bin/sh
set -eu
if [ -f /data/options.json ]; then
  export WG_COCKPIT_URL="$(node -e 'const fs=require("fs");process.stdout.write(JSON.parse(fs.readFileSync("/data/options.json","utf8")).wg_cockpit_url||"")')"
fi
exec node /app/ha-ingress-proxy.cjs
