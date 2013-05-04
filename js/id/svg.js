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

    Path: function(projection, graph) {
        var cache = {},
            path = d3.geo.path().projection(projection);

        return function(entity) {
            if (entity.id in cache) return cache[entity.id];
            return cache[entity.id] = path(entity.asGeoJSON(graph));
        };
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
                        var segment = 'M' + a[0] + ',' + a[1];

                        var span = iD.geo.dist(a, b),
                            angle = Math.atan2(b[1] - a[1], b[0] - a[0]),
                            dx = dt * Math.cos(angle),
                            dy = dt * Math.sin(angle),
                            p;

                        if (offset < span) {
                            p = [a[0] + offset * Math.cos(angle),
                                 a[1] + offset * Math.sin(angle)];

                            segment += 'L' + p[0] + ',' + p[1];
                        }

                        while ((offset + dt) < span) {
                            offset += dt;
                            p[0] += dx;
                            p[1] += dy;
                            segment += 'L' + p[0] + ',' + p[1];
                        }

                        offset = dt - (span - offset);

                        segment += 'L' + b[0] + ',' + b[1];
                        segments.push({id: entity.id, index: i, d: segment});
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
