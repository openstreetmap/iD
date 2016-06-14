import { DeleteRelation } from './delete_relation';

export function DeleteMember(relationId, memberIndex) {
    return function(graph) {
        var relation = graph.entity(relationId)
            .removeMember(memberIndex);

        graph = graph.replace(relation);

        if (relation.isDegenerate())
            graph = DeleteRelation(relation.id)(graph);

        return graph;
    };
}
