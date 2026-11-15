import type { Action } from '../core/history';
import type { RelationId } from '../osm';

export function actionMoveMember(relationId: RelationId, fromIndex: number, toIndex: number): Action {
    return function(graph) {
        return graph.replace(graph.entity(relationId).moveMember(fromIndex, toIndex));
    };
}
