iD.actions.Revert = function(id) {

    var action = function(graph) {
        var entity = graph.hasEntity(id),
            base = graph.base().entities[id];

        if (entity && !base) {
            return iD.actions.DeleteMultiple([id])(graph);
        } else {
            return graph.revert(id);
        }
    };

    return action;
};
