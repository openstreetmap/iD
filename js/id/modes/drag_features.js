iD.modes._dragFeatures = function(mode) {
    var dragging;

    var dragbehavior = d3.behavior.drag()
        .origin(function(entity) {
            var p = mode.map.projection(entity.loc);
            d3.event.sourceEvent.stopPropagation();
            return { x: p[0], y: p[1] };
        })
        .on('drag', function(entity) {
            d3.event.sourceEvent.stopPropagation();

            var loc = mode.map.projection.invert([d3.event.x, d3.event.y]);

            if (!dragging) {
                if (entity.accuracy) {
                    dragging = iD.Node({loc: loc});
                    mode.history.perform(
                        iD.actions.AddNode(dragging),
                        iD.actions.AddWayNode(entity.way, dragging.id, entity.index));
                } else {
                    dragging = entity;
                    mode.history.perform(
                        iD.actions.Move(dragging.id, loc));
                }
            }

            mode.history.replace(iD.actions.Move(dragging.id, loc));
        })
        .on('dragend', function (entity) {
            if (!dragging) return;
            dragging = undefined;

            mode.history.replace(
                iD.actions.Noop(),
                entity.accuracy ? 'added a node to a way' : 'moved a node');
        });

    mode.map.surface
        .call(dragbehavior)
        .call(d3.latedrag()
             .filter(function(d) {
                 return (d.type === 'node' || d.accuracy);
             }));
};
