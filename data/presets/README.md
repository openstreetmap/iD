## Presets

iD uses a simple presets system based on [JSON](http://en.wikipedia.org/wiki/JSON)
preset definitions and simple structure.

## Individual Presets

Specific presets are located under `data/presets/presets`. They're organized in a
directory hierarchy based on OSM key/value pairs. For example, the preset that matches
the tag `leisure=park` is in the file `data/presets/presets/leisure/park.json`.

## Preset Format

A basic preset is of the form:

```javascript
{
    // The icon in iD which represents this feature.
    "icon": "park",
    // An array of field names. See the fields documentation for details of what's valid here.
    "fields": [
        "address"
    ],
    // The geometry types for which this preset is valid.
    // options are point, area, line, and vertex.
    // vertexes are points that are parts of lines, like the nodes
    // in a road
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

## Fields

Fields are, like presets, defined in JSON structures. A typical field is

```js
{
    "key": "access",
    "type": "combo"
}
```

In which `type` is the fields's type. Valid field types are

* textarea
* radio
* combo
* address
* check - a tri-state checkbox: yes, no, or unknown (no tag)
* defaultcheck - a boolean checkbox where checked produces a `*=yes` tag and
  unchecked produces no tag

The `key` property names the OSM key that the field will edit. Alternatively, for
compound fields like `address`, you can specify an array of keys in the `keys`
property.

Each field definition lives in a separate file in `data/presets/fields`. The field
name (used in the preset `fields` property) is the name of the file (minus the `.json`
extension).

## Icons

Preset icons in iD are pulled from the open source map icon set,
[Maki](http://www.mapbox.com/maki/).
The icons are identified in iD by the same name as they are on the Maki home. Use those
names when identifying the icon to be used for a given preset.

## Building

To build presets, all you need to do is run `make`.

This command will take care of running the build script, which packages all presets
into one file: `dist/presets.js`, which is included in the packaged iD.js file.

## Custom Presets

iD supports deployments which use a custom set of presets. You can supply presets via
the `presets` accessor:

```js
var id = iD().presets({
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
