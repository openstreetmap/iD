// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/AddNodeToWayAction.as
iD.actions.AddWayNode = function(wayId, nodeId, index) {
    return function(graph) {
        var way = graph.entity(wayId),
            node = graph.entity(nodeId),
            nodes = way.nodes.slice();
        nodes.splice((index === undefined) ? nodes.length : index, 0, nodeId);
        return graph.replace(way.update({nodes: nodes}));
    };
};
