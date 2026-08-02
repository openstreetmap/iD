import type { Action } from '../core/history';
import type { EntityId } from '../osm';

export function actionChangeTags(entityId: EntityId, tags: Tags): Action {
    return function (graph) {
        const entity = graph.entity(entityId);
        return graph.replace(entity.update({ tags: tags }));
    };
}
