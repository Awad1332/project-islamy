#!/usr/bin/env bash
# ABAYA OS - double-click to start on macOS (includes the labelled demo store).
cd "$(dirname "$0")"
./start.sh --demo
open "http://localhost:3000" 2>/dev/null || true
read -r -p "Press Enter to close…"
