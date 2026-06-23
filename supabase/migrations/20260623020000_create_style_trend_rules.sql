-- Phase 11: trend-aware style intelligence
-- Forward-only migration. Keep this file permanently.

alter table public.profiles
  add column if not exists use_style_trends boolean not null default true,
  add column if not exists trend_influence text not null default 'subtle';

alter table public.profiles
  drop constraint if exists profiles_trend_influence_check;

alter table public.profiles
  add constraint profiles_trend_influence_check
  check (trend_influence in ('off', 'subtle', 'balanced'));

create table if not exists public.style_trend_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  seasons text[] not null default '{}',
  climate_tags text[] not null default '{}',
  style_tags text[] not null default '{}',
  jacket_subtypes text[] not null default '{}',
  color_families text[] not null default '{}',
  fit_tags text[] not null default '{}',
  material_tags text[] not null default '{}',
  suggestion_phrases jsonb not null default '{"subtle": [], "balanced": []}'::jsonb,
  source_label text not null default 'Internal seasonal style research',
  source_date date,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  weight numeric(4,3) not null default 0.5,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint style_trend_rules_dates_check check (expires_at > starts_at),
  constraint style_trend_rules_weight_check check (weight >= 0 and weight <= 1),
  constraint style_trend_rules_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint style_trend_rules_phrases_check check (
    jsonb_typeof(suggestion_phrases) = 'object'
    and jsonb_typeof(coalesce(suggestion_phrases->'subtle', '[]'::jsonb)) = 'array'
    and jsonb_typeof(coalesce(suggestion_phrases->'balanced', '[]'::jsonb)) = 'array'
  )
);

create table if not exists public.style_trend_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recommendation_history_id uuid references public.recommendation_history(id) on delete set null,
  response text not null,
  style_preference text,
  trend_influence text not null default 'subtle',
  trend_rule_ids uuid[] not null default '{}',
  trend_rule_slugs text[] not null default '{}',
  style_suggestion_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint style_trend_feedback_response_check
    check (response in ('classic', 'feels_right', 'more_current')),
  constraint style_trend_feedback_influence_check
    check (trend_influence in ('off', 'subtle', 'balanced'))
);

create or replace function public.set_style_trend_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_style_trend_rules_updated_at on public.style_trend_rules;
create trigger set_style_trend_rules_updated_at
before update on public.style_trend_rules
for each row execute function public.set_style_trend_updated_at();

create index if not exists style_trend_rules_active_dates_idx
  on public.style_trend_rules (is_active, starts_at, expires_at);
create index if not exists style_trend_rules_style_tags_idx
  on public.style_trend_rules using gin (style_tags);
create index if not exists style_trend_rules_climate_tags_idx
  on public.style_trend_rules using gin (climate_tags);
create index if not exists style_trend_rules_seasons_idx
  on public.style_trend_rules using gin (seasons);
create index if not exists style_trend_feedback_user_created_idx
  on public.style_trend_feedback (user_id, created_at desc);
create index if not exists style_trend_feedback_rule_ids_idx
  on public.style_trend_feedback using gin (trend_rule_ids);

alter table public.style_trend_rules enable row level security;
alter table public.style_trend_feedback enable row level security;

drop policy if exists "Public can read current active trend rules" on public.style_trend_rules;
drop policy if exists "Public can read trend rule catalog" on public.style_trend_rules;
create policy "Public can read trend rule catalog"
on public.style_trend_rules
for select
to anon, authenticated
using (true);

drop policy if exists "Users can read own trend feedback" on public.style_trend_feedback;
create policy "Users can read own trend feedback"
on public.style_trend_feedback
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own trend feedback" on public.style_trend_feedback;
create policy "Users can create own trend feedback"
on public.style_trend_feedback
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own trend feedback" on public.style_trend_feedback;
create policy "Users can delete own trend feedback"
on public.style_trend_feedback
for delete
to authenticated
using (auth.uid() = user_id);

