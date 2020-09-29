import { actionAddMember } from './add_member';
import { geoSphericalDistance } from '../geo/geo';
import { osmIsOldMultipolygonOuterMember } from '../osm/multipolygon';
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

    function split(graph, nodeId, wayA, newWayId) {
        var wayB = osmWay({ id: newWayId, tags: wayA.tags });   // `wayB` is the NEW way
        var origNodes = wayA.nodes.slice();
        var nodesA;
        var nodesB;
        var isArea = wayA.isArea();
        var isOuter = osmIsOldMultipolygonOuterMember(wayA, graph);

        if (wayA.isClosed()) {
            var nodes = wayA.nodes.slice(0, -1);
            var idxA = nodes.indexOf(nodeId);
            var idxB = splitArea(nodes, idxA, graph);

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

        if (_keepHistoryOn === 'longest' &&
            totalLengthBetweenNodes(graph, nodesB) > totalLengthBetweenNodes(graph, nodesA)) {
            // keep the history on the longer way, regardless of the node count
            wayA = wayA.update({ nodes: nodesB });
            wayB = wayB.update({ nodes: nodesA });
        } else {
            wayA = wayA.update({ nodes: nodesA });
            wayB = wayB.update({ nodes: nodesB });
        }

        graph = graph.replace(wayA);
        graph = graph.replace(wayB);

        graph.parentRelations(wayA).forEach(function(relation) {
            var member;

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
                            member = {
                                id: wayB.id,
                                type: 'way',
                                role: 'via'
                            };
                            graph = actionAddMember(relation.id, member, v[i].index + 1)(graph);
                            break;
                        }
                    }
                }

            // All other relations (Routes, Multipolygons, etc):
            // 1. Both `wayA` and `wayB` remain in the relation
            // 2. But must be inserted as a pair (see `actionAddMember` for details)
            } else {
                if (relation === isOuter) {
                    graph = graph.replace(relation.mergeTags(wayA.tags));
                    graph = graph.replace(wayA.update({ tags: {} }));
                    graph = graph.replace(wayB.update({ tags: {} }));
                }

                member = {
                    id: wayB.id,
                    type: 'way',
                    role: relation.memberById(wayA.id).role
                };

                var insertPair = {
                    originalID: wayA.id,
                    insertedID: wayB.id,
                    nodes: origNodes
                };

                graph = actionAddMember(relation.id, member, undefined, insertPair)(graph);
            }
        });

        if (!isOuter && isArea) {
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

    var action = function(graph) {
        _createdWayIDs = [];
        var newWayIndex = 0;
        for (var i = 0; i < nodeIds.length; i++) {
            var nodeId = nodeIds[i];
            var candidates = action.waysForNode(nodeId, graph);
            for (var j = 0; j < candidates.length; j++) {
                graph = split(graph, nodeId, candidates[j], newWayIds && newWayIds[newWayIndex]);
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
        for (var i = 0; i < nodeIds.length; i++) {
            var nodeId = nodeIds[i];
            var candidates = action.waysForNode(nodeId, graph);
            if (candidates.length === 0 || (_wayIDs && _wayIDs.length !== candidates.length)) {
                return 'not_eligible';
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
