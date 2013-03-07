iD.svg = {
    RoundProjection: function(projection) {
        return function(d) {
            return iD.geo.roundCoords(projection(d));
        };
    },

    resample: function resample(dx) {
        return function() {
            var line = d3.svg.line();
            var path = this,
                l = path.getTotalLength(),
                t = [0], i = 0, dt = dx / l;
            while ((i += dt) < 1) t.push(i);
            t.push(1);
            return line(t.map(function(t) {
                var p = path.getPointAtLength(t * l);
                return [p.x, p.y];
            }));
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
                cache[entity.id] = null;
                return cache[entity.id];
            }

            cache[entity.id] =
                segments.map(function(points) {
                    return 'M' + points.map(function(p) {
                        return p[0] + ',' + p[1];
                    }).join('L');
                }).join('');

            return cache[entity.id];
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
