import { actionDeleteNode } from './delete_node';
import { geoVecDot, geoVecInterp, geoVecLength } from '../geo';
import { utilArrayDifference } from '../util';


/*
 * Based on https://github.com/openstreetmap/potlatch2/net/systemeD/potlatch2/tools/Straighten.as
 */
export function actionStraightenWay(selectedIDs, projection) {

    function positionAlongWay(a, o, b) {
        return geoVecDot(a, b, o) / geoVecDot(b, b, o);
    }

    // Return all selected ways as a continuous, ordered array of nodes
    function allNodes(graph) {
        var nodes = [];
        var startNodes = [];
        var endNodes = [];
        var remainingWays = [];
        var selectedWays = selectedIDs.filter(function(w) {
            return graph.entity(w).type === 'way';
        });
        var selectedNodes = selectedIDs.filter(function(n) {
            return graph.entity(n).type === 'node';
        });

        for (var i = 0; i < selectedWays.length; i++) {
            var way = graph.entity(selectedWays[i]);
            nodes = way.nodes.slice(0);
            remainingWays.push(nodes);
            startNodes.push(nodes[0]);
            endNodes.push(nodes[nodes.length-1]);
        }

        // Remove duplicate end/startNodes (duplicate nodes cannot be at the line end,
        //   and need to be removed so currNode difference calculation below works)
        // i.e. ["n-1", "n-1", "n-2"] => ["n-2"]
        startNodes = startNodes.filter(function(n) {
            return startNodes.indexOf(n) === startNodes.lastIndexOf(n);
        });
        endNodes = endNodes.filter(function(n) {
            return endNodes.indexOf(n) === endNodes.lastIndexOf(n);
        });

        // Choose the initial endpoint to start from
        var currNode = utilArrayDifference(startNodes, endNodes)
            .concat(utilArrayDifference(endNodes, startNodes))[0];
        var nextWay = [];
        nodes = [];

        // Create nested function outside of loop to avoid "function in loop" lint error
        var getNextWay = function(currNode, remainingWays) {
            return remainingWays.filter(function(way) {
                return way[0] === currNode || way[way.length-1] === currNode;
            })[0];
        };

        // Add nodes to end of nodes array, until all ways are added
        while (remainingWays.length) {
            nextWay = getNextWay(currNode, remainingWays);
            remainingWays = utilArrayDifference(remainingWays, [nextWay]);

            if (nextWay[0] !== currNode) {
                nextWay.reverse();
            }
            nodes = nodes.concat(nextWay);
            currNode = nodes[nodes.length-1];
        }

        // If user selected 2 nodes to straighten between, then slice nodes array to those nodes
        if (selectedNodes.length === 2) {
            var startNodeIdx = nodes.indexOf(selectedNodes[0]);
            var endNodeIdx = nodes.indexOf(selectedNodes[1]);
            var sortedStartEnd = [startNodeIdx, endNodeIdx];

            sortedStartEnd.sort(function(a, b) { return a - b; });
            nodes = nodes.slice(sortedStartEnd[0], sortedStartEnd[1]+1);
        }

        return nodes.map(function(n) { return graph.entity(n); });
    }

    function shouldKeepNode(node, graph) {
        return graph.parentWays(node).length > 1 ||
            graph.parentRelations(node).length ||
            node.hasInterestingTags();
    }


    var action = function(graph, t) {
        if (t === null || !isFinite(t)) t = 1;
        t = Math.min(Math.max(+t, 0), 1);

        var nodes = allNodes(graph);
        var points = nodes.map(function(n) { return projection(n.loc); });
        var startPoint = points[0];
        var endPoint = points[points.length-1];
        var toDelete = [];
        var i;

        for (i = 1; i < points.length-1; i++) {
            var node = nodes[i];
            var point = points[i];

            if (t < 1 || shouldKeepNode(node, graph)) {
                var u = positionAlongWay(point, startPoint, endPoint);
                var p = geoVecInterp(startPoint, endPoint, u);
                var loc2 = projection.invert(p);
                graph = graph.replace(node.move(geoVecInterp(node.loc, loc2, t)));

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
        var nodes = allNodes(graph);
        var points = nodes.map(function(n) { return projection(n.loc); });
        var startPoint = points[0];
        var endPoint = points[points.length-1];
        var threshold = 0.2 * geoVecLength(startPoint, endPoint);
        var i;

        if (threshold === 0) {
            return 'too_bendy';
        }

        var maxDistance = 0;

        for (i = 1; i < points.length - 1; i++) {
            var point = points[i];
            var u = positionAlongWay(point, startPoint, endPoint);
            var p = geoVecInterp(startPoint, endPoint, u);
            var dist = geoVecLength(p, point);

            // to bendy if point is off by 20% of total start/end distance in projected space
            if (isNaN(dist) || dist > threshold) {
                return 'too_bendy';
            } else if (dist > maxDistance) {
                maxDistance = dist;
            }
        }

        var keepingAllNodes = nodes.every(function(node, i) {
            return i === 0 || i === nodes.length - 1 || shouldKeepNode(node, graph);
        });

        if (maxDistance < 0.0001 &&
            // Allow straightening even if already straight in order to remove extraneous nodes
            keepingAllNodes) {
            return 'straight_enough';
        }
    };

    action.transitionable = true;


    return action;
}
