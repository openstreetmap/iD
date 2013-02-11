iD.svg = {
    RoundProjection: function(projection) {
        return function(d) {
            return iD.geo.roundCoords(projection(d));
        };
    },

    PointTransform: function(projection) {
        return function(entity) {
            // http://jsperf.com/short-array-join
            var pt = projection(entity.loc);
            return 'translate(' + pt[0] + ',' + pt[1] + ')';
        };
    },

    LineString: function(projection, graph) {
        var cache = {};
        return function(entity) {
            if (cache[entity.id] !== undefined) {
                return cache[entity.id];
            }

            if (entity.nodes.length === 0) {
                return (cache[entity.id] = null);
            }

            return (cache[entity.id] =
                'M' + graph.childNodes(entity).map(function(n) {
                    var pt = projection(n.loc);
                    return pt[0] + ',' + pt[1];
                }).join('L'));
        };
    },

    MultipolygonMemberTags: function (graph) {
        return function (entity) {
            var tags = entity.tags;
            graph.parentRelations(entity).forEach(function (relation) {
                if (relation.isMultipolygon()) {
                    tags = _.extend({}, relation.tags, tags);
                }
            });
            return tags;
        };
    }
};
