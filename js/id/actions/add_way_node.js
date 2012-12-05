// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/AddNodeToWayAction.as
iD.actions.AddWayNode = function(way, node, index) {
    return function(graph) {
        var nodes = way.nodes.slice();
        nodes.splice(index || nodes.length, 0, node.id);
        return graph.replace(way.update({nodes: nodes})).replace(node, 'added to a road');
    };
};
