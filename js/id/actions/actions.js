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
iD.actions.remove = function(entity) {
    return function(graph) {
        graph.parentWays(entity.id)
            .forEach(function(parent) {
                graph = iD.actions.removeWayNode(parent, entity)(graph);
            });

        graph.parentRelations(entity.id)
            .forEach(function(parent) {
                graph = iD.actions.removeRelationEntity(parent, entity)(graph);
            });

        return graph.remove(entity, 'removed a feature');
    };
};

// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/AddNodeToWayAction.as
iD.actions.addWayNode = function(way, node, index) {
    return function(graph) {
        var nodes = way.nodes.slice();
        nodes.splice(index || nodes.length, 0, node.id);
        return graph.replace(way.update({nodes: nodes})).replace(node, 'added to a road');
    };
};

iD.actions.removeWayNode = function(way, node) {
    return function(graph) {
        var nodes = _.without(way.nodes, node.id);
        return graph.replace(way.update({nodes: nodes}), 'removed from a road');
    };
};

iD.actions.removeRelationEntity = function(relation, entity) {
    return function(graph) {
        var members = _.without(relation.members, entity.id);
        return graph.replace(relation.update({members: members}), 'removed from a relation');
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
iD.actions.move = function(entity, loc) {
    return function(graph) {
        return graph.replace(entity.update({loc: loc}), 'moved an element');
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
