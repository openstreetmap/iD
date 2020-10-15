import { actionDeleteMember } from './delete_member';


export function actionDeleteMembers(relationId, memberIndexes) {
    return function(graph) {
        // Remove the members in descending order so removals won't shift what members
        // are at the remaining indexes
        memberIndexes.sort((a, b) => b - a);
        for (var i in memberIndexes) {
            graph = actionDeleteMember(relationId, memberIndexes[i])(graph);
        }
        return graph;
    };
}
