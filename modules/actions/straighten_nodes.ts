import type { Action } from '../core/history';
import { geoGetSmallestSurroundingRectangle, geoVecDot, geoVecLength, geoVecInterp } from '../geo';
import type { Projection } from '../geo/raw_mercator';
import type { Vec2 } from '../geo/vector';
import type { NodeId } from '../osm';


/* Align nodes along their common axis */
export function actionStraightenNodes(nodeIDs: NodeId[], projection: Projection): Action {

    function positionAlongWay(a: Vec2, o: Vec2, b: Vec2) {
        return geoVecDot(a, b, o) / geoVecDot(b, b, o);
    }

    // returns the endpoints of the long axis of symmetry of the `points` bounding rect
    function getEndpoints(points: Vec2[]) {
        var ssr = geoGetSmallestSurroundingRectangle(points);

        // Choose line pq = axis of symmetry.
        // The shape's surrounding rectangle has 2 axes of symmetry.
        // Snap points to the long axis
        var p1: Vec2 = [(ssr.poly[0][0] + ssr.poly[1][0]) / 2, (ssr.poly[0][1] + ssr.poly[1][1]) / 2 ];
        var q1: Vec2 = [(ssr.poly[2][0] + ssr.poly[3][0]) / 2, (ssr.poly[2][1] + ssr.poly[3][1]) / 2 ];
        var p2: Vec2 = [(ssr.poly[3][0] + ssr.poly[4][0]) / 2, (ssr.poly[3][1] + ssr.poly[4][1]) / 2 ];
        var q2: Vec2 = [(ssr.poly[1][0] + ssr.poly[2][0]) / 2, (ssr.poly[1][1] + ssr.poly[2][1]) / 2 ];

        var isLong = (geoVecLength(p1, q1) > geoVecLength(p2, q2));
        if (isLong) {
            return [p1, q1];
        }
        return [p2, q2];
    }


    const action: Action = function(graph, t) {
        if (t === null || t === undefined || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        var nodes = nodeIDs.map(function(id) { return graph.entity(id); });
        var points = nodes.map(function(n) { return projection(n.loc); });
        var endpoints = getEndpoints(points);
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
        var endpoints = getEndpoints(points);
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
