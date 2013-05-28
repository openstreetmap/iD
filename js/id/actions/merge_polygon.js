iD.actions.MergePolygon = function(ids, newRelationId) {

    function groupEntities(graph) {
        var entities = ids.map(graph.getEntity);
        return _.extend({
                closedWay: [],
                multipolygon: [],
                other: []
            }, _.groupBy(entities, function(entity) {
                if (entity.type === 'way' && entity.isClosed()) {
                    return 'closedWay';
                } else if (entity.type === 'relation' && entity.isMultipolygon()) {
                    return 'multipolygon';
                } else {
                    return 'other';
                }
            }));
    }

    var action = function(graph) {
        var entities = groupEntities(graph);

        // An array of objects representing all the polygons that are part of the multipolygon.
        //
        // Each object has two properties:
        //     ids - an array of ids of entities that are part of that polygon
        //     locs - an array of the locations forming the polygon
        var polygons = entities.multipolygon.reduce(function(polygons, m) {
            return polygons.concat(m.joinMemberWays(null, graph));
        }, []).concat(entities.closedWay.map(function(d) {
            return {
                ids: [d.id],
                locs: graph.childNodes(d).map(function(n) { return n.loc; })
            };
        }));

        // contained is an array of arrays of boolean values,
        // where contained[j][k] is true iff the jth way is
        // contained by the kth way.
        var contained = polygons.map(function(w, i) {
            return polygons.map(function(d, n) {
                if (i === n) return null;
                return iD.geo.polygonContainsPolygon(d.locs, w.locs);
            });
        });

        // Sort all polygons as either outer or inner ways
        var members = [],
            outer = true;

        while (polygons.length) {
            extractUncontained(polygons);
            polygons = polygons.filter(isContained);
            contained = contained.filter(isContained).map(filterContained);
        }

        function isContained(d, i) {
            return _.any(contained[i]);
        }

        function filterContained(d, i) {
            return d.filter(isContained);
        }

        function extractUncontained(polygons) {
            polygons.forEach(function(d, i) {
                if (!isContained(d, i)) {
                    d.ids.forEach(function(id) {
                        members.push({
                            type: 'way',
                            id: id,
                            role: outer ? 'outer' : 'inner'
                        });
                    });
                }
            });
            outer = !outer;
        }

        // Move all tags to one relation
        var relation = entities.multipolygon[0] ||
            iD.Relation({ id: newRelationId, tags: { type: 'multipolygon' }});

        entities.multipolygon.slice(1).forEach(function(m) {
            relation = relation.mergeTags(m.tags);
            graph = graph.remove(m);
        });

        members.forEach(function(m) {
            var entity = graph.entity(m.id);
            relation = relation.mergeTags(entity.tags);
            graph = graph.replace(entity.update({ tags: {} }));
        });

        return graph.replace(relation.update({
            members: members,
            tags: _.omit(relation.tags, 'area')
        }));
    };

    action.disabled = function(graph) {
        var entities = groupEntities(graph);
        if (entities.other.length > 0 ||
            entities.closedWay.length + entities.multipolygon.length < 2)
            return 'not_eligible';
    };

    return action;
};
