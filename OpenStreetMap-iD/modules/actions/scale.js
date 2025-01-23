import { utilGetAllNodes } from '../util';

export function actionScale(ids, pivotLoc, scaleFactor, projection) {
    return function(graph) {
        return graph.update(function(graph) {
            let point, radial;

            utilGetAllNodes(ids, graph).forEach(function(node) {

                point = projection(node.loc);
                radial = [
                    point[0] - pivotLoc[0],
                    point[1] - pivotLoc[1]
                ];
                point = [
                    pivotLoc[0] + (scaleFactor * radial[0]),
                    pivotLoc[1] + (scaleFactor * radial[1])
                ];

                graph = graph.replace(node.move(projection.invert(point)));
            });
        });
    };
}
