#!/usr/bin/env bash
set -euo pipefail
rm -f \
  src/components/OwnedOutfitCard.jsx \
  src/utils/generateWardrobeOutfit.js \
  src/utils/outfitColorRules.js \
  src/context/ClosetContext.jsx \
  src/components/ClosetItemCard.jsx \
  src/components/ClosetItemForm.jsx \
  src/pages/ClosetPage.jsx \
  src/hooks/useClosetItems.js \
  src/hooks/useClosetImageAnalysis.js \
  src/utils/normalizeClosetAnalysis.js
printf 'Phase 13 forward cleanup complete.\n'
