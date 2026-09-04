import type { Action } from '../core/history';
import { geoEdgeEqual } from '../geo';
import type { Vec2 } from '../geo/vector';
import type { EntityId, osmNode } from '../osm';
import { utilArrayIntersection } from '../util';


export function actionAddMidpoint(midpoint: { loc: Vec2; edge: [EntityId, EntityId] }, node: osmNode): Action {
    return function(graph) {
        graph = graph.replace(node.move(midpoint.loc));

        var parents = utilArrayIntersection(
            graph.parentWays(graph.entity(midpoint.edge[0])),
            graph.parentWays(graph.entity(midpoint.edge[1]))
        );

        parents.forEach(function(way) {
            for (var i = 0; i < way.nodes.length - 1; i++) {
                if (geoEdgeEqual([way.nodes[i], way.nodes[i + 1]], midpoint.edge)) {
                    graph = graph.replace(graph.entity(way.id).addNode(node.id, i + 1));

                    // Add only one midpoint on doubled-back segments,
                    // turning them into self-intersections.
                    return;
                }
            }
        });

        return graph;
    };
}
