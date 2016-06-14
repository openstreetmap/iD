// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/AddNodeToWayAction.as
export function AddVertex(wayId, nodeId, index) {
    return function(graph) {
        return graph.replace(graph.entity(wayId).addNode(nodeId, index));
    };
}
