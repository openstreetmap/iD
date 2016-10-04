export function svgPointTransform(projection) {
    return function(entity) {
        // http://jsperf.com/short-array-join
        var pt = projection(entity.loc);
        return 'translate(' + pt[0] + ',' + pt[1] + ')';
    };
}
