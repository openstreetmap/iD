// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/AddNodeToWayAction.as
iD.actions.ReverseWay = function(wayId) {
    return function(graph) {
        var way = graph.entity(wayId),
            nodes = way.nodes.slice().reverse();
        return graph.replace(way.update({nodes: nodes}));
    };
};
