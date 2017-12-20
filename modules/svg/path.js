import {
    geoIdentity as d3_geoIdentity,
    geoPath as d3_geoPath
} from 'd3-geo';


export function svgPath(projection, graph, isArea) {

    // Explanation of magic numbers:
    // "padding" here allows space for strokes to extend beyond the viewport,
    // so that the stroke isn't drawn along the edge of the viewport when
    // the shape is clipped.
    //
    // When drawing lines, pad viewport by 5px.
    // When drawing areas, pad viewport by 65px in each direction to allow
    // for 60px area fill stroke (see ".fill-partial path.fill" css rule)

    var cache = {};
    var padding = isArea ? 65 : 5;
    var viewport = projection.clipExtent();
    var paddedExtent = [
        [viewport[0][0] - padding, viewport[0][1] - padding],
        [viewport[1][0] + padding, viewport[1][1] + padding]
    ];
    var clip = d3_geoIdentity().clipExtent(paddedExtent).stream;
    var project = projection.stream;
    var path = d3_geoPath()
        .projection({stream: function(output) { return project(clip(output)); }});

    var svgpath = function(entity) {
        if (entity.id in cache) {
            return cache[entity.id];
        } else {
            return cache[entity.id] = path(entity.asGeoJSON(graph));
        }
    };

    svgpath.geojson = path;

    return svgpath;
}
