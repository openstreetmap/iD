iD.actions.DeleteMember = function(relationId, memberIndex) {
    return function(graph) {
        return graph.replace(graph.entity(relationId).removeMember(memberIndex));
    };
};
