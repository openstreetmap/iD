import { actionDeleteNode } from './delete_node';
import { geoEuclideanDistance, geoInterp } from '../geo/index';


/*
 * Based on https://github.com/openstreetmap/potlatch2/net/systemeD/potlatch2/tools/Straighten.as
 */
export function actionStraighten(wayId, projection) {

    function positionAlongWay(n, s, e) {
        return ((n[0] - s[0]) * (e[0] - s[0]) + (n[1] - s[1]) * (e[1] - s[1])) /
                (Math.pow(e[0] - s[0], 2) + Math.pow(e[1] - s[1], 2));
    }


    var action = function(graph, t) {
        if (t === null || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        var way = graph.entity(wayId),
            nodes = graph.childNodes(way),
            points = nodes.map(function(n) { return projection(n.loc); }),
            startPoint = points[0],
            endPoint = points[points.length-1],
            toDelete = [],
            i;

        for (i = 1; i < points.length-1; i++) {
            var node = nodes[i],
                point = points[i];

            if (t < 1 || graph.parentWays(node).length > 1 ||
                graph.parentRelations(node).length ||
                node.hasInterestingTags()) {

                var u = positionAlongWay(point, startPoint, endPoint),
                    p = [
                        startPoint[0] + u * (endPoint[0] - startPoint[0]),
                        startPoint[1] + u * (endPoint[1] - startPoint[1])
                    ],
                    loc2 = projection.invert(p);

                graph = graph.replace(node.move(geoInterp(node.loc, loc2, t)));

            } else {
                // safe to delete
                if (toDelete.indexOf(node) === -1) {
                    toDelete.push(node);
                }
            }
        }

        for (i = 0; i < toDelete.length; i++) {
            graph = actionDeleteNode(toDelete[i].id)(graph);
        }

        return graph;
    };


    action.disabled = function(graph) {
        // check way isn't too bendy
        var way = graph.entity(wayId),
            nodes = graph.childNodes(way),
            points = nodes.map(function(n) { return projection(n.loc); }),
            startPoint = points[0],
            endPoint = points[points.length-1],
            threshold = 0.2 * geoEuclideanDistance(startPoint, endPoint),
            i;

        if (threshold === 0) {
            return 'too_bendy';
        }

        for (i = 1; i < points.length-1; i++) {
            var point = points[i],
                u = positionAlongWay(point, startPoint, endPoint),
                p0 = startPoint[0] + u * (endPoint[0] - startPoint[0]),
                p1 = startPoint[1] + u * (endPoint[1] - startPoint[1]),
                dist = Math.sqrt(Math.pow(p0 - point[0], 2) + Math.pow(p1 - point[1], 2));

            // to bendy if point is off by 20% of total start/end distance in projected space
            if (isNaN(dist) || dist > threshold) {
                return 'too_bendy';
            }
        }
    };


    action.transitionable = true;


    return action;
}
