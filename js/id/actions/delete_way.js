// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/DeleteWayAction.as
iD.actions.DeleteWay = function(way) {
    return function(graph) {
        graph.parentRelations(way.id)
            .forEach(function(parent) {
                graph = iD.actions.removeRelationEntity(parent, way)(graph);
            });

        way.nodes.forEach(function (id) {
            var node = graph.entity(id);

            graph = iD.actions.removeWayNode(way, node)(graph);

            if (!graph.parentWays(id).length && !graph.parentRelations(id).length) {
                graph = graph.remove(node);
            }
        });

        return graph.remove(way, 'removed a way');
    };
};
