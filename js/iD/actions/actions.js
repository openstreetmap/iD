iD.actions = {};

iD.actions.noop = function() {
    return function(graph) {
        return graph;
    };
};

// https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/AddCommand.java
iD.actions.addNode = function(node) {
    return function(graph) {
        return graph.replace(node, 'added a place');
    };
};

iD.actions.startWay = function(way) {
    return function(graph) {
        return graph.replace(way, 'started a road');
    };
};

// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteWayAction.as
iD.actions.remove = function(node) {
    return function(graph) {
        return graph.remove(node, 'removed a feature');
    };
};

// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/AddNodeToWayAction.as
iD.actions.changeWayNodes = function(way, node) {
    return function(graph) {
        return graph.replace(way.update({
            nodes: way.nodes.slice()
        })).replace(node, 'added to a road');
    };
};

// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/AddNodeToWayAction.as
iD.actions.changeWayDirection = function(way) {
    return function(graph) {
        return graph.replace(way.update({
            nodes: way.nodes.slice()
        }), 'changed way direction');
    };
};

iD.actions.changeTags = function(node, tags) {
    return function(graph) {
        return graph.replace(node.update({
            tags: tags
        }), 'changed tags');
    };
};

// https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/MoveCommand.java
// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MoveNodeAction.as
iD.actions.move = function(entity, to) {
    return function(graph) {
        return graph.replace(entity.update({
            lon: to.lon || to[0],
            lat: to.lat || to[1]
        }), 'moved an element');
    };
};

iD.actions.addTemporary = function(node) {
    return function(graph) {
        return graph.replace(node);
    };
};

iD.actions.removeTemporary = function(node) {
    return function(graph) {
        return graph.remove(node);
    };
};
