iD.actions.AddMember = function(relationId, member, memberIndex) {
    return function(graph) {
        var relation = graph.entity(relationId);

        if (isNaN(memberIndex) && member.type === 'way') {
            var members = relation.indexedMembers();
            members.push(member);

            var joined = iD.geo.joinWays(members, graph);
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
                }
            }
        }

        return graph.replace(relation.addMember(member, memberIndex));
    };
};
