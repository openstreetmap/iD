## Browser Features caniuse

* [CORS](http://caniuse.com/#feat=cors)
* [SVG](http://caniuse.com/#feat=svg)
* [CSS 3D Transforms](http://caniuse.com/#feat=transforms3d): No IE9, No Opera
* [localStorage](http://caniuse.com/#feat=namevalue-storage)
* [hashchange event](http://caniuse.com/#feat=hashchange)

## Interactions

Way drawing strategy:

* START: Click to start way
* END: Click on own node
* END: Click on self-segment
* END: Escape key

* [Adding a new road in MapZen](http://www.youtube.com/watch?v=tdpDm6MiUEM)
* [Editing turn restrictions](http://www.youtube.com/watch?v=DyHorSJFbyg)

### Continuing Ways

Continuing ways is a tricky problem: for instance, fixing unclosed areas by
completing the loop.

**Potlatch** does this by clicking on the way (since it does
not show handles by default), showing handles, and if you click on the start
or end, it immediately starts drawing. If you escape out of that draw, you can
then edit the node itself.

**JOSM**, since it has an `add` mode, just selects the node if you click a start
or end. You need to be in draw mode, and then clicking on a start/end node
extends the way.

_However_ JOSM also does a little trick where if you have a node selected and
then enter draw mode, it'll start either a new way or a continuation of the way,
depending on whether it's the start or the end.

Also what happens if you click on a point that happens to be the start or end
of more than one way?

## Relations and Turn Restrictions

http://wiki.openstreetmap.org/wiki/Relation:restriction

## Pathological conditions

* Ways with one node
* Relations which contain themselves (circular references)
* Nodes with no tags and no way attached
* Ways which contain only nodes that are subsets of the nodes of other ways
* Paths with intersecting boundaries (invalid geometries)
* Nodes with tags that repeat what the way says

## Code Layout

This follows a similar layout to d3: each module of d3 has a file with its exact
name, like

```javascript
// format.js

iD.format = {};
```

And the parts of that module are in separate files that implement `iD.format.XML`
and so on.

## The Graph

The data model of OSM is something like

    root -> relations (-> relations) -> ways -> nodes
       \                             \> nodes
        \-  ways -> nodes
         \- nodes

In English:

* Relations have (ways, nodes, relations)
* Ways have (nodes)
* Nodes have ()

iD implements a [persistent data structure](http://en.wikipedia.org/wiki/Persistent_data_structure)
over the OSM data model. Instead of updating the graph in place when edits are made and storing enough
information about the change so that it can be undone in place, changes produce a new version of the
graph data structure, and the previous version is left untouced. "Undo" is accomplished simply by
reverting to the previous version.

The persistent data structure approach also takes advantage of the fact that the typical change modifies
only a small portion of the graph. The unchanged majority of the graph is shared between revisions,
keeping memory use to a minimum. For example, the `iD.actions.removeWayNode` action removes a single
node from a way. It produces new versions of three objects:

* The Array of nodes in the way.
* The way itself. The new version references the new Array of nodes.
* The Graph. The new version references the new way.

The previous versions of these three objects are retained. Since the previous version of the Graph
continues to reference the previous version of the way and its nodes, the action can be undone by
restoring this version. Meanwhile, both versions of the Graph share references to all the other
objects. Since these objects are never themselves mutated, this is safe.

In concrete terms, this approach dictates the following rule: all methods that produce a change in
the state of the data model objects (Entity, Graph) or their constituent parts (e.g. nodes Array,
tags Object) must return a new instance of the appropriate type, leaving the current instance
unchanged.

## UI

Rendering and UI code generally follows a [convention for reusable elements established by d3](http://bost.ocks.org/mike/chart/).

Constructor functions typically return a function decorated with additional properties. The function
can be called with `this` set to a d3 selection in order to set up the HTML structure. This is usually
done via [selection.call](https://github.com/mbostock/d3/wiki/Selections#wiki-call).

Accessors are implemented as a unified getter/setter function. When called with no arguments,
it acts as a getter; when called with an argument it acts as a setter and returns self, for
chaining. Accessors are preferable to constructor arguments; constructors typically take zero
arguments.

## Performance

See blog post: http://mapbox.com/osmdev/2012/11/20/getting-serious-about-svg/

Main performance concerns of iD:

### Panning & zooming performance of the map

SVG redraws are costly, especially when they require all features to
be reprojected.

Approaches:

* Using CSS transforms for intermediate map states, and then redrawing when
  map movement stops
* "In-between" projecting features to make reprojection cheaper

### Memory overhead of objects

Many things will be stored by iD. With the graph structure in place, we'll
be storing much more.

We also need to worry about **memory leaks**, which have been a big problem
in Potlatch 2. Storing OSM data and versions leads to a lot of object-referencing
in Javascript.

## Connection, Graph, Map

The Map is a display and manipulation element. It should have minimal particulars
of how exactly to store or retrieve data. It gets data from Connection and
asks for it from Graph.

Graph stores all of the objects and all of the versions of those objects.
Connection requests objects over HTTP, parses them, and provides them to Graph.

## loaded

The `.loaded` member of nodes and ways is because of [relations](http://wiki.openstreetmap.org/wiki/Relation),
which refer to elements, so we want to have real references of those
elements, but we don't have the data yet. Thus when the Connection
encounters a new object but has a non-loaded representation of it,
the non-loaded version is replaced.

## Prior Art

JOSM and Potlatch 2 appear to implement versioning in the same way, but having
an undo stack:

```java
// src/org/openstreetmap/josm/actions/MoveNodeAction.java
Main.main.undoRedo.add(new MoveCommand(n, coordinates));

// src/org/openstreetmap/josm/command/MoveCommand.java

/**
 * List of all old states of the objects.
 */
private List<OldState> oldState = new LinkedList<OldState>();

@Override public boolean executeCommand() {
// ...
}
@Override public void undoCommand() {
// ...
}
```

## Transforms Performance

There are two kinds of transforms: SVG and CSS. CSS transforms of SVG elements
are less efficient that SVG transforms of SVG elements. `translate` notation
has equivalent performance to `matrix` notation.

* [svg swarm with svg transform matrix](http://bl.ocks.org/d/4074697/)
* [svg swarm with svg transform translate](http://bl.ocks.org/d/4074808/)
* [svg swarm with css translate](http://bl.ocks.org/d/4074632/)

SVG transforms are a roughly 2x speedup relative to CSS - 16fps vs 32fps in
Google Chrome Beta.

* [svg swarm with css on html](http://bl.ocks.org/4081364)

However, using CSS transforms with HTML elements has vastly different and
better performance than using them with SVG elements. For this reason, iD
transforms a map-container element rather than a `g` element on panning
movements.

### Transforms in browsers

Matrix transforms are significantly slower than `translate` in webkit but
nearly equivalent in Firefox. Chrome is about 4x faster than Firefox with
transforms.

However, matrix transforms can also represent scale, and so they should be compared
with transform + scale. If you add an identity scale (`scale(1, 1)`), then
matrix and `translate scale` performance is similar in Chrome, though matrix
still lags significantly in Safari and Firefox.

## SVG point rounding performance

Rounding points in SVG gives a ~20% speedup.

* http://bl.ocks.org/4081369 ~18fps
* http://bl.ocks.org/4081356 ~22fps (about 20% faster)

And this is not just the effect of less `d` data:

* http://bl.ocks.org/4089090 ~18fps

## SVG Corner Cases

One-way streets need markers to indicate that they're one-way. Unfortunately
SVG [line markers](http://www.svgbasics.com/markers.html) are based strictly
off of vertices, so won't handle this case properly.

* textPath demo http://bl.ocks.org/4078870
* line markers http://bl.ocks.org/4079441

One way to resolve this is by using textPath with a glyph, like a gt sign or
triangle character if available. This has a few concerns:

* performance of textPath is known to suck in some cases. For simple cases, it is fine
* can we be absolutely sure about direction of text?
* glyphs need to be available. are webfonts svg-okay?

Or more importantly, we need to calculate the pixel length of a linestring,
calculate the width of a glyph, and do the necessary math so that it fills enough
of the line without overflowing.

See the [textPath element](http://www.w3.org/TR/SVG/text.html#TextPathElement) and its quirks.

See:

* [getComputedTextLength](http://www.w3.org/TR/SVG/text.html#__svg__SVGTextContentElement__getComputedTextLength)
* [getTotalLength](http://www.w3.org/TR/SVG/paths.html#__svg__SVGPathElement__getTotalLength)

## Authenticating

The [OAuth](http://oauth.net/) endpoint of OpenStreetMap does support
[CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing),
which is great and allows iD to do browser-side authentication. This requires some hacks,
mainly that a cookie is used to persist the token_secret between pageloads.

## Making Edits

    PUT /api/0.6/changeset/create
    POST /api/0.6/changeset/135324/upload
    PUT /api/0.6/changeset/135324/close

## Browser problems that affect iD

See also: [Kothic browser bugs](https://github.com/kothic/kothic-js/wiki/Browser-bugs).

**one-way streets** use glyphs and textPaths. letter-spacing is not supported
in Firefox but is in webkit so we need to use spaces.

And trailing spaces are not included in getComputedTextLength:

* https://bugzilla.mozilla.org/show_bug.cgi?id=346694

webkit doesn't let querySelectorAll select camelcase elements:

* https://bugs.webkit.org/show_bug.cgi?id=46800
* https://bugs.webkit.org/show_bug.cgi?id=83438
* https://github.com/mbostock/d3/issues/925
