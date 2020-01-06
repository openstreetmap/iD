## Presets

iD editor preset and field types are defined in [JSON](http://en.wikipedia.org/wiki/JSON)
files located under the `data/presets` folder of the iD repository.

#### Preset Files

Presets are defined in JSON files located under `data/presets/presets`.  They're organized in a
directory hierarchy based on OSM key/value pairs.  For example, the preset that matches
the tag `leisure=park` is in the file `data/presets/presets/leisure/park.json`.

#### Preset Schema

A basic preset is of the form:

```javascript
{
    // The icon in iD which represents this feature.
    "icon": "maki-park",
    // The names of fields that will appear by default in the editor sidebar.
    // See the fields documentation for details of what's valid here.
    "fields": [
        "address"
    ],
    // The names of fields that the user can add manually. These will also
    // appear if the corresponding tags are present.
    "moreFields": [
        "phone",
        "website"
    ],
    // The geometry types for which this preset is valid.
    // options are point, area, line, and vertex.
    // vertexes are points that are parts of lines, like the nodes in a road
    // lines are unclosed ways, and areas are closed ways
    "geometry": [
        "point", "area"
    ],
    // Terms are synonyms for the preset - these are added to fuel
    // the search functionality. searching for 'woodland' will bring
    // up this 'park' preset
    "terms": [
        "esplanade",
        "village green",
        "woodland"
    ],
    // Tags that are added to the feature when selecting the preset,
    // and also used to match the preset against existing features.
    // You can use the value "*" to match any value.
    "tags": {
        "leisure": "park"
    },
    // English language display name for this map feature.
    "name": "Park"
}
```
The complete JSON schema for presets can be found in [`data/presets/schema/preset.json`](schema/preset.json)


#### Preset Properties

##### `name`

The primary name of the feature type in American English.

Upon merging with `master`, this is sent to Transifex for translating to other localizations. Changing the name of an existing preset will require it to be re-translated to all localizations.

This property is required. There is no default.

##### `geometry`

An array of possible geometry types that a feature must have in order to match this preset.

* `point`: an OSM node that is not a member of any way
* `vertex`: an OSM node that is a member of one or more ways
* `line`: an OSM way that is not an area
* `area`: an OSM way that is closed/circular (the first and last nodes are the same) or a `type=multipolygon` relation
* `relation`: an OSM relation

Closed ways can be treated as both `line` or `area` geometry. If a preset allows both, iD will add an additional `area=yes` tag when choosing the preset for an area feature.

The geometry types should be listed in order of preference. For example, the preset for `leisure=swimming_pool` lists `area` before `point`.

This property is required. There is no default.

##### `tags`

An object with the `"key": "value"` tags a feature must have to match this preset. A `"*"` wildcard value can be set to have this preset match any value for that key.

A features can only match one preset even if its tags and geometry could technically match more than one. iD will pick the best match based on `matchScore`, the number of tags, and the use of wildcard values.

This property is required. There is no default.

##### `addTags`

The tags that are added to the feature when selecting this preset. Defaults to `tags`. If needed, this property will typically be a superset of `tags`.

iD's validator will recommend that users add missing tags from `addTags` to matching features. For example, the Bridge preset has these properties:

```
    "tags": {
        "man_made": "bridge"
    },
    "addTags": {
        "man_made": "bridge",
        "layer": "1"
    },
```

When adding a feature with this preset, it will be given the tags `man_made=bridge` and `layer=1`. The user could then change `layer` to `3`, for instance, and the feature would still match the preset because it still has `man_made=bridge`. If the user removes the `layer` tag altogether, iD will recommend adding it back with a value of `1`.

##### `removeTags`

The tags that are removed from the feature when deselecting this preset. Defaults to `addTags` or if this is also not defined, to `tags`.

##### `fields`/`moreFields`

Both these properties are arrays of field paths (e.g. `description` or `generator/type`).
`fields` are shown by default and `moreFields` are shown if manually added by the
user or if a matching tag is present. Note that some fields have a `prerequisiteTag`
property that limits when they will be shown.

A preset can reference the fields of another by using that preset's name contained in
brackets, like `{preset}`. For example, `shop/books` references and extends the fields
of `shop`:

```javascript
"fields": [
    "{shop}",
    "internet_access"
],
"moreFields": [
    "{shop}",
    "internet_access/fee",
    "internet_access/ssid"
],
"tags": {
    "shop": "books"
}
```

If `fields` or `moreFields` are not defined, the values of the preset's "parent"
preset are used. For example, `shop/convenience` automatically uses the same
fields as `shop`.

In both explicit and implicit inheritance, fields for keys that define the
preset are generally not inherited. E.g. the `shop` field is not inherited by `shop/…` presets.

##### `icon`

The name of a local SVG icon file. You can use icons from any of the following icon sets. When specifying an icon, use the prefixed version of the name, for example `"icon": "maki-park"` or `"icon": "tnp-2009223"`.

* [iD's spritesheet](https://github.com/openstreetmap/iD/tree/master/svg/iD-sprite/presets) (`iD-`)
* [Maki](https://labs.mapbox.com/maki-icons/) (`maki-`), map-specific icons from Mapbox
* [Temaki](https://ideditor.github.io/temaki/docs/) (`temaki-`), an expansion pack for Maki
    * This is the best place to submit a PR if you want to create a preset icon!
* [Font Awesome](https://fontawesome.com/icons?d=gallery&m=free), thousands of general-purpose icons
    * There is a free and pro tier. You can use any icon from the free tier in the following styles:
        * [Solid](https://fontawesome.com/icons?d=gallery&s=solid&m=free) (`fas-`)
        * [Regular](https://fontawesome.com/icons?d=gallery&s=regular&m=free) (`far-`)
        * [Brands](https://fontawesome.com/icons?d=gallery&s=brands&m=free) (`fab-`)
* [The Noun Project](https://thenounproject.com) (`tnp-`), millions of general-purpose icons
    * The licenses vary. You can only use the public-domain icons in iD, such as those from [OCHA Visual](https://thenounproject.com/ochavisual/).
    * The icon styles vary. Avoid thin or overly-detailed icons since they will not look good at small sizes.
    * Use the numeric ID of the icon (e.g. `2009223`). This is shown in the URL when you select an icon on their site.
    * Unfortunately, you must [sign up for a free API key](https://thenounproject.com/developers/) in order to download new icons (even for public-domain icons). Add a file called `the_noun_project.auth` to the root of your local iD instance containing your credentials like `{"consumer_key": "xxxxxx", "consumer_secret": "xxxxxx"}`. This file is not version-controlled.

##### `imageURL`

The URL of a remote image file. This does not fully replace `icon`—both may be shown in the UI.

For example, `imageURL` is used to specify the logos of brand presets from the [name-suggestion-index](https://github.com/osmlab/name-suggestion-index).

Bitmap images should be at least 100x100px to look good at 50x50pt on high-resolution screens.

##### `searchable`

Deprecated or generic presets can include the property `"searchable": false`.
This means that they will be recognized by iD when editing existing data,
but will not be available as an option when adding new features.

By convention, unsearchable presets have filenames that begin with an underscore
(e.g. `data/presets/presets/landuse/_farm.json`)

##### `matchScore`

A number that ranks this preset against others that match the feature.

For example, a feature with `amenity=cafe` and `building=commercial` will match the Cafe preset instead of the Commercial Building preset because Commercial Building has a lower `matchScore`.

The default is `1.0`.

##### `countryCodes`

An array of two-letter, lowercase [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country codes. The preset will only be searchable when the user is editing over the specified, whitelisted countries. The locale and language of iD are not factors, just the position of the map.

By default, presets are available everywhere.

##### `notCountryCodes`

An array of two-letter, lowercase [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country codes. Similar to `countryCodes` except a blacklist instead of a whitelist.

##### `replacement`

The ID of a preset that is preferable to this one. iD's validator will flag features matching this preset and recommend that the user upgrade the tags.

When possible, use `deprecated.json` instead to specify upgrade paths for old tags. This property is meant for special cases, such as upgrades with geometry requirements.

##### `reference`

A key and optionally a value to link to the wiki documentation for this preset. Only necessary if the preset consists of several tags.

For example,
```javascript
"reference": {
    "key": "tower:type",
    "value": "communication"
}
```

## Fields

Fields are reusable form elements that can be associated with presets.

#### Field Files

Fields are defined in JSON files located under `data/presets/fields`.

The field files are typically named according to their associated OSM key.
For example, the field for the tag `sport=*` is stored in the file
`data/presets/fields/sport.json`.  When a field has multiple versions that
depend on which preset is active, we add a suffix to the filename:
(`sport.json`, `sport_ice.json`, `sport_racing_motor.json`).

Some keys in OSM are namespaced using colons (':').  Namespaced fields
are nested in folders according to their tag.
For example, the field for the tag `piste:difficulty=*` is stored in the file
`data/presets/fields/piste/difficulty.json`.


#### Field Schema

```js
{
    "key": "cuisine",
    "type": "combo",
    "label": "Cuisine"
}
```
The complete JSON schema for fields can be found in [`data/presets/schema/field.json`](schema/field.json)

#### Field Properties

##### `type`

A string specifying the UI and behavior of the field. Must be one of the following values.

###### Text fields

* `text` - Basic single line text field
* `number` - Text field with up/down buttons for entering numbers (e.g. `width=*`)
* `localized` - Text field with localization abilities (e.g. `name=*`, `name:es=*`, etc.)
* `tel` - Text field for entering phone numbers (localized for editing location)
* `email` - Text field for entering email addresses
* `url` - Text field for entering URLs
* `identifier` - Text field for foreign IDs (e.g. `gnis:feature_id`)
* `textarea` - Multi-line text area (e.g. `description=*`)

###### Combo/Dropdown fields

* `combo` - Dropdown field for picking one option out of many (e.g. `surface=*`)
* `typeCombo` - Dropdown field picking a specific type from a generic category key<br/>
(e.g. `waterway=*`.  If unset, tag will be `waterway=yes`, but dropdown contains options like `stream`, `ditch`, `river`)
* `multiCombo` - Dropdown field for adding `yes` values to a common multikey<br/>
(e.g. `recycling:*` -> `recycling:glass=yes`, `recycling:paper=yes`, etc.)
* `networkCombo` - Dropdown field that helps users pick a route `network` tag (localized for editing location)
* `semiCombo` - Dropdown field for adding multiple values to a semicolon-delimited list<br/>
(e.g. `sport=*` -> `soccer;lacrosse;athletics;field_hockey`)

###### Checkboxes

* `check` - 3-state checkbox: `yes`, `no`, unknown (no tag)
* `defaultCheck` - 2-state checkbox where checked produces `yes` and unchecked produces no tag
* `onewayCheck` - 3-state checkbox for `oneway` fields, with extra button for direction switching

###### Radio Buttons

* `radio` - Multiple choice radio button field
* `structureRadio` - Multiple choice structure radio button field, with extra input for bridge/tunnel level

###### Special

* `access` - Block of dropdowns for defining the `access=*` tags on a highway
* `address` - Block of text and dropdown fields for entering address information (localized for editing location)
* `cycleway` - Block of dropdowns for adding `cycleway:left` and `cycleway:right` tags on a highway
* `maxspeed` - Numeric text field for speed and dropdown for "mph/kph"
* `restrictions` - Graphical field for editing turn restrictions
* `wikidata` - Search field for selecting a Wikidata entity
* `wikipedia` - Block of fields for selecting a wiki language and Wikipedia page

##### `key`/`keys`

The `key` property names the OSM key that the field will edit.
Compound fields like `address` expect an array of keys in the `keys` property.

##### `universal`

If a field definition contains the property `"universal": true`, this field will
appear in the "Add Field" list for all presets

##### `geometry`

If specified, only show the field for this kind of geometry.  Should contain
one of `point`, `vertex`, `line`, `area`.

##### `default`

The default value for the field.  For example, the `building_area.json` field
will automatically add the tag `building=yes` to certain presets that are
associated with building features (but only if drawn as a closed area).

```js
{
    "key": "building",
    "type": "combo",
    "default": "yes",
    "geometry": "area",
    "label": "Building"
}
```

##### `options`

Combo field types can provide dropdown values in an `options` array.
The user can pick from any of the options, or type their own value.

```js
{
    "key": "diaper",
    "type": "combo",
    "label": "Diaper Changing Available",
    "options": ["yes", "no", "room", "1", "2", "3", "4", "5"]
}
```

##### `strings`

Combo field types can accept name-value pairs in the `strings` property.
This is helpful when the field has a fixed number of options and you want to be
able to provide a translatable description of each option.  When using `strings`,
the user can not type their own value, they must choose one of the given values.

```js
{
    "key": "smoothness",
    "type": "combo",
    "label": "Smoothness",
    "placeholder": "Thin Rollers, Wheels, Off-Road...",
    "strings": {
        "options": {
            "excellent": "Thin Rollers: rollerblade, skateboard",
            "good": "Thin Wheels: racing bike",
            "intermediate": "Wheels: city bike, wheelchair, scooter",
            "bad": "Robust Wheels: trekking bike, car, rickshaw",
            "very_bad": "High Clearance: light duty off-road vehicle",
            "horrible": "Off-Road: heavy duty off-road vehicle",
            "very_horrible": "Specialized off-road: tractor, ATV",
            "impassable": "Impassable / No wheeled vehicle"
        }
    }
}
```

If a combo field does not specify `options` or `strings`, the field will fetch
common tag values from the Taginfo service to use as dropdown values.

##### `snake_case`

For combo fields, spaces are replaced with underscores in the tag value if `snake_case` is `true`. The default is `true`.

##### `caseSensitive`

For combo fields, case-sensitve field values are allowed if `caseSensitive` is `true`. The default is `false`.

##### `min_value`

For number fields, the lowest valid value. There is no default.

##### `max_value`

For number fields, the greatest valid value. There is no default.

##### `prerequisiteTag`

An object defining the tags the feature needs before this field will be displayed. It may have this property:

- `key`: The key for the required tag.

And may optionally be combined with one of these properties:

- `value`: The value that the key must have.
- `valueNot`: The value that the key must not have.

Alternatively, the object may contain a single property:

- `keyNot`: The key that must not be present.

For example, this is how we show the Internet Access Fee field only if the feature has an `internet_access` tag not equal to `no`.

```js
"prerequisiteTag": {
    "key": "internet_access",
    "valueNot": "no"
}
```

If a feature has a value for this field's `key` or `keys`, it will display regardless of the `prerequisiteTag` property.

##### `countryCodes`

An array of two-letter, lowercase [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country codes. The field will only be available for features in the specified, whitelisted countries.

By default, fields are available everywhere.

##### `notCountryCodes`

An array of two-letter, lowercase [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country codes. Similar to `countryCodes` except a blacklist instead of a whitelist.

##### `urlFormat`

For `identifier` fields, the permalink URL of the external record. It must contain a `{value}` placeholder where the tag value will be inserted. For example:

```js
"urlFormat": "https://geonames.usgs.gov/apex/f?p=gnispq:3:::NO::P3_FID:{value}"
```

##### `pattern`

For `identifier` fields, the regular expression that valid values are expected to match to be linkable.


## Building

To build presets, all you need to do is run `npm run build`.

The following files are autogenerated and will be replaced when rebuilding:

* `data/presets/categories.json`
* `data/presets/fields.json`
* `data/presets/presets.json`
* `data/presets.yaml`
* `data/taginfo.json`
* `dist/locales/en.json`


## Custom Presets

iD supports deployments which use a custom set of presets. You can supply presets via
the `presets` accessor:

```js
var id = iD.coreContext().presets({
    presets: { ... },
    fields: { ... },
    defaults: { ... },
    categories: { ... }
});
```

All four parts (presets, fields, defaults, and categories) must be supplied. In addition,
several base presets and fields must be included.

Basic geometric presets must be included so that every feature matches at least one preset.
For example:

```js
"area": {
    "name": "Area",
    "tags": {},
    "geometry": ["area"],
    "matchScore": 0.1
},
"line": {
    "name": "Line",
    "tags": {},
    "geometry": ["line"],
    "matchScore": 0.1
},
"point": {
    "name": "Point",
    "tags": {},
    "geometry": ["point", "vertex"],
    "matchScore": 0.1
},
"relation": {
    "name": "Relation",
    "tags": {},
    "geometry": ["relation"],
    "matchScore": 0.1
}
```

A "name" field must be included:

```js
"name": {
    "key": "name",
    "type": "localized",
    "label": "Name",
    "placeholder": "Common name (if any)"
}
```