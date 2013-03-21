// https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/MoveCommand.java
// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MoveNodeAction.as
iD.actions.Move = function(ids, delta, projection) {
    function addNodes(ids, nodes, graph) {
        ids.forEach(function(id) {
            var entity = graph.entity(id);
            if (entity.type === 'node') {
                nodes.push(id);
            } else if (entity.type === 'way') {
                nodes.push.apply(nodes, entity.nodes);
            } else {
                addNodes(_.pluck(entity.members, 'id'), nodes, graph);
            }
        });
    }

    var action = function(graph) {
        var nodes = [];

        addNodes(ids, nodes, graph);

        _.uniq(nodes).forEach(function(id) {
            var node = graph.entity(id),
                start = projection(node.loc),
                end = projection.invert([start[0] + delta[0], start[1] + delta[1]]);
            graph = graph.replace(node.move(end));
        });

        return graph;
    };

    action.enabled = function(graph) {
        return _.every(ids, function(id) {
            var entity = graph.entity(id);
            return entity.type !== 'relation' || entity.isComplete(graph);
        });
    };

    return action;
};
