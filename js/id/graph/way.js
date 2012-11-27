// Way
// wiki: http://wiki.openstreetmap.org/wiki/Way
//
// Ways can either be open or closed. A closed way is such that the
// last node is the first node.
//
// If a a way is _closed_, it is assumed to be an area unless it has a
// `highway` or `barrier` tag and is not also tagged `area`.

iD.Way.isClosed = function(w) {
    return (!w.nodes.length) || w.nodes[w.nodes.length - 1].id === w.nodes[0].id;
};
