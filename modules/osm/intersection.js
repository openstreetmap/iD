import { actionDeleteRelation } from '../actions/delete_relation';
import { actionReverse } from '../actions/reverse';
import { actionSplit } from '../actions/split';
import { coreGraph } from '../core/graph';
import { geoAngle, geoSphericalDistance } from '../geo';
import { osmEntity } from './entity';
import { utilArrayDifference, utilArrayUniq } from '../util';


export function osmTurn(turn) {
    if (!(this instanceof osmTurn)) {
        return new osmTurn(turn);
    }
    Object.assign(this, turn);
}


export function osmIntersection(graph, startVertexId, maxDistance) {
    maxDistance = maxDistance || 30;    // in meters
    let vgraph = coreGraph();           // virtual graph
    let i, j, k;


    function memberOfRestriction(entity) {
        return graph.parentRelations(entity)
            .some(function(r) { return r.isRestriction(); });
    }

    function isRoad(way) {
        if (way.isArea() || way.isDegenerate()) return false;
        const roads = {
            'motorway': true,
            'motorway_link': true,
            'trunk': true,
            'trunk_link': true,
            'primary': true,
            'primary_link': true,
            'secondary': true,
            'secondary_link': true,
            'tertiary': true,
            'tertiary_link': true,
            'residential': true,
            'unclassified': true,
            'living_street': true,
            'service': true,
            'busway': true,
            'road': true,
            'track': true
        };
        return roads[way.tags.highway];
    }


    const startNode = graph.entity(startVertexId);
    let checkVertices = [startNode];
    let checkWays;
    let vertices = [];
    let vertexIds = [];
    let vertex;
    let ways = [];
    let wayIds = [];
    let way;
    let nodes = [];
    let node;
    let parents = [];
    let parent;

    // `actions` will store whatever actions must be performed to satisfy
    // preconditions for adding a turn restriction to this intersection.
    //  - Remove any existing degenerate turn restrictions (missing from/to, etc)
    //  - Reverse oneways so that they are drawn in the forward direction
    //  - Split ways on key vertices
    const actions = [];


    // STEP 1:  walk the graph outwards from starting vertex to search
    //  for more key vertices and ways to include in the intersection..

    while (checkVertices.length) {
        vertex = checkVertices.pop();

        // check this vertex for parent ways that are roads
        checkWays = graph.parentWays(vertex);
        let hasWays = false;
        for (i = 0; i < checkWays.length; i++) {
            way = checkWays[i];
            if (!isRoad(way) && !memberOfRestriction(way)) continue;

            ways.push(way);   // it's a road, or it's already in a turn restriction
            hasWays = true;

            // check the way's children for more key vertices
            nodes = utilArrayUniq(graph.childNodes(way));
            for (j = 0; j < nodes.length; j++) {
                node = nodes[j];
                if (node === vertex) continue;                                           // same thing
                if (vertices.indexOf(node) !== -1) continue;                             // seen it already
                if (geoSphericalDistance(node.loc, startNode.loc) > maxDistance) continue;   // too far from start

                // a key vertex will have parents that are also roads
                let hasParents = false;
                parents = graph.parentWays(node);
                for (k = 0; k < parents.length; k++) {
                    parent = parents[k];
                    if (parent === way) continue;                 // same thing
                    if (ways.indexOf(parent) !== -1) continue;    // seen it already
                    if (!isRoad(parent)) continue;                // not a road
                    hasParents = true;
                    break;
                }

                if (hasParents) {
                    checkVertices.push(node);
                }
            }
        }

        if (hasWays) {
            vertices.push(vertex);
        }
    }

    vertices = utilArrayUniq(vertices);
    ways = utilArrayUniq(ways);


    // STEP 2:  Build a virtual graph containing only the entities in the intersection..
    // Everything done after this step should act on the virtual graph
    // Any actions that must be performed later to the main graph go in `actions` array
    ways.forEach(function(way) {
        graph.childNodes(way).forEach(function(node) {
            vgraph = vgraph.replace(node);
        });

        vgraph = vgraph.replace(way);

        graph.parentRelations(way).forEach(function(relation) {
            if (relation.isRestriction()) {
                if (relation.isValidRestriction(graph)) {
                    vgraph = vgraph.replace(relation);
                } else if (relation.isComplete(graph)) {
                    actions.push(actionDeleteRelation(relation.id));
                }
            }
        });
    });


    // STEP 3:  Force all oneways to be drawn in the forward direction
    ways.forEach(function(w) {
        const way = vgraph.entity(w.id);
        if (way.tags.oneway === '-1') {
            const action = actionReverse(way.id, { reverseOneway: true });
            actions.push(action);
            vgraph = action(vgraph);
        }
    });


    // STEP 4:  Split ways on key vertices
    const origCount = osmEntity.id.next.way;
    vertices.forEach(function(v) {
        // This is an odd way to do it, but we need to find all the ways that
        // will be split here, then split them one at a time to ensure that these
        // actions can be replayed on the main graph exactly in the same order.
        // (It is unintuitive, but the order of ways returned from graph.parentWays()
        // is arbitrary, depending on how the main graph and vgraph were built)
        const splitAll = actionSplit([v.id]).keepHistoryOn('first');
        if (!splitAll.disabled(vgraph)) {
            splitAll.ways(vgraph).forEach(function(way) {
                const splitOne = actionSplit([v.id]).limitWays([way.id]).keepHistoryOn('first');
                actions.push(splitOne);
                vgraph = splitOne(vgraph);
            });
        }
    });

    // In here is where we should also split the intersection at nearby junction.
    //   for https://github.com/mapbox/iD-internal/issues/31
    // nearbyVertices.forEach(function(v) {
    // });

    // Reasons why we reset the way id count here:
    //  1. Continuity with way ids created by the splits so that we can replay
    //     these actions later if the user decides to create a turn restriction
    //  2. Avoids churning way ids just by hovering over a vertex
    //     and displaying the turn restriction editor
    osmEntity.id.next.way = origCount;


    // STEP 5:  Update arrays to point to vgraph entities
    vertexIds = vertices.map(function(v) { return v.id; });
    vertices = [];
    ways = [];

    vertexIds.forEach(function(id) {
        const vertex = vgraph.entity(id);
        const parents = vgraph.parentWays(vertex);
        vertices.push(vertex);
        ways = ways.concat(parents);
    });

    vertices = utilArrayUniq(vertices);
    ways = utilArrayUniq(ways);

    vertexIds = vertices.map(function(v) { return v.id; });
    wayIds = ways.map(function(w) { return w.id; });


    // STEP 6:  Update the ways with some metadata that will be useful for
    // walking the intersection graph later and rendering turn arrows.

    function withMetadata(way, vertexIds) {
        // bidirectional ways are two-way from an intersection's perspective
        const __oneWay = way.isOneWay() && !way.isBiDirectional();

        // which affixes are key vertices?
        const __first = (vertexIds.indexOf(way.first()) !== -1);
        const __last = (vertexIds.indexOf(way.last()) !== -1);

        // what roles is this way eligible for?
        const __via = (__first && __last);
        const __from = ((__first && !__oneWay) || __last);
        const __to = (__first || (__last && !__oneWay));

        return way.update({
            __first:  __first,
            __last:  __last,
            __from:  __from,
            __via: __via,
            __to:  __to,
            __oneWay:  __oneWay
        });
    }

    ways = [];
    wayIds.forEach(function(id) {
        const way = withMetadata(vgraph.entity(id), vertexIds);
        vgraph = vgraph.replace(way);
        ways.push(way);
    });


    // STEP 7:  Simplify - This is an iterative process where we:
    //  1. Find trivial vertices with only 2 parents
    //  2. trim off the leaf way from those vertices and remove from vgraph

    let keepGoing;
    const removeWayIds = [];
    const removeVertexIds = [];

    do {
        keepGoing = false;
        checkVertices = vertexIds.slice();

        for (i = 0; i < checkVertices.length; i++) {
            const vertexId = checkVertices[i];
            vertex = vgraph.hasEntity(vertexId);

            if (!vertex) {
                if (vertexIds.indexOf(vertexId) !== -1) {
                    vertexIds.splice(vertexIds.indexOf(vertexId), 1);   // stop checking this one
                }
                removeVertexIds.push(vertexId);
                continue;
            }

            parents = vgraph.parentWays(vertex);
            if (parents.length < 3) {
                if (vertexIds.indexOf(vertexId) !== -1) {
                    vertexIds.splice(vertexIds.indexOf(vertexId), 1);   // stop checking this one
                }
            }

            if (parents.length === 2) {     // vertex with 2 parents is trivial
                const a = parents[0];
                const b = parents[1];
                const aIsLeaf = a && !a.__via;
                const bIsLeaf = b && !b.__via;
                let leaf, survivor;

                if (aIsLeaf && !bIsLeaf) {
                    leaf = a;
                    survivor = b;
                } else if (!aIsLeaf && bIsLeaf) {
                    leaf = b;
                    survivor = a;
                }

                if (leaf && survivor) {
                    survivor = withMetadata(survivor, vertexIds);      // update survivor way
                    vgraph = vgraph.replace(survivor).remove(leaf);    // update graph
                    removeWayIds.push(leaf.id);
                    keepGoing = true;
                }
            }

            parents = vgraph.parentWays(vertex);

            if (parents.length < 2) {     // vertex is no longer a key vertex
                if (vertexIds.indexOf(vertexId) !== -1) {
                    vertexIds.splice(vertexIds.indexOf(vertexId), 1);   // stop checking this one
                }
                removeVertexIds.push(vertexId);
                keepGoing = true;
            }

            if (parents.length < 1) {     // vertex is no longer attached to anything
                vgraph = vgraph.remove(vertex);
            }

        }
    } while (keepGoing);


    vertices = vertices
        .filter(function(vertex) { return removeVertexIds.indexOf(vertex.id) === -1; })
        .map(function(vertex) { return vgraph.entity(vertex.id); });
    ways = ways
        .filter(function(way) { return removeWayIds.indexOf(way.id) === -1; })
        .map(function(way) { return vgraph.entity(way.id); });


    // OK!  Here is our intersection..
    const intersection = {
        graph: vgraph,
        actions: actions,
        vertices: vertices,
        ways: ways,
    };



    // Get all the valid turns through this intersection given a starting way id.
    // This operates on the virtual graph for everything.
    //
    // Basically, walk through all possible paths from starting way,
    //   honoring the existing turn restrictions as we go (watch out for loops!)
    //
    // For each path found, generate and return a `osmTurn` datastructure.
    //
    intersection.turns = function(fromWayId, maxViaWay) {
        if (!fromWayId) return [];
        if (!maxViaWay) maxViaWay = 0;

        const vgraph = intersection.graph;
        const keyVertexIds = intersection.vertices.map(function(v) { return v.id; });

        const start = vgraph.entity(fromWayId);
        if (!start || !(start.__from || start.__via)) return [];

        // maxViaWay=0   from-*-to              (0 vias)
        // maxViaWay=1   from-*-via-*-to        (1 via max)
        // maxViaWay=2   from-*-via-*-via-*-to  (2 vias max)
        const maxPathLength = (maxViaWay * 2) + 3;
        const turns = [];

        step(start);
        return turns;


        // traverse the intersection graph and find all the valid paths
        function step(entity, currPath, currRestrictions, matchedRestriction) {
            currPath = (currPath || []).slice();  // shallow copy
            if (currPath.length >= maxPathLength) return;
            currPath.push(entity.id);
            currRestrictions = (currRestrictions || []).slice();  // shallow copy

            if (entity.type === 'node') {
                stepNode(entity, currPath, currRestrictions);
            } else {  // entity.type === 'way'
                stepWay(entity, currPath, currRestrictions, matchedRestriction);
            }
        }

        function stepNode(entity, currPath, currRestrictions) {
            let i, j;
            const parents = vgraph.parentWays(entity);
            const nextWays = [];

            // which ways can we step into?
            for (i = 0; i < parents.length; i++) {
                const way = parents[i];

                // if next way is a oneway incoming to this vertex, skip
                if (way.__oneWay && way.nodes[0] !== entity.id) continue;

                // if we have seen it before (allowing for an initial u-turn), skip
                if (currPath.indexOf(way.id) !== -1 && currPath.length >= 3) continue;

                // Check all "current" restrictions (where we've already walked the `FROM`)
                let restrict = null;
                for (j = 0; j < currRestrictions.length; j++) {
                    const restriction = currRestrictions[j];
                    const f = restriction.memberByRole('from');
                    const v = restriction.membersByRole('via');
                    const t = restriction.memberByRole('to');
                    const isNo = /^no_/.test(restriction.tags.restriction);
                    const isOnly = /^only_/.test(restriction.tags.restriction);

                    if (!(isNo || isOnly)) {
                        continue; // skip unsupported restriction values
                    }

                    // Does the current path match this turn restriction?
                    const matchesFrom = (f.id === fromWayId);
                    let matchesViaTo = false;
                    let isAlongOnlyPath = false;

                    if (t.id === way.id) {     // match TO

                        if (v.length === 1 && v[0].type === 'node') {    // match VIA node
                            matchesViaTo = (v[0].id === entity.id && (
                                (matchesFrom && currPath.length === 2) ||
                                (!matchesFrom && currPath.length > 2)
                            ));

                        } else {                                         // match all VIA ways
                            const pathVias = [];
                            for (k = 2; k < currPath.length; k +=2 ) {   // k = 2 skips FROM
                                pathVias.push(currPath[k]);              // (path goes way-node-way...)
                            }
                            const restrictionVias = [];
                            for (k = 0; k < v.length; k++) {
                                if (v[k].type === 'way') {
                                    restrictionVias.push(v[k].id);
                                }
                            }
                            const diff = utilArrayDifference(pathVias, restrictionVias);
                            matchesViaTo = !diff.length;
                        }

                    } else if (isOnly) {
                        for (k = 0; k < v.length; k++) {
                            // way doesn't match TO, but is one of the via ways along the path of an "only"
                            if (v[k].type === 'way' && v[k].id === way.id) {
                                isAlongOnlyPath = true;
                                break;
                            }
                        }
                    }

                    if (matchesViaTo) {
                        if (isOnly) {
                            restrict = { id: restriction.id, direct: matchesFrom, from: f.id, only: true, end: true };
                        } else {
                            restrict = { id: restriction.id, direct: matchesFrom, from: f.id, no: true, end: true };
                        }
                    } else {    // indirect - caused by a different nearby restriction
                        if (isAlongOnlyPath) {
                            restrict = { id: restriction.id, direct: false, from: f.id, only: true, end: false };
                        } else if (isOnly) {
                            restrict = { id: restriction.id, direct: false, from: f.id, no: true, end: true };
                        }
                    }

                    // stop looking if we find a "direct" restriction (matching FROM, VIA, TO)
                    if (restrict && restrict.direct) break;
                }

                nextWays.push({ way: way, restrict: restrict });
            }

            nextWays.forEach(function(nextWay) {
                step(nextWay.way, currPath, currRestrictions, nextWay.restrict);
            });
        }

        function stepWay(entity, currPath, currRestrictions, matchedRestriction) {
            let i;
            if (currPath.length >= 3) {     // this is a "complete" path..
                let turnPath = currPath.slice();   // shallow copy

                // an indirect restriction - only include the partial path (starting at FROM)
                if (matchedRestriction && matchedRestriction.direct === false) {
                    for (i = 0; i < turnPath.length; i++) {
                        if (turnPath[i] === matchedRestriction.from) {
                            turnPath = turnPath.slice(i);
                            break;
                        }
                    }
                }

                const turn = pathToTurn(turnPath);
                if (turn) {
                    if (matchedRestriction) {
                        turn.restrictionID = matchedRestriction.id;
                        turn.no = matchedRestriction.no;
                        turn.only = matchedRestriction.only;
                        turn.direct = matchedRestriction.direct;
                    }
                    turns.push(osmTurn(turn));
                }

                if (currPath[0] === currPath[2]) return;   // if we made a u-turn - stop here
            }

            if (matchedRestriction && matchedRestriction.end) return;  // don't advance any further

            // which nodes can we step into?
            const n1 = vgraph.entity(entity.first());
            const n2 = vgraph.entity(entity.last());
            const dist = geoSphericalDistance(n1.loc, n2.loc);
            const nextNodes = [];

            if (currPath.length > 1) {
                if (dist > maxDistance) return;   // the next node is too far
                if (!entity.__via) return;        // this way is a leaf / can't be a via
            }

            if (!entity.__oneWay &&                     // bidirectional..
                keyVertexIds.indexOf(n1.id) !== -1 &&   // key vertex..
                currPath.indexOf(n1.id) === -1) {       // haven't seen it yet..
                nextNodes.push(n1);                     // can advance to first node
            }
            if (keyVertexIds.indexOf(n2.id) !== -1 &&   // key vertex..
                currPath.indexOf(n2.id) === -1) {       // haven't seen it yet..
                nextNodes.push(n2);                     // can advance to last node
            }

            nextNodes.forEach(function(nextNode) {
                // gather restrictions FROM this way
                const fromRestrictions = vgraph.parentRelations(entity).filter(function(r) {
                    if (!r.isRestriction()) return false;

                    const f = r.memberByRole('from');
                    if (!f || f.id !== entity.id) return false;

                    const isOnly = /^only_/.test(r.tags.restriction);
                    if (!isOnly) return true;

                    // `only_` restrictions only matter along the direction of the VIA - #4849
                    let isOnlyVia = false;
                    const v = r.membersByRole('via');
                    if (v.length === 1 && v[0].type === 'node') {   // via node
                        isOnlyVia = (v[0].id === nextNode.id);
                    } else {                                        // via way(s)
                        for (let i = 0; i < v.length; i++) {
                            if (v[i].type !== 'way') continue;
                            const viaWay = vgraph.entity(v[i].id);
                            if (viaWay.first() === nextNode.id || viaWay.last() === nextNode.id) {
                                isOnlyVia = true;
                                break;
                            }
                        }
                    }
                    return isOnlyVia;
                });

                step(nextNode, currPath, currRestrictions.concat(fromRestrictions), false);
            });
        }


        // assumes path is alternating way-node-way of odd length
        function pathToTurn(path) {
            if (path.length < 3) return;
            let fromNodeId, fromVertexId;
            let toNodeId, toVertexId;
            let viaWayIds, viaNodeId, isUturn;

            const fromWayId = path[0];
            const toWayId = path[path.length - 1];

            if (path.length === 3 && fromWayId === toWayId) {  // u turn
                const way = vgraph.entity(fromWayId);
                if (way.__oneWay) return null;

                isUturn = true;
                viaNodeId = fromVertexId = toVertexId = path[1];
                fromNodeId = toNodeId = adjacentNode(fromWayId, viaNodeId);

            } else {
                isUturn = false;
                fromVertexId = path[1];
                fromNodeId = adjacentNode(fromWayId, fromVertexId);
                toVertexId = path[path.length - 2];
                toNodeId = adjacentNode(toWayId, toVertexId);

                if (path.length === 3) {
                    viaNodeId = path[1];
                } else {
                    viaWayIds = path.filter(function(entityId) { return entityId[0] === 'w'; });
                    viaWayIds = viaWayIds.slice(1, viaWayIds.length - 1);  // remove first, last
                }
            }

            return {
                key:  path.join('_'),
                path: path,
                from: { node: fromNodeId, way:  fromWayId, vertex: fromVertexId },
                via:  { node: viaNodeId,  ways: viaWayIds },
                to:   { node: toNodeId,   way:  toWayId, vertex: toVertexId },
                u:    isUturn
            };


            function adjacentNode(wayId, affixId) {
                const nodes = vgraph.entity(wayId).nodes;
                return affixId === nodes[0] ? nodes[1] : nodes[nodes.length - 2];
            }
        }

    };

    return intersection;
}


