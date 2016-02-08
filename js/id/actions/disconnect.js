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
            connections = action.connections(graph);

        connections.forEach(function(connection) {
            var way = graph.entity(connection.wayID),
                newNode = iD.Node({id: newNodeId, loc: node.loc, tags: node.tags});

            graph = graph.replace(newNode);
            if (connection.index === 0 && way.isArea()) {
                // replace shared node with shared node..
                graph = graph.replace(way.replaceNode(way.nodes[0], newNode.id));
            } else {
                // replace shared node with multiple new nodes..
                graph = graph.replace(way.updateNode(newNode.id, connection.index));
            }
        });

        return graph;
    };

    action.connections = function(graph) {
        var candidates = [],
            keeping = false,
            parentWays = graph.parentWays(graph.entity(nodeId));

        parentWays.forEach(function(way) {
            if (wayIds && wayIds.indexOf(way.id) === -1) {
                keeping = true;
                return;
            }
            if (way.isArea() && (way.nodes[0] === nodeId)) {
                candidates.push({wayID: way.id, index: 0});
            } else {
                way.nodes.forEach(function(waynode, index) {
                    if (waynode === nodeId) {
                        candidates.push({wayID: way.id, index: index});
                    }
                });
            }
        });

        return keeping ? candidates : candidates.slice(1);
    };

    action.disabled = function(graph) {
        var connections = action.connections(graph);
        if (connections.length === 0 || (wayIds && wayIds.length !== connections.length))
            return 'not_connected';

        var parentWays = graph.parentWays(graph.entity(nodeId)),
            seenRelationIds = {},
            sharedRelation;

        parentWays.forEach(function(way) {
            if (wayIds && wayIds.indexOf(way.id) === -1)
                return;

            var relations = graph.parentRelations(way);
            relations.forEach(function(relation) {
                if (relation.id in seenRelationIds) {
                    sharedRelation = relation;
                } else {
                    seenRelationIds[relation.id] = true;
                }
            });
        });

        if (sharedRelation)
            return 'relation';
    };

    action.limitWays = function(_) {
        if (!arguments.length) return wayIds;
        wayIds = _;
        return action;
    };

    return action;
};
