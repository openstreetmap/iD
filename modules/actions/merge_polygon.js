import { geoPolygonContainsPolygon } from '../geo';
import { osmJoinWays, osmRelation } from '../osm';
import { utilArrayGroupBy, utilArrayIntersection, utilObjectOmit } from '../util';


export function actionMergePolygon(ids, newRelationId) {

    function groupEntities(graph) {
        var entities = ids.map(function (id) { return graph.entity(id); });
        var geometryGroups = utilArrayGroupBy(entities, function(entity) {
            if (entity.type === 'way' && entity.isClosed()) {
                return 'closedWay';
            } else if (entity.type === 'relation' && entity.isMultipolygon()) {
                return 'multipolygon';
            } else {
                return 'other';
            }
        });

        return Object.assign(
            { closedWay: [], multipolygon: [], other: [] },
            geometryGroups
        );
    }


    var action = function(graph) {
        var entities = groupEntities(graph);

        // An array representing all the polygons that are part of the multipolygon.
        //
        // Each element is itself an array of objects with an id property, and has a
        // locs property which is an array of the locations forming the polygon.
        var polygons = entities.multipolygon.reduce(function(polygons, m) {
            return polygons.concat(osmJoinWays(m.members, graph));
        }, []).concat(entities.closedWay.map(function(d) {
            var member = [{id: d.id}];
            member.nodes = graph.childNodes(d);
            return member;
        }));

        // contained is an array of arrays of boolean values,
        // where contained[j][k] is true iff the jth way is
        // contained by the kth way.
        var contained = polygons.map(function(w, i) {
            return polygons.map(function(d, n) {
                if (i === n) return null;
                return geoPolygonContainsPolygon(
                    d.nodes.map(function(n) { return n.loc; }),
                    w.nodes.map(function(n) { return n.loc; })
                );
            });
        });

        // Sort all polygons as either outer or inner ways
        var members = [];
        var outer = true;

        while (polygons.length) {
            extractUncontained(polygons);
            polygons = polygons.filter(isContained);
            contained = contained.filter(isContained).map(filterContained);
        }

        function isContained(d, i) {
            return contained[i].some(function(val) { return val; });
        }

        function filterContained(d) {
            return d.filter(isContained);
        }

        function extractUncontained(polygons) {
            polygons.forEach(function(d, i) {
                if (!isContained(d, i)) {
                    d.forEach(function(member) {
                        members.push({
                            type: 'way',
                            id: member.id,
                            role: outer ? 'outer' : 'inner'
                        });
                    });
                }
            });
            outer = !outer;
        }

        // Move all tags to one relation
        var relation = entities.multipolygon[0] ||
            osmRelation({ id: newRelationId, tags: { type: 'multipolygon' }});

        entities.multipolygon.slice(1).forEach(function(m) {
            relation = relation.mergeTags(m.tags);
            graph = graph.remove(m);
        });

        entities.closedWay.forEach(function(way) {
            function isThisOuter(m) {
                return m.id === way.id && m.role !== 'inner';
            }
            if (members.some(isThisOuter)) {
                relation = relation.mergeTags(way.tags);
                graph = graph.replace(way.update({ tags: {} }));
            }
        });

        return graph.replace(relation.update({
            members: members,
            tags: utilObjectOmit(relation.tags, ['area'])
        }));
    };


    action.disabled = function(graph) {
        var entities = groupEntities(graph);
        if (entities.other.length > 0 ||
            entities.closedWay.length + entities.multipolygon.length < 2) {
            return 'not_eligible';
        }
        if (!entities.multipolygon.every(function(r) { return r.isComplete(graph); })) {
            return 'incomplete_relation';
        }

        if (!entities.multipolygon.length) {
            var sharedMultipolygons = [];
            entities.closedWay.forEach(function(way, i) {
                if (i === 0) {
                    sharedMultipolygons = graph.parentMultipolygons(way);
                } else {
                    sharedMultipolygons = utilArrayIntersection(sharedMultipolygons, graph.parentMultipolygons(way));
                }
            });
            sharedMultipolygons = sharedMultipolygons.filter(function(relation) {
                return relation.members.length === entities.closedWay.length;
            });
            if (sharedMultipolygons.length) {
                // don't create a new multipolygon if it'd be redundant
                return 'not_eligible';
            }
        } else if (entities.closedWay.some(function(way) {
                return utilArrayIntersection(graph.parentMultipolygons(way), entities.multipolygon).length;
            })) {
            // don't add a way to a multipolygon again if it's already a member
            return 'not_eligible';
        }
    };


    return action;
}
