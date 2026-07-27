#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p build/ios/logs
LOG="build/ios/logs/final-free-check-$(date +%Y%m%d-%H%M%S).log"

exec > >(tee "$LOG") 2>&1

echo "Jacket Checker final free-release gate"
echo "Repository: $ROOT"
echo "Log: $LOG"
echo

npm run test:predeploy
npm audit --omit=dev
npm run mobile:sync
node scripts/test-ios-release-readiness.mjs
node scripts/test-ios-free-finalization.mjs
npm run mobile:release:simulator

echo
echo "FINAL FREE RELEASE CHECK PASSED"
echo "Next: npm run ios:free:open"
