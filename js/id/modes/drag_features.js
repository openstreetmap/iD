iD.modes._dragFeatures = function(mode) {
    var dragging, incarnated;

    var dragbehavior = d3.behavior.drag()
        .origin(function(entity) {
            var p = mode.map.projection(entity.loc);
            return { x: p[0], y: p[1] };
        })
        .on('drag', function(entity) {
            d3.event.sourceEvent.stopPropagation();
            if (!dragging) {
                if (entity.accuracy) {
                    var node = iD.Node({ loc: entity.loc });
                    mode.history.perform(
                        iD.actions.AddNode(node),
                        iD.actions.AddWayNode(entity.way, node.id, entity.index));
                    incarnated = node.id;
                }
                dragging = iD.util.trueObj([entity.id].concat(
                    _.pluck(mode.history.graph().parentWays(entity.id), 'id')));
                mode.history.perform(iD.actions.Noop());
            }
            if (incarnated) entity = mode.history.graph().entity(incarnated);
            var to = mode.map.projection.invert([d3.event.x, d3.event.y]);
            mode.history.replace(iD.actions.Move(entity.id, to));
        })
        .on('dragend', function () {
            if (!dragging) return;
            dragging = undefined;
            incarnated = undefined;
        });

    mode.map.surface
        .call(dragbehavior)
        .call(d3.latedrag()
             .filter(function(d) {
                 return (d.type === 'node' || d.accuracy);
             }));
};
