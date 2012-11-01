## The Graph

iD implements a [persistent data structure](http://en.wikipedia.org/wiki/Persistent_data_structure)
over the OSM data model.

To be clear, this data model is something like


    root -> relations (-> relations) -> ways -> nodes
       \                             \> nodes
        \-  ways -> nodes
         \- nodes


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
