#!/bin/sh
set -eu
if [ -f /data/options.json ]; then
  export ADMIN_COCKPIT_URL="$(node -e 'const fs=require("fs");process.stdout.write(JSON.parse(fs.readFileSync("/data/options.json","utf8")).admin_cockpit_url||"")')"
  configured_database_url="$(node -e 'const fs=require("fs");process.stdout.write(JSON.parse(fs.readFileSync("/data/options.json","utf8")).database_url||"")')"
  if [ -n "$configured_database_url" ]; then export DATABASE_URL="$configured_database_url"; fi
fi
exec node /app/ha-ingress-proxy.cjs
