export function ChangeMember(relationId, member, memberIndex) {
    return function(graph) {
        return graph.replace(graph.entity(relationId).updateMember(member, memberIndex));
    };
}
