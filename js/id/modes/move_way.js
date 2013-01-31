iD.modes.MoveWay = function(wayId) {
    var mode = {
        id: 'move-way'
    };

    var keybinding = d3.keybinding('move-way');

    mode.enter = function() {
        var map = mode.map,
            history = mode.history,
            graph = history.graph(),
            selection = map.surface,
            controller = mode.controller,
            projection = map.projection;

        var way = graph.entity(wayId),
            origin = d3.mouse(selection.node());

        history.perform(
            iD.actions.Noop(),
            'Moved a way.');

        function move() {
            var p = d3.mouse(selection.node()),
                delta = [p[0] - origin[0],
                         p[1] - origin[1]];

            origin = p;

            history.replace(
                iD.actions.MoveWay(wayId, delta, projection),
                'Moved a way.');
        }

        function finish() {
            d3.event.stopPropagation();
            controller.enter(iD.modes.Select(way, true));
        }

        function cancel() {
            history.pop();
            controller.enter(iD.modes.Select(way, true));
        }

        function undone() {
            controller.enter(iD.modes.Browse());
        }

        selection
            .on('mousemove.move-way', move)
            .on('click.move-way', finish);

        history.on('undone.move-way', undone);

        keybinding
            .on('⎋', cancel)
            .on('↩', finish);

        d3.select(document)
            .call(keybinding);
    };

    mode.exit = function() {
        var map = mode.map,
            history = mode.history,
            selection = map.surface;

        selection
            .on('mousemove.move-way', null)
            .on('click.move-way', null);

        history.on('undone.move-way', null);

        keybinding.off();
    };

    return mode;
};
