iD.svg = {
    RoundProjection: function(projection) {
        return function(d) {
            return iD.geo.roundCoords(projection(d));
        };
    },

    PointTransform: function(projection) {
        return function(entity) {
            return 'translate(' + projection(entity.loc) + ')';
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
                    return projection(n.loc);
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
        }
    }
};
