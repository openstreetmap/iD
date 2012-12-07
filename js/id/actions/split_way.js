// https://github.com/systemed/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/SplitWayAction.as
iD.actions.SplitWay = function(nodeId, wayId) {
    return function(graph) {
        var way = graph.entity(wayId);
        return graph.replace(way.update({nodes: nodes}), 'changed way direction');
    };
};
