#!/bin/sh
# يشغّل نبض على جهازك: افتح http://localhost:8080 في المتصفح
cd "$(dirname "$0")"
echo "نبض يعمل الآن على: http://localhost:8080  (للإيقاف: Ctrl+C)"
if command -v python3 >/dev/null 2>&1; then python3 -m http.server 8080
elif command -v python >/dev/null 2>&1; then python -m http.server 8080
else npx --yes serve -l 8080 .
fi
