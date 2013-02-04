iD.behavior.DragNode = function(context) {
    var size = context.map().size(),
        nudgeInterval;

    function edge(point) {
        var pad = [30, 100, 30, 100];
        if (point[0] > size[0] - pad[0]) return [-10, 0];
        else if (point[0] < pad[2]) return [10, 0];
        else if (point[1] > size[1] - pad[1]) return [0, -10];
        else if (point[1] < pad[3]) return [0, 10];
        return null;
    }

    function startNudge(nudge) {
        if (nudgeInterval) window.clearInterval(nudgeInterval);
        nudgeInterval = window.setInterval(function() {
            context.map().pan(nudge).redraw();
        }, 50);
    }

    function stopNudge(nudge) {
        if (nudgeInterval) window.clearInterval(nudgeInterval);
        nudgeInterval = null;
    }

    function annotation(entity) {
        return t('operations.move.annotation.' + entity.geometry(context.graph()));
    }

    return iD.behavior.drag()
        .delegate(".node")
        .origin(function(entity) {
            return context.projection(entity.loc);
        })
        .on('start', function() {
            context.perform(
                iD.actions.Noop());
        })
        .on('move', function(entity) {
            d3.event.sourceEvent.stopPropagation();

            var nudge = edge(d3.event.point);
            if (nudge) startNudge(nudge);
            else stopNudge();

            context.replace(
                iD.actions.MoveNode(entity.id, context.projection.invert(d3.event.point)),
                annotation(entity));
        })
        .on('end', function(entity) {
            stopNudge();
            context.replace(
                iD.actions.Noop(),
                annotation(entity));
        });
};
