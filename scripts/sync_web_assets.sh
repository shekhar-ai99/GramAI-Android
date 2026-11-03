#!/usr/bin/env bash
# Copies the web app and its content from the GramAI-Web repo into this app's assets.
# Usage: scripts/sync_web_assets.sh /path/to/GramAI-Web
set -euo pipefail
SRC="${1:?usage: sync_web_assets.sh /path/to/GramAI-Web}"
DST="$(cd "$(dirname "$0")/.." && pwd)/app/src/main/assets/www"
rm -rf "$DST"; mkdir -p "$DST/web"
rsync -a --exclude test --exclude README.md "$SRC/web/" "$DST/web/"
rsync -a "$SRC/languages/" "$DST/languages/"
rsync -a "$SRC/recommendations/" "$DST/recommendations/"
echo "synced $(du -sh "$DST" | cut -f1) into app/src/main/assets/www"
