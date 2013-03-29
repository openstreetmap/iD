// Disconect the ways at the given node.
//
// For testing convenience, accepts an ID to assign to the (first) new node.
// Normally, this will be undefined and the way will automatically
// be assigned a new ID.
//
// This is the inverse of `iD.actions.Connect`.
//
// Reference:
//   https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/UnjoinNodeAction.as
//   https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/actions/UnGlueAction.java
//
iD.actions.Disconnect = function(nodeId, newNodeId) {
    var action = function(graph) {
        var node = graph.entity(nodeId);

        graph.parentWays(node).forEach(function(parent, i) {

            var keep = i === 0;

            parent.nodes.forEach(function(waynode, index) {
                if (waynode === nodeId) {

                    if (!keep) {
                        var newNode = iD.Node({id: newNodeId, loc: node.loc, tags: node.tags});

                        graph = graph.replace(newNode);
                        graph = graph.replace(parent.updateNode(newNode.id, index));
                    }

                    // Only keep the first occurrence in first way
                    keep = false;
                }
            });
        });

        return graph;
    };

    action.disabled = function(graph) {
        var parentWays = graph.parentWays(graph.entity(nodeId));
        if (parentWays.length >= 2)
            return;
        if (parentWays.length === 0)
            return 'not_connected';
        if (parentWays[0].nodes.filter(function(d) { return d === nodeId; }).length < 2)
            return 'not_connected';
    };

    return action;
};
