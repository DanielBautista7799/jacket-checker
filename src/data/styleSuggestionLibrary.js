export const STYLE_SUGGESTION_LIBRARY = {
  streetwear: {
    label: "Streetwear",
    tone: "relaxed and street-ready",
    fitDirections: {
      relaxed: [
        "Keep the fit relaxed without letting every piece feel oversized",
        "Use easy proportions with one roomier piece",
      ],
      fitted: [
        "Keep the base clean and fitted so the jacket stays central",
        "Use a closer base with relaxed pants for balance",
      ],
      oversized: [
        "Lean into a roomy silhouette with clean footwear",
        "Keep the shapes loose but the color palette controlled",
      ],
      layered: [
        "Use simple layers and let the jacket finish the look",
        "Keep the layers easy and avoid stacking too many bulky pieces",
      ],
      default: ["Keep the proportions relaxed and balanced"],
    },
    warm: {
      tops: ["relaxed tee", "clean graphic tee", "lightweight tee"],
      bottoms: ["loose cargos", "straight-leg jeans", "relaxed pants"],
      shoes: ["clean sneakers", "simple high-tops", "low-profile sneakers"],
    },
    mild: {
      tops: ["tee", "light hoodie", "simple crewneck"],
      bottoms: ["relaxed cargos", "straight-leg jeans", "loose dark denim"],
      shoes: ["clean sneakers", "high-tops", "sturdy low-profile sneakers"],
    },
    cold: {
      tops: ["hoodie", "heavyweight tee with a warm base", "simple crewneck"],
      bottoms: ["relaxed cargos", "dark denim", "heavier straight-leg pants"],
      shoes: ["high-tops", "sturdy sneakers", "simple boots"],
    },
    weatherNotes: {
      rain: [
        "Keep the shoes weather-friendly and avoid extra-long hems.",
        "Use practical footwear and keep the lower half easy to manage in rain.",
      ],
      wind: [
        "Keep the layers close enough that they do not move around in the wind.",
        "Skip loose accessories and keep the layers controlled.",
      ],
      rain_wind: [
        "Use weather-friendly shoes and keep the layers controlled in the wind.",
        "Keep the base light, the footwear practical, and the loose details minimal.",
      ],
      cold: [
        "Add a warm base underneath without changing the relaxed silhouette.",
        "Use one warm layer under the jacket and keep the rest simple.",
      ],
      hot: [
        "Keep the base lightweight so the outfit does not feel heavy.",
        "Use breathable pieces underneath and let the jacket stay optional when possible.",
      ],
      default: ["Keep the look simple and let the jacket carry the outfit."],
    },
  },

  minimal: {
    label: "Minimal",
    tone: "clean and intentional",
    fitDirections: {
      relaxed: [
        "Keep the shapes relaxed but clean",
        "Use soft structure with very little visual clutter",
      ],
      fitted: [
        "Keep the lines clean and slightly fitted",
        "Use a neat base and straight, simple proportions",
      ],
      oversized: [
        "Use one oversized shape and keep everything else controlled",
        "Let the jacket be the roomy piece and keep the rest simple",
      ],
      layered: [
        "Keep the layers thin, tonal, and uncomplicated",
        "Use clean layers with no unnecessary details",
      ],
      default: ["Keep the lines clean and the palette controlled"],
    },
    warm: {
      tops: ["plain tee", "clean short-sleeve knit", "lightweight top"],
      bottoms: ["straight-leg pants", "simple trousers", "clean dark denim"],
      shoes: ["low-profile sneakers", "clean leather sneakers", "simple slip-ons"],
    },
    mild: {
      tops: ["plain tee", "lightweight knit", "clean long-sleeve"],
      bottoms: ["straight-leg trousers", "dark denim", "simple pants"],
      shoes: ["low-profile sneakers", "simple boots", "clean leather sneakers"],
    },
    cold: {
      tops: ["simple knit", "clean thermal base", "light turtleneck"],
      bottoms: ["straight-leg trousers", "dark structured pants", "clean dark denim"],
      shoes: ["simple boots", "minimal sneakers", "clean leather shoes"],
    },
    weatherNotes: {
      rain: [
        "Keep the shoes simple but weather-friendly and avoid dragging hems.",
        "Choose practical footwear without adding extra visual clutter.",
      ],
      wind: [
        "Keep the layers streamlined so the silhouette stays clean.",
        "Use close, simple layers and skip loose accessories.",
      ],
      rain_wind: [
        "Keep the layers streamlined and use clean weather-friendly shoes.",
        "Use practical footwear and keep every layer close and simple.",
      ],
      cold: [
        "Add a warm base layer underneath while keeping the outside clean.",
        "Use a thin knit or thermal under the jacket without adding bulk.",
      ],
      hot: [
        "Keep every piece lightweight and let the color contrast do the work.",
        "Use breathable basics and avoid unnecessary layering.",
      ],
      default: ["Keep the finish clean and let the color balance do the work."],
    },
  },

  athletic: {
    label: "Athletic",
    tone: "comfortable and movement-friendly",
    fitDirections: {
      relaxed: [
        "Keep the fit easy but tapered enough to look intentional",
        "Use comfortable shapes with a clean finish",
      ],
      fitted: [
        "Keep the base fitted and movement-friendly",
        "Use a clean athletic fit without making every piece tight",
      ],
      oversized: [
        "Use a roomier jacket with a more tapered base",
        "Balance the oversized layer with cleaner athletic pieces",
      ],
      layered: [
        "Use light performance layers that move easily",
        "Keep the layers functional and low-bulk",
      ],
      default: ["Keep the fit comfortable, clean, and easy to move in"],
    },
    warm: {
      tops: ["performance tee", "lightweight athletic tee", "simple breathable top"],
      bottoms: ["tapered joggers", "clean athletic shorts", "lightweight track pants"],
      shoes: ["trainers", "running shoes", "clean athletic sneakers"],
    },
    mild: {
      tops: ["performance tee", "light sweatshirt", "clean quarter-zip base"],
      bottoms: ["tapered joggers", "track pants", "clean athletic pants"],
      shoes: ["trainers", "running shoes", "simple athletic sneakers"],
    },
    cold: {
      tops: ["fitted thermal base", "warm performance layer", "simple sweatshirt"],
      bottoms: ["warm joggers", "tapered track pants", "clean technical pants"],
      shoes: ["trainers", "weather-ready running shoes", "sturdy athletic sneakers"],
    },
    weatherNotes: {
      rain: [
        "Use grippier, weather-friendly shoes and keep the lower half practical.",
        "Keep the footwear functional and avoid absorbent layers.",
      ],
      wind: [
        "Use fitted layers so the wind does not catch loose fabric.",
        "Keep the base close and the outer silhouette clean.",
      ],
      rain_wind: [
        "Use fitted layers and weather-friendly trainers for the wet, windy conditions.",
        "Keep the outfit functional with close layers and practical shoes.",
      ],
      cold: [
        "Use a warm performance base underneath instead of adding bulky layers.",
        "Add a thermal base while keeping the movement-friendly shape.",
      ],
      hot: [
        "Keep the base breathable and avoid heavy joggers or sweatshirts.",
        "Use lightweight performance pieces underneath.",
      ],
      default: ["Keep the outfit functional and easy to move in."],
    },
  },

  smart_casual: {
    label: "Smart casual",
    tone: "polished without feeling overdressed",
    fitDirections: {
      relaxed: [
        "Keep the fit relaxed but polished",
        "Use easy proportions with a clean finish",
      ],
      fitted: [
        "Keep the lines neat and slightly tailored",
        "Use a clean fitted base with straight trousers",
      ],
      oversized: [
        "Let the jacket be the relaxed piece and keep the rest refined",
        "Balance the roomy layer with cleaner, straighter pieces",
      ],
      layered: [
        "Use thin, polished layers with clear lines",
        "Keep the layers neat and avoid bulky overlaps",
      ],
      default: ["Keep the proportions polished and easy"],
    },
    warm: {
      tops: ["clean tee", "open-collar shirt", "lightweight polo"],
      bottoms: ["chinos", "light trousers", "clean dark denim"],
      shoes: ["leather sneakers", "loafers", "simple low-profile shoes"],
    },
    mild: {
      tops: ["clean tee", "light knit", "button-down"],
      bottoms: ["chinos", "straight trousers", "dark denim"],
      shoes: ["leather sneakers", "loafers", "simple boots"],
    },
    cold: {
      tops: ["light knit", "clean layered shirt", "fine-gauge sweater"],
      bottoms: ["trousers", "dark chinos", "structured dark denim"],
      shoes: ["simple boots", "leather sneakers", "loafers with warm socks"],
    },
    weatherNotes: {
      rain: [
        "Choose clean weather-friendly shoes and keep the trousers off the ground.",
        "Keep the footwear polished but practical for wet conditions.",
      ],
      wind: [
        "Keep the layers neat and skip loose scarves or oversized details.",
        "Use close, polished layers so the wind does not disrupt the shape.",
      ],
      rain_wind: [
        "Use polished weather-friendly shoes and keep the layers neat and close.",
        "Keep the outfit refined with practical footwear and controlled layers.",
      ],
      cold: [
        "Add a fine knit underneath instead of a bulky sweatshirt.",
        "Use a warm, clean base layer that keeps the look polished.",
      ],
      hot: [
        "Use a breathable top and lightweight trousers underneath.",
        "Keep the fabrics light so the outfit stays polished without feeling heavy.",
      ],
      default: ["Keep the finish polished but easy."],
    },
  },

  techwear: {
    label: "Techwear",
    tone: "dark, functional, and streamlined",
    fitDirections: {
      relaxed: [
        "Keep the silhouette relaxed but controlled",
        "Use functional shapes without letting the outfit feel sloppy",
      ],
      fitted: [
        "Keep the base fitted and the outer layer structured",
        "Use close technical layers with clean lines",
      ],
      oversized: [
        "Use one oversized technical layer with a tapered base",
        "Balance the larger jacket with controlled lower proportions",
      ],
      layered: [
        "Layer technical pieces without adding unnecessary bulk",
        "Keep the layers functional, dark, and streamlined",
      ],
      default: ["Keep the silhouette functional and controlled"],
    },
    warm: {
      tops: ["technical tee", "lightweight dark base", "clean performance top"],
      bottoms: ["tapered cargos", "technical pants", "clean utility pants"],
      shoes: ["black sneakers", "technical trainers", "low-profile boots"],
    },
    mild: {
      tops: ["dark base layer", "technical long-sleeve", "light technical hoodie"],
      bottoms: ["technical cargos", "tapered utility pants", "clean dark pants"],
      shoes: ["black sneakers", "technical boots", "weather-ready trainers"],
    },
    cold: {
      tops: ["fitted thermal base", "technical hoodie", "warm dark base layer"],
      bottoms: ["weather-ready cargos", "technical pants", "tapered utility pants"],
      shoes: ["technical boots", "weather-ready sneakers", "dark trail shoes"],
    },
    weatherNotes: {
      rain: [
        "Lean into weather-ready textures and keep the footwear practical.",
        "Use water-friendly shoes and keep the lower layers functional.",
      ],
      wind: [
        "Keep the layers close, technical, and free of loose details.",
        "Use controlled layers so the silhouette stays sharp in the wind.",
      ],
      rain_wind: [
        "Use weather-ready footwear and keep every layer close and functional.",
        "Lean into technical textures with controlled layers and practical shoes.",
      ],
      cold: [
        "Use a fitted thermal base to add warmth without disrupting the shape.",
        "Add one technical warm layer underneath and keep the outside streamlined.",
      ],
      hot: [
        "Use lightweight technical fabrics and keep the base minimal.",
        "Keep the layers breathable and low-bulk.",
      ],
      default: ["Keep the details functional and the palette controlled."],
    },
  },

  vintage: {
    label: "Vintage",
    tone: "relaxed and worn-in",
    fitDirections: {
      relaxed: [
        "Keep the fit easy and naturally worn-in",
        "Use relaxed proportions without making the outfit look careless",
      ],
      fitted: [
        "Keep the base neat and let the jacket bring the vintage character",
        "Use a cleaner fit with one textured vintage piece",
      ],
      oversized: [
        "Lean into a roomy throwback silhouette",
        "Use a larger jacket with simple, straight pieces underneath",
      ],
      layered: [
        "Use textured layers and keep the colors grounded",
        "Layer simple vintage shapes without overdoing the details",
      ],
      default: ["Keep the fit relaxed and naturally worn-in"],
    },
    warm: {
      tops: ["washed tee", "simple retro tee", "light knit polo"],
      bottoms: ["straight-leg denim", "relaxed chinos", "washed dark pants"],
      shoes: ["retro sneakers", "simple canvas shoes", "clean vintage-style sneakers"],
    },
    mild: {
      tops: ["washed tee", "crewneck", "textured long-sleeve"],
      bottoms: ["straight-leg jeans", "relaxed chinos", "dark denim"],
      shoes: ["retro sneakers", "simple boots", "canvas shoes"],
    },
    cold: {
      tops: ["textured knit", "worn-in crewneck", "warm retro base"],
      bottoms: ["straight-leg dark denim", "heavier chinos", "relaxed wool-blend pants"],
      shoes: ["simple boots", "retro sneakers", "sturdy leather shoes"],
    },
    weatherNotes: {
      rain: [
        "Use sturdy shoes and keep delicate suede or long hems out of the rain.",
        "Choose the more practical vintage pieces and avoid absorbent footwear.",
      ],
      wind: [
        "Keep the layers grounded and skip loose vintage accessories.",
        "Use a closer base so the relaxed pieces stay controlled.",
      ],
      rain_wind: [
        "Use sturdy footwear and keep the relaxed layers controlled.",
        "Choose practical vintage pieces and avoid loose or delicate details.",
      ],
      cold: [
        "Add a textured warm layer underneath without changing the vintage feel.",
        "Use a warm knit or crewneck under the jacket.",
      ],
      hot: [
        "Keep the fabrics light and let the wash or texture create the vintage feel.",
        "Use a lightweight retro base instead of heavier layers.",
      ],
      default: ["Let texture and shape create the vintage feel."],
    },
  },

  skater: {
    label: "Skater",
    tone: "loose and laid-back",
    fitDirections: {
      relaxed: [
        "Keep the fit loose and easy",
        "Use relaxed proportions with simple footwear",
      ],
      fitted: [
        "Keep the top cleaner and let the pants stay relaxed",
        "Use a closer base with loose bottoms for balance",
      ],
      oversized: [
        "Lean into the oversized shape but keep the colors simple",
        "Use a roomy silhouette with one clear color direction",
      ],
      layered: [
        "Layer a tee and hoodie without making the outfit too bulky",
        "Keep the layers casual and the proportions loose",
      ],
      default: ["Keep the fit loose, casual, and balanced"],
    },
    warm: {
      tops: ["oversized tee", "simple graphic tee", "washed tee"],
      bottoms: ["loose jeans", "relaxed shorts", "baggy work pants"],
      shoes: ["skate shoes", "simple low-top sneakers", "chunky sneakers"],
    },
    mild: {
      tops: ["oversized tee", "hoodie", "roomy long-sleeve"],
      bottoms: ["loose jeans", "baggy work pants", "relaxed cargos"],
      shoes: ["skate shoes", "chunky sneakers", "simple low-tops"],
    },
    cold: {
      tops: ["roomy hoodie", "heavyweight tee with a base", "warm crewneck"],
      bottoms: ["loose dark denim", "baggy work pants", "heavier relaxed cargos"],
      shoes: ["skate shoes", "sturdy low-tops", "chunky sneakers"],
    },
    weatherNotes: {
      rain: [
        "Use weather-friendly skate shoes and keep the pant hems off the ground.",
        "Keep the loose pants practical and choose the shoes that can handle rain.",
      ],
      wind: [
        "Keep the hoodie and loose layers controlled so they do not flap around.",
        "Skip loose accessories and keep the oversized pieces balanced.",
      ],
      rain_wind: [
        "Use practical shoes, keep the hems up, and control the loose layers.",
        "Keep the skater shape but make the footwear and layers weather-ready.",
      ],
      cold: [
        "Add a warm base under the hoodie or tee without tightening the silhouette.",
        "Use one warm layer underneath and keep the outside loose.",
      ],
      hot: [
        "Keep the oversized tee lightweight and avoid heavy layers.",
        "Use breathable loose pieces so the fit stays comfortable.",
      ],
      default: ["Keep the fit loose and let the shoes finish the look."],
    },
  },

  outdoor: {
    label: "Outdoor",
    tone: "practical and weather-ready",
    fitDirections: {
      relaxed: [
        "Keep the fit practical and easy",
        "Use comfortable proportions with functional details",
      ],
      fitted: [
        "Keep the base fitted and the outer layer functional",
        "Use close technical layers with practical pants",
      ],
      oversized: [
        "Let the jacket stay roomy and keep the base functional",
        "Balance the larger outer layer with clean utility pieces",
      ],
      layered: [
        "Use functional layers that can be added or removed easily",
        "Keep the layering practical and low-bulk",
      ],
      default: ["Keep the outfit practical, comfortable, and weather-ready"],
    },
    warm: {
      tops: ["breathable tee", "light performance top", "simple outdoor shirt"],
      bottoms: ["utility pants", "practical shorts", "light trail pants"],
      shoes: ["trail shoes", "sturdy sneakers", "light hiking shoes"],
    },
    mild: {
      tops: ["breathable base", "light fleece", "simple long-sleeve"],
      bottoms: ["utility pants", "trail pants", "clean workwear pants"],
      shoes: ["trail shoes", "light boots", "sturdy sneakers"],
    },
    cold: {
      tops: ["thermal base", "fleece layer", "warm outdoor base"],
      bottoms: ["weather-ready utility pants", "heavier trail pants", "warm workwear pants"],
      shoes: ["trail boots", "weather-ready shoes", "sturdy hiking shoes"],
    },
    weatherNotes: {
      rain: [
        "Use grippy weather-friendly shoes and keep the lower layers practical.",
        "Choose the pieces that dry quickly and keep the footwear secure.",
      ],
      wind: [
        "Keep the layers close and functional so the wind does not catch them.",
        "Use adjustable, controlled layers and skip loose accessories.",
      ],
      rain_wind: [
        "Use grippy footwear and keep every layer practical and controlled.",
        "Choose quick-drying pieces, secure footwear, and close layers.",
      ],
      cold: [
        "Add a thermal or fleece layer underneath and keep the outer layer functional.",
        "Use a warm technical base without adding unnecessary bulk.",
      ],
      hot: [
        "Keep the base breathable and the utility pieces lightweight.",
        "Use quick-drying lightweight layers underneath.",
      ],
      default: ["Keep the outfit practical and ready for the selected weather."],
    },
  },
};

