import { osmJoinWays } from '../osm';


export function actionAddMember(relationId, member, memberIndex, insertHint) {

    var action = function(graph) {
        var relation = graph.entity(relationId);
        var numAdded = 0;

        // If we weren't passed a memberIndex,
        // try to perform sensible inserts based on how the ways join together
        if ((isNaN(memberIndex) || insertHint) && member.type === 'way') {
            var members = relation.indexedMembers();
            if (!insertHint) {
                members.push(member);   // just push and let osmJoinWays sort it out
            }

            var joined = osmJoinWays(members, graph, insertHint);

            for (var i = 0; i < joined.length; i++) {
                var segment = joined[i];
                for (var j = 0; j < segment.length && segment.length >= 2; j++) {
                    if (segment[j] !== member)
                        continue;

                    if (j === 0) {
                        memberIndex = segment[j + 1].index;
                    } else if (j === segment.length - 1) {
                        memberIndex = segment[j - 1].index + 1;
                    } else {
                        memberIndex = Math.min(segment[j - 1].index + 1, segment[j + 1].index + 1);
                    }

                    relation = relation.addMember(member, memberIndex + (numAdded++));
                }
            }
        }

        // By default, add at index (or append to end if index undefined)
        if (!numAdded) {
            relation = relation.addMember(member, memberIndex);
        }

        return graph.replace(relation);
    };


    return action;
}
