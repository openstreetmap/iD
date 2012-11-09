iD.operations = {};

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
        way.nodes = way.nodes.slice();
        way = pdata.object(way).get();
        return graph.replace(way).replace(node, 'added to a road');
    };
};

iD.operations.changeTags = function(node, tags) {
    return function(graph) {
        var node = pdata.object(node).set({ tags: tags }).get();
        return graph.replace(node, 'changed tags');
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