export const COLOR_FAMILY_PLANS = {
  dark_neutral: [
    {
      key: "clean_contrast",
      tops: ["white", "cream", "light grey"],
      bottoms: ["black", "charcoal", "washed blue"],
      shoes: ["white", "black", "grey"],
    },
    {
      key: "tonal_dark",
      tops: ["grey", "black", "charcoal"],
      bottoms: ["black", "dark grey", "dark denim"],
      shoes: ["white", "black"],
    },
    {
      key: "soft_neutral",
      tops: ["cream", "white", "stone"],
      bottoms: ["charcoal", "olive", "dark denim"],
      shoes: ["white", "brown", "black"],
    },
  ],
  light_neutral: [
    {
      key: "light_dark_balance",
      tops: ["black", "navy", "charcoal"],
      bottoms: ["black", "navy", "olive"],
      shoes: ["white", "black", "brown"],
    },
    {
      key: "soft_tonal",
      tops: ["white", "cream", "light grey"],
      bottoms: ["stone", "tan", "light denim"],
      shoes: ["white", "cream", "brown"],
    },
    {
      key: "earth_contrast",
      tops: ["olive", "brown", "black"],
      bottoms: ["dark denim", "brown", "black"],
      shoes: ["white", "brown", "black"],
    },
  ],
  blue: [
    {
      key: "blue_clean",
      tops: ["white", "black", "light grey"],
      bottoms: ["navy", "charcoal", "black"],
      shoes: ["white", "grey", "black"],
    },
    {
      key: "blue_tonal",
      tops: ["light blue", "white", "navy"],
      bottoms: ["dark blue", "navy", "washed denim"],
      shoes: ["white", "grey"],
    },
    {
      key: "blue_earth",
      tops: ["cream", "white", "stone"],
      bottoms: ["olive", "tan", "dark denim"],
      shoes: ["white", "brown", "grey"],
    },
  ],
  earth: [
    {
      key: "earth_clean",
      tops: ["cream", "white", "black"],
      bottoms: ["olive", "dark denim", "brown"],
      shoes: ["white", "brown", "black"],
    },
    {
      key: "earth_tonal",
      tops: ["tan", "cream", "stone"],
      bottoms: ["brown", "olive", "dark khaki"],
      shoes: ["brown", "cream", "black"],
    },
    {
      key: "earth_contrast",
      tops: ["black", "white", "navy"],
      bottoms: ["black", "dark denim", "charcoal"],
      shoes: ["white", "black", "brown"],
    },
  ],
  warm_bold: [
    {
      key: "bold_grounded",
      tops: ["black", "white", "grey"],
      bottoms: ["black", "charcoal", "dark denim"],
      shoes: ["white", "black"],
    },
    {
      key: "bold_softened",
      tops: ["cream", "white", "light grey"],
      bottoms: ["brown", "dark denim", "black"],
      shoes: ["white", "brown", "black"],
    },
  ],
  cool_bold: [
    {
      key: "cool_grounded",
      tops: ["black", "white", "grey"],
      bottoms: ["black", "charcoal", "dark denim"],
      shoes: ["white", "black"],
    },
    {
      key: "cool_tonal",
      tops: ["light grey", "navy", "white"],
      bottoms: ["navy", "black", "washed denim"],
      shoes: ["white", "grey", "black"],
    },
  ],
  multicolor: [
    {
      key: "multicolor_simple",
      tops: ["black", "white", "grey"],
      bottoms: ["black", "charcoal", "dark denim"],
      shoes: ["white", "black"],
    },
    {
      key: "multicolor_light",
      tops: ["white", "cream", "light grey"],
      bottoms: ["navy", "black", "dark denim"],
      shoes: ["white", "grey"],
    },
  ],
};

