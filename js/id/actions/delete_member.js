iD.actions.DeleteMember = function(relationId, memberIndex) {
    return function(graph) {
        var relation = graph.entity(relationId)
            .removeMember(memberIndex);

        graph = graph.replace(relation);

        if (relation.isDegenerate())
            graph = iD.actions.DeleteRelation(relation.id)(graph);

        return graph;
    };
};
