iD.behavior.DragMidpoint = function(mode) {
    var history = mode.history,
        projection = mode.map.projection;

    var behavior = iD.behavior.drag()
        .delegate(".midpoint")
        .origin(function(d) {
            return projection(d.loc);
        })
        .on('start', function(d) {
            var node = iD.Node();

            history.perform(iD.actions.AddMidpoint(d, node));

            var vertex = d3.selectAll('.vertex')
                .filter(function(data) { return data.id === node.id; });

            behavior.target(vertex.node(), vertex.datum());
        })
        .on('move', function(d) {
            d3.event.sourceEvent.stopPropagation();
            history.replace(
                iD.actions.MoveNode(d.id, projection.invert(d3.event.point)));
        })
        .on('end', function() {
            history.replace(
                iD.actions.Noop(),
                'added a node to a way');
        });

    return behavior;
};
