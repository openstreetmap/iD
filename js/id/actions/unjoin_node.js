// Unjoin the ways at the given node.
//
// For testing convenience, accepts an ID to assign to the (first) new node.
// Normally, this will be undefined and the way will automatically
// be assigned a new ID.
//
// Reference:
//   https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/UnjoinNodeAction.as
//   https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/actions/UnGlueAction.java
//
iD.actions.UnjoinNode = function(nodeId, newNodeId) {
    var action = function(graph) {
        if (!action.permitted(graph))
            return graph;

        var node = graph.entity(nodeId);

        graph.parentWays(node).forEach(function(parent, i) {
            if (i === 0)
                return;

            var index = parent.nodes.indexOf(nodeId),
                newNode = iD.Node({id: newNodeId, loc: node.loc, tags: node.tags}),
                nodes = parent.nodes.slice();

            nodes.splice(index, 1, newNode.id);

            graph = graph.replace(newNode);
            graph = graph.replace(parent.update({nodes: nodes}));
        });

        return graph;
    };

    action.permitted = function(graph) {
        return graph.parentWays(graph.entity(nodeId)).length >= 2;
    };

    return action;
};
