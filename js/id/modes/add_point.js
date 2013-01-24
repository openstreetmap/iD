iD.modes.AddPoint = function() {
    var mode = {
        id: 'add-point',
        title: 'Point',
        description: 'Restaurants, monuments, and postal boxes are points.'
    };

    var keybinding = d3.keybinding('add-point');

    mode.enter = function() {
        var map = mode.map,
            history = mode.history,
            controller = mode.controller;

        map.tail('Click on the map to add a point.');

        map.surface.on('click.addpoint', function() {
            var node = iD.Node({loc: map.mouseCoordinates()});

            history.perform(
                iD.actions.AddNode(node),
                'added a point');

            controller.enter(iD.modes.Select(node, true));
        });

        keybinding.on('⎋', function() {
            controller.exit();
        });

        d3.select(document)
            .call(keybinding);
    };

    mode.exit = function() {
        mode.map.tail(false);
        mode.map.surface.on('click.addpoint', null);
        keybinding.off();
    };

    return mode;
};
