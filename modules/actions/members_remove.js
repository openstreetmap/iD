import { actionDeleteMembers } from './delete_members';


// `actionMembersRemove` removes selected members from a single relation
//
// * there must be only one relation in the selection
// * all other selected entities are members of the relation
// * the operation removes all occurrences of the features from
//   being a member of the relation

export function actionMembersRemove(entityIDs) {

    // export function actionDeleteMembers(relationId, memberIndexes) {

    var action = function(graph) {
        let relation;
        for (const entityID of entityIDs) {
            var entity = graph.entity(entityID);
            if (entity.type === 'relation') {
                relation = entity;
            }
        }
        let memberIndices = [];
        for (let i = 0; i < relation.members.length; i++) {
            if (entityIDs.indexOf(relation.members[i].id) > 0) {
                memberIndices.push(i);
            }
        }

        graph = actionDeleteMembers(relation.id, memberIndices)(graph);

        // only keep relation in new selection (see operation/merge.js)
        entityIDs.splice(0, entityIDs.indexOf(relation.id));
        entityIDs.splice(1, entityIDs.length - 1);

        return graph;
    };


    action.disabled = function(graph) {
        let relation;
        for (const entityID of entityIDs) {
            var entity = graph.entity(entityID);
            if (entity.type === 'relation') {
                if (relation !== undefined) return 'not_eligible';
                relation = entity;
            }
        }
        if (relation === undefined) {
            return 'not_eligible';
        }
        if (entityIDs.some(entityID => entityID !== relation.id &&
            !relation.members.find(member => member.id === entityID))) {
            return 'not_eligible';
        }
    };

    return action;
}
