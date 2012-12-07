iD.actions.RemoveRelationMember = function(relationId, memberId) {
    return function(graph) {
        var relation = graph.entity(relationId),
            members = _.reject(relation.members, function(r) {
                return r.id === memberId;
            });
        return graph.replace(relation.update({members: members}));
    };
};
