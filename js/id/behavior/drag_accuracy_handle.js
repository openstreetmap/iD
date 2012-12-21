iD.behavior.DragAccuracyHandle = function(mode) {
    var history = mode.history,
        projection = mode.map.projection;

    return iD.behavior.drag()
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
};
