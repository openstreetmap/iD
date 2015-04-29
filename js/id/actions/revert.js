iD.actions.Revert = function(entity) {
    return function(graph) {
        return graph.revert(entity);
    };
};
