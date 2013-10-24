iD.actions.ChangeMember = function(relationId, member, memberIndex) {
    return function(graph) {
        return graph.replace(graph.entity(relationId).updateMember(member, memberIndex));
    };
};
