import type { coreGraph } from '../core';
import type { Action } from '../core/history';
import { geoPolygonContainsPolygon } from '../geo';
import { osmJoinWays, osmRelation, osmWayOnlyTags, type EntityId, type osmWay } from '../osm';
import type { Sequence } from '../osm/multipolygon';
import type { RelationMember } from '../osm/relation';
import { utilArrayGroupBy, utilArrayIntersection, utilObjectOmit, utilOldestID } from '../util';

export function actionMergePolygon(ids: EntityId[], newRelationId?: EntityId): Action {
    function groupEntities(graph: coreGraph): {
        closedWay: osmWay[];
        multipolygon: osmRelation[];
        other: (osmWay | osmRelation)[];
    } {
        const entities = ids.map(function (id) {
            return graph.entity(id);
        });
        const geometryGroups = utilArrayGroupBy(entities, function (entity) {
            if (entity.type === 'way' && entity.isClosed()) {
                return 'closedWay';
            } else if (entity.type === 'relation' && entity.isMultipolygon()) {
                return 'multipolygon';
            } else {
                return 'other';
            }
        });

        return Object.assign({ closedWay: [], multipolygon: [], other: [] }, geometryGroups);
    }

    const action: Action = function (graph) {
        const entities = groupEntities(graph);

        // An array representing all the polygons that are part of the multipolygon.
        //
        // Each element is itself an array of objects with an id property, and has a
        // locs property which is an array of the locations forming the polygon.
        let polygons = entities.multipolygon
            .reduce<Sequence<RelationMember>[]>(function (polygons, m) {
                return polygons.concat(osmJoinWays(m.members, graph));
            }, [])
            .concat(
                entities.closedWay.map(function (d) {
                    const member = [{ id: d.id }] as Sequence<RelationMember>;
                    member.nodes = graph.childNodes(d);
                    return member;
                }),
            );

        // contained is an array of arrays of boolean values,
        // where contained[j][k] is true iff the jth way is
        // contained by the kth way.
        let contained = polygons.map(function (w, i) {
            return polygons.map(function (d, n) {
                if (i === n) return null;
                return geoPolygonContainsPolygon(
                    d.nodes.map(function (n) {
                        return n.loc;
                    }),
                    w.nodes.map(function (n) {
                        return n.loc;
                    }),
                );
            });
        });

        // Sort all polygons as either outer or inner ways
        const members: RelationMember[] = [];
        let outer = true;

        while (polygons.length) {
            extractUncontained(polygons);
            polygons = polygons.filter(isContained);
            contained = contained.filter(isContained).map(filterContained);
        }

        function isContained(d: unknown, i: number) {
            return contained[i].some(function (val) {
                return val;
            });
        }

        function filterContained<T>(d: T[]): T[] {
            return d.filter(isContained);
        }

        function extractUncontained(polygons: RelationMember[][]) {
            polygons.forEach(function (d, i) {
                if (!isContained(d, i)) {
                    d.forEach(function (member) {
                        members.push({
                            type: 'way',
                            id: member.id,
                            role: outer ? 'outer' : 'inner',
                        });
                    });
                }
            });
            outer = !outer;
        }

        // Move all tags to one relation.
        // Keep the oldest multipolygon alive if it exists.
        let relation: osmRelation;
        if (entities.multipolygon.length > 0) {
            const oldestID = utilOldestID(entities.multipolygon.map((entity) => entity.id));
            relation = entities.multipolygon.find((entity) => entity.id === oldestID)!;
        } else {
            relation = new osmRelation({ id: newRelationId, tags: { type: 'multipolygon' } });
        }

        entities.multipolygon.forEach(function (m) {
            if (m.id !== relation.id) {
                relation = relation.mergeTags(m.tags);
                graph = graph.remove(m);
            }
        });

        entities.closedWay.forEach(function (way) {
            function isThisOuter(m: RelationMember) {
                return m.id === way.id && m.role !== 'inner';
            }
            if (members.some(isThisOuter)) {
                //filter out tags that shouldn't be moved to the multipolygon relation
                const areaTags = { ...way.tags };
                const lineTags: Tags = {};
                for (const key in areaTags) {
                    if (osmWayOnlyTags[key] && osmWayOnlyTags[key][areaTags[key]]) {
                        lineTags[key] = areaTags[key];
                        delete areaTags[key];
                    }
                }
                relation = relation.mergeTags(areaTags);
                graph = graph.replace(way.update({ tags: lineTags }));
            }
        });

        return graph.replace(
            relation.update({
                members: members,
                tags: utilObjectOmit(relation.tags, ['area']),
            }),
        );
    };

    action.disabled = function (graph) {
        const entities = groupEntities(graph);
        if (
            entities.other.length > 0 ||
            entities.closedWay.length + entities.multipolygon.length < 2
        ) {
            return 'not_eligible';
        }
        if (
            !entities.multipolygon.every(function (r) {
                return r.isComplete(graph);
            })
        ) {
            return 'incomplete_relation';
        }

        if (!entities.multipolygon.length) {
            let sharedMultipolygons: osmRelation[] = [];
            entities.closedWay.forEach(function (way, i) {
                if (i === 0) {
                    sharedMultipolygons = graph.parentMultipolygons(way);
                } else {
                    sharedMultipolygons = utilArrayIntersection(
                        sharedMultipolygons,
                        graph.parentMultipolygons(way),
                    );
                }
            });
            sharedMultipolygons = sharedMultipolygons.filter(function (relation) {
                return relation.members.length === entities.closedWay.length;
            });
            if (sharedMultipolygons.length) {
                // don't create a new multipolygon if it'd be redundant
                return 'not_eligible';
            }
        } else if (
            entities.closedWay.some(function (way) {
                return utilArrayIntersection(graph.parentMultipolygons(way), entities.multipolygon)
                    .length;
            })
        ) {
            // don't add a way to a multipolygon again if it's already a member
            return 'not_eligible';
        }
    };

    return action;
}
