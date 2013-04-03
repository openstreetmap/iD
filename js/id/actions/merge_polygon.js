iD.actions.MergePolygon = function(ids) {

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

        // an array of all the polygons to be merged
        var polygons = _.unique(entities.multipolygon.reduce(function(polygons, m) {
            return polygons.concat(m.members.filter(function(d) {
                return d.type === 'way';
            }).map(function(d) {
                return graph.entity(d.id);
            }));
        }, entities.closedWay));

        // contained is an array of arrays of boolean values,
        // where contained[j][k] is true iff the jth way is
        // contained by the kth way.
        var contained = polygons.map(function(w, i) {
            return polygons.map(function(d, n) {
                if (i === n) return null;
                return iD.geo.polygonContainsPolygon(getLocs(d), getLocs(w));
            });
        });

        function getLocs(way) {
            return graph.childNodes(way).map(function(d) { return d.loc; });
        }


        // Sort all polygons as either outer or inner ways
        var members = [];
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
                    members.push({
                        type: 'way',
                        id: d.id,
                        role: outer ? 'outer' : 'inner'
                    });
                }
            });
            outer = !outer;
        }

        // Move all tags to one relation
        var relation = entities.multipolygon[0] ||
            iD.Relation({ tags: { type: 'multipolygon' }});

        entities.multipolygon.slice(1).forEach(function(m) {
            relation = relation.mergeTags(m.tags);
            graph = graph.remove(m);
        });

        members.forEach(function(m) {
            var entity = graph.entity(m.id);
            relation = relation.mergeTags(entity.tags);
            graph = graph.replace(entity.update({ tags: {} }));
        });

        delete relation.tags.area;

        return graph.replace(relation.update({ members: members }));
    };

    action.disabled = function(graph) {
        var entities = groupEntities(graph);
        if (entities.other.length > 0 ||
            entities.closedWay.length + entities.multipolygon.length < 2)
            return 'not_eligible';
    };

    return action;
};
