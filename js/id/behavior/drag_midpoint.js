iD.behavior.DragMidpoint = function(context) {
    var behavior = iD.behavior.drag()
        .delegate(".midpoint")
        .origin(function(d) {
            return context.projection(d.loc);
        })
        .on('start', function(d) {
            var node = iD.Node();

            context.perform(iD.actions.AddMidpoint(d, node));

            var vertex = context.surface().selectAll('.vertex')
                .filter(function(data) { return data.id === node.id; });

            behavior.target(vertex.node(), vertex.datum());
        })
        .on('move', function(d) {
            d3.event.sourceEvent.stopPropagation();
            context.replace(
                iD.actions.MoveNode(d.id, context.projection.invert(d3.event.point)));
        })
        .on('end', function() {
            context.replace(
                iD.actions.Noop(),
                t('operations.add.annotation.vertex'));
        });

    return behavior;
};
