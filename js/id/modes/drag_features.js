iD.modes._dragFeatures = function(mode) {
    var history = mode.history,
        projection = mode.map.projection;

    var dragNode = iD.behavior.drag()
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
                iD.actions.MoveNode(entity.id, projection.invert(d3.event.loc)));
        })
        .on('end', function() {
            history.replace(
                iD.actions.Noop(),
                'moved a node');
        });

    var dragAccuracy = iD.behavior.drag()
        .delegate(".accuracy-handle")
        .origin(function(d) {
            return projection(d.loc);
        })
        .on('start', function(d) {
            d.node = iD.Node({loc: d.loc});
            history.perform(
                iD.actions.AddNode(d.node),
                iD.actions.AddWayNode(d.way, d.node.id, d.index));
        })
        .on('move', function(d) {
            d3.event.sourceEvent.stopPropagation();
            history.replace(
                iD.actions.MoveNode(d.node.id, projection.invert(d3.event.loc)));
        })
        .on('end', function() {
            history.replace(
                iD.actions.Noop(),
                'added a node to a way');
        });

    mode.map.surface
        .call(dragNode)
        .call(dragAccuracy);
};
