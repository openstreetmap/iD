iD.operations = {};

iD.operations.noop = function() {
    return function(graph) {
        return graph;
    };
};

iD.operations.addNode = function(node) {
    return function(graph) {
        return graph.replace(node, 'added a place');
    }
};

iD.operations.startWay = function(way) {
    return function(graph) {
        return graph.replace(way, 'started a road');
    };
};

iD.operations.remove = function(node) {
    return function(graph) {
        return graph.remove(node, 'removed a feature');
    };
};

iD.operations.changeWayNodes = function(way, node) {
    return function(graph) {
        return graph.replace(way.update({
            nodes: way.nodes.slice()
        })).replace(node, 'added to a road');
    };
};

iD.operations.changeTags = function(node, tags) {
    return function(graph) {
        return graph.replace(node.update({
            tags: tags
        }), 'changed tags');
    };
};

iD.operations.move = function(entity, to) {
    return function(graph) {
        return graph.replace(entity.update({
            lon: to.lon || to[0],
            lat: to.lat || to[1]
        }), 'moved an element');
    };
};

iD.operations.addTemporary = function(node) {
    return function(graph) {
        return graph.replace(node);
    };
};

iD.operations.removeTemporary = function(node) {
    return function(graph) {
        return graph.remove(node);
    };
};
