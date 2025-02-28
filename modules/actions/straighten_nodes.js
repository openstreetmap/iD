import { geoGetSmallestSurroundingRectangle, geoVecDot, geoVecLength, geoVecInterp } from '../geo';


/* Align nodes along their common axis */
export function actionStraightenNodes(nodeIDs, projection) {

    function positionAlongWay(a, o, b) {
        return geoVecDot(a, b, o) / geoVecDot(b, b, o);
    }

    // returns the endpoints of the long axis of symmetry of the `points` bounding rect
    function getEndpoints(points) {
        const ssr = geoGetSmallestSurroundingRectangle(points);

        // Choose line pq = axis of symmetry.
        // The shape's surrounding rectangle has 2 axes of symmetry.
        // Snap points to the long axis
        const p1 = [(ssr.poly[0][0] + ssr.poly[1][0]) / 2, (ssr.poly[0][1] + ssr.poly[1][1]) / 2 ];
        const q1 = [(ssr.poly[2][0] + ssr.poly[3][0]) / 2, (ssr.poly[2][1] + ssr.poly[3][1]) / 2 ];
        const p2 = [(ssr.poly[3][0] + ssr.poly[4][0]) / 2, (ssr.poly[3][1] + ssr.poly[4][1]) / 2 ];
        const q2 = [(ssr.poly[1][0] + ssr.poly[2][0]) / 2, (ssr.poly[1][1] + ssr.poly[2][1]) / 2 ];

        const isLong = (geoVecLength(p1, q1) > geoVecLength(p2, q2));
        if (isLong) {
            return [p1, q1];
        }
        return [p2, q2];
    }


    const action = function(graph, t) {
        if (t === null || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        const nodes = nodeIDs.map(function(id) { return graph.entity(id); });
        const points = nodes.map(function(n) { return projection(n.loc); });
        const endpoints = getEndpoints(points);
        const startPoint = endpoints[0];
        const endPoint = endpoints[1];

        // Move points onto the line connecting the endpoints
        for (let i = 0; i < points.length; i++) {
            const node = nodes[i];
            const point = points[i];
            const u = positionAlongWay(point, startPoint, endPoint);
            const point2 = geoVecInterp(startPoint, endPoint, u);
            const loc2 = projection.invert(point2);
            graph = graph.replace(node.move(geoVecInterp(node.loc, loc2, t)));
        }

        return graph;
    };


    action.disabled = function(graph) {

        const nodes = nodeIDs.map(function(id) { return graph.entity(id); });
        const points = nodes.map(function(n) { return projection(n.loc); });
        const endpoints = getEndpoints(points);
        const startPoint = endpoints[0];
        const endPoint = endpoints[1];

        let maxDistance = 0;

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const u = positionAlongWay(point, startPoint, endPoint);
            const p = geoVecInterp(startPoint, endPoint, u);
            const dist = geoVecLength(p, point);

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
