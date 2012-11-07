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

iD implements a [persistent data structure](http://en.wikipedia.org/wiki/Persistent_data_structure)
over the OSM data model.

The data model of OSM is something like

    root -> relations (-> relations) -> ways -> nodes
       \                             \> nodes
        \-  ways -> nodes
         \- nodes

In English:

* Relations have (ways, nodes, relations)
* Ways have (nodes)
* Nodes have ()

## Persistence

The background for this is in [#50](https://github.com/systemed/iD/issues/50).

Also see [this spec by jfirebaugh](https://gist.github.com/3994398)

The idea is that we keep every _changed_ of an object around, but reuse
unchanged objects between versions.

So, possibly the datastructure on first load is like

```javascript
{
    1: [1],
    2: [2],
    3: [3]
}
```

After one edit in which the object formerly known as `1` acquires a new
version, it is like:

```javascript
{
    1: [4, 1],
    2: [2, 2],
    3: [3, 3]
}
```

Issues:

* [Performance seems to suffer with Object.freeze](http://stackoverflow.com/questions/8435080/any-performance-benefit-to-locking-down-javascript-objects).

The alternative to this approach is changing the object graph itself and keeping
the change data in another representation, like an undo stack.

At the very least, changes need to have:

* A name ('Changed 2 Nodes')
* Changes (whether in discrete versions or a 'change object' that can be applied and unapplied)

## Performance

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
