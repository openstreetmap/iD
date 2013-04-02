iD.actions.Merge = function(ids) {
    function groupEntitiesByGeometry(graph) {
        var entities = ids.map(function(id) { return graph.entity(id); });
        return _.extend({point: [], area: [], line: [], relation: []},
            _.groupBy(entities, function(entity) { return entity.geometry(graph); }));
    }

    var action = function(graph) {
        var geometries = groupEntitiesByGeometry(graph),
            target = geometries.area[0] || geometries.line[0],
            points = geometries.point;

        points.forEach(function(point) {
            target = target.mergeTags(point.tags);

            graph.parentRelations(point).forEach(function(parent) {
                graph = graph.replace(parent.replaceMember(point, target));
            });

            graph = graph.remove(point);
        });

        graph = graph.replace(target);

        return graph;
    };

    action.disabled = function(graph) {
        var geometries = groupEntitiesByGeometry(graph);
        if (geometries.point.length === 0 ||
            (geometries.area.length + geometries.line.length) !== 1 ||
            geometries.relation.length !== 0)
            return 'not_eligible';
    };

    return action;
};
