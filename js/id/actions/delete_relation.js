// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteRelationAction.as
iD.actions.DeleteRelation = function(relationId) {
    function deleteEntity(entity, graph) {
        return !graph.parentWays(entity).length &&
            !graph.parentRelations(entity).length &&
            !entity.hasInterestingTags();
    }

    var action = function(graph) {
        var relation = graph.entity(relationId);

        graph.parentRelations(relation)
            .forEach(function(parent) {
                graph = graph.replace(parent.removeMember(relationId));
            });

        _.uniq(_.pluck(relation.members, 'id')).forEach(function(memberId) {
            graph = graph.replace(relation.removeMember(memberId));

            var entity = graph.entity(memberId);
            if (deleteEntity(entity, graph)) {
                graph = iD.actions.DeleteMultiple([memberId])(graph);
            }
        });

        return graph.remove(relation);
    };

    action.disabled = function(graph) {
        if (!graph.entity(relationId).isComplete(graph))
            return 'incomplete_relation';
    };

    return action;
};
