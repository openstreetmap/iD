iD.modes.MoveWay = function(context, wayId) {
    var mode = {
        id: 'move-way'
    };

    var keybinding = d3.keybinding('move-way');

    mode.enter = function() {
        var origin = point(),
            annotation = t('operations.move.annotation.' + context.geometry(wayId));

        // If intiated via keyboard
        if (!origin[0] && !origin[1]) origin = null;

        context.perform(
            iD.actions.Noop(),
            annotation);

        function point() {
            return d3.mouse(context.surface().node());
        }

        function move() {
            var p = point(),
                delta = origin ?
                    [p[0] - origin[0], p[1] - origin[1]] :
                    [0, 0];

            origin = p;

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
