import type { Action } from '../core/history';
import { geoRotate } from '../geo';
import type { Projection } from '../geo/raw_mercator';
import type { Vec2 } from '../geo/vector';
import type { EntityId } from '../osm';
import { utilGetAllNodes } from '../util';

export function actionRotate(
    rotateIds: EntityId[],
    pivot: Vec2,
    angle: number,
    projection: Projection,
): Action {
    const action: Action = function (graph) {
        return graph.update(function (graph) {
            utilGetAllNodes(rotateIds, graph).forEach(function (node) {
                const point = geoRotate([projection(node.loc)], angle, pivot)[0];
                graph = graph.replace(node.move(projection.invert(point)));
            });
        });
    };

    return action;
}
