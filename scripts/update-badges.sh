#!/usr/bin/env bash
# Run tests for all skills in parallel and generate SVG badges.
# Usage: ./scripts/update-badges.sh

set -euo pipefail

BADGE_DIR="assets/badges"
TEMP_DIR=$(mktemp -d)
mkdir -p "$BADGE_DIR"

generate_badge() {
  local name="$1" pass="$2" total="$3" file="$4"

  if [ "$pass" -eq "$total" ]; then
    color="#22c55e" # green
    label="$pass/$total passing"
  elif [ "$pass" -gt 0 ]; then
    color="#eab308" # yellow
    label="$pass/$total passing"
  else
    color="#ef4444" # red
    label="failing"
  fi

  local name_width=$(( ${#name} * 7 + 12 ))
  local label_width=$(( ${#label} * 7 + 12 ))
  local total_width=$(( name_width + label_width ))

  cat > "$file" << SVG
<svg xmlns="http://www.w3.org/2000/svg" width="${total_width}" height="20" role="img">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${total_width}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${name_width}" height="20" fill="#555"/>
    <rect x="${name_width}" width="${label_width}" height="20" fill="${color}"/>
    <rect width="${total_width}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="$(( name_width / 2 ))" y="14">${name}</text>
    <text x="$(( name_width + label_width / 2 ))" y="14">${label}</text>
  </g>
</svg>
SVG
}

run_skill_test() {
  local skill="$1"
  local output
  output=$(cd "skills/$skill/cli" && bun test 2>&1 || true)

  local pass fail
  pass=$(echo "$output" | grep -oE '[0-9]+ pass' | grep -oE '[0-9]+' || echo "0")
  fail=$(echo "$output" | grep -oE '[0-9]+ fail' | grep -oE '[0-9]+' || echo "0")

  echo "$pass $((pass + fail))" > "$TEMP_DIR/$skill.txt"
}

SKILLS=(boliga boligsiden jobbank-search jobdanmark-search jobindex-search jobnet-search medrxiv-search pubmed-database)

echo "Running tests in parallel..."

for skill in "${SKILLS[@]}"; do
  run_skill_test "$skill" &
done

wait
echo ""

total_pass=0
total_all=0

for skill in "${SKILLS[@]}"; do
  read -r pass total < "$TEMP_DIR/$skill.txt"
  total_pass=$((total_pass + pass))
  total_all=$((total_all + total))

  if [ "$pass" -eq "$total" ]; then
    status="✓"
  else
    status="✗"
  fi
  printf "  %s %-20s %s/%s passing\n" "$status" "$skill" "$pass" "$total"

  generate_badge "tests" "$pass" "$total" "$BADGE_DIR/$skill.svg"
done

echo ""
echo "Total: $total_pass/$total_all passing"
echo "Badges updated in $BADGE_DIR/"

rm -rf "$TEMP_DIR"
