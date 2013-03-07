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

    resample: function(points, dx) {
        var o = [];
        for (var i = 0; i < points.length - 1; i++) {
            var a = points[i], b = points[i + 1],
                span = iD.geo.dist(a, b);
            o.push(a);
            // if there is space to fit one or more oneway mark
            // in this segment
            if (span > dx) {
                // the angle from a to b
                var angle = Math.atan2(b[1] - a[1], b[0] - a[0]),
                    to = points[i].slice();
                while (iD.geo.dist(a, to) < (span - dx)) {
                    // a dx-length line segment in that angle
                    to[0] += Math.cos(angle) * dx;
                    to[1] += Math.sin(angle) * dx;
                    o.push(to.slice());
                }
            }
            o.push(b);
        }
        return o;
    },

    LineString: function(projection, graph, dimensions, dx) {
        var cache = {},
            resample = this.resample;

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
                    if (dx) points = resample(points, dx);
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
