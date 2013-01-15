iD.behavior.DragWay = function(mode) {
    var history = mode.history,
        projection = mode.map.projection;

    return iD.behavior.drag()
        .delegate('.casing, .stroke, .area')
        .filter(function(d) {
            return d && d.id === mode.entity.id;
        })
        .origin(function(entity) {
            return projection(entity.nodes[0].loc);
        })
        .on('start', function() {
            history.perform(
                iD.actions.Noop());
        })
        .on('move', function(entity) {
            d3.event.sourceEvent.stopPropagation();
            history.replace(
                iD.actions.MoveWay(entity.id, d3.event.delta, projection));
        })
        .on('end', function() {
            history.replace(
                iD.actions.Noop(),
                'moved a way');
        });
};
