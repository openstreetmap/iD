// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteRelationAction.as
iD.actions.DeleteRelation = function(relationId) {
    return function(graph) {
        var relation = graph.entity(relationId);

        graph.parentRelations(relation)
            .forEach(function(parent) {
                graph = graph.replace(parent.removeMember(relationId));
            });

        return graph.remove(relation);
    };
};
