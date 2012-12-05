iD.actions.removeRelationEntity = function(relation, entity) {
    return function(graph) {
        var members = _.without(relation.members, entity.id);
        return graph.replace(relation.update({members: members}), 'removed from a relation');
    };
};
