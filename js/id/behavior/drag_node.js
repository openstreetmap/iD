iD.behavior.DragNode = function(mode) {
    var history = mode.history,
        projection = mode.map.projection;

    return iD.behavior.drag()
        .delegate(".handle, .marker")
        .origin(function(entity) {
            return projection(entity.loc);
        })
        .on('start', function() {
            history.perform(
                iD.actions.Noop());
        })
        .on('move', function(entity) {
            d3.event.sourceEvent.stopPropagation();
            history.replace(
                iD.actions.MoveNode(entity.id, projection.invert(d3.event.point)));
        })
        .on('end', function() {
            history.replace(
                iD.actions.Noop(),
                'moved a node');
        });
};
