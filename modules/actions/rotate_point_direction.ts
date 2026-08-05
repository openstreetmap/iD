import type { Action } from '../core/history';
import type { EntityId } from '../osm';
import { utilWrap } from '../util';


export function actionRotatePointDirection(entityID: EntityId, deltaDegrees: number): Action {
    return function(graph) {
        const entity = graph.hasEntity(entityID);
        if (!entity || entity.type !== 'node') return graph;

        const direction = Number(entity.tags.direction);
        if (!isFinite(direction)) return graph;

        // Keep values aligned with iD direction tagging (whole degrees, [0, 360)).
        const nextDirection = Math.round(utilWrap(direction + deltaDegrees, 360)).toString();
        if (nextDirection === entity.tags.direction) return graph;

        const tags = Object.assign({}, entity.tags, { direction: nextDirection });
        return graph.replace(entity.update({ tags: tags }));
    };
}
