import _ from 'lodash';
/* Flip the provided way horizontally 
Only operates on "area" ways
*/

export function actionReflect(wayId) {

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
        // Obtain the left and right lonlat's
        const left = boundingRect[0];
        const right = boundingRect[2];
        // Determine the mid-point that we will flip on
        const midPoint = left + ((right - left) / 2);

        // Obtain all of the nodes on the way, iterate over them to translate then aggreate up
        return _(targetWay.nodes)
            .map(function (nodeId) {
                return graph.entity(nodeId);
            })
            // Only process each node once, as the first node will be listed twice in the way
            .uniqBy(function (node) { return node.id; })
            // Get distance from midPoint and produce a translated node
            .map(function (node) {
                const delta = node.loc[0] - midPoint;
                return node.move([node.loc[0]-(2*delta), node.loc[1]]);
            })
            // Chain together consecutive updates to the graph for each updated node and return
            .reduce(function (accGraph, value) {
                return accGraph.replace(value);
            }, graph);

    };
}