import { DeleteMultiple } from './delete_multiple';

// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteRelationAction.as
export function DeleteRelation(relationId) {
    function deleteEntity(entity, graph) {
        return !graph.parentWays(entity).length &&
            !graph.parentRelations(entity).length &&
            !entity.hasInterestingTags();
    }

    var action = function(graph) {
        var relation = graph.entity(relationId);

        graph.parentRelations(relation)
            .forEach(function(parent) {
                parent = parent.removeMembersWithID(relationId);
                graph = graph.replace(parent);

                if (parent.isDegenerate()) {
                    graph = DeleteRelation(parent.id)(graph);
                }
            });

        _.uniq(_.map(relation.members, 'id')).forEach(function(memberId) {
            graph = graph.replace(relation.removeMembersWithID(memberId));

            var entity = graph.entity(memberId);
            if (deleteEntity(entity, graph)) {
                graph = DeleteMultiple([memberId])(graph);
            }
        });

        return graph.remove(relation);
    };

    action.disabled = function(graph) {
        if (!graph.entity(relationId).isComplete(graph))
            return 'incomplete_relation';
    };

    return action;
}
