iD.actions.UpdateRelationMember = function(relationId, properties, index) {
    return function(graph) {
        var relation = graph.entity(relationId),
            members = relation.members.slice();

        members.splice(index, 1, _.extend({}, members[index], properties));
        return graph.replace(relation.update({members: members}));
    };
};
