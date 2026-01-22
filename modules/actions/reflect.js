import { geoGetSmallestSurroundingRectangle, geoVecInterp, geoVecLength } from '../geo';
import { utilGetAllNodes } from '../util';


/* Reflect the given area around its axis of symmetry */
export function actionReflect(reflectIds, projection) {
    var _useLongAxis = true;


    var action = function(graph, t) {
        if (t === null || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        const [p, q] = action.getReflectAxis(graph);

        // reflect c across pq
        // http://math.stackexchange.com/questions/65503/point-reflection-over-a-line
        var dx = q[0] - p[0];
        var dy = q[1] - p[1];
        var a = (dx * dx - dy * dy) / (dx * dx + dy * dy);
        var b = 2 * dx * dy / (dx * dx + dy * dy);

        const nodes = utilGetAllNodes(reflectIds, graph);
        for (const node of nodes) {
            const c = projection(node.loc);
            const newLoc = projection.invert([
                a * (c[0] - p[0]) + b * (c[1] - p[1]) + p[0],
                b * (c[0] - p[0]) - a * (c[1] - p[1]) + p[1]
            ]);
            graph = graph.replace(
                node.move(geoVecInterp(node.loc, newLoc, t)));
        }

        return graph;
    };


    action.useLongAxis = function(val) {
        if (!arguments.length) return _useLongAxis;
        _useLongAxis = val;
        return action;
    };


    action.getReflectAxis = function(graph) {
        const nodes = utilGetAllNodes(reflectIds, graph);
        const points = nodes.map(function(n) { return projection(n.loc); });
        const ssr = geoGetSmallestSurroundingRectangle(points);

        // Choose line pq = axis of symmetry.
        // The shape's surrounding rectangle has 2 axes of symmetry.
        // Reflect across the longer axis by default.
        const p1 = [(ssr.poly[0][0] + ssr.poly[1][0]) / 2, (ssr.poly[0][1] + ssr.poly[1][1]) / 2 ];
        const q1 = [(ssr.poly[2][0] + ssr.poly[3][0]) / 2, (ssr.poly[2][1] + ssr.poly[3][1]) / 2 ];
        const p2 = [(ssr.poly[3][0] + ssr.poly[4][0]) / 2, (ssr.poly[3][1] + ssr.poly[4][1]) / 2 ];
        const q2 = [(ssr.poly[1][0] + ssr.poly[2][0]) / 2, (ssr.poly[1][1] + ssr.poly[2][1]) / 2 ];

        const isLong = (geoVecLength(p1, q1) > geoVecLength(p2, q2));
        if ((_useLongAxis && isLong) || (!_useLongAxis && !isLong)) {
            return [p1, q1];
        } else {
            return [p2, q2];
        }
    };


    action.transitionable = true;


    return action;
}
