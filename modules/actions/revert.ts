import type { Action } from '../core/history';
import type { EntityId, NodeId } from '../osm';
import { actionDeleteRelation } from './delete_relation';
import { actionDeleteWay } from './delete_way';


export function actionRevert(id: EntityId): Action {
    const action: Action = function(graph) {
        var entity = graph.hasEntity(id),
            base = graph.base().entities[id];

        if (entity && !base) {    // entity will be removed..
            if (entity.type === 'node') {
                graph.parentWays(entity)
                    .forEach(function(parent) {
                        parent = parent.removeNode(id as NodeId);
                        graph = graph.replace(parent);

                        if (parent.isDegenerate()) {
                            graph = actionDeleteWay(parent.id)(graph);
                        }
                    });
            }

            graph.parentRelations(entity)
                .forEach(function(parent) {
                    parent = parent.removeMembersWithID(id);
                    graph = graph.replace(parent);

                    if (parent.isDegenerate()) {
                        graph = actionDeleteRelation(parent.id)(graph);
                    }
                });
        }

        return graph.revert(id);
    };

    return action;
}
