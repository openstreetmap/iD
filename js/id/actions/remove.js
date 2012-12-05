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
