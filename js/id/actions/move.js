// https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/MoveCommand.java
// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MoveNodeAction.as
iD.actions.Move = function(entityId, loc) {
    return function(graph) {
        var entity = graph.entity(entityId);
        return graph.replace(entity.update({loc: loc}));
    };
};
