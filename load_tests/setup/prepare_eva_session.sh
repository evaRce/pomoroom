#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

k6 run --quiet --no-summary --log-format=json prepare_eva_session.js 2>&1 \
  | jq -r 'select(.msg | startswith("SESSION_JSON:")) | .msg' \
  | sed 's/^SESSION_JSON://' \
  > eva_session.json

echo "sesión guardada en $(pwd)/eva_session.json"
jq '.nickname' eva_session.json
