import type { coreGraph } from '../core/graph';
import type { Action } from '../core/history';
import type { EntityId } from '../osm';
import type { OsmEntity } from '../osm/abstract-entity';

export interface ActionCopyEntities extends Action {
    copies(): Record<EntityId, OsmEntity>;
}

export function actionCopyEntities(
    ids: EntityId[],
    fromGraph: coreGraph,
): ActionCopyEntities {
    const _copies: Record<EntityId, OsmEntity> = {};

    const action: ActionCopyEntities = function (graph) {
        ids.forEach(function (id) {
            fromGraph.entity(id).copy(fromGraph, _copies);
        });

        for (const id in _copies) {
            graph = graph.replace(_copies[<EntityId>id]);
        }

        return graph;
    };

    action.copies = function () {
        return _copies;
    };

    return action;
}
