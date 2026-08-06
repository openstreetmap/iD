import type { Action } from '../core/history';
import type { EntityId } from '../osm';
import { actionDeleteNode } from './delete_node';
import { actionDeleteRelation } from './delete_relation';
import { actionDeleteWay } from './delete_way';

export function actionDeleteMultiple(ids: EntityId[]): Action {
    const actions = {
        way: actionDeleteWay,
        node: actionDeleteNode,
        relation: actionDeleteRelation,
    };

    const action: Action = function (graph) {
        ids.forEach(function (id) {
            if (graph.hasEntity(id)) {
                // It may have been deleted already.
                graph = actions[graph.entity(id).type](id as never)(graph);
            }
        });

        return graph;
    };

    return action;
}
