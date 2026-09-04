import type { Action } from '../core/history';
import type { EntityId } from '../osm';
import { utilRotatePointDirectionKey } from '../util/direction_field';
import { utilRetargetDirectionDegreesValue } from '../util/direction_degrees';


/**
 * Set a node's direction tag so it aims at `degrees` (OSM azimuth, clockwise from north).
 * Multi-value tags keep relative offsets; cardinals become numeric degrees.
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

        const nextDirection = utilRetargetDirectionDegreesValue(
            entity.tags[directionKey],
            degrees
        );
        if (nextDirection === entity.tags[directionKey]) return graph;

        const tags = Object.assign({}, entity.tags, { [directionKey]: nextDirection });
        return graph.replace(entity.update({ tags: tags }));
    };
}
