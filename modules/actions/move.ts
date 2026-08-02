import type { coreGraph } from '../core';
import type { Action } from '../core/history';
import {
    geoAngle,
    geoChooseEdge,
    geoPathIntersections,
    geoPathLength,
    geoVecAdd,
    geoVecEqual,
    geoVecInterp,
    geoVecSubtract,
} from '../geo';
import type { Projection } from '../geo/raw_mercator';
import type { EntityId, osmWay, NodeId, WayId } from '../osm';

import { osmNode } from '../osm/node';
import { utilArrayIntersection } from '../util';
import type { Vec2 } from '../geo/vector';

export interface Intersection {
    nodeId: NodeId;
    movedId: WayId;
    unmovedId: WayId;
    movedIsEP: boolean;
    unmovedIsEP: boolean;
}

export interface Cache {
    moving: Record<EntityId, unknown>;
    nodes: NodeId[];
    ways: WayId[];
    startLoc: Record<NodeId, Vec2>;
    intersections: Intersection[];
    ok: boolean;
    replacedVertex: {
        [key: string]: osmNode;
    };
}

export interface ActionMove extends Action {
    delta(): Vec2;
}

// https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/MoveCommand.java
// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MoveNodeAction.as
export function actionMove(
    moveIDs: EntityId[],
    tryDelta: Vec2,
    projection: Projection,
    cache: Cache,
): ActionMove {
    let _delta = tryDelta;

    function setupCache(graph: coreGraph) {
        function canMove(nodeID: EntityId) {
            // Allow movement of any node that is in the selectedIDs list..
            if (moveIDs.indexOf(nodeID) !== -1) return true;

            // Allow movement of a vertex where 2 ways meet..
            const parents = graph.parentWays(graph.entity(nodeID));
            if (parents.length < 3) return true;

            // Restrict movement of a vertex where >2 ways meet, unless all parentWays are moving too..
            const parentsMoving = parents.every(function (way) {
                return cache.moving[way.id];
            });
            if (!parentsMoving) delete cache.moving[nodeID];

            return parentsMoving;
        }

        function cacheEntities(ids: EntityId[]) {
            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];
                if (cache.moving[id]) continue;
                cache.moving[id] = true;

                const entity = graph.hasEntity(id);
                if (!entity) continue;

                if (entity.type === 'node') {
                    cache.nodes.push(entity.id);
                    cache.startLoc[entity.id] = entity.loc;
                } else if (entity.type === 'way') {
                    cache.ways.push(entity.id);
                    cacheEntities(entity.nodes);
                } else {
                    cacheEntities(
                        entity.members.map(function (member) {
                            return member.id;
                        }),
                    );
                }
            }
        }

        function cacheIntersections(ids: WayId[]) {
            function isEndpoint(way: osmWay, id: NodeId) {
                return !way.isClosed() && !!way.affix(id);
            }

            for (let i = 0; i < ids.length; i++) {
                const id = ids[i];

                // consider only intersections with 1 moved and 1 unmoved way.
                const childNodes = graph.childNodes(graph.entity(id));
                for (let j = 0; j < childNodes.length; j++) {
                    const node = childNodes[j];
                    const parents = graph.parentWays(node);
                    if (parents.length !== 2) continue;

                    const moved = graph.entity(id);
                    let unmoved = null;
                    for (let k = 0; k < parents.length; k++) {
                        const way = parents[k];
                        if (!cache.moving[way.id]) {
                            unmoved = way;
                            break;
                        }
                    }
                    if (!unmoved) continue;

                    // exclude ways that are overly connected..
                    if (utilArrayIntersection(moved.nodes, unmoved.nodes).length > 2) continue;
                    if (moved.isArea() || unmoved.isArea()) continue;

                    cache.intersections.push({
                        nodeId: node.id,
                        movedId: moved.id,
                        unmovedId: unmoved.id,
                        movedIsEP: isEndpoint(moved, node.id),
                        unmovedIsEP: isEndpoint(unmoved, node.id),
                    });
                }
            }
        }

        if (!cache) {
            cache = {} as Cache;
        }
        if (!cache.ok) {
            cache.moving = {};
            cache.intersections = [];
            cache.replacedVertex = {};
            cache.startLoc = {};
            cache.nodes = [];
            cache.ways = [];

            cacheEntities(moveIDs);
            cacheIntersections(cache.ways);
            cache.nodes = cache.nodes.filter(canMove);

            cache.ok = true;
        }
    }

    // Place a vertex where the moved vertex used to be, to preserve way shape..
    //
    //  Start:
    //      b ---- e
    //     / \
    //    /   \
    //   /     \
    //  a       c
    //
    //      *               node '*' added to preserve shape
    //     / \
    //    /   b ---- e      way `b,e` moved here:
    //   /     \
    //  a       c
    //
    //
    function replaceMovedVertex(
        nodeId: NodeId,
        wayId: WayId,
        graph: coreGraph,
        delta: Vec2 | null,
    ) {
        let way = graph.entity(wayId);
        const moved = graph.entity(nodeId);
        const movedIndex = way.nodes.indexOf(nodeId);
        let len, prevIndex, nextIndex;

        if (way.isClosed()) {
            len = way.nodes.length - 1;
            prevIndex = (movedIndex + len - 1) % len;
            nextIndex = (movedIndex + len + 1) % len;
        } else {
            len = way.nodes.length;
            prevIndex = movedIndex - 1;
            nextIndex = movedIndex + 1;
        }

        const prev = graph.hasEntity(way.nodes[prevIndex]);
        const next = graph.hasEntity(way.nodes[nextIndex]);

        // Don't add orig vertex at endpoint..
        if (!prev || !next) return graph;

        const key = wayId + '_' + nodeId;
        let orig = cache.replacedVertex[key];
        if (!orig) {
            orig = new osmNode();
            cache.replacedVertex[key] = orig;
            cache.startLoc[orig.id] = cache.startLoc[nodeId];
        }

        let start, end;
        if (delta) {
            start = projection(cache.startLoc[nodeId]);
            end = projection.invert(geoVecAdd(start, delta));
        } else {
            end = cache.startLoc[nodeId];
        }
        orig = orig.move(end);

        const angle =
            (Math.abs(geoAngle(orig, prev, projection) - geoAngle(orig, next, projection)) * 180) /
            Math.PI;

        // Don't add orig vertex if it would just make a straight line..
        if (angle > 175 && angle < 185) return graph;

        // moving forward or backward along way?
        const p1: Vec2[] = [prev.loc, orig.loc, moved.loc, next.loc].map(projection);
        const p2: Vec2[] = [prev.loc, moved.loc, orig.loc, next.loc].map(projection);
        const d1 = geoPathLength(p1);
        const d2 = geoPathLength(p2);
        let insertAt = d1 <= d2 ? movedIndex : nextIndex;

        // moving around closed loop?
        if (way.isClosed() && insertAt === 0) insertAt = len;

        way = way.addNode(orig.id, insertAt);
        return graph.replace(orig).replace(way);
    }

    // Remove duplicate vertex that might have been added by
    // replaceMovedVertex.  This is done after the unzorro checks.
    function removeDuplicateVertices(wayId: WayId, graph: coreGraph) {
        let way = graph.entity(wayId);
        const epsilon = 1e-6;
        let prev: osmNode | undefined;
        let curr: osmNode | undefined;

        function isInteresting(node: osmNode, graph: coreGraph) {
            return (
                graph.parentWays(node).length > 1 ||
                graph.parentRelations(node).length ||
                node.hasInterestingTags()
            );
        }

        for (let i = 0; i < way.nodes.length; i++) {
            curr = graph.entity(way.nodes[i]);

            if (prev && curr && geoVecEqual(prev.loc, curr.loc, epsilon)) {
                if (!isInteresting(prev, graph)) {
                    way = way.removeNode(prev.id);
                    graph = graph.replace(way).remove(prev);
                } else if (!isInteresting(curr, graph)) {
                    way = way.removeNode(curr.id);
                    graph = graph.replace(way).remove(curr);
                }
            }

            prev = curr;
        }

        return graph;
    }

    // Reorder nodes around intersections that have moved..
    //
    //  Start:                way1.nodes: b,e         (moving)
    //  a - b - c ----- d     way2.nodes: a,b,c,d     (static)
    //      |                 vertex: b
    //      e                 isEP1: true,  isEP2, false
    //
    //  way1 `b,e` moved here:
    //  a ----- c = b - d
    //              |
    //              e
    //
    //  reorder nodes         way1.nodes: b,e
    //  a ----- c - b - d     way2.nodes: a,c,b,d
    //              |
    //              e
    //
    function unZorroIntersection(intersection: Intersection, graph: coreGraph) {
        const vertex = graph.entity(intersection.nodeId);
        let way1 = graph.entity(intersection.movedId);
        let way2 = graph.entity(intersection.unmovedId);
        const isEP1 = intersection.movedIsEP;
        const isEP2 = intersection.unmovedIsEP;

        // don't move the vertex if it is the endpoint of both ways.
        if (isEP1 && isEP2) return graph;

        const nodes1 = graph.childNodes(way1).filter(function (n) {
            return n !== vertex;
        });
        const nodes2 = graph.childNodes(way2).filter(function (n) {
            return n !== vertex;
        });

        if (way1.isClosed() && way1.first() === vertex.id) nodes1.push(nodes1[0]);
        if (way2.isClosed() && way2.first() === vertex.id) nodes2.push(nodes2[0]);

        let edge1 = isEP1 ? undefined : geoChooseEdge(nodes1, projection(vertex.loc), projection);
        let edge2 = isEP2 ? undefined : geoChooseEdge(nodes2, projection(vertex.loc), projection);
        let loc;

        // snap vertex to nearest edge (or some point between them)..
        if (!isEP1 && !isEP2) {
            const epsilon = 1e-6,
                maxIter = 10;
            for (let i = 0; i < maxIter; i++) {
                loc = geoVecInterp(edge1!.loc!, edge2!.loc!, 0.5);
                edge1 = geoChooseEdge(nodes1, projection(loc), projection);
                edge2 = geoChooseEdge(nodes2, projection(loc), projection);
                if (Math.abs(edge1!.distance - edge2!.distance) < epsilon) break;
            }
        } else if (!isEP1) {
            loc = edge1!.loc;
        } else {
            loc = edge2!.loc;
        }

        graph = graph.replace(vertex.move(loc!));

        // if zorro happened, reorder nodes..
        if (!isEP1 && edge1!.index !== way1.nodes.indexOf(vertex.id)) {
            way1 = way1.removeNode(vertex.id).addNode(vertex.id, edge1!.index);
            graph = graph.replace(way1);
        }
        if (!isEP2 && edge2!.index !== way2.nodes.indexOf(vertex.id)) {
            way2 = way2.removeNode(vertex.id).addNode(vertex.id, edge2!.index);
            graph = graph.replace(way2);
        }

        return graph;
    }

    function cleanupIntersections(graph: coreGraph) {
        for (let i = 0; i < cache.intersections.length; i++) {
            const obj = cache.intersections[i];
            graph = replaceMovedVertex(obj.nodeId, obj.movedId, graph, _delta);
            graph = replaceMovedVertex(obj.nodeId, obj.unmovedId, graph, null);
            graph = unZorroIntersection(obj, graph);
            graph = removeDuplicateVertices(obj.movedId, graph);
            graph = removeDuplicateVertices(obj.unmovedId, graph);
        }

        return graph;
    }

    // check if moving way endpoint can cross an unmoved way, if so limit delta..
    function limitDelta(graph: coreGraph) {
        function moveNode(loc: Vec2) {
            return geoVecAdd(projection(loc), _delta);
        }

        for (let i = 0; i < cache.intersections.length; i++) {
            const obj = cache.intersections[i];

            // Don't limit movement if this is vertex joins 2 endpoints..
            if (obj.movedIsEP && obj.unmovedIsEP) continue;
            // Don't limit movement if this vertex is not an endpoint anyway..
            if (!obj.movedIsEP) continue;

            const node = graph.entity(obj.nodeId);
            const start = projection(node.loc);
            const end = geoVecAdd(start, _delta);
            const movedNodes = graph.childNodes(graph.entity(obj.movedId));
            const movedPath = movedNodes.map(function (n) {
                return moveNode(n.loc);
            });
            const unmovedNodes = graph.childNodes(graph.entity(obj.unmovedId));
            const unmovedPath = unmovedNodes.map(function (n) {
                return projection(n.loc);
            });
            const hits = geoPathIntersections(movedPath, unmovedPath);

            if (hits.length) {
                // snap delta back to the edge we are attached to, so we only move along the edge,
                // not away from it since that causes intersection(s)
                const edge = geoChooseEdge(unmovedNodes, end, projection);
                _delta = geoVecSubtract(projection(edge!.loc!), start);
                break; // any further attempts/intersections will result in the same calculation
            }
        }
    }

    const action: ActionMove = function (graph) {
        if (_delta[0] === 0 && _delta[1] === 0) return graph;

        setupCache(graph);

        if (cache.intersections.length) {
            limitDelta(graph);
        }

        for (let i = 0; i < cache.nodes.length; i++) {
            const node = graph.entity<osmNode>(cache.nodes[i]);
            const start = projection(node.loc);
            const end = geoVecAdd(start, _delta);
            graph = graph.replace(node.move(projection.invert(end)));
        }

        if (cache.intersections.length) {
            graph = cleanupIntersections(graph);
        }

        return graph;
    };

    action.delta = function () {
        return _delta;
    };

    return action;
}
