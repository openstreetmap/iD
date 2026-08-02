import type { Action } from '../core/history';
import { geoVecInterp } from '../geo';
import type { Vec2 } from '../geo/vector';
import type { NodeId } from '../osm';

export function actionMoveNode(nodeID: NodeId, toLoc: Vec2): Action {
    const action: Action = function (graph, t) {
        if (t === null || t === undefined || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        const node = graph.entity(nodeID);
        return graph.replace(node.move(geoVecInterp(node.loc, toLoc, t)));
    };

    action.transitionable = true;

    return action;
}
