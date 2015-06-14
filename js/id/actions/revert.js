iD.actions.Revert = function(id) {

    var action = function(graph) {
        var entity = graph.hasEntity(id),
            base = graph.base().entities[id];

        if (entity && !base) {    // entity will be removed..
            if (entity.type === 'node') {
                graph.parentWays(entity)
                    .forEach(function(parent) {
                        parent = parent.removeNode(id);
                        graph = graph.replace(parent);

                        if (parent.isDegenerate()) {
                            graph = iD.actions.DeleteWay(parent.id)(graph);
                        }
                    });
            }

            graph.parentRelations(entity)
                .forEach(function(parent) {
                    parent = parent.removeMembersWithID(id);
                    graph = graph.replace(parent);

                    if (parent.isDegenerate()) {
                        graph = iD.actions.DeleteRelation(parent.id)(graph);
                    }
                });
        }

        return graph.revert(id);
    };

    return action;
};
