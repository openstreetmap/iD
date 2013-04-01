// Disconect the ways at the given node.
//
// Optionally, disconnect only the given ways.
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
iD.actions.Disconnect = function(nodeId, wayIds, newNodeId) {
    var action = function(graph) {
        var node = graph.entity(nodeId),
            replacements = action.replacements(graph);

        replacements.forEach(function(replacement) {
            var newNode = iD.Node({id: newNodeId, loc: node.loc, tags: node.tags});
            graph = graph.replace(newNode);
            graph = graph.replace(replacement.way.updateNode(newNode.id, replacement.index));
        });

        return graph;
    };

    action.replacements = function(graph) {
        var candidates = [],
            keeping = false,
            parents = graph.parentWays(graph.entity(nodeId));

        parents.forEach(function(parent) {
            if (wayIds && wayIds.length && wayIds.indexOf(parent.id) === -1) {
                keeping = true;
                return;
            }

            parent.nodes.forEach(function(waynode, index) {
                if (waynode === nodeId) {
                    candidates.push({way: parent, index: index});
                }
            });
        });

        return keeping ? candidates : candidates.slice(1);
    };

    action.disabled = function(graph) {
        var replacements = action.replacements(graph);
        if (replacements.length === 0 || (wayIds && wayIds.length && wayIds.length !== replacements.length))
            return 'not_connected';
    };

    return action;
};
