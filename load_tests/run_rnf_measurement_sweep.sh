#!/usr/bin/env bash
set -euo pipefail

K6_BIN="${K6_BIN:-$HOME/.local/bin/k6}"
VU_LIST="${VU_LIST:-1 3 5 7 9}"
RESULTS_FILE="load_tests/results/rnf_measurement_sweep.md"
TMP_SUMMARY="$(mktemp)"

SCENARIOS=(
  "RNF-01 (redirección de página)|load_tests/scenarios/04_concurrent_room_join.js|room_join_duration_ms|1000"
  "RNF-02 (solicitud de amistad)|load_tests/scenarios/20_concurrent_friend_request.js|friend_request_duration_ms|1000"
  "RNF-03 (mensajes, misma sala)|load_tests/scenarios/07_concurrent_message_same_room.js|message_send_duration_ms|2000"
  "RNF-03 (mensajes, salas distintas)|load_tests/scenarios/08_concurrent_message_diff_rooms.js|message_send_duration_ms|2000"
  "RNF-04 (llamada, misma sala)|load_tests/scenarios/11_concurrent_call_same_room.js|call_join_duration_ms|3000"
  "RNF-04 (llamada, salas distintas)|load_tests/scenarios/12_concurrent_call_diff_rooms.js|call_join_duration_ms|3000"
)

mkdir -p "$(dirname "$RESULTS_FILE")"
{
  echo "# Medición de RNF por número de usuarios concurrentes"
  echo
  echo "Generado: $(date '+%Y-%m-%d %H:%M')"
  echo
  echo "No son thresholds del script (no se fuerza ningún límite): cada fila es lo que realmente midió k6 a ese N de usuarios, para comparar después contra el umbral del RNF."
  echo
  echo "| RNF | VUs | % éxito (checks) | p95 medido | umbral RNF |"
  echo "|---|---|---|---|---|"
} > "$RESULTS_FILE"

for entry in "${SCENARIOS[@]}"; do
  IFS='|' read -r label script trend target_ms <<< "$entry"
  pair_start=0
  for vus in $VU_LIST; do
    echo "== $label @ ${vus} VUs =="
    VUS="$vus" PAIR_START="$pair_start" "$K6_BIN" run --summary-export="$TMP_SUMMARY" "$script" || true
    pair_start=$((pair_start + vus))

    success_rate=$(jq -r '.metrics.checks.value // .metrics.checks.rate // "n/a"' "$TMP_SUMMARY" 2>/dev/null || echo "n/a")
    p95=$(jq -r --arg m "$trend" '.metrics[$m]["p(95)"] // "n/a"' "$TMP_SUMMARY" 2>/dev/null || echo "n/a")

    if [[ "$success_rate" != "n/a" ]]; then
      success_pct=$(awk -v r="$success_rate" 'BEGIN { printf "%.1f%%", r * 100 }')
    else
      success_pct="n/a"
    fi
    if [[ "$p95" != "n/a" ]]; then
      p95_ms=$(awk -v p="$p95" 'BEGIN { printf "%.0fms", p }')
    else
      p95_ms="n/a"
    fi

    echo "| $label | $vus | $success_pct | $p95_ms | <${target_ms}ms |" >> "$RESULTS_FILE"
  done
done

rm -f "$TMP_SUMMARY"
echo "Resumen escrito en $RESULTS_FILE"
