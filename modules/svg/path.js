import * as d3 from 'd3';
export function Path(projection, graph, polygon) {
    var cache = {},
        clip = d3.geoClipExtent().extent(projection.clipExtent()).stream,
        project = projection.stream,
        path = d3.geoPath()
            .projection({stream: function(output) { return polygon ? project(output) : project(clip(output)); }});

    return function(entity) {
        if (entity.id in cache) {
            return cache[entity.id];
        } else {
            return cache[entity.id] = path(entity.asGeoJSON(graph));
        }
    };
}
