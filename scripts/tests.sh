#!/usr/bin/env bash
# Führt tests/index.html in Chrome ohne Fenster aus (über das DevTools-Protokoll) und wertet die ✅/❌-Zeilen aus.
# Optional: bash scripts/tests.sh <Text> lässt nur Tests laufen, deren Name den Text enthält.
# Maßgeblich bleibt die Testseite im Browser; das hier ist die Kurzform für die Kommandozeile.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
exec node scripts/tests-lauf.js "$@"
