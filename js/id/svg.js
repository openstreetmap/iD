iD.svg = {
    RoundProjection: function (projection) {
        return function (d) {
            return iD.util.geo.roundCoords(projection(d));
        };
    },

    PointTransform: function (projection) {
        return function (entity) {
            return 'translate(' + projection(entity.loc) + ')';
        };
    },

    LineString: function (projection) {
        var cache = {};
        return function (entity) {
            if (cache[entity.id] !== undefined) {
                return cache[entity.id];
            }

            if (entity.nodes.length === 0) {
                return (cache[entity.id] = null);
            }

            return (cache[entity.id] =
                'M' + entity.nodes.map(function (n) { return projection(n.loc); }).join('L'));
        }
    }
};
