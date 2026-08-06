import type { Action } from '../core/history';
import type { NodeId, WayId } from '../osm';

// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/AddNodeToWayAction.as
export function actionAddVertex(wayId: WayId, nodeId: NodeId, index: number): Action {
    return function (graph) {
        return graph.replace(graph.entity(wayId).addNode(nodeId, index));
    };
}
