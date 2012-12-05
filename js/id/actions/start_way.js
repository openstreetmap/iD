iD.actions.startWay = function(way) {
    return function(graph) {
        return graph.replace(way, 'started a road');
    };
};
