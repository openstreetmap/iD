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

    LineString: function(projection, graph, dimensions, dx) {
        var cache = {};

        return function(entity) {
            if (cache[entity.id] !== undefined) {
                return cache[entity.id];
            }

            var last,
                next,
                started = false,
                d = '';

            d3.geo.stream({
                type: 'LineString',
                coordinates: graph.childNodes(entity).map(function(n) {
                    return n.loc;
                })
            }, projection.stream({
                lineStart: function() { last = null; started = false; },
                lineEnd: function() { },
                point: function(x, y) {
                    if (!started) d += 'M';
                    next = [Math.floor(x), Math.floor(y)];
                    if (dx && last && iD.geo.dist(last, next) > dx) {
                        var span = iD.geo.dist(last, next),
                            angle = Math.atan2(next[1] - last[1], next[0] - last[0]),
                            to = last.slice();
                        to[0] += Math.cos(angle) * dx;
                        to[1] += Math.sin(angle) * dx;
                        while (iD.geo.dist(last, to) < (span)) {
                            // a dx-length line segment in that angle
                            if (started) d += 'L';
                            d += Math.floor(to[0]) + ',' + Math.floor(to[1]);
                            started = started || true;
                            to[0] += Math.cos(angle) * dx;
                            to[1] += Math.sin(angle) * dx;
                        }
                    }
                    if (started) d += 'L';
                    d += next[0] + ',' + next[1];
                    started = started || true;
                    last = next;
                }
            }));

            if (d === '') {
                cache[entity.id] = null;
                return cache[entity.id];
            } else {
                cache[entity.id] = d;
                return cache[entity.id];
            }
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