export function osmInferRestriction(graph, turn, projection) {
    const fromWay = graph.entity(turn.from.way);
    const fromNode = graph.entity(turn.from.node);
    const fromVertex = graph.entity(turn.from.vertex);
    const toWay = graph.entity(turn.to.way);
    const toNode = graph.entity(turn.to.node);
    const toVertex = graph.entity(turn.to.vertex);

    const fromOneWay = (fromWay.tags.oneway === 'yes');
    const toOneWay = (toWay.tags.oneway === 'yes');
    let angle = (geoAngle(fromVertex, fromNode, projection) -
                geoAngle(toVertex, toNode, projection)) * 180 / Math.PI;

    while (angle < 0) {
        angle += 360;
    }

    if (fromNode === toNode) {
        return 'no_u_turn';
    }
    if ((angle < 23 || angle > 336) && fromOneWay && toOneWay) {
        return 'no_u_turn';   // wider tolerance for u-turn if both ways are oneway
    }
    if ((angle < 40 || angle > 319) && fromOneWay && toOneWay && turn.from.vertex !== turn.to.vertex) {
        return 'no_u_turn';   // even wider tolerance for u-turn if there is a via way (from !== to)
    }
    if (angle < 158) {
        return 'no_right_turn';
    }
    if (angle > 202) {
        return 'no_left_turn';
    }

    return 'no_straight_on';
}
