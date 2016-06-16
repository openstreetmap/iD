export function Path(projection, graph, polygon) {
    var cache = {},
        clip = d3.geo.clipExtent().extent(projection.clipExtent()).stream,
        project = projection.stream,
        path = d3.geo.path()
            .projection({stream: function(output) { return polygon ? project(output) : project(clip(output)); }});

    return function(entity) {
        if (entity.id in cache) {
            return cache[entity.id];
        } else {
            return cache[entity.id] = path(entity.asGeoJSON(graph));
        }
    };
}
