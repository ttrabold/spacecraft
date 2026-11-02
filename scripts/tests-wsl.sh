#!/usr/bin/env bash
# Wie tests.sh, aber für WSL2 mit Chrome unter Windows (braucht networkingMode=mirrored in .wslconfig).
# Optional: bash scripts/tests-wsl.sh <Text> lässt nur Tests laufen, deren Name den Text enthält.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
export CHROME="${CHROME:-/mnt/c/Program Files/Google/Chrome/Application/chrome.exe}"
exec node scripts/tests-lauf.js "$@"
