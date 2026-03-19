import { actionAddMember } from './add_member';


// `actionMergeMembers` adds new members to a single relation
//
// * there must be only one relation in the selection
// * all other selected entities are added as new members to the relation
// * sorting is done "automagically" when applicable (e.g. connecting to
//   existing members of a route), otherwise they will be appended at the
//   end of the members list
// * members are added using an empty role

export function actionMergeMembers(entityIDs) {

    var action = function(graph) {
        let relationID;
        let newMembers = [];
        for (const entityID of entityIDs) {
            var entity = graph.entity(entityID);
            if (entity.type === 'relation') {
                relationID = entityID;
            } else {
                newMembers.push({
                    id: entity.id,
                    type: entity.type,
                    role: ''
                });
            }
        }

        for (const member of newMembers) {
            graph = actionAddMember(relationID, member)(graph);
        }

        // only keep relation in new selection (see operation/merge.js)
        entityIDs.splice(0, entityIDs.indexOf(relationID));
        entityIDs.splice(1, entityIDs.length - 1);

        return graph;
    };


    action.disabled = function(graph) {
        const relationCount = entityIDs.filter(entityID =>
            graph.entity(entityID).type === 'relation')
            .length;
        if (relationCount !== 1) return 'not_eligible';
    };

    action.id = 'merge_members';

    return action;
}
