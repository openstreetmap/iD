iD.behavior.DragMidpoint = function(mode) {
    var history = mode.history,
        projection = mode.map.projection;

    return iD.behavior.drag()
        .delegate(".midpoint")
        .origin(function(d) {
            return projection(d.loc);
        })
        .on('start', function(d) {
            d.node = iD.Node({loc: d.loc});
            var ops = [iD.actions.AddNode(d.node)];

            d.ways.forEach(function(w, i) {
                ops.push(iD.actions.AddWayNode(w, d.node.id, d.indices[i]));
            });

            history.perform.apply(history, ops);
        })
        .on('move', function(d) {
            d3.event.sourceEvent.stopPropagation();
            history.replace(
                iD.actions.MoveNode(d.node.id, projection.invert(d3.event.point)));
        })
        .on('end', function() {
            history.replace(
                iD.actions.Noop(),
                'added a node to a way');
        });
};
