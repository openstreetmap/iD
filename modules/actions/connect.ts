import { actionDeleteNode } from './delete_node';
import { actionDeleteWay } from './delete_way';
import { utilArrayUniq, utilOldestID } from '../util';
import type { Action } from '../core/history';
import type { EntityId, osmNode, osmRelation, osmWay, NodeId } from '../osm';
import type { RelationMember } from '../osm/relation';

// Connect the ways at the given nodes.
//
// First choose a node to be the survivor, with preference given
// to the oldest existing (not new) and "interesting" node.
//
// Tags and relation memberships of of non-surviving nodes are merged
// to the survivor.
//
// This is the inverse of `iD.actionDisconnect`.
//
// Reference:
//   https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MergeNodesAction.as
//   https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/actions/MergeNodesAction.java
//
export function actionConnect(nodeIDs: NodeId[]): Action {
    const action: Action = function (graph) {
        let survivor;
        let node: osmNode;
        let parents;
        let i, j;

        // Select the node with the ID passed as parameter if it is in the list,
        // otherwise select the node with the oldest ID as the survivor, or the
        // last one if there are only new nodes.
        nodeIDs.reverse();

        const interestingIDs: NodeId[] = [];
        for (i = 0; i < nodeIDs.length; i++) {
            node = graph.entity(nodeIDs[i]);
            if (node.hasInterestingTags()) {
                if (!node.isNew()) {
                    interestingIDs.push(node.id);
                }
            }
        }
        survivor = graph.entity(
            utilOldestID(interestingIDs.length > 0 ? interestingIDs : nodeIDs)!,
        );

        // Replace all non-surviving nodes with the survivor and merge tags.
        for (i = 0; i < nodeIDs.length; i++) {
            node = graph.entity(nodeIDs[i]);
            if (node.id === survivor.id) continue;

            parents = graph.parentWays(node);
            for (j = 0; j < parents.length; j++) {
                graph = graph.replace(parents[j].replaceNode(node.id, survivor.id));
            }

            parents = graph.parentRelations(node);
            for (j = 0; j < parents.length; j++) {
                graph = graph.replace(parents[j].replaceMember(node, survivor));
            }

            survivor = survivor.mergeTags(node.tags);
            graph = actionDeleteNode(node.id)(graph);
        }

        graph = graph.replace(survivor);

        // find and delete any degenerate ways created by connecting adjacent vertices
        parents = graph.parentWays(survivor);
        for (i = 0; i < parents.length; i++) {
            if (parents[i].isDegenerate()) {
                graph = actionDeleteWay(parents[i].id)(graph);
            }
        }

        return graph;
    };

    action.disabled = function (graph) {
        const seen: Record<EntityId, string> = {};
        let restrictionIDs: EntityId[] = [];
        let node: osmNode;
        let way: osmWay;
        let relations;
        let relation: osmRelation;
        let role;
        let i, j, k;

        // Select the node with the oldest ID as the survivor.
        const survivor = graph.entity(utilOldestID(nodeIDs)!);

        // 1. disable if the nodes being connected have conflicting relation roles
        for (i = 0; i < nodeIDs.length; i++) {
            node = graph.entity(nodeIDs[i]);
            relations = graph.parentRelations(node);

            for (j = 0; j < relations.length; j++) {
                relation = relations[j];
                role = relation.memberById(node.id)!.role || '';

                // if this node is a via node in a restriction, remember for later
                if (relation.hasFromViaTo()) {
                    restrictionIDs.push(relation.id);
                }

                if (seen[relation.id] !== undefined && seen[relation.id] !== role) {
                    return 'relation';
                } else {
                    seen[relation.id] = role;
                }
            }
        }

        // gather restrictions for parent ways
        for (i = 0; i < nodeIDs.length; i++) {
            node = graph.entity(nodeIDs[i]);

            const parents = graph.parentWays(node);
            for (j = 0; j < parents.length; j++) {
                const parent = parents[j];
                relations = graph.parentRelations(parent);

                for (k = 0; k < relations.length; k++) {
                    relation = relations[k];
                    if (relation.hasFromViaTo()) {
                        restrictionIDs.push(relation.id);
                    }
                }
            }
        }

        // test restrictions
        restrictionIDs = utilArrayUniq(restrictionIDs);
        for (i = 0; i < restrictionIDs.length; i++) {
            relation = graph.entity(restrictionIDs[i]);
            if (!relation.isComplete(graph)) continue;

            let memberWays = relation.members
                .filter(function (m) {
                    return m.type === 'way';
                })
                .map(function (m) {
                    return graph.entity<osmWay>(m.id);
                });

            memberWays = utilArrayUniq(memberWays);
            const f = relation.memberByRole('from')!;
            const t = relation.memberByRole('to')!;
            const isUturn = f.id === t.id;

            // 2a. disable if connection would damage a restriction
            // (a key node is a node at the junction of ways)
            const nodes: Record<string, EntityId[]> = {
                from: [],
                via: [],
                to: [],
                keyfrom: [],
                keyto: [],
            };
            for (j = 0; j < relation.members.length; j++) {
                collectNodes(relation.members[j], nodes);
            }

            nodes.keyfrom = utilArrayUniq(nodes.keyfrom.filter(hasDuplicates));
            nodes.keyto = utilArrayUniq(nodes.keyto.filter(hasDuplicates));

            const filter = keyNodeFilter(nodes.keyfrom, nodes.keyto);
            nodes.from = nodes.from.filter(filter);
            nodes.via = nodes.via.filter(filter);
            nodes.to = nodes.to.filter(filter);

            let connectFrom = false;
            let connectVia = false;
            let connectTo = false;
            let connectKeyFrom = false;
            let connectKeyTo = false;

            for (j = 0; j < nodeIDs.length; j++) {
                const n = nodeIDs[j];
                if (nodes.from.indexOf(n) !== -1) {
                    connectFrom = true;
                }
                if (nodes.via.indexOf(n) !== -1) {
                    connectVia = true;
                }
                if (nodes.to.indexOf(n) !== -1) {
                    connectTo = true;
                }
                if (nodes.keyfrom.indexOf(n) !== -1) {
                    connectKeyFrom = true;
                }
                if (nodes.keyto.indexOf(n) !== -1) {
                    connectKeyTo = true;
                }
            }
            if (connectFrom && connectTo && !isUturn) {
                return 'restriction';
            }
            if (connectFrom && connectVia) {
                return 'restriction';
            }
            if (connectTo && connectVia) {
                return 'restriction';
            }

            // connecting to a key node -
            // if both nodes are on a member way (i.e. part of the turn restriction),
            // the connecting node must be adjacent to the key node.
            if (connectKeyFrom || connectKeyTo) {
                if (nodeIDs.length !== 2) {
                    return 'restriction';
                }

                let n0 = null;
                let n1 = null;
                for (j = 0; j < memberWays.length; j++) {
                    way = memberWays[j];
                    if (way.contains(nodeIDs[0])) {
                        n0 = nodeIDs[0];
                    }
                    if (way.contains(nodeIDs[1])) {
                        n1 = nodeIDs[1];
                    }
                }

                if (n0 && n1) {
                    // both nodes are part of the restriction
                    let ok = false;
                    for (j = 0; j < memberWays.length; j++) {
                        way = memberWays[j];
                        if (way.areAdjacent(n0, n1)) {
                            ok = true;
                            break;
                        }
                    }
                    if (!ok) {
                        return 'restriction';
                    }
                }
            }

            // 2b. disable if nodes being connected will destroy a member way in a restriction
            // (to test, make a copy and try actually connecting the nodes)
            for (j = 0; j < memberWays.length; j++) {
                way = memberWays[j].update({}); // make copy
                for (k = 0; k < nodeIDs.length; k++) {
                    if (nodeIDs[k] === survivor.id) continue;

                    if (way.areAdjacent(nodeIDs[k], survivor.id)) {
                        way = way.removeNode(nodeIDs[k]);
                    } else {
                        way = way.replaceNode(nodeIDs[k], survivor.id);
                    }
                }
                if (way.isDegenerate()) {
                    return 'restriction';
                }
            }
        }

        return false;

        // if a key node appears multiple times (indexOf !== lastIndexOf) it's a FROM-VIA or TO-VIA junction
        function hasDuplicates<T>(n: T, i: number, arr: T[]) {
            return arr.indexOf(n) !== arr.lastIndexOf(n);
        }

        function keyNodeFilter<T>(froms: T[], tos: T[]) {
            return function (n: T) {
                return froms.indexOf(n) === -1 && tos.indexOf(n) === -1;
            };
        }

        function collectNodes(member: RelationMember, collection: Record<string, EntityId[]>) {
            const entity = graph.hasEntity<osmWay>(member.id);
            if (!entity) return;

            const role = member.role || '';
            if (!collection[role]) {
                collection[role] = [];
            }

            if (member.type === 'node') {
                collection[role].push(member.id);
                if (role === 'via') {
                    collection.keyfrom.push(member.id);
                    collection.keyto.push(member.id);
                }
            } else if (member.type === 'way') {
                collection[role].push(...entity.nodes);
                if (role === 'from' || role === 'via') {
                    collection.keyfrom.push(entity.first());
                    collection.keyfrom.push(entity.last());
                }
                if (role === 'to' || role === 'via') {
                    collection.keyto.push(entity.first());
                    collection.keyto.push(entity.last());
                }
            }
        }
    };

    return action;
}
