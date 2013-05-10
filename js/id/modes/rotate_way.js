iD.modes.RotateWay = function(context, wayId) {
    var mode = {
        id: 'rotate-way',
        button: 'browse'
    };

    var keybinding = d3.keybinding('rotate-way');

    mode.enter = function() {

        var annotation = t('operations.rotate.annotation.' + context.geometry(wayId)),
            way = context.graph().entity(wayId),
            nodes = _.uniq(context.graph().childNodes(way)),
            points = nodes.map(function(n) { return context.projection(n.loc); }),
            pivot = d3.geom.polygon(points).centroid(),
            angle;

        context.perform(
            iD.actions.Noop(),
            annotation);

        function rotate() {

            var mousePoint = context.mouse(),
                newAngle = Math.atan2(mousePoint[1] - pivot[1], mousePoint[0] - pivot[0]);

            if (typeof angle === 'undefined') angle = newAngle;

            context.replace(
                iD.actions.RotateWay(wayId, pivot, newAngle - angle, context.projection),
                annotation);

            angle = newAngle;
        }

        function finish() {
            d3.event.stopPropagation();
            context.enter(iD.modes.Select(context, [wayId]));
        }

        function cancel() {
            context.pop();
            context.enter(iD.modes.Select(context, [wayId]));
        }

        function undone() {
            context.enter(iD.modes.Browse(context));
        }

        context.surface()
            .on('mousemove.rotate-way', rotate)
            .on('click.rotate-way', finish);

        context.history()
            .on('undone.rotate-way', undone);

        keybinding
            .on('⎋', cancel)
            .on('↩', finish);

        d3.select(document)
            .call(keybinding);
    };

    mode.exit = function() {
        context.surface()
            .on('mousemove.rotate-way', null)
            .on('click.rotate-way', null);

        context.history()
            .on('undone.rotate-way', null);

        keybinding.off();
    };

    return mode;
};
