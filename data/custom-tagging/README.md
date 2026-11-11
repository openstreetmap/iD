# Custom presets (Chaire Mobilité)

Fork-specific [OpenStreetMap tagging schema](https://github.com/openstreetmap/id-tagging-schema) data. Same layout and tooling as upstream iD (`@openstreetmap/id-tagging-schema` + [`@ideditor/schema-builder`](https://github.com/ideditor/schema-builder)).

Upstream presets still load from the npm package at runtime. This tree is **merged on top** after the schema is loaded (`modules/presets/apply_custom_presets.ts`), then Québec-specific field wiring runs in `modules/presets/custom_fields.js`.

## Layout

```
data/custom-tagging/
├── README.md
├── src/                          Author here (TypeScript)
│   ├── types.ts
│   ├── registry.ts               Registers fields, @templates, presets
│   ├── lib/tag_helpers.ts        removeTags helpers
│   ├── fields/*.ts
│   └── presets/.../*.ts          Variant templates (parking, footway, …)
├── fields/**/*.json              Generated (gitignored)
├── presets/**/*.json             Generated (gitignored)
├── presets/@templates/
├── deprecated.json
├── discarded.json
├── preset_defaults.json
└── interim/                      Build scratch (gitignored)

dist/data/custom/                 schema-builder output (gitignored in dev)
├── fields.min.json
└── presets.min.json

data/locales/custom_presets/      Preset search strings (name, terms, aliases)
data/locales/custom/              Field labels, UI, validator messages
```

Preset IDs follow the path under `presets/`, e.g. `highway/footway/footway_link_bicycle_dismount`.

## Runtime

1. `presetManager.ensureLoaded()` loads upstream schema from CDN.
2. `applyCustomPresets()` fetches `dist/data/custom/fields.min.json` and `presets.min.json`.
3. `registerCustomStrings()` loads preset `name` / `terms` / `aliases` from `data/locales/custom_presets/{en,fr}.json`.

Generated preset JSON includes English `name` from `preset_name_en.ts` (reads `custom_presets/en.json`). Search terms and French copy stay in locale files.

## Authoring with TypeScript

Edit `src/` and use shared helpers (`lib/tag_helpers.ts`, `parking_variants.ts`, `access_aisle_variants.ts`, …) to define variant families without copying JSON.

Generate JSON only (for inspection or diff):

```bash
npm run generate:presets:custom
```

Full build (generate JSON → schema-builder → `dist/data/custom/*.min.json`):

```bash
npm run build:presets:custom
```

## Access grid

Restricted-access service roads, driveways, parking aisles, drive-throughs, footways, steps and paths are generated from one configuration: `src/presets/highway/access_categories.ts` (access categories with their tags and OSM wiki links, way kinds, surfaces, en/fr labels). After editing it:

```bash
npm run generate:locales:access-grid   # preset names and terms in data/locales/custom_presets/{en,fr}.json
npm run build:presets:custom
```

The map color of each category is the `tag-access-category-<id>` rule in `css/30_highways.css`.

## `@templates`

Virtual presets referenced from other presets, e.g. `"{@templates/placement_line}"`. See upstream [data/presets/@templates/README.md](https://github.com/openstreetmap/id-tagging-schema/blob/main/data/presets/@templates/README.md).

Parent preset field lists can reference upstream presets with `{highway/footway}`; `scripts/custom_presets_config.js` expands those before schema-builder runs.

## Locales

| What | Where |
|------|--------|
| Preset structure (tags, fields, geometry) | `src/presets/**/*.ts` → generated JSON |
| English `name` (schema + `presetNameEn`) | `data/locales/custom_presets/en.json` |
| Search `terms` / `aliases`, FR `name` | `data/locales/custom_presets/{en,fr}.json` |
| Custom field labels, UI, issues | `data/locales/custom/{locale}.json` |

## Validate

```bash
npm run validate:presets:custom   # compile sources + schema check (without dist build; npm test uses build:presets:custom instead)
```

## Preset locales (`data/locales/custom_presets/`)

Each preset id maps to `{ name, terms, aliases }`:

| Key | Role |
|-----|------|
| `name` | Display name in that language |
| `aliases` | Primary short acronym (same in `en` and `fr`) for quick search |
| `terms` | Comma-separated search string: **start with `aliases`**, then other acronyms, then phrases in the locale language |

`aliases` is also indexed for search, but editors expect the primary acronym to appear in `terms` (see parking/footway entries). Do not put full English phrases in `fr.json`.

## Tests

```bash
npm run test:spec -- test/spec/presets/custom_presets.js test/spec/presets/custom/
```

## Adding a field or preset

1. Add `src/fields/my_field.ts` or extend a variant module under `src/presets/`.
2. Register in `src/registry.ts`.
3. Add `name` / `terms` / `aliases` in `data/locales/custom_presets/{en,fr}.json` (see "Preset locales" section above).
4. Run `npm run build:presets:custom`.

Fields with `prerequisiteTag.allOf` stay in `modules/presets/custom_fields.js` until schema-builder supports them.

## References

- [id-tagging-schema CONTRIBUTING](https://github.com/openstreetmap/id-tagging-schema/blob/main/CONTRIBUTING.md)
- [schema-builder README](https://github.com/ideditor/schema-builder/blob/main/README.md)
- `scripts/compile_custom_presets_sources.ts`, `scripts/build_custom_presets.ts`, `scripts/custom_presets_config.js`
