This file documents efforts toward establishing a public API for iD, one that
can support plugin development.

## URL parameters

iD supports several URL parameters. When constructing a URL to a standalone instance
of iD (e.g. `http://openstreetmap.us/iD/release/`), the following parameters are available
in the hash portion of the URL:

* `map` - A slash separated zoom level, longitude, and latitude. Example:
  `map=20.00/-77.02271/38.90085`.
* `id` - The character 'n', 'w', or 'r', followed by the OSM ID of a node,
   way or relation, respectively. Selects the specified entity, and, unless
   a `map` parameter is also provided, centers the map on it.
* `background` - The value from a `sourcetag` property in iD's
  [imagery list](https://github.com/openstreetmap/iD/blob/master/data/imagery.json),
  or a custom tile URL. A custom URL is specified in the format `custom:<url>`,
  where the URL can contain the standard tile URL placeholders `{x}`, `{y}` and
  `{z}`/`{zoom}`, `{ty}` for flipped TMS-style Y coordinates, and `{switch:a,b,c}` for
  DNS multiplexing. Example:
  `background=custom:http://{switch:a,b,c}.tiles.mapbox.com/v4/examples.map-4l7djmvo/{z}/{x}/{y}.png`
* `comment` - Prefills the changeset comment box, for use when integrating iD with
  external task management or quality assurance tools. Example:
  `comment=CAR%20crisis%2C%20refugee%20areas%20in%20Cameroon%20%23hotosm-task-592`.

When constructing a URL to an instance of iD embedded in the OpenStreetMap Rails
Port (e.g. `http://www.openstreetmap.org/edit?editor=id`), the following parameters
are available as regular URL query parameters:

* `lat`, `lon`, `zoom` - Self-explanatory.
* `node`, `way`, `relation` - Select the specified entity.

In addition, the `background` parameter is available as a hash parameter as above.

## CSS selectors

iD has a documented and stable set of classes that can be used to apply style or
attach behavior to the visual representation of map data via CSS selectors.
These classes relate to the vocabulary of the OSM data model, a related geometric
vocabulary established by iD, and to the tags present on OSM entities.

### OSM Data Model classes

An SVG element on the map to which an iD.Entity has been bound as a datum shall
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
tags (see `iD.Way#isArea` for the exact definition). Elements representing areas
have `.area` and `.way` classes.


### Tag classes

Elements also receive classes according to certain of the OSM key-value tags that are
assigned to them.

Tag classes are prefixed with `tag-` (see [`iD.svg.TagClasses`](https://github.com/openstreetmap/iD/blob/master/js/id/svg/tag_classes.js) for details).

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

A node that is a member of two or more ways shall have the `.shared` class.

Two or more nodes at identical coordinates shall each have an `.overlapped` class. (TODO)

Elements comprising the entity currently under the cursor shall have the `.hover` class.
(The `:hover` psuedo-class is insufficient when an entity's visual representation consists
of several elements, only one of which can be `:hover`ed.)

Elements that are currently active (being clicked or dragged) shall have the `.active`
class.

Elements that are currently selected shall have the `.selected` class.

## Customized Deployments

iD is used to edit data outside of the OpenStreetMap environment. There are some basic configuration steps to introduce custom presets, imagery and tag information.

### Presets

iD can use external presets exclusively or along with the default OpenStreetMap presets. This is configured using the `iD().presets` accessor. To use external presets alone, initialize iD in index.html with the Presets object.

```js

var iD = iD()
  .presets(customPresets)
  .taginfo(iD.services.taginfo())
  .imagery(iD.data.imagery);

```

The format of the Preset object is [documented here](https://github.com/openstreetmap/iD/tree/master/data/presets#custom-presets).

### Imagery

Just like Presets, Imagery can be configured using the `iD().imagery` accessor.

```js

var iD = iD()
  .presets(customPresets)
  .taginfo(iD.services.taginfo())
  .imagery(customImagery);

```

The Imagery object should follow the structure defined by [editor-layer-index](https://github.com/osmlab/editor-layer-index/blob/gh-pages/schema.json)


### Taginfo

[Taginfo](http://taginfo.openstreetmap.org/) is a service that provides comprehensive documentation about the tags used in OpenStreetMap. iD uses Taginfo to display description and also autocomplete keys and values. This can be completely disabled by removing the `iD().taginfo` accessor. To point iD to a different instance of Taginfo other than the default OpenStreetMap instance

```js

var iD = iD()
  .presets(customPresets)
  .taginfo(iD.services.taginfo().endpoint('url'))
  .imagery(customImagery);

```

### Minimum Editable Zoom

The minimum zoom at which iD enters the edit mode is configured using the `iD().minEditableZoom()` accessor. The default value is 16. To change this initialise iD as

```js

var iD = iD().
  .minEditableZoom(zoom_level)

```

This should be set with caution for performance reasons. The OpenStreetMap API has a limitation of 50000 nodes per request.
