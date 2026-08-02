import type { Action } from '../core/history';
import type { Projection } from '../geo/raw_mercator';
import type { Vec2 } from '../geo/vector';
import type { EntityId } from '../osm';
import { utilGetAllNodes } from '../util';

export function actionScale(
    ids: EntityId[],
    pivotLoc: Vec2,
    scaleFactor: number,
    projection: Projection,
): Action {
    return function (graph) {
        return graph.update(function (graph) {
            let point: Vec2;
            let radial: Vec2;

            utilGetAllNodes(ids, graph).forEach(function (node) {
                point = projection(node.loc);
                radial = [point[0] - pivotLoc[0], point[1] - pivotLoc[1]];
                point = [
                    pivotLoc[0] + scaleFactor * radial[0],
                    pivotLoc[1] + scaleFactor * radial[1],
                ];

                graph = graph.replace(node.move(projection.invert(point)));
            });
        });
    };
}
