import _ from 'lodash';
/* Flip the provided way horizontally or vertically
Only operates on "area" ways
*/

export function actionFlip(wayId, isVertical, projection) {

    return function (graph) {        
        const targetWay = graph.entity(wayId);

        // If the way is not an area, we will not process it
        if (!targetWay.isArea()) {
            // return input graph without changes
            return graph;
        }
        // Get the bounding rectangle of the area
        const boundingRect = targetWay.extent(graph).rectangle();
        // rectangle returned as [ lon (x) top left, lat (y) top left, lon (x) bottom right, lat (y) bottom right]
        // Obtain the left/top lonlat and the right/bottom
        const leftOrTop = isVertical ? boundingRect[1] : boundingRect[0];
        const rightOrBottom = isVertical ? boundingRect[3] : boundingRect[2];
        // Determine the mid-point that we will flip on
        const midPoint = leftOrTop + ((rightOrBottom - leftOrTop) / 2);

        // Obtain all of the nodes on the way, iterate over them to translate then aggreate up
        return _(targetWay.nodes)
            .map(function (nodeId) {
                return graph.entity(nodeId);
            })
            .map(function (node) {
                // Get distance from midPoint
                const delta = isVertical ?
                    node.loc[1] - midPoint :
                    node.loc[0] - midPoint;
                return isVertical ?
                    node.move([node.loc[0], node.loc[1]-(2*delta)]) :
                    node.move([node.loc[0]-(2*delta), node.loc[1]]);
            })
            // Chain together consecutive updates to the graph for each updated node and return
            .reduce(function (accGraph, value) {
                return accGraph.replace(value);
            }, graph);

    };
}