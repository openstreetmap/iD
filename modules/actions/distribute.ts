import type { coreGraph } from '../core';
import type { Action } from '../core/history';
import { geoGetAxis, geoVecEqual, geoVecInterp, geoVecPositionAlongWay } from '../geo';
import type { Projection } from '../geo/raw_mercator';
import type { NodeId } from '../osm';
import { actionMoveNode } from './move_node';

/**
 * distributes nodes evenly spaced along a line between the furthest two points.
 * Involves running {@link actionStraightenNodes}.
 */
export function actionDistribute(nodeIds: NodeId[], projection: Projection): Action {

    function distribute(graph: coreGraph) {
        const nodes = nodeIds.map(id => graph.entity(id));
        const locs = nodes.map(node => projection(node.loc));
        const [first, last] = geoGetAxis(locs)!;

        // the user might not have used the straighten operation yet, so the
        // nodes might be scattered. therefore, sort every node based on the
        // order if the straighten operation was already applied (i.e. the
        // projected position).
        const ordered = nodes
            .map((node, i) => ({
                node,
                projected: geoVecPositionAlongWay(locs[i], first, last),
            }))
            .sort((a, b) => a.projected - b.projected);

        return ordered.map(({ node }, i) => ({
            node,
            newLoc: projection.invert(
                geoVecInterp(first, last, i / (ordered.length - 1))
            )
        }));
    }

    const action: Action = function(graph, t) {
        for (const { node, newLoc } of distribute(graph)) {
            graph = actionMoveNode(node.id, newLoc)(graph, t);
        }
        return graph;
    };


    action.disabled = function(graph) {
        if (nodeIds.length <= 2) return 'too_few';

        const isNoop = distribute(graph)
            .every(({ node, newLoc }) => geoVecEqual(node.loc, newLoc, 1e-6));

        if (isNoop) return 'already_distributed';
    };


    action.transitionable = true;


    return action;
}
