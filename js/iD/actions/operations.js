iD.operations = {};

iD.operations.addNode = function(map, node) {
    map.graph.modify(function(graph) {
        var o = {};
        o[node.id] = node;
        return graph.set(o);
    }, 'added a place');
    map.update();
};

iD.operations.startWay = function(map, way) {
    map.graph.modify(function(graph) {
        var o = {};
        o[way.id] = way;
        return graph.set(o);
    }, 'started a road');
    map.update();
};

iD.operations.changeWayNodes = function(map, way, node) {
    map.graph.modify(function(graph) {
        var o = {};
        way.nodes = way.nodes.slice();
        o[way.id] = pdata.object(way).get();
        o[node.id] = node;
        return graph.set(o);
    }, 'added to a road');
    map.update();
};

iD.operations.addTemporary = function(map, node) {
    map.graph.modify(function(graph) {
        var o = {};
        o[node.id] = node;
        return graph.set(o);
    }, '');
    map.update();
};

iD.operations.removeTemporary = function(map, node) {
    map.graph.modify(function(graph) {
        return graph.remove(node.id);
    }, '');
    map.update();
};
