iD.actions.RemoveRelationMember = function(relationId, memberId) {
    return function(graph) {
        var relation = graph.entity(relationId),
            members = _.without(relation.members, memberId);
        return graph.replace(relation.update({members: members}));
    };
};
