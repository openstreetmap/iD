import type { coreGraph } from './graph';
import type { coreContext } from './context';
import type { EntityId, OsmEntity } from '../osm';

function getChildrenRecursive(entity: OsmEntity, graph: coreGraph) {
    const results: Record<EntityId, OsmEntity | undefined> = {};
    const queue = [entity];

    while (queue.length) {
        const next = queue.pop()!;
        for (const childId of next.children()) {
            if (childId in results) continue;

            const child = graph.hasEntity(childId);
            results[childId] = child;
            if (child) queue.push(child);
        }
    }

    return Object.values(results).filter(Boolean);
}

/**
 * This prepares the graph for a merge conflict situation where
 * we have local_delete + remote_modify.
 *
 * If `keep_remote` is chosen, actionRevert will reset all our
 * local changes to the "base" version. Therefore, this function
 * needs to rebease the graph, so that the base version is
 * replaced with the latest remote version.
 *
 * Similar to a git rebase, this effectively rewrites history.
 * It also cannot be easily reversed, since it mutates the
 * base graph.
 */
export function rebaseRemoteChangesIntoBaseGraph(context: coreContext, remote: OsmEntity, remoteGraph: coreGraph) {
    const history = context.history();
    const baseGraph = history.base();
    const base = baseGraph.base();
    const entities = [remote, ...getChildrenRecursive(remote, remoteGraph)];

    const known: OsmEntity[] = [];
    for (const entity of entities) {
        if (!entity.visible) continue; // skip deleted

        if (baseGraph.hasEntity(entity.id)) known.push(entity);

        baseGraph._updateCalculated(base.entities[entity.id], entity, base.parentWays, base.parentRels);
        base.entities[entity.id] = entity;
    }
    baseGraph.transients = {};

    history.tree().rebase(
        known.filter((entity) => history.graph().hasEntity(entity.id)),
        /* force */ true,
    );
}
