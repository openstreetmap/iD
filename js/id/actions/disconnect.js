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
iD.actions.Disconnect = function(nodeId, newNodeId) {
    var wayIds;

    var action = function(graph) {
        var node = graph.entity(nodeId),
            replacements = action.replacements(graph);

        replacements.forEach(function(replacement) {
            var way = graph.entity(replacement.wayID),
                newNode = iD.Node({id: newNodeId, loc: node.loc, tags: node.tags});
            graph = graph.replace(newNode);
            graph = graph.replace(way.replaceNode(way.nodes[replacement.index], newNode.id));
        });

        return graph;
    };

    action.replacements = function(graph) {
        var candidates = [],
            keeping = false,
            parentWays = graph.parentWays(graph.entity(nodeId));

        parentWays.forEach(function(way) {
            if (wayIds && wayIds.indexOf(way.id) === -1) {
                keeping = true;
                return;
            }

            way.nodes.forEach(function(waynode, index) {
                if (waynode === nodeId) {
                    candidates.push({wayID: way.id, index: index});
                }
            });
        });

        candidates = _.uniq(candidates, function(item) { return item.wayID; } );
        return keeping ? candidates : candidates.slice(1);
    };

    action.disabled = function(graph) {
        var replacements = action.replacements(graph);
        if (replacements.length === 0 || (wayIds && wayIds.length !== replacements.length))
            return 'not_connected';
    };

    action.limitWays = function(_) {
        if (!arguments.length) return wayIds;
        wayIds = _;
        return action;
    };

    return action;
};
