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

    LineString: function(projection, graph, dimensions) {
        var cache = {};
        return function(entity) {
            if (cache[entity.id] !== undefined) {
                return cache[entity.id];
            }

            var clip = d3.clip.cohenSutherland()
                .bounds([0, 0, dimensions[0], dimensions[1]]);

            var segments = clip(graph.childNodes(entity).map(function(n) {
                return projection(n.loc);
            }));

            if (segments.length === 0) {
                return (cache[entity.id] = null);
            }

            return (cache[entity.id] =
                segments.map(function(points) {
                    return 'M' + points.map(function(p) {
                        return p[0] + ',' + p[1];
                    }).join('L');
                }).join(''));
        };
    },

    MultipolygonMemberTags: function(graph) {
        return function(entity) {
            var tags = entity.tags;
            graph.parentRelations(entity).forEach(function(relation) {
                if (relation.isMultipolygon()) {
                    tags = _.extend({}, relation.tags, tags);
                }
            });
            return tags;
        };
    }
};
