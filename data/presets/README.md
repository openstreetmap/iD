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
    // An array of field names. See the fields documentation for details of what's valid here.
    "fields": [
        "address"
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

##### searchable

Deprecated or generic presets can include the property `"searchable": false`.
This means that they will be recognized by iD when editing existing data,
but will not be available as an option when adding new features.

By convention, unsearchable presets have filenames that begin with an underscore
(e.g. `data/presets/presets/landuse/_farm.json`)


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


#### Field Types

**Text fields**
* `text` - Basic single line text field
* `number` - Text field with up/down buttons for entering numbers (e.g. `width=*`)
* `localized` - Text field with localization abilities (e.g. `name=*`, `name:es=*`, etc.)
* `tel` - Text field for entering phone numbers (localized for editing location)
* `email` - Text field for entering email addresses
* `url` - Text field for entering URLs
* `textarea` - Multi-line text area (e.g. `description=*`)

**Combo/Dropdown fields**
* `combo` - Dropdown field for picking one option out of many (e.g. `surface=*`)
* `typeCombo` - Dropdown field picking a specific type from a generic category key<br/>
(e.g. `waterway=*`.  If unset, tag will be `waterway=yes`, but dropdown contains options like `stream`, `ditch`, `river`)
* `multiCombo` - Dropdown field for adding `yes` values to a common multikey<br/>
(e.g. `recycling:*` -> `recycling:glass=yes`, `recycling:paper=yes`, etc.)
* `networkCombo` - Dropdown field that helps users pick a route `network` tag (localized for editing location)
* `semiCombo` - Dropdown field for adding multiple values to a semicolon-delimited list<br/>
(e.g. `sport=*` -> `soccer;lacrosse;athletics;field_hockey`)

**Checkboxes**
* `check` - 3-state checkbox: `yes`, `no`, unknown (no tag)
* `defaultCheck` - 2-state checkbox where checked produces `yes` and unchecked produces no tag
* `onewayCheck` - 3-state checkbox for `oneway` fields, with extra button for direction switching

**Radio Buttons**
* `radio` - Multiple choice radio button field
* `structureRadio` - Multiple choice structure radio button field, with extra input for bridge/tunnel level

**Special**
* `access` - Block of dropdowns for defining the `access=*` tags on a highway
* `address` - Block of text and dropdown fields for entering address information (localized for editing location)
* `cycleway` - Block of dropdowns for adding `cycleway:left` and `cycleway:right` tags on a highway
* `maxspeed` - Numeric text field for speed and dropdown for "mph/kph"
* `restrictions` - Graphical field for editing turn restrictions
* `wikipedia` - Block of fields for selecting a wiki language and Wikipedia page


#### Field Properties

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

## Icons

You can use any of the following open source map icon sets as preset icons.

* [Maki](http://www.mapbox.com/maki/) - prefix: `maki-`
* [Temaki](http://bhousel.github.io/temaki/docs/) - prefix: `temaki-`
* [Font Awesome (free, solid)](https://fontawesome.com/icons?d=gallery&s=solid) - prefix: `fas-`
* [Font Awesome (free, regular)](https://fontawesome.com/icons?d=gallery&s=regular) - prefix: `far-`
* [Font Awesome (free, brands)](https://fontawesome.com/icons?d=gallery&s=brands) - prefix: `fab-`
* [iD's spritesheet](https://github.com/openstreetmap/iD/tree/master/svg/iD-sprite/presets) - prefix: `iD-`

When specifying an icon, use the prefixed version of the name, for example `"icon": "maki-park"`.


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
var id = iD.Context().presets({
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
    "geometry": ["point"],
    "matchScore": 0.1
},
"vertex": {
    "name": "Other",
    "tags": {},
    "geometry": ["vertex"],
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
