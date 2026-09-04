import type { Action } from '../core/history';
import type { RelationId } from '../osm';
import { actionDeleteRelation } from './delete_relation';


export function actionDeleteMember(relationId: RelationId, memberIndex: number): Action {
    return function(graph) {
        var relation = graph.entity(relationId)
            .removeMember(memberIndex);

        graph = graph.replace(relation);

        if (relation.isDegenerate()) {
            graph = actionDeleteRelation(relation.id)(graph);
        }

        return graph;
    };
}
