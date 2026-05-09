# Custom presets and validation rules

This document answers a recurring question:

> _"Can I add my own presets or validation rules to iD — for a mapping campaign, an organization, or a custom tagging schema?"_

Short answer: yes, both. iD supports loading custom **presets** at runtime via the `presets=` URL hash parameter when its value is an `http`/`https` URL to a JSON file, and custom **validation rules** at runtime via the `maprules=` URL hash parameter. Both are static-JSON files you host yourself — no server, no fork, no rebuild.

The sections below explain the available extension points (`presets=` in two modes, plus `maprules=`).

---

## 1. Adding custom presets at runtime

iD supports merging extra presets, fields, categories, and defaults into the running preset library when `presets=` is set to an **`http` or `https` URL** pointing at a JSON file. The file is fetched once at iD startup, after iD's bundled presets finish loading, and merged in via the same `presetManager.merge` API used internally by the Name-Suggestion-Index.

```
https://ideditor-release.netlify.app/#presets=https://example.org/my-presets.json&map=18/52.5/13.4
```

### Operational notes

- The URL is fetched once at startup. Changes to the file require a page reload.
- The URL must be reachable via CORS from the iD origin.
- On success / failure / wrong shape, `[presets] …` lines are written to the browser console.
- Field IDs referenced under each preset's `fields` array must already exist (either as iD built-ins or because you also defined them under a `fields` key in the same file).
- Mappers without your URL will not see the preset. Use this for campaigns, organization-internal deployments, and previewing schema changes — not as a substitute for contributing to [`@openstreetmap/id-tagging-schema`](https://github.com/openstreetmap/id-tagging-schema) when the preset belongs in the global library.

### JSON file format

The file must be a JSON **object** (not an array). It can carry any subset of the keys below; each one is merged into the corresponding part of the preset index:

- `presets` — object keyed by preset ID (e.g. `"amenity/bench_with_backrest"`). Each entry uses the [id-tagging-schema preset shape](https://github.com/ideditor/schema-builder#presets) (`name`, `icon`, `geometry`, `tags`, `addTags`, `fields`, `terms`, `searchable`, …).
- `fields` — object keyed by field ID. Same shape as built-in fields.
- `categories` — object keyed by category ID. Used to group presets in the picker.
- `defaults` — object keyed by geometry (`area`, `line`, `point`, `vertex`, `relation`); each value is an array of preset/category IDs to show as the default suggestions for that geometry.
- `featureCollection` — GeoJSON FeatureCollection of location-set polygons referenced by `locationSet` keys in your presets/fields.

### Example file

A "Bench with Backrest" preset that adds both `amenity=bench` and `backrest=yes` when selected:

```json
{
  "presets": {
    "amenity/bench_with_backrest": {
      "icon": "maki-bench",
      "geometry": ["point"],
      "tags": { "amenity": "bench", "backrest": "yes" },
      "addTags": { "amenity": "bench", "backrest": "yes" },
      "fields": ["inscription", "material", "seats", "colour"],
      "name": "Bench with Backrest",
      "terms": ["bench", "seat", "backrest"]
    }
  }
}
```

After loading, the preset shows up in the search list and the _Change feature type_ dialog. Pair it with the `maprules=` example below to also flag any benches that are missing `backrest` or have a non-`yes`/`no` value.

## 2. Restricting which built-in presets a user may select

Use the same `presets=` URL hash parameter with a **comma-separated list of preset IDs** (when the value does **not** start with `http://` or `https://`). That allowlists which built-in presets may be selected (for example, campaigns limited to certain feature types). It only **filters** the built-in library; it does not add new presets. You cannot combine a merge URL and an allowlist in a single `presets=` value — pick one mode per link. See the __`presets`__ entry under [URL parameters → iD Standalone in API.md](API.md#id-standalone).

## 3. Adding custom validation rules at runtime

iD supports loading a JSON file of custom warnings and errors via the `maprules=` URL hash parameter. The file is fetched once at iD startup and each entry is registered as an extra rule that runs alongside the built-in validators.

This mechanism originated as the client side of the [MapRules](https://github.com/radiant-maxar/maprules) service, which is no longer maintained. **You do not need that service.** The URL just points at a static JSON file on any host that allows CORS — for example a GitHub Pages site, an S3 bucket, a [GitHub Gist](https://gist.github.com/) raw file (see [section 4](#4-hosting-on-github-gist)), or your campaign's own server.

```
https://ideditor-release.netlify.app/#maprules=https://example.org/my-rules.json&map=18/52.5/13.4
```

### Operational notes

- The URL is fetched once at iD startup. Changing the file requires a page reload.
- The URL must be reachable via CORS from the iD origin. If the request fails or the JSON is malformed, the failure is silently ignored — there is no error toast.
- Issues raised by these rules show up in the sidebar like any other issue, but the `maprules` rule type is intentionally hidden from the issue-rule toggle UI under _Map Data → Issues_, so users cannot disable individual custom rules from the UI.
- Rules can produce either errors (which block changeset upload) or warnings (which do not). See `error` / `warning` below.

### JSON file format

The file must contain a JSON **array** of selector objects. Each selector describes one rule — a tag-based condition plus the message to display when it matches.

Each selector object has:

- `geometry` (**required**) — one of `"node"`, `"way"`, `"closedway"`, `"relation"`.
  - For `"node"` and `"relation"` the entity type must match exactly.
  - For `"way"` and `"closedway"` the geometry is **inferred from the selector's tags**, using the same area-key vs. line-key logic as iD itself. (This means a selector with `geometry: "closedway"` will fire on any closed way whose tags imply an area; an explicit `area=yes` / `area=no` tag in the selector flips this.)

- One or more **conditions** (all must match for the rule to fire on a given entity):
  - `equals: { key: value }`
  - `notEquals: { key: value }`
  - `presence: "key"`
  - `absence: "key"`
  - `greaterThan` / `greaterThanEqual` / `lessThan` / `lessThanEqual`: `{ key: number }` — compared against the raw OSM tag value (string-coerced; intended for numeric tags).
  - `positiveRegex` / `negativeRegex`: `{ key: ["regex1", "regex2"] }` — the entries are joined with `|` and used as a single `RegExp`. Anchor with `^` / `$` if you want exact matches.

- Exactly one of:
  - `error: "message"` — surfaced as an error, blocks changeset upload.
  - `warning: "message"` — surfaced as a warning, does not block upload.

### Example file

```json
[
  {
    "geometry": "node",
    "equals": { "amenity": "marketplace" },
    "absence": "name",
    "error": "Marketplace must have a name"
  },
  {
    "geometry": "way",
    "equals": { "highway": "residential" },
    "positiveRegex": { "structure": ["bridge", "tunnel"] },
    "warning": "Residential road should not be a bridge or tunnel"
  },
  {
    "geometry": "node",
    "equals": { "man_made": "tower", "tower:type": "communication" },
    "presence": "height",
    "warning": "Communication towers should record height when known"
  }
]
```

## 4. Hosting on GitHub Gist

[GitHub Gists](https://gist.github.com/) are a practical place to host the static JSON for `presets=` (URL merge) and `maprules=`: create a gist, add one file per payload (preset bundle as a single object, rules as a single array), then open each file and use its **Raw** URL from the browser address bar in your iD hash parameters. Raw gist URLs typically work with iD's fetch + CORS expectations for small campaign files.

Worked example you can open, fork, or copy from — a **Bench with Backrest** preset JSON and a companion **bench** `maprules` array in the same gist:

https://gist.github.com/tordans/549a328ccff34963192899113c73d35a

Point `presets=` at the raw URL of the preset object file and `maprules=` at the raw URL of the rules array file in one editor link to try both together.
