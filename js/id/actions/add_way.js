iD.actions.AddWay = function(way) {
    return function(graph) {
        return graph.replace(way);
    };
};
