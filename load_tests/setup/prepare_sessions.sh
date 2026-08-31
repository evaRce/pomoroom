#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

k6 run --quiet --no-summary --log-format=json prepare_sessions.js 2>&1 \
  | jq -r 'select(.msg | startswith("SESSIONS_JSON:")) | .msg' \
  | sed 's/^SESSIONS_JSON://' \
  > sessions.json

echo "sesiones guardadas en $(pwd)/sessions.json"
jq '.sessions | length' sessions.json
