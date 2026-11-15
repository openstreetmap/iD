import type { Action } from '../core/history';
import type { RelationId } from '../osm';
import type { RelationMember } from '../osm/relation';

export function actionChangeMember(relationId: RelationId, member: RelationMember, memberIndex: number): Action {
    return function(graph) {
        return graph.replace(graph.entity(relationId).updateMember(member, memberIndex));
    };
}
