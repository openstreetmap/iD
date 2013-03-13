## Presets

iD uses a simple presets system based on [JSON](http://en.wikipedia.org/wiki/JSON)
preset definitions and simple structure.

## Individual Presets

Specific presets are located under `data/presets/presets`. For convenience,
they're stored in sub-directories like `data/presets/presets/leisure/park.json`,
but these have no effect on their final functionality.

## Preset Format

A basic preset is of the form:

```javascript
{
    "name": "park",
    "match": {
        // the geometry types for which this preset is valid.
        // options are point, area, line, and vertex.
        // vertexes are points that are parts of lines, like the nodes
        // in a road
        // lines are unclosed ways, and areas are closed ways
        "geometry": [
            "point", "area"
        ],
        // terms are synonyms for the preset - these are added to fuel
        // the search functionality. searching for 'woodland' will bring
        // up this 'park' preset
        "terms": [
            "esplanade",
            "village green",
            "woodland"
        ],
        // tags that automatically added to the feature when it's selected
        "tags": {
            "leisure": "park"
        }
    },
    // the icon in iD which represents this feature
    "icon": "park",
    // A form. See the forms documentation for details of what's valid here.
    // Forms are arrays of form field types
    "form": [
        "address"
    ]
}
```

## Forms

Forms are, like presets, defined in JSON structures. A typical form is

```js
{
    "key": "access",
    "type": "combo"
}
```

In which `type` is the form's type. Valid form types are

* textarea
* radio
* combo
* check
* address
* defaultcheck - a checkbox that can be yes, no, or null - not filled

## Building

Presets are built with the `build.js` script in iD's root. `build.js` combines
all presets together with imagery data, deprecated and discarded tags into
one file, `data/data.js`.
