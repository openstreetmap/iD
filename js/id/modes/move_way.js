iD.modes.MoveWay = function(context, wayId) {
    var mode = {
        id: 'move-way',
        button: 'browse'
    };

    var keybinding = d3.keybinding('move-way');

    mode.enter = function() {
        var origin = context.map().mouseCoordinates(),
            nudgeInterval,
            annotation = t('operations.move.annotation.' + context.geometry(wayId));

        // If intiated via keyboard
        if (!origin[0] && !origin[1]) origin = null;

        context.perform(
            iD.actions.Noop(),
            annotation);

        function edge(point, size) {
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
                context.pan(nudge);
            }, 50);
        }

        function stopNudge() {
            if (nudgeInterval) window.clearInterval(nudgeInterval);
            nudgeInterval = null;
        }

        function point() {
            return d3.mouse(context.map().surface.node());
        }

        function move() {
            var p = point();

            var delta = origin ?
                [p[0] - context.projection(origin)[0],
                p[1] - context.projection(origin)[1]] :
                [0, 0];

            var nudge = edge(p, context.map().size());
            if (nudge) startNudge(nudge);
            else stopNudge();

            origin = context.map().mouseCoordinates();

            context.replace(
                iD.actions.MoveWay(wayId, delta, context.projection),
                annotation);
        }

        function finish() {
            d3.event.stopPropagation();
            context.enter(iD.modes.Select(context, [wayId], true));
        }

        function cancel() {
            context.pop();
            context.enter(iD.modes.Select(context, [wayId], true));
        }

        function undone() {
            context.enter(iD.modes.Browse(context));
        }

        context.surface()
            .on('mousemove.move-way', move)
            .on('click.move-way', finish);

        context.history()
            .on('undone.move-way', undone);

        keybinding
            .on('⎋', cancel)
            .on('↩', finish);

        d3.select(document)
            .call(keybinding);
    };

    mode.exit = function() {
        context.surface()
            .on('mousemove.move-way', null)
            .on('click.move-way', null);

        context.history()
            .on('undone.move-way', null);

        keybinding.off();
    };

    return mode;
};
