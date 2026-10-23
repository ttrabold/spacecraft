#!/usr/bin/env bash
# Baut dist/spacecraft.zip nur aus den Dateien, die das Spiel zur Laufzeit wirklich lädt.
# Liste wird aus index.html und den Manifesten abgeleitet, nichts ist fest verdrahtet.
# Dazu kommen alle Sprachvarianten (manifest*.webmanifest, ANLEITUNG*.md), die das Spiel je nach Sprache nachlädt.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

OUT="${1:-dist/spacecraft.zip}"

# Übersetzungen prüfen (gleiche Schlüssel, Manifeste passend), sonst kein ZIP
[ -f scripts/i18n-check.js ] && node scripts/i18n-check.js
[ -f index.html ] || { echo "index.html fehlt" >&2; exit 1; }

# Lokale Verweise aus index.html (href/src), ohne ?v=…, ohne http(s)-Links und ohne Anker
# (auch die Skriptliste im Lader: "js/….js")
refs=$({ grep -oE '(href|src)="[^"]+"' index.html; grep -oE '"js/[^"]+\.js"' index.html | sed 's/^/src=/'; grep -oE 'css/style\.css' index.html | sed 's/^/href="/;s/$/"/'; } | sed -E 's/^(href|src)="//; s/"$//; s/[?#].*$//' | grep -vE '^(https?:|//|data:|$)|[+]' || true)

files=$(printf '%s\n' index.html $refs | sort -u)

# Sprachvarianten: Manifeste und Anleitungen (werden zur Laufzeit je nach Sprache geladen)
langfiles=$(ls manifest*.webmanifest ANLEITUNG*.md 2>/dev/null || true)
files=$(printf '%s\n%s\n' "$files" "$langfiles" | sort -u)

# Icons aus allen Manifesten
for m in manifest*.webmanifest; do
  [ -f "$m" ] || continue
  icons=$(grep -oE '"src":"[^"]+"' "$m" | sed -E 's/"src":"//; s/"$//')
  files=$(printf '%s\n%s\n' "$files" "$icons" | sort -u)
done

missing=0
for f in $files; do [ -f "$f" ] || { echo "Fehlt: $f" >&2; missing=1; }; done
[ "$missing" = 0 ] || exit 1

# sw.js bewusst nicht dabei: im itch-iframe unnötig und kann Updates verklemmen
files=$(printf '%s\n' "$files" | grep -vx 'sw.js')

mkdir -p "$(dirname "$OUT")"
rm -f "$OUT"
printf '%s\n' "$files" | zip -q -X "$OUT" -@

echo "Erstellt: $OUT ($(du -h "$OUT" | cut -f1), $(printf '%s\n' "$files" | wc -l | tr -d ' ') Dateien)"
unzip -Z1 "$OUT"
