iD.actions.AddMember = function(relationId, member, memberIndex) {
    return function(graph) {
        return graph.replace(graph.entity(relationId).addMember(member, memberIndex));
    }
};
