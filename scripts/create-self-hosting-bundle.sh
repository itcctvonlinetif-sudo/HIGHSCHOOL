#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_DIR="$ROOT/release"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
NAME="zein-page-self-hosting-${STAMP}"
STAGE_DIR="$RELEASE_DIR/.stage-${STAMP}"
ARCHIVE="$RELEASE_DIR/${NAME}.tar.gz"
CHECKSUM="$RELEASE_DIR/${NAME}.sha256"

cleanup() {
  rm -rf "$STAGE_DIR"
}
trap cleanup EXIT

cd "$ROOT"
mkdir -p "$RELEASE_DIR"
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"

echo "==> Building API..."
pnpm --filter @workspace/api-server run build

echo "==> Building frontend..."
PORT=3000 BASE_PATH=/ NODE_ENV=production \
  pnpm --filter @workspace/masjid-istiqlal run build

echo "==> Copying source and deployment files..."
tar \
  --exclude='./.git' \
  --exclude='./.cache' \
  --exclude='./.local' \
  --exclude='./.upm' \
  --exclude='./.agents' \
  --exclude='./.replit' \
  --exclude='./.replitignore' \
  --exclude='./node_modules' \
  --exclude='*/node_modules' \
  --exclude='./release' \
  --exclude='*/.replit-artifact' \
  --exclude='*/.env' \
  --exclude='*/.env.*' \
  --exclude='./.env' \
  --exclude='./.env.*' \
  --exclude='*.log' \
  -C "$ROOT" -cf - . | tar -xf - -C "$STAGE_DIR"

cat > "$STAGE_DIR/BUNDLE-MANIFEST.txt" <<EOF
Zein Page self-hosting bundle
Generated (UTC): ${STAMP}
Frontend build: artifacts/masjid-istiqlal/dist/public
API build: artifacts/api-server/dist/index.mjs
Install guide: SELF-HOSTING.md
Environment template: deploy/env.example
EOF

echo "==> Creating archive..."
tar -czf "$ARCHIVE" -C "$STAGE_DIR" .
(cd "$RELEASE_DIR" && sha256sum "$(basename "$ARCHIVE")" > "$(basename "$CHECKSUM")")

echo
echo "Bundle selesai:"
echo "  $ARCHIVE"
echo "  $CHECKSUM"
echo
echo "Secret, .env, node_modules, cache, dan .git tidak disertakan."