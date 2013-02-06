iD.actions.Merge = function(ids) {
    function groupEntitiesByGeometry(graph) {
        var entities = ids.map(function(id) { return graph.entity(id); });
        return _.extend({point: [], area: []}, _.groupBy(entities, function(entity) { return entity.geometry(graph); }));
    }

    var action = function(graph) {
        var geometries = groupEntitiesByGeometry(graph),
            area = geometries['area'][0],
            points = geometries['point'];

        points.forEach(function (point) {
            area = area.mergeTags(point.tags);

            graph.parentRelations(point).forEach(function (parent) {
                graph = graph.replace(parent.replaceMember(point, area));
            });

            graph = graph.remove(point);
        });

        graph = graph.replace(area);

        return graph;
    };

    action.enabled = function(graph) {
        var geometries = groupEntitiesByGeometry(graph);
        return geometries['area'].length === 1 &&
            geometries['point'].length > 0 &&
            (geometries['area'].length + geometries['point'].length) === ids.length;
    };

    return action;
};
