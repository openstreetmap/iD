import type { Action } from '../core/history';
import type { Projection } from '../geo/raw_mercator';
import { geoVecDot, geoVecInterp, geoVecLength, geoVecLengthSquare } from '../geo';
import type { Vec2 } from '../geo/vector';
import type { NodeId, WayId } from '../osm';

export function actionStraightenNode(
    wayID: WayId,
    nodeID: NodeId,
    projection: Projection
): Action {
    function getTarget(graph: Parameters<Action>[0]): Vec2 | undefined {
        const way = graph.hasEntity(wayID);
        const node = graph.hasEntity(nodeID);

        if (!way || way.type !== 'way' || !node || node.type !== 'node') return;
        if (graph.parentWays(node).length !== 1) return;

        // Closed ways repeat their first node at the end.
        const nodeIDs = way.isClosed() ? way.nodes.slice(0, -1) : way.nodes;
        const indices = nodeIDs
            .map((id, index) => ({ id, index }))
            .filter(item => item.id === nodeID);

        if (indices.length !== 1 || nodeIDs.length < 3) return;

        const index = indices[0].index;
        if (!way.isClosed() && (index === 0 || index === nodeIDs.length - 1)) return;

        const previousIndex = (index - 1 + nodeIDs.length) % nodeIDs.length;
        const nextIndex = (index + 1) % nodeIDs.length;

        const previous = graph.hasEntity(nodeIDs[previousIndex]);
        const next = graph.hasEntity(nodeIDs[nextIndex]);

        if (!previous || previous.type !== 'node' || !next || next.type !== 'node') return;
        if (previous.id === next.id) return;

        const a = projection(previous.loc);
        const b = projection(next.loc);
        const p = projection(node.loc);
        const lengthSquared = geoVecLengthSquare(b, a);

        if (lengthSquared === 0) return;

        const t = geoVecDot(p, b, a) / lengthSquared;
        return geoVecInterp(a, b, t);
    }

    const action: Action = function(graph, t) {
        if (t === null || t === undefined || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        const target = getTarget(graph);
        if (!target) return graph;

        const node = graph.entity(nodeID);
        const targetLoc = projection.invert(target);
        return graph.replace(node.move(geoVecInterp(node.loc, targetLoc, t)));
    };

    action.disabled = function(graph) {
        const target = getTarget(graph);
        if (!target) return 'invalid';

        const node = graph.entity(nodeID);
        const current = projection(node.loc);

        if (geoVecLength(current, target) < 0.0001) {
            return 'straight_enough';
        }
    };

    action.transitionable = true;
    return action;
}
