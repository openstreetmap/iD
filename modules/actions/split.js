import { geoSphericalDistance } from '../geo/geo';
import { osmRelation } from '../osm/relation';
import { osmWay } from '../osm/way';
import { utilArrayIntersection, utilWrap, utilArrayUniq } from '../util';


// Split a way at the given node.
//
// Optionally, split only the given ways, if multiple ways share
// the given node.
//
// This is the inverse of `iD.actionJoin`.
//
// For testing convenience, accepts an ID to assign to the new way.
// Normally, this will be undefined and the way will automatically
// be assigned a new ID.
//
// Reference:
//   https://github.com/systemed/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/SplitWayAction.as
//
export function actionSplit(nodeIds, newWayIds) {
    // accept single ID for backwards-compatiblity
    if (typeof nodeIds === 'string') nodeIds = [nodeIds];

    var _wayIDs;
    // the strategy for picking which way will have a new version and which way is newly created
    var _keepHistoryOn = 'longest'; // 'longest', 'first'

    // these closed ways have to be treated in a special way when contained in a (route) relation
    const circularJunctions = ['roundabout', 'circular'];

    // The IDs of the ways actually created by running this action
    var _createdWayIDs = [];

    function dist(graph, nA, nB) {
        var locA = graph.entity(nA).loc;
        var locB = graph.entity(nB).loc;
        var epsilon = 1e-6;
        return (locA && locB) ? geoSphericalDistance(locA, locB) : epsilon;
    }

    // If the way is closed, we need to search for a partner node
    // to split the way at.
    //
    // The following looks for a node that is both far away from
    // the initial node in terms of way segment length and nearby
    // in terms of beeline-distance. This assures that areas get
    // split on the most "natural" points (independent of the number
    // of nodes).
    // For example: bone-shaped areas get split across their waist
    // line, circles across the diameter.
    function splitArea(nodes, idxA, graph) {
        var lengths = new Array(nodes.length);
        var length;
        var i;
        var best = 0;
        var idxB;

        function wrap(index) {
            return utilWrap(index, nodes.length);
        }

        // calculate lengths
        length = 0;
        for (i = wrap(idxA + 1); i !== idxA; i = wrap(i + 1)) {
            length += dist(graph, nodes[i], nodes[wrap(i - 1)]);
            lengths[i] = length;
        }

        length = 0;
        for (i = wrap(idxA - 1); i !== idxA; i = wrap(i - 1)) {
            length += dist(graph, nodes[i], nodes[wrap(i + 1)]);
            if (length < lengths[i]) {
                lengths[i] = length;
            }
        }

        // determine best opposite node to split
        for (i = 0; i < nodes.length; i++) {
            var cost = lengths[i] / dist(graph, nodes[idxA], nodes[i]);
            if (cost > best) {
                idxB = i;
                best = cost;
            }
        }

        return idxB;
    }

    function totalLengthBetweenNodes(graph, nodes) {
        var totalLength = 0;
        for (var i = 0; i < nodes.length - 1; i++) {
            totalLength += dist(graph, nodes[i], nodes[i + 1]);
        }
        return totalLength;
    }

    function split(graph, nodeId, wayA, newWayId, otherNodeIds) {
        var wayB = osmWay({ id: newWayId, tags: wayA.tags });   // `wayB` is the NEW way
        var nodesA;
        var nodesB;
        var isArea = wayA.isArea();

        if (wayA.isClosed()) {
            var nodes = wayA.nodes.slice(0, -1);
            var idxA = nodes.indexOf(nodeId);
            var idxB = otherNodeIds.length > 0 ? nodes.indexOf(otherNodeIds[0]) : splitArea(nodes, idxA, graph);

            if (idxB < idxA) {
                nodesA = nodes.slice(idxA).concat(nodes.slice(0, idxB + 1));
                nodesB = nodes.slice(idxB, idxA + 1);
            } else {
                nodesA = nodes.slice(idxA, idxB + 1);
                nodesB = nodes.slice(idxB).concat(nodes.slice(0, idxA + 1));
            }
        } else {
            var idx = wayA.nodes.indexOf(nodeId, 1);
            nodesA = wayA.nodes.slice(0, idx + 1);
            nodesB = wayA.nodes.slice(idx);
        }

        var lengthA = totalLengthBetweenNodes(graph, nodesA);
        var lengthB = totalLengthBetweenNodes(graph, nodesB);

        if (_keepHistoryOn === 'longest' &&
            lengthB > lengthA) {
            // keep the history on the longer way, regardless of the node count
            wayA = wayA.update({ nodes: nodesB });
            wayB = wayB.update({ nodes: nodesA });

            var temp = lengthA;
            lengthA = lengthB;
            lengthB = temp;
        } else {
            wayA = wayA.update({ nodes: nodesA });
            wayB = wayB.update({ nodes: nodesB });
        }

        if (wayA.tags.step_count) {
            // divide up the the step count proportionally between the two ways

            var stepCount = Number(wayA.tags.step_count);
            if (stepCount &&
                // ensure a number
                isFinite(stepCount) &&
                // ensure positive
                stepCount > 0 &&
                // ensure integer
                Math.round(stepCount) === stepCount) {

                var tagsA = Object.assign({}, wayA.tags);
                var tagsB = Object.assign({}, wayB.tags);

                var ratioA = lengthA / (lengthA + lengthB);
                var countA = Math.round(stepCount * ratioA);
                tagsA.step_count = countA.toString();
                tagsB.step_count = (stepCount - countA).toString();

                wayA = wayA.update({ tags: tagsA });
                wayB = wayB.update({ tags: tagsB });
            }
        }


        graph = graph.replace(wayA);
        graph = graph.replace(wayB);

        graph.parentRelations(wayA).forEach(function(relation) {
            // Turn restrictions - make sure:
            // 1. Splitting a FROM/TO way - only `wayA` OR `wayB` remains in relation
            //    (whichever one is connected to the VIA node/ways)
            // 2. Splitting a VIA way - `wayB` remains in relation as a VIA way
            if (relation.hasFromViaTo()) {
                var f = relation.memberByRole('from');
                var v = relation.membersByRole('via');
                var t = relation.memberByRole('to');
                var i;

                // 1. split a FROM/TO
                if (f.id === wayA.id || t.id === wayA.id) {
                    var keepB = false;
                    if (v.length === 1 && v[0].type === 'node') {   // check via node
                        keepB = wayB.contains(v[0].id);
                    } else {                                        // check via way(s)
                        for (i = 0; i < v.length; i++) {
                            if (v[i].type === 'way') {
                                var wayVia = graph.hasEntity(v[i].id);
                                if (wayVia && utilArrayIntersection(wayB.nodes, wayVia.nodes).length) {
                                    keepB = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (keepB) {
                        relation = relation.replaceMember(wayA, wayB);
                        graph = graph.replace(relation);
                    }

                // 2. split a VIA
                } else {
                    for (i = 0; i < v.length; i++) {
                        if (v[i].type === 'way' && v[i].id === wayA.id) {
                            graph = splitWayMember(graph, relation.id, wayA, wayB);
                        }
                    }
                }

            // All other relations (Routes, Multipolygons, etc):
            // 1. Both `wayA` and `wayB` remain in the relation
            // 2. But must be inserted in the correct order
            } else {
                graph = splitWayMember(graph, relation.id, wayA, wayB);
            }
        });

        if (isArea) {
            var multipolygon = osmRelation({
                tags: Object.assign({}, wayA.tags, { type: 'multipolygon' }),
                members: [
                    { id: wayA.id, role: 'outer', type: 'way' },
                    { id: wayB.id, role: 'outer', type: 'way' }
                ]
            });

            graph = graph.replace(multipolygon);
            graph = graph.replace(wayA.update({ tags: {} }));
            graph = graph.replace(wayB.update({ tags: {} }));
        }

        _createdWayIDs.push(wayB.id);

        return graph;
    }

    // Handles (most kinds of) parent relations of a way that is split:
    // We need to find the correct order to insert the newly created way
    // relative to the existing way.
    //
    // This applies some heuristics to find the most likely correct order to
    // perform the operation, working under the assumption that the members
    // of the relation are already "properly" sorted and that the relevant
    // member entities are loaded in graph: The new way is inserted into the
    // relation before or after the existing way depending on how the old/new
    // way connect to their neighboring members.
    //
    // As this is a local operation, it means that even if these conditions
    // are not met, the order of the relation members will at most be incorrect
    // between the existing and newly created way; other relation members are
    // kept unmodified.
    function splitWayMember(graph, relationId, wayA, wayB) {
        // returns true if way1 connects to way2 at either end node, or if one
        // of the two ways is tagged as a "roundabout" and connects to the other
        // way at any of its nodes.
        function connects(way1, way2) {
            if (way1.nodes.length < 2 || way2.nodes.length < 2) return false;
            if (circularJunctions.includes(way1.tags.junction) && way1.isClosed()) {
                return way1.nodes.some(nodeId =>
                    nodeId === way2.nodes[0] ||
                    nodeId === way2.nodes[way2.nodes.length - 1]);
            } else if (circularJunctions.includes(way2.tags.junction) && way2.isClosed()) {
                return way2.nodes.some(nodeId =>
                    nodeId === way1.nodes[0] ||
                    nodeId === way1.nodes[way1.nodes.length - 1]);
            }
            if (way1.nodes[0] === way2.nodes[0]) return true;
            if (way1.nodes[0] === way2.nodes[way2.nodes.length - 1]) return true;
            if (way1.nodes[way1.nodes.length - 1] === way2.nodes[way2.nodes.length - 1]) return true;
            if (way1.nodes[way1.nodes.length - 1] === way2.nodes[0]) return true;
            return false;
        }

        let relation = graph.entity(relationId);
        // insertMembers stores the positions where the new way (wayB) is to be inserted
        // into the parent relation
        const insertMembers = [];
        const members = relation.members;
        for (let i = 0; i < members.length; i++) {
            const member = members[i];
            if (member.id === wayA.id) { // wayA is the existing way
                // determine connection matrix of wayA, wayB and their neighboring members
                let wayAconnectsPrev = false;
                let wayAconnectsNext = false;
                let wayBconnectsPrev = false;
                let wayBconnectsNext = false;
                if (i > 0 && graph.hasEntity(members[i - 1].id)) {
                    const prevEntity = graph.entity(members[i - 1].id);
                    if (prevEntity.type === 'way') {
                        wayAconnectsPrev = connects(prevEntity, wayA);
                        wayBconnectsPrev = connects(prevEntity, wayB);
                    }
                }
                if (i < members.length - 1 && graph.hasEntity(members[i + 1].id)) {
                    const nextEntity = graph.entity(members[i + 1].id);
                    if (nextEntity.type === 'way') {
                        wayAconnectsNext = connects(nextEntity, wayA);
                        wayBconnectsNext = connects(nextEntity, wayB);
                    }
                }
                // possible outcomes of connection matrix
                //
                //  ⟍    0   0   1   1    <- wayA connects to next member
                //    ⟍  0   1   0   1    <- wayB connects to next member
                //      +---+---+---+---+
                //  0 0 | ? | → | ← | * |        → ... wayB should be inserted after wayA
                //      +---+---+---+---+        ← ... wayB should be inserted before wayA
                //  0 1 | ← | x | ← | ← |        ↺ ... members form a loop
                //      +---+---+---+---+        ? ... wayA/B do not connect to their neighbor members
                //  1 0 | → | → | x | → |        x ... undefined state
                //      +---+---+---+---+        * ... undefined state (any order results in a connection)
                //  1 1 | * | → | ← | ↺ |
                //      +---+---+---+---+
                //  ^ ^
                //  | |
                //  | +-- wayB connects to previous member
                //  +---- wayA connects to previous member
                //
                // These boolean conditions can be simplified to the following conditions
                // (considering the outcome as arbitrary for the undefined "*" cases),
                // i.e. wayB should be inserted after wayA if:
                // * wayA connects the the previous member but not the next one, or
                // * wayB connects to the next member but not the previous one, and wayA's connectivity does not contradict that
                // (and vice versa)
                // the remaining cases to be handles specifically are:
                // * unconnected ways
                // * members for a loop
                // * a few invalid/undefined cases (e.g. forks with no proper solution)
                if (wayAconnectsPrev && !wayAconnectsNext ||
                    !wayBconnectsPrev && wayBconnectsNext && !(!wayAconnectsPrev && wayAconnectsNext)
                ) {
                    insertMembers.push({at: i + 1, role: member.role});
                    continue;
                }
                if (!wayAconnectsPrev && wayAconnectsNext ||
                    wayBconnectsPrev && !wayBconnectsNext && !(wayAconnectsPrev && !wayAconnectsNext)
                ) {
                    insertMembers.push({at: i, role: member.role});
                    continue;
                }
                // loops: try to look one further member ahead/behind to resolve the connectivity
                if (wayAconnectsPrev && wayBconnectsPrev && wayAconnectsNext && wayBconnectsNext) {
                    // look one further member ahead
                    if (i > 2 && graph.hasEntity(members[i - 2].id)) {
                        const prev2Entity = graph.entity(members[i - 2].id);
                        if (connects(prev2Entity, wayA) && !connects(prev2Entity, wayB)) {
                            // prev-2 member connects only to A: insert B before A
                            insertMembers.push({at: i, role: member.role});
                            continue;
                        }
                        if (connects(prev2Entity, wayB) && !connects(prev2Entity, wayA)) {
                            // prev-2 member connects only to B: insert B after A
                            insertMembers.push({at: i + 1, role: member.role});
                            continue;
                        }
                    }
                    // look one further member behind
                    if (i < members.length - 2 && graph.hasEntity(members[i + 2].id)) {
                        const next2Entity = graph.entity(members[i + 2].id);
                        if (connects(next2Entity, wayA) && !connects(next2Entity, wayB)) {
                            // next+2 member connects only to A: insert B after A
                            insertMembers.push({at: i + 1, role: member.role});
                            continue;
                        }
                        if (connects(next2Entity, wayB) && !connects(next2Entity, wayA)) {
                            // next+2 member connects only to B: insert B before A
                            insertMembers.push({at: i, role: member.role});
                            continue;
                        }
                    }
                }

                // could not determine how new member should connect (e.g. existing way was not
                // connected to other member ways): insert them in the original orientation of wayA
                if (wayA.nodes[wayA.nodes.length - 1] === wayB.nodes[0]) {
                    insertMembers.push({at: i + 1, role: member.role});
                } else {
                    insertMembers.push({at: i, role: member.role});
                }
            }
        }
        // insert new member(s) at the determined indices
        insertMembers.reverse().forEach(item => {
            graph = graph.replace(relation.addMember({
                id: wayB.id,
                type: 'way',
                role: item.role
            }, item.at));
            relation = graph.entity(relation.id);
        });
        return graph;
    }

    var action = function(graph) {
        _createdWayIDs = [];
        var newWayIndex = 0;
        for (var i = 0; i < nodeIds.length; i++) {
            var nodeId = nodeIds[i];
            var candidates = action.waysForNode(nodeId, graph);
            for (var j = 0; j < candidates.length; j++) {
                graph = split(graph, nodeId, candidates[j], newWayIds && newWayIds[newWayIndex], nodeIds.slice(j + 1));
                newWayIndex += 1;
            }
        }
        return graph;
    };

    action.getCreatedWayIDs = function() {
        return _createdWayIDs;
    };

    action.waysForNode = function(nodeId, graph) {
        var node = graph.entity(nodeId);
        var splittableParents = graph.parentWays(node).filter(isSplittable);

        if (!_wayIDs) {
            // If the ways to split aren't specified, only split the lines.
            // If there are no lines to split, split the areas.

            var hasLine = splittableParents.some(function(parent) {
                return parent.geometry(graph) === 'line';
            });
            if (hasLine) {
                return splittableParents.filter(function(parent) {
                    return parent.geometry(graph) === 'line';
                });
            }
        }
        return splittableParents;

        function isSplittable(parent) {
            // If the ways to split are specified, ignore everything else.
            if (_wayIDs && _wayIDs.indexOf(parent.id) === -1) return false;

            // We can fake splitting closed ways at their endpoints...
            if (parent.isClosed()) return true;

            // otherwise, we can't split nodes at their endpoints.
            for (var i = 1; i < parent.nodes.length - 1; i++) {
                if (parent.nodes[i] === nodeId) return true;
            }
            return false;
        }
    };

    action.ways = function(graph) {
        return utilArrayUniq([].concat.apply([], nodeIds.map(function(nodeId) {
            return action.waysForNode(nodeId, graph);
        })));
    };


    action.disabled = function(graph) {
        for (const nodeId of nodeIds) {
            const candidates = action.waysForNode(nodeId, graph);
            if (candidates.length === 0 || (_wayIDs && _wayIDs.length !== candidates.length)) {
                return 'not_eligible';
            }
            for (const way of candidates) {
                const parentRelations = graph.parentRelations(way);
                for (const parentRelation of parentRelations) {
                    if (parentRelation.hasFromViaTo()) {
                        // turn restrictions: via members must be loaded
                        const vias = parentRelation.membersByRole('via');
                        if (!vias.every(via => graph.hasEntity(via.id))) {
                            return 'parent_incomplete';
                        }
                    } else {
                        // other relations (e.g. route relations): at least one members before or after way must be present
                        for (let i = 0; i < parentRelation.members.length; i++) {
                            if (parentRelation.members[i].id === way.id) {
                                const memberBeforePresent = i > 0 && graph.hasEntity(parentRelation.members[i - 1].id);
                                const memberAfterPresent = i < parentRelation.members.length - 1 && graph.hasEntity(parentRelation.members[i + 1].id);
                                if (!memberBeforePresent && !memberAfterPresent && parentRelation.members.length > 1) {
                                    return 'parent_incomplete';
                                }
                            }
                        }
                    }
                    const relTypesExceptions = ['junction', 'enforcement']; // some relation types should not prehibit a member from being split
                    if (circularJunctions.includes(way.tags.junction) && way.isClosed() && !relTypesExceptions.includes(parentRelation.tags.type)) {
                        return 'simple_roundabout';
                    }
                }
            }
        }
    };


    action.limitWays = function(val) {
        if (!arguments.length) return _wayIDs;
        _wayIDs = val;
        return action;
    };


    action.keepHistoryOn = function(val) {
        if (!arguments.length) return _keepHistoryOn;
        _keepHistoryOn = val;
        return action;
    };


    return action;
}
