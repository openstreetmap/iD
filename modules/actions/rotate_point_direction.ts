import type { Action } from '../core/history';
import type { EntityId } from '../osm';
import { utilRotatePointDirectionKey } from '../util/direction_field';
import { utilWrap } from '../util';


/**
 * Set a node's numeric direction tag to `degrees` (OSM azimuth, clockwise from north).
 */
export function actionRotatePointDirection(
    entityID: EntityId,
    degrees: number,
    key?: TagKey
): Action {
    return function(graph) {
        const entity = graph.hasEntity(entityID);
        if (!entity || entity.type !== 'node') return graph;

        const directionKey = key || utilRotatePointDirectionKey(entity, graph);
        if (!directionKey) return graph;

        // Keep values aligned with iD direction tagging (whole degrees, [0, 360)).
        const nextDirection = Math.round(utilWrap(degrees, 360)).toString();
        if (nextDirection === entity.tags[directionKey]) return graph;

        const tags = Object.assign({}, entity.tags, { [directionKey]: nextDirection });
        return graph.replace(entity.update({ tags: tags }));
    };
}
