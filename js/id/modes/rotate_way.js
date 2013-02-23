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
            ref_points = nodes.map(function(n) { return context.projection(n.loc); }),
            pivot = d3.geom.polygon(ref_points).centroid();

        context.perform(
            iD.actions.Noop(),
            annotation);

        function point() {
            return d3.mouse(context.map().surface.node());
        }

        function rotate() {
            var mousePoint = point();

            context.replace(
                iD.actions.RotateWay(wayId, ref_points, pivot, mousePoint, context.projection),
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
