// https://github.com/systemed/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/SplitWayAction.as
iD.actions.SplitWay = function(nodeId) {
    return function(graph) {
        var node = graph.entity(nodeId),
            parents = graph.parentWays(node);

        // splitting ways at intersections TODO
        if (parents.length !== 1) return graph;

        var way = parents[0],
            idx = _.indexOf(way.nodes, nodeId);

        // Create a 'b' way that contains all of the tags in the second
        // half of this way
        var newWay = iD.Way({tags: way.tags, nodes: way.nodes.slice(idx)});
        graph = graph.replace(newWay);

        // Reduce the original way to only contain the first set of nodes
        graph = graph.replace(way.update({nodes: way.nodes.slice(0, idx + 1)}));

        var parentRelations = graph.parentRelations(way);

        function isVia(x) { return x.role = 'via'; }
        function isSelf(x) { return x.id = way.id; }

        parentRelations.forEach(function(relation) {
            if (relation.tags.type === 'restriction') {
                var via = _.find(relation.members, isVia);
                var ownrole = _.find(relation.members, isSelf).role;
                if (via && !_.contains(newWay.nodes, via.id)) {
                    // the new way doesn't contain the node that's important
                    // to the turn restriction, so we don't need to worry
                    // about adding it to the turn restriction.
                } else {
                    graph = graph.replace(iD.actions.AddRelationMember(relation.id, {
                        role: ownrole,
                        id: newWay.id,
                        type: 'way'
                    }));
                }
            }
        });

        return graph;
    };
};
