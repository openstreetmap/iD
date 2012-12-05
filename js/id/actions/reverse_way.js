// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/AddNodeToWayAction.as
iD.actions.ReverseWay = function(way) {
    return function(graph) {
        return graph.replace(way.update({
            nodes: way.nodes.slice()
        }), 'changed way direction');
    };
};
