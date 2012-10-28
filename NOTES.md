## Actions

Actions are operations on OSM data like adding nodes, moving ways,
and so on. They are initiated by controller states, like
`iD.controller.ControllerState` initiates a `CreatePOIAction` and
adds it to the undo stack.

## Entities

`iD.Entity` is the door from pure objects like `iD.Node` into a hierarchy
of objects - it provides handling of parents, children, and so on.

## loaded

The `.loaded` member of nodes and ways is because of [relations](http://wiki.openstreetmap.org/wiki/Relation),
which refer to elements, so we want to have real references of those
elements, but we don't have the data yet. Thus when the Connection
encounters a new object but has a non-loaded representation of it,
the non-loaded version is replaced.
