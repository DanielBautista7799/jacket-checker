const RATING_WEIGHTS = {
fire: 4,
good: 1,
not_it: -5,
};

function addScore(record, key, amount) {
if (!key) {
    return;
}

record[key] = (record[key] || 0) + amount;
}

function normalizePiece(piece) {
if (typeof piece !== "string") {
    return null;
}

return piece.trim().toLowerCase();
}

export function buildPreferenceModel(feedback = []) {
const model = {
    closetItems: {},
    colors: {},
    styleTags: {},
    outfitPieces: {},
    totalFeedback: feedback.length,
};

feedback.forEach((entry) => {
    const weight = RATING_WEIGHTS[entry.rating] || 0;

    const itemId =
    entry.wardrobe_item_id ||
    entry.closet_item_id ||
    null;

    addScore(model.closetItems, itemId, weight);
    addScore(model.colors, entry.jacket_color, weight);

    const styleTags = Array.isArray(entry.style_tags)
    ? entry.style_tags
    : [];

    styleTags.forEach((tag) => {
    addScore(model.styleTags, tag, weight);
    });

    const outfitPieces = entry.outfit_json?.pieces;

    if (Array.isArray(outfitPieces)) {
    outfitPieces.forEach((piece) => {
        addScore(
        model.outfitPieces,
        normalizePiece(piece),
        weight
        );
    });
    }
});

return model;
}

export function getItemPreferenceScore(item, preferenceModel) {
if (!item || !preferenceModel) {
    return 0;
}

let score = 0;

const primaryColor =
    item.primary_color ||
    item.color ||
    null;

score += preferenceModel.closetItems[item.id] || 0;
score += preferenceModel.colors[primaryColor] || 0;

if (Array.isArray(item.style_tags)) {
    item.style_tags.forEach((tag) => {
    score += preferenceModel.styleTags[tag] || 0;
    });
}

return Math.max(-20, Math.min(20, score));
}