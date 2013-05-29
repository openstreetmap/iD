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

    Path: function(projection, graph, polygon) {
        var cache = {},
            path = d3.geo.path().projection(projection);

        function result(entity) {
            if (entity.id in cache) return cache[entity.id];

            var buffer = '';

            path.context({
                beginPath: function() {},
                moveTo: function(x, y) { buffer += 'M' + Math.floor(x) + ',' + Math.floor(y); },
                lineTo: function(x, y) { buffer += 'L' + Math.floor(x) + ',' + Math.floor(y); },
                arc: function() {},
                closePath: function() { buffer += 'Z'; }
            });

            path(entity.asGeoJSON(graph, polygon));

            return cache[entity.id] = buffer;
        }

        return result;
    },

    OneWaySegments: function(projection, graph, dt) {
        return function(entity) {
            var a,
                b,
                i = 0,
                offset = dt,
                segments = [],
                coordinates = graph.childNodes(entity).map(function(n) {
                    return n.loc;
                });

            if (entity.tags.oneway === '-1') coordinates.reverse();

            d3.geo.stream({
                type: 'LineString',
                coordinates: coordinates
            }, projection.stream({
                lineStart: function() {},
                lineEnd: function() {},
                point: function(x, y) {
                    b = [x, y];

                    if (a) {
                        var span = iD.geo.dist(a, b) - offset;

                        if (span >= 0) {
                            var angle = Math.atan2(b[1] - a[1], b[0] - a[0]),
                                dx = dt * Math.cos(angle),
                                dy = dt * Math.sin(angle),
                                p = [a[0] + offset * Math.cos(angle),
                                     a[1] + offset * Math.sin(angle)];

                            var segment = 'M' + a[0] + ',' + a[1] +
                                          'L' + p[0] + ',' + p[1];

                            for (span -= dt; span >= 0; span -= dt) {
                                p[0] += dx;
                                p[1] += dy;
                                segment += 'L' + p[0] + ',' + p[1];
                            }

                            segment += 'L' + b[0] + ',' + b[1];
                            segments.push({id: entity.id, index: i, d: segment});
                        }

                        offset = -span;
                        i++;
                    }

                    a = b;
                }
            }));

            return segments;
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