with seed_rule as (
  select value as rule
  from jsonb_array_elements($phase11_seed$[
  {
    "id": "11000000-0000-4000-8000-000000000001",
    "name": "Relaxed street proportions",
    "slug": "streetwear-relaxed-proportions",
    "description": "Keeps streetwear roomy while maintaining a controlled silhouette.",
    "seasons": [
      "spring",
      "fall",
      "transitional"
    ],
    "climate_tags": [
      "mild",
      "transitional",
      "wind"
    ],
    "style_tags": [
      "streetwear"
    ],
    "jacket_subtypes": [],
    "color_families": [],
    "fit_tags": [
      "relaxed",
      "oversized"
    ],
    "material_tags": [],
    "suggestion_phrases": {
      "subtle": [
        "Keep one part of the silhouette slightly roomier without letting every piece look oversized."
      ],
      "balanced": [
        "Use a roomier lower half with a cleaner top layer so the streetwear proportions feel current but intentional."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000002",
    "name": "Tonal streetwear contrast",
    "slug": "streetwear-tonal-contrast",
    "description": "Uses nearby dark or washed tones with one controlled contrast point.",
    "seasons": [
      "winter",
      "fall",
      "summer"
    ],
    "climate_tags": [
      "cold",
      "mild",
      "warm"
    ],
    "style_tags": [
      "streetwear"
    ],
    "jacket_subtypes": [],
    "color_families": [
      "dark_neutral",
      "blue",
      "earth"
    ],
    "fit_tags": [],
    "material_tags": [],
    "suggestion_phrases": {
      "subtle": [
        "Stay mostly tonal and let one lighter neutral create the contrast."
      ],
      "balanced": [
        "Build the look through washed or tonal shades, then use one clean neutral to keep the outfit from feeling flat."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000003",
    "name": "Relaxed clean minimalism",
    "slug": "minimal-relaxed-clean",
    "description": "Softens strict minimal outfits with a slightly easier silhouette.",
    "seasons": [
      "spring",
      "summer",
      "transitional"
    ],
    "climate_tags": [
      "warm",
      "mild",
      "transitional"
    ],
    "style_tags": [
      "minimal"
    ],
    "jacket_subtypes": [],
    "color_families": [],
    "fit_tags": [
      "relaxed",
      "fitted"
    ],
    "material_tags": [],
    "suggestion_phrases": {
      "subtle": [
        "Keep the lines clean while allowing a little more ease through the fit."
      ],
      "balanced": [
        "Use a slightly roomier silhouette with clean hems and limited color so the look stays minimal rather than oversized."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000004",
    "name": "Tonal neutral minimalism",
    "slug": "minimal-tonal-neutrals",
    "description": "Uses soft tonal neutrals and restrained contrast.",
    "seasons": [
      "fall",
      "winter",
      "spring"
    ],
    "climate_tags": [
      "cold",
      "mild",
      "dry"
    ],
    "style_tags": [
      "minimal"
    ],
    "jacket_subtypes": [],
    "color_families": [
      "light_neutral",
      "dark_neutral",
      "earth"
    ],
    "fit_tags": [],
    "material_tags": [],
    "suggestion_phrases": {
      "subtle": [
        "Keep the colors close together and use texture instead of a loud accent."
      ],
      "balanced": [
        "Stay within one neutral family, using a lighter top or shoe to create depth without breaking the clean palette."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000005",
    "name": "Streamlined athletic layers",
    "slug": "athletic-streamlined-layers",
    "description": "Keeps athletic styling movement-focused and uncluttered.",
    "seasons": [
      "spring",
      "fall",
      "winter"
    ],
    "climate_tags": [
      "wind",
      "cold",
      "transitional"
    ],
    "style_tags": [
      "athletic"
    ],
    "jacket_subtypes": [],
    "color_families": [],
    "fit_tags": [
      "fitted",
      "layered"
    ],
    "material_tags": [
      "nylon",
      "polyester",
      "fleece"
    ],
    "suggestion_phrases": {
      "subtle": [
        "Keep the layers streamlined so the look still feels built for movement."
      ],
      "balanced": [
        "Use close, technical layers with one slightly looser piece for comfort while keeping the overall shape athletic."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000006",
    "name": "Clean sporty contrast",
    "slug": "athletic-clean-contrast",
    "description": "Combines neutral athletic basics with a crisp contrast color.",
    "seasons": [
      "summer",
      "spring",
      "fall"
    ],
    "climate_tags": [
      "hot",
      "warm",
      "mild"
    ],
    "style_tags": [
      "athletic"
    ],
    "jacket_subtypes": [],
    "color_families": [
      "dark_neutral",
      "light_neutral",
      "blue",
      "bold"
    ],
    "fit_tags": [],
    "material_tags": [],
    "suggestion_phrases": {
      "subtle": [
        "Use one crisp contrast color and keep the rest of the athletic look simple."
      ],
      "balanced": [
        "Ground the outfit in a neutral base, then repeat one clean contrast color in a small detail for a sharper sporty finish."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000007",
    "name": "Soft smart-casual structure",
    "slug": "smart-casual-soft-structure",
    "description": "Keeps smart-casual outfits refined without making them rigid.",
    "seasons": [
      "spring",
      "summer",
      "fall",
      "transitional"
    ],
    "climate_tags": [
      "mild",
      "transitional",
      "wind"
    ],
    "style_tags": [
      "smart_casual"
    ],
    "jacket_subtypes": [],
    "color_families": [],
    "fit_tags": [
      "fitted",
      "relaxed"
    ],
    "material_tags": [],
    "suggestion_phrases": {
      "subtle": [
        "Keep the shape refined but slightly softer through the trousers or top layer."
      ],
      "balanced": [
        "Use clean structure at the jacket and a softer, straighter shape below it so the outfit looks polished without feeling formal."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000008",
    "name": "Refined transitional neutrals",
    "slug": "smart-casual-transitional-neutrals",
    "description": "Uses refined neutral combinations for changing weather.",
    "seasons": [
      "fall",
      "spring",
      "winter"
    ],
    "climate_tags": [
      "mild",
      "cold",
      "transitional"
    ],
    "style_tags": [
      "smart_casual"
    ],
    "jacket_subtypes": [],
    "color_families": [
      "earth",
      "blue",
      "dark_neutral",
      "light_neutral"
    ],
    "fit_tags": [],
    "material_tags": [],
    "suggestion_phrases": {
      "subtle": [
        "Use a refined neutral palette and let the jacket provide the strongest color."
      ],
      "balanced": [
        "Pair the jacket with two related neutrals and one lighter finish so the look stays polished through transitional weather."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000009",
    "name": "Practical technical layering",
    "slug": "techwear-practical-layering",
    "description": "Adds functional layering language without costume-like excess.",
    "seasons": [
      "fall",
      "winter",
      "spring"
    ],
    "climate_tags": [
      "rain",
      "wind",
      "rain_wind",
      "cold"
    ],
    "style_tags": [
      "techwear"
    ],
    "jacket_subtypes": [
      "rain jacket",
      "shell",
      "windbreaker",
      "parka"
    ],
    "color_families": [],
    "fit_tags": [],
    "material_tags": [
      "nylon",
      "polyester",
      "gore-tex",
      "technical"
    ],
    "suggestion_phrases": {
      "subtle": [
        "Keep the technical details practical and avoid stacking too many visual features."
      ],
      "balanced": [
        "Use compact functional layers, muted colors, and one clear utility detail so the outfit feels technical rather than busy."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000010",
    "name": "Muted technical palette",
    "slug": "techwear-muted-palette",
    "description": "Uses muted technical colors with measured contrast.",
    "seasons": [
      "summer",
      "transitional",
      "winter"
    ],
    "climate_tags": [
      "warm",
      "mild",
      "cold"
    ],
    "style_tags": [
      "techwear"
    ],
    "jacket_subtypes": [],
    "color_families": [
      "dark_neutral",
      "earth",
      "cool",
      "blue"
    ],
    "fit_tags": [],
    "material_tags": [],
    "suggestion_phrases": {
      "subtle": [
        "Keep the palette muted and let one reflective or lighter detail do the work."
      ],
      "balanced": [
        "Stay in charcoal, olive, navy, or black, then add one restrained light accent to define the technical layers."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000011",
    "name": "Washed vintage texture",
    "slug": "vintage-washed-texture",
    "description": "Uses washed colors and texture while keeping the outfit wearable.",
    "seasons": [
      "fall",
      "spring",
      "winter"
    ],
    "climate_tags": [
      "mild",
      "cold",
      "dry"
    ],
    "style_tags": [
      "vintage"
    ],
    "jacket_subtypes": [],
    "color_families": [],
    "fit_tags": [],
    "material_tags": [
      "denim",
      "corduroy",
      "wool",
      "leather",
      "cotton"
    ],
    "suggestion_phrases": {
      "subtle": [
        "Let one washed or textured piece carry the vintage feel instead of aging every part of the outfit."
      ],
      "balanced": [
        "Mix the jacket with one washed color and one textured neutral so the vintage direction feels layered but not costume-like."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000012",
    "name": "Classic vintage proportions",
    "slug": "vintage-classic-proportions",
    "description": "Balances shorter outerwear with straighter lower proportions.",
    "seasons": [
      "summer",
      "spring",
      "fall"
    ],
    "climate_tags": [
      "warm",
      "mild",
      "transitional"
    ],
    "style_tags": [
      "vintage"
    ],
    "jacket_subtypes": [],
    "color_families": [],
    "fit_tags": [
      "relaxed",
      "fitted"
    ],
    "material_tags": [],
    "suggestion_phrases": {
      "subtle": [
        "Keep the proportions classic with a straighter lower half and a clean jacket length."
      ],
      "balanced": [
        "Use a shorter or cleaner jacket proportion with straight, relaxed bottoms to create a vintage shape without exaggerating it."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000013",
    "name": "Relaxed skater workwear",
    "slug": "skater-relaxed-workwear",
    "description": "Blends skater ease with simple workwear structure.",
    "seasons": [
      "fall",
      "spring",
      "winter"
    ],
    "climate_tags": [
      "mild",
      "cold",
      "wind"
    ],
    "style_tags": [
      "skater"
    ],
    "jacket_subtypes": [
      "work jacket",
      "denim jacket",
      "bomber",
      "coach jacket"
    ],
    "color_families": [],
    "fit_tags": [
      "relaxed",
      "oversized"
    ],
    "material_tags": [],
    "suggestion_phrases": {
      "subtle": [
        "Keep the shape relaxed and let one workwear detail add structure."
      ],
      "balanced": [
        "Use loose but controlled proportions with a workwear-inspired jacket and simple shoes so the skater look stays grounded."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000014",
    "name": "Simple graphic contrast",
    "slug": "skater-graphic-contrast",
    "description": "Creates skater contrast through one graphic or color break.",
    "seasons": [
      "summer",
      "spring",
      "fall"
    ],
    "climate_tags": [
      "hot",
      "warm",
      "mild"
    ],
    "style_tags": [
      "skater"
    ],
    "jacket_subtypes": [],
    "color_families": [
      "dark_neutral",
      "light_neutral",
      "bold"
    ],
    "fit_tags": [],
    "material_tags": [],
    "suggestion_phrases": {
      "subtle": [
        "Use one graphic or color break and keep the rest of the outfit easy."
      ],
      "balanced": [
        "Let one graphic, washed color, or bright detail stand out against simple relaxed basics rather than layering several competing accents."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000015",
    "name": "Functional outdoor layering",
    "slug": "outdoor-functional-layering",
    "description": "Keeps outdoor styling practical, weather-ready, and clean.",
    "seasons": [
      "fall",
      "winter",
      "spring"
    ],
    "climate_tags": [
      "rain",
      "wind",
      "rain_wind",
      "cold"
    ],
    "style_tags": [
      "outdoor"
    ],
    "jacket_subtypes": [
      "rain jacket",
      "shell",
      "parka",
      "puffer",
      "fleece jacket"
    ],
    "color_families": [],
    "fit_tags": [],
    "material_tags": [
      "nylon",
      "fleece",
      "down",
      "wool",
      "technical"
    ],
    "suggestion_phrases": {
      "subtle": [
        "Keep the layers functional and use one earth tone to soften the technical look."
      ],
      "balanced": [
        "Combine a weather-ready jacket with practical layers, earth-toned neutrals, and a compact silhouette that will still move comfortably outside."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  },
  {
    "id": "11000000-0000-4000-8000-000000000016",
    "name": "Lightweight trail color",
    "slug": "outdoor-lightweight-color",
    "description": "Uses breathable outdoor shapes and controlled natural color.",
    "seasons": [
      "summer",
      "spring",
      "transitional"
    ],
    "climate_tags": [
      "hot",
      "warm",
      "mild",
      "transitional"
    ],
    "style_tags": [
      "outdoor"
    ],
    "jacket_subtypes": [],
    "color_families": [
      "earth",
      "blue",
      "light_neutral",
      "warm"
    ],
    "fit_tags": [],
    "material_tags": [],
    "suggestion_phrases": {
      "subtle": [
        "Use lightweight pieces and keep the color direction close to natural or muted tones."
      ],
      "balanced": [
        "Choose breathable shapes with earth, stone, navy, or muted warm tones so the outdoor look feels current without looking overly technical."
      ]
    },
    "source_label": "Internal seasonal style research",
    "source_date": "2026-06-01",
    "starts_at": "2025-01-01T00:00:00.000Z",
    "expires_at": "2030-12-31T23:59:59.999Z",
    "weight": 0.6,
    "is_active": true
  }
]$phase11_seed$::jsonb)
)
insert into public.style_trend_rules (
  id,
  name,
  slug,
  description,
  seasons,
  climate_tags,
  style_tags,
  jacket_subtypes,
  color_families,
  fit_tags,
  material_tags,
  suggestion_phrases,
  source_label,
  source_date,
  starts_at,
  expires_at,
  weight,
  is_active
)
select
  (rule->>'id')::uuid,
  rule->>'name',
  rule->>'slug',
  coalesce(rule->>'description', ''),
  array(select jsonb_array_elements_text(coalesce(rule->'seasons', '[]'::jsonb))),
  array(select jsonb_array_elements_text(coalesce(rule->'climate_tags', '[]'::jsonb))),
  array(select jsonb_array_elements_text(coalesce(rule->'style_tags', '[]'::jsonb))),
  array(select jsonb_array_elements_text(coalesce(rule->'jacket_subtypes', '[]'::jsonb))),
  array(select jsonb_array_elements_text(coalesce(rule->'color_families', '[]'::jsonb))),
  array(select jsonb_array_elements_text(coalesce(rule->'fit_tags', '[]'::jsonb))),
  array(select jsonb_array_elements_text(coalesce(rule->'material_tags', '[]'::jsonb))),
  coalesce(rule->'suggestion_phrases', '{"subtle": [], "balanced": []}'::jsonb),
  coalesce(rule->>'source_label', 'Internal seasonal style research'),
  nullif(rule->>'source_date', '')::date,
  (rule->>'starts_at')::timestamptz,
  (rule->>'expires_at')::timestamptz,
  coalesce((rule->>'weight')::numeric, 0.5),
  coalesce((rule->>'is_active')::boolean, true)
from seed_rule
on conflict (slug) do nothing;

grant select on public.style_trend_rules to anon, authenticated;
grant select, insert, delete on public.style_trend_feedback to authenticated;
