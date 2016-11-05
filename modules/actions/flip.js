import _ from 'lodash';
/* Flip the provided way horizontally or vertically
Only operates on "area" ways
*/

export function actionFlip(wayId, isVertical, projection) {

    return function (graph) {
        var targetWay = graph.entity(wayId);
        // If the way is not an area, we will not process it
        if (!targetWay.isArea()) {
            // return input graph without changes
            return graph;
        }
        // Obtain all of the nodes on the way
        var nodesAndRects = _(targetWay.nodes)
            .map(function (nodeId) {
                return graph.entity(nodeId);
            })
            // and their rectangles
            .map(function (node) {
                return {
                    node: node,
                    rect: node.extent().rectangle()
                };
            });
        // Obtain the left/top lonlat
        // rectangle returned as [ lon (x) top left, lat (y) top left, lon (x) bottom right, lat (y) bottom right]
        var leftOrTop = nodesAndRects
            .map(function (nodeAndRect) {
                return nodeAndRect.rect;
            })
            .minBy(function (rect) {
                return isVertical ? rect[1] : rect[0];
            });
        // Now the same for right/bottom
        var rightOrBottom = nodesAndRects
            .map(function (nodeAndRect) {
                return nodeAndRect.rect;
            })
            .minBy(function (rect) {
                return isVertical ? rect[3] : rect[2];
            });
        // Determine the mid-point that we will flip on
        var midPoint = rightOrBottom - leftOrTop;
        // Iterate and aggregate
        return nodesAndRects
            .map(function (nodeAndRect) {
                // Get distance from midPoint
                var node = nodeAndRect.node;
                var delta = isVertical ?
                    node.loc[1] - midPoint :
                    node.loc[0] - midPoint;
                return isVertical ?
                    node.move(projection.translate(0, delta)) :
                    node.move(projection.translate(delta, 0));
            })
            // Chain together consecutive updates to the graph for each updated node and return
            .reduce(function (accGraph, value) {
                return accGraph.replace(value);
            }, graph);

    };
}