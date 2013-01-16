iD.svg = {
    RoundProjection: function (projection) {
        return function (d) {
            return iD.util.geo.roundCoords(projection(d));
        };
    },

    PointTransform: function (projection) {
        projection = iD.svg.RoundProjection(projection);
        return function (entity) {
            return 'translate(' + projection(entity.loc) + ')';
        };
    }
};
