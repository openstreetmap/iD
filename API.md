This file documents efforts toward establishing a public API for iD.

## URL parameters

##### iD Standalone

iD supports several URL parameters. When constructing a URL to a standalone instance
of iD (e.g. `http://preview.ideditor.com/release/`), the following parameters are available
**in the hash portion of the URL**:

* __`background`__ - The value from a `sourcetag` property in iD's
  [imagery list](https://github.com/openstreetmap/iD/blob/develop/data/imagery.json),
  or a custom tile URL. A custom URL is specified in the format `custom:<url>`,
  where the URL can contain the standard tile URL placeholders `{x}`, `{y}` and
  `{z}`/`{zoom}`, `{ty}` for flipped TMS-style Y coordinates, and `{switch:a,b,c}` for
  DNS multiplexing.<br/>
  _Example:_ `background=custom:https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png`
* __`comment`__ - Prefills the changeset comment. Pass a url encoded string.<br/>
  _Example:_ `comment=CAR%20crisis%2C%20refugee%20areas%20in%20Cameroon`
* __`disable_features`__ - Disables features in the list.<br/>
  _Example:_ `disable_features=water,service_roads,points,paths,boundaries`<br/>
  _Available features:_ `points`, `traffic_roads`, `service_roads`, `paths`, `buildings`, `building_parts`, `indoor`, `landuse`,
  `boundaries`, `water`, `rail`, `pistes`, `aerialways`, `power`, `past_future`, `others`
* __`gpx`__ - A custom URL for loading a gpx track.  Specifying a `gpx` parameter will
  automatically enable the gpx layer for display.<br/>
  _Example:_ `gpx=https://tasks.hotosm.org/project/592/task/16.gpx`
* __`hashtags`__ - Prefills the changeset hashtags.  Pass a url encoded list of event
  hashtags separated by commas, semicolons, or spaces.  Leading '#' symbols are
  optional and will be added automatically. (Note that hashtag-like strings are
  automatically detected in the `comment`).<br/>
  _Example:_ `hashtags=%23hotosm-task-592,%23MissingMaps`
* __`id`__ - The character 'n', 'w', or 'r', followed by the OSM ID of a node, way or relation, respectively. Selects the specified entity, and, unless a `map` parameter is also provided, centers the map on it.<br/>
  _Example:_ `id=n1207480649`
* __`locale`__ - A code specifying the localization to use, affecting the language, layout, and keyboard shortcuts. The default locale is set by the browser.<br/>
  _Example:_ `locale=en-US`, `locale=de`<br/>
  _Available values:_ Any of the [supported locales](https://github.com/openstreetmap/iD/tree/develop/dist/locales).
* __`map`__ - A slash-separated `zoom/latitude/longitude`.<br/>
  _Example:_ `map=20.00/38.90085/-77.02271`
* __`maprules`__ - A path to a [MapRules](https://github.com/radiant-maxar/maprules) service endpoint for enhanced tag validation.<br/>
  _Example:_ `maprules=https://path/to/file.json`
* __`offset`__ - Background imagery alignment offset in meters, formatted as `east,north`.<br/>
  _Example:_ `offset=-10,5`
* __`photo_overlay`__ - The street-level photo overlay layers to enable.<br/>
  _Example:_ `photo_overlay=streetside,mapillary,openstreetcam`<br/>
  _Available values:_ `streetside` (Microsoft Bing), `mapillary`, `mapillary-signs`, `mapillary-map-features`, `openstreetcam`
* __`presets`__ - A comma-separated list of preset IDs. These will be the only presets the user may select.<br/>
  _Example:_ `presets=building,highway/residential,highway/unclassified`
* __`rtl=true`__ - Force iD into right-to-left mode (useful for testing).
* __`source`__ - Prefills the changeset source. Pass a url encoded string.<br/>
  _Example:_ `source=Bing%3BMapillary`
* __`walkthrough=true`__ - Start the walkthrough automatically

##### iD on openstreetmap.org (Rails Port)

When constructing a URL to an instance of iD embedded in the OpenStreetMap Rails
Port (e.g. `http://www.openstreetmap.org/edit?editor=id`), the following parameters
are available as **regular URL query parameters**:

* __`map`__ - same as standalone
* __`lat`__, __`lon`__, __`zoom`__ - Self-explanatory.
* __`node`__, __`way`__, __`relation`__ - Select the specified entity.
* __`background`__ - same as standalone
* __`disable_features`__ - same as standalone
* __`gpx`__ - same as standalone
* __`maprules`__ - same as standalone
* __`offset`__ - same as standalone
* __`presets`__ - same as standalone
* __`comment`__ - same as standalone
* __`source`__ - same as standalone
* __`hashtags`__ - same as standalone
* __`locale`__ - same as standalone, but the default locale is set by the language settings in your OSM user account.
* __`walkthrough`__ - same as standalone


## CSS selectors

iD has a documented and stable set of classes that can be used to apply style or
attach behavior to the visual representation of map data via CSS selectors.
These classes relate to the vocabulary of the OSM data model, a related geometric
vocabulary established by iD, and to the tags present on OSM entities.

### OSM Data Model classes

An SVG element on the map to which an iD.osmEntity has been bound as a datum shall
have a class with that datum's type, i.e. either `.node` or `.way`. (If and when
we add visual representations for relations, `.relation` may also be valid.)

The visual representation of a single entity may be composed of several elements,
e.g. ways are composed of casing and stroke. Such elements will have a distinct class
identifying the particular aspect of representation, e.g. `.casing` and `.stroke`.

The particular type of SVG element (`path`, `circle`, `image` etc.) that is used to
implement that visual representation is explicitly NOT part of the public API. Avoid
naming specific tags in CSS selectors; as iD evolves, we may need to change what SVG
elements we use in order to implement a particular visual style.

### Geometric classes

In addition to the OSM element vocabulary of nodes, ways, and relations, iD has
established a related geometric vocabulary consisting of points, vertices, midpoints,
lines, and areas.

A **point** is a node that is not a member of any way. Elements representing points
have a `.point` class. Since a point is always a node, they also have a `.node` class.

A **vertex** is a node that is a member of one or more ways. Elements representing
points have `.vertex` and `.node` classes.

A **midpoint** is a virtual point drawn midway between two vertices along a way.
Midpoints indicate the direction that the way, but can also be selected and dragged
to create a new point along the way.  Midpoints are classed with a `.midpoint` class.

A **line** is a way that is not an area. Elements representing lines have a `.line`
class. Since a line is also a way, they also have a `.way` class.

An **area** is a way that is circular, has certain tags, or lacks certain other
tags (see `iD.osmWay#isArea` for the exact definition). Elements representing areas
have `.area` and `.way` classes.


### Tag classes

Elements also receive classes according to certain of the OSM key-value tags that are
assigned to them.

Tag classes are prefixed with `tag-` (see [`iD.svgTagClasses`](https://github.com/openstreetmap/iD/blob/develop/js/id/svg/tag_classes.js) for details).

#### Primary

An element may be classed with at most one primary tag class based on its main OSM
key -- "building", "highway", "railway", "waterway", etc.
(e.g. `.tag-highway .tag-highway-residential`).

#### Secondary

An element may be classed with one or more secondary tag classes based on other
interesting OSM keys -- "bridge", "tunnel", "barrier", "surface", etc.
(e.g. `.tag-bridge .tag-bridge-yes`).

#### Status

An element may be classed with at most one status tag.  Status tagging in OSM can
be either key or value based, but iD attempts to detect most common lifecycle tagging
schemes -- "construction", "proposed", "abandoned", "disused", etc.
(e.g. `.tag-status .tag-status-construction`).

#### Unpaved Surfaces (highways only)

Most vehicular highways in OSM are assumed to have a smooth paved surface. A highway
element may receive the special tag class `.tag-unpaved` if it contains certain OSM tags
indicating a bumpy surface.

### Special classes

- A node that is a member of two or more ways shall have the `.shared` class.

- A node that is an endpoint of a linear way shall have the `.endpoint` class.

- Two or more nodes at identical coordinates shall each have an `.overlapped` class. (TODO)

- Elements comprising the entity currently under the cursor shall have the `.hover` class.
(The `:hover` psuedo-class is insufficient when an entity's visual representation consists
of several elements, only one of which can be `:hover`ed.)

- Elements that are currently active (being clicked or dragged) shall have the `.active`
class.

- Elements that are currently selected shall have the `.selected` class.


## Customized Deployments

iD may be used to edit maps in a non-OpenStreetMap environment.  This requires
certain parts of the iD code to be replaced at runtime by custom code or data.

iD is written in a modular style and bundled with [rollup.js](http://rollupjs.org/),
which makes hot code replacement tricky.  (ES6 module exports are
[immutable live bindings](http://www.2ality.com/2015/07/es6-module-exports.html)).
Because of this, the parts of iD which are designed for customization are exported
as live bound objects that can be overridden at runtime _before initializing the iD context_.

### Services

The `iD.services` object includes code that talks to other web services.

To replace the OSM service with a custom service that exactly mimics the default OSM service:
```js
iD.services.osm = serviceMyOSM;
```

Some services may be removed entirely.  For example, to remove the Mapillary service:
```js
iD.services.mapillary = undefined;
// or
delete iD.services.mapillary;
```


### Background Imagery

iD's background imagery database is stored in the `iD.fileFetcher.cache().imagery` array and can be
overridden or modified prior to creating the iD context.

Note that the "None" and "Custom" options will always be shown in the list.

To remove all imagery from iD:
```js
iD.fileFetcher.cache().imagery = [];
```

To replace all imagery with a single source:
```js
iD.fileFetcher.cache().imagery = [{
    "id": "ExampleImagery",
    "name": "My Imagery",
    "type": "tms",
    "template": "http://{switch:a,b,c}.tiles.example.com/{z}/{x}/{y}.png"
}];
```

Each imagery source should have the following properties:
* `id` - Unique identifier for this source (also used as a url parameter)
* `name` - Display name for the source
* `type` - Source type, currently only `tms` is supported
* `template` - Url template, valid replacement tokens include:
  * `{z}`, `{x}`, `{y}` - for Z/X/Y scheme
  * `{-y}` or `{ty}` - for flipped Y
  * `{u}` - for quadtile scheme
  * `{switch:a,b,c}` - for parts of the url that can be cycled for connection parallelization

Optional properties:
* `description` - A longer source description which, if included, will be displayed in a popup when viewing the background imagery list
* `overlay` - If `true`, this is an overlay layer (a transparent layer rendered above base imagery layer). Defaults to `false`
* `zoomExtent` - Allowable min and max zoom levels, defaults to `[0, 22]`
* `polygon` - Array of coordinate rings within which imagery is valid.  If omitted, imagery is assumed to be valid worldwide
* `overzoom` - Can this imagery be scaled up when zooming in beyond the max zoom?  Defaults to `true`
* `terms_url` - Url to link to when displaying the imagery terms
* `terms_html` - Html content to display in the imagery terms
* `terms_text` - Text content to display in the imagery terms
* `best` - If set to `true`, this imagery is considered "better than Bing" and may be chosen by default when iD starts.  Will display with a star in the background imagery list.  Defaults to `false`

For more details about the `iD.fileFetcher.cache().imagery` structure, see
[`update_imagery.js`](https://github.com/openstreetmap/iD/blob/develop/scripts/update_imagery.js).


### Presets

iD's preset database is stored in the `iD.fileFetcher.cache().presets` object and can be overridden
or modified prior to creating the iD context.

The format of the `presets` object is
[documented here](https://github.com/openstreetmap/iD/tree/develop/data/presets#custom-presets).

To add a new preset to iD's existing preset database.
```js
iD.fileFetcher.cache().presets.presets["aerialway/zipline"] = {
    geometry: ["line"],
    fields: ["incline"],
    tags: { "aerialway": "zip_line" },
    name: "Zipline"
};
```

To completely replace iD's default presets with your own:
```js
iD.fileFetcher.cache().presets = myPresets;
```

To run iD with the minimal set of presets that only match basic geometry types:
```js
iD.fileFetcher.cache().presets = {
    presets: {
        "area": {
            "name": "Area",
            "tags": {},
            "geometry": ["area"]
        },
        "line": {
            "name": "Line",
            "tags": {},
            "geometry": ["line"]
        },
        "point": {
            "name": "Point",
            "tags": {},
            "geometry": ["point"]
        },
        "vertex": {
            "name": "Vertex",
            "tags": {},
            "geometry": ["vertex"]
        },
        "relation": {
            "name": "Relation",
            "tags": {},
            "geometry": ["relation"]
        }
    }
};
```


### Minimum Editable Zoom

The minimum zoom at which iD enters the edit mode is configured using the `context.minEditableZoom()` accessor. The default value is 16. To change this initialise the iD context as:

```js

var id = iD.coreContext()
  .minEditableZoom(zoom_level)

```

This should be set with caution for performance reasons. The OpenStreetMap API has a limitation of 50000 nodes per request.
