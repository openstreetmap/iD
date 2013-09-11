iD.modes.Scale = function(context, wayId) {
    var mode = {
        id: 'scale',
        button: 'browse'
    };

    var keybinding = d3.keybinding('scale'),
        edit = iD.behavior.Edit(context);

    mode.enter = function() {
        context.install(edit);

        var annotation = t('operations.scale.annotation.' + context.geometry(wayId)),
            way = context.graph().entity(wayId),
            nodes = _.uniq(context.graph().childNodes(way)),
            points = nodes.map(function(n) { return context.projection(n.loc); }),
            pivot = d3.geom.polygon(points).centroid(),
            mousePoint = context.mouse(),
            angle= Math.atan2(mousePoint[1] - pivot[1],mousePoint[0] - pivot[0]);
            distance= Math.sqrt(Math.pow(mousePoint[1] - pivot[1], 2) + Math.pow(mousePoint[0] - pivot[0], 2));
        context.perform(
            iD.actions.Noop(),
            annotation);

        function scale() {

            var mousePoint = context.mouse(),
            
                newAngle = Math.atan2(mousePoint[1] - pivot[1],mousePoint[0] - pivot[0]);
                newDistance = Math.sqrt(Math.pow(mousePoint[1] - pivot[1], 2) + Math.pow(mousePoint[0] - pivot[0], 2));
                scalingFactor = Math.cos(angle-newAngle) * newDistance / distance;
            context.replace(
                iD.actions.Scale(wayId, pivot, scalingFactor, context.projection),
                annotation);
                distance=newDistance;
                angle=newAngle;
        }

        function finish() {
            d3.event.stopPropagation();
            context.enter(iD.modes.Select(context, [wayId])
                .suppressMenu(true));
        }

        function cancel() {
            context.pop();
            context.enter(iD.modes.Select(context, [wayId])
                .suppressMenu(true));
        }

        function undone() {
            context.enter(iD.modes.Browse(context));
        }

        context.surface()
            .on('mousemove.scale', scale)
            .on('click.scale', finish);

        context.history()
            .on('undone.scale', undone);

        keybinding
            .on('⎋', cancel)
            .on('↩', finish);

        d3.select(document)
            .call(keybinding);
    };

    mode.exit = function() {
        context.uninstall(edit);

        context.surface()
            .on('mousemove.scale', null)
            .on('click.scale', null);

        context.history()
            .on('undone.scale', null);

        keybinding.off();
    };

    return mode;
};
