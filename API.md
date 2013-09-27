This file documents effors toward establishing a public API for iD, one that
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
  [imagery list](https://github.com/systemed/iD/blob/master/data/imagery.json),
  or a custom tile URL. A custom URL is specified in the format `custom:<url>`,
  where the URL can contain the standard tile URL placeholders `{x}`, `{y}` and
  `{z}`, `{ty}` for flipped TMS-style Y coordinates, and `{switch:a,b,c}` for
  DNS multiplexing. Example:
  `background=custom:http://{switch:a,b,c}.tiles.mapbox.com/v3/examples.map-4l7djmvo/{z}/{x}/{y}.png`

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
established a related geometric vocabulary consisting of points, vertices, lines,
and areas.

A **point** is a node that is not a member of any way. Elements representing points
have a `.point` class. Since a point is always a node, they also have a `.node` class.

A **vertex** is a node that is a member of one or more ways. Elements representing
points have `.vertex` and `.node` classes.

A **line** is a way that is not an area. Elements representing lines have a `.line`
class. Since a line is also a way, they also have a `.way` class.

An **area** is a way that is circular, has certain tags, or lacks certain other
tags (see `iD.Way#isArea` for the exact definition). Elements representing areas
have `.area` and `.way` classes.

### Tag classes

Elements also receive classes according to certain of the key-value tags that are
assigned to them.

TODO: elaborate.

### Special classes

A node that is a member of two or more ways shall have the `.shared` class.

Two or more nodes at identical coordinates shall each have an `.overlapped` class. (TODO)

Elements comprising the entity currently under the cursor shall have the `.hover` class.
(The `:hover` psuedo-class is insufficient when an entity's visual representation consists
of several elements, only one of which can be `:hover`ed.)

Elements that are currently active (being clicked or dragged) shall have the `.active`
class. (TODO)

Elements that are currently selected shall have the `.selected` class.