import type { Action } from '../core/history';
import { geoGetAxis, geoVecLength, geoVecInterp, geoVecPositionAlongWay as positionAlongWay } from '../geo';
import type { Projection } from '../geo/raw_mercator';
import type { NodeId } from '../osm';


/* Align nodes along their common axis */
export function actionStraightenNodes(nodeIDs: NodeId[], projection: Projection): Action {

    const action: Action = function(graph, t) {
        if (t === null || t === undefined || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        var nodes = nodeIDs.map(function(id) { return graph.entity(id); });
        var points = nodes.map(function(n) { return projection(n.loc); });
        var endpoints = geoGetAxis(points)!;
        var startPoint = endpoints[0];
        var endPoint = endpoints[1];

        // Move points onto the line connecting the endpoints
        for (var i = 0; i < points.length; i++) {
            var node = nodes[i];
            var point = points[i];
            var u = positionAlongWay(point, startPoint, endPoint);
            var point2 = geoVecInterp(startPoint, endPoint, u);
            var loc2 = projection.invert(point2);
            graph = graph.replace(node.move(geoVecInterp(node.loc, loc2, t)));
        }

        return graph;
    };


    action.disabled = function(graph) {

        var nodes = nodeIDs.map(function(id) { return graph.entity(id); });
        var points = nodes.map(function(n) { return projection(n.loc); });
        var endpoints = geoGetAxis(points)!;
        var startPoint = endpoints[0];
        var endPoint = endpoints[1];

        var maxDistance = 0;

        for (var i = 0; i < points.length; i++) {
            var point = points[i];
            var u = positionAlongWay(point, startPoint, endPoint);
            var p = geoVecInterp(startPoint, endPoint, u);
            var dist = geoVecLength(p, point);

            if (!isNaN(dist) && dist > maxDistance) {
                maxDistance = dist;
            }
        }

        if (maxDistance < 0.0001) {
            return 'straight_enough';
        }
    };


    action.transitionable = true;


    return action;
}
