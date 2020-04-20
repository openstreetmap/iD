import { geoVecInterp } from '../geo';

export function actionMoveNode(nodeID, toLoc) {

    var action = function(graph, t) {
        if (t === null || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        var node = graph.entity(nodeID);
        return graph.replace(
            node.move(geoVecInterp(node.loc, toLoc, t))
        );
    };

    action.transitionable = true;

    return action;
}
