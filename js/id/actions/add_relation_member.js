iD.actions.AddRelationMember = function(relationId, member, index) {
    return function(graph) {
        var relation = graph.entity(relationId),
            members = relation.members.slice();

        members.splice((index === undefined) ? members.length : index, 0, member);
        return graph.replace(relation.update({members: members}));
    };
};
