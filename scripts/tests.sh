#!/usr/bin/env bash
# Führt tests/index.html in Chrome ohne Fenster aus und wertet die ✅/❌-Zeilen aus.
# Maßgeblich bleibt die Testseite im Browser; das hier ist die Kurzform für die Kommandozeile.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PROFIL="$(mktemp -d "${TMPDIR:-/tmp}/sc-tests.XXXXXX")"
trap 'rm -rf "$PROFIL"' EXIT
DOM=$("$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$PROFIL" \
  --allow-file-access-from-files --virtual-time-budget="${BUDGET:-60000}" \
  --dump-dom "file://$PWD/tests/index.html" 2>/dev/null)
ZEILEN=$(printf '%s' "$DOM" | perl -ne 'while(/<div class="(?:ok|fehl|ende)">(.*?)<\/div>/g){ my $z=$1; $z=~s/&lt;/</g; $z=~s/&gt;/>/g; $z=~s/&amp;/&/g; print "$z\n"; }' || true)
printf '%s\n' "$ZEILEN" | grep -E '^❌' || true
ENDE=$(printf '%s\n' "$ZEILEN" | grep -E '^Fertig:' || true)
[ -n "$ENDE" ] || { echo "Keine Abschlusszeile – Tests nicht durchgelaufen"; exit 1; }
echo "$ENDE"
printf '%s\n' "$ZEILEN" | grep -qE '^❌' && exit 1
printf '%s\n' "$ENDE" | grep -q ', 0 fehlgeschlagen' || exit 1
