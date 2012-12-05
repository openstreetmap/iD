iD.actions.RemoveRelationMember = function(relation, member) {
    return function(graph) {
        var members = _.without(relation.members, member.id);
        return graph.replace(relation.update({members: members}), 'removed from a relation');
    };
};
