import type { Action } from '../core/history';
import type { OsmEntity } from '../osm/abstract-entity';

export function actionAddEntity(way: OsmEntity): Action {
    return function (graph) {
        return graph.replace(way);
    };
}
