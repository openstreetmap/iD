// https://github.com/openstreetmap/josm/blob/mirror/src/org/openstreetmap/josm/command/MoveCommand.java
// https://github.com/openstreetmap/potlatch2/blob/master/net/systemeD/halcyon/connection/actions/MoveNodeAction.as
iD.actions.move = function(entity, loc) {
    return function(graph) {
        return graph.replace(entity.update({loc: loc}), 'moved an element');
    };
};