const COLOR_ALIASES = {
  gray: "grey",
  lightblue: "light_blue",
  "light blue": "light_blue",
  darkblue: "navy",
  "dark blue": "navy",
  maroon: "burgundy",
  khaki: "tan",
  offwhite: "cream",
  "off white": "cream",
};

export const JACKET_COLOR_FAMILIES = {
  black: "dark_neutral",
  grey: "dark_neutral",
  silver: "dark_neutral",
  white: "light_neutral",
  cream: "light_neutral",
  beige: "light_neutral",
  tan: "light_neutral",
  navy: "blue",
  blue: "blue",
  light_blue: "blue",
  brown: "earth",
  olive: "earth",
  green: "earth",
  gold: "earth",
  red: "warm_bold",
  burgundy: "warm_bold",
  orange: "warm_bold",
  yellow: "warm_bold",
  pink: "warm_bold",
  purple: "cool_bold",
  multicolor: "multicolor",
  other: "dark_neutral",
};

export const PROFILE_COLOR_FAMILIES = {
  black: "dark_neutral",
  white: "light_neutral",
  grey: "dark_neutral",
  navy: "blue",
  earth_tones: "earth",
  bold: "multicolor",
};

export function normalizeStyleColor(value) {
  const normalized = String(value || "other")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_");

  return COLOR_ALIASES[normalized] || normalized || "other";
}

export function getStyleSuggestionTemplate(stylePreference) {
  return (
    STYLE_SUGGESTION_LIBRARY[stylePreference] ||
    STYLE_SUGGESTION_LIBRARY.streetwear
  );
}

export function getColorPlanOptions(primaryColor) {
  const normalizedColor = normalizeStyleColor(primaryColor);
  const family = JACKET_COLOR_FAMILIES[normalizedColor] || "dark_neutral";

  return {
    normalizedColor,
    family,
    plans: COLOR_FAMILY_PLANS[family] || COLOR_FAMILY_PLANS.dark_neutral,
  };
}

export function getProfileColorPlanOptions(colorPreference) {
  const family =
    PROFILE_COLOR_FAMILIES[colorPreference] || "dark_neutral";

  return {
    normalizedColor: colorPreference || "black",
    family,
    plans: COLOR_FAMILY_PLANS[family] || COLOR_FAMILY_PLANS.dark_neutral,
  };
}
