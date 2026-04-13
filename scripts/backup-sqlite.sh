#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/prisma/crm.sqlite"
[ -f "$SRC" ] || { echo "crm.sqlite yok: $SRC"; exit 1; }
DEST="$ROOT/prisma/crm.backup-$(date +%Y%m%d-%H%M%S).sqlite"
cp "$SRC" "$DEST"
echo "Yedek: $DEST"
