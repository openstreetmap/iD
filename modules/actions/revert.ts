import type { Action } from '../core/history';
import type { EntityId, NodeId } from '../osm';
import { actionDeleteRelation } from './delete_relation';
import { actionDeleteWay } from './delete_way';


/**
 * 'revert' means that the local state of an entity is reverted
 * back to the 'base' state (at download time).
 *
 * The merge conflict UI abuses this action by first rebasing
 * the graph (i.e. updating the base version), and then "reverting"
 * the local version to the (new) "base" version.
 */
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

        graph = graph.revert(id);


        // now deal with children
        const queue = [graph.hasEntity(id)];
        while (queue.length) {
            const next = queue.pop();
            if (!next) continue;

            for (const childId of next.children()) {
                // it's a local deletion if it exists in the base graph,
                // but does not exist in the current graph
                if (graph.base().entities[childId] && !graph.hasEntity(childId)) {
                    graph = graph.revert(childId);

                    // check children recusively
                    queue.push(graph.hasEntity(childId));
                }
            }
        }

        return graph;
    };

    return action;
}
