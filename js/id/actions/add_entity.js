iD.actions.AddEntity = function(way) {
    return function(graph) {
        return graph.replace(way);
    };
};
