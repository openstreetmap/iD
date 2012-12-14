iD.modes.AddPlace = function() {
    var mode = {
        id: 'add-place',
        title: 'Place',
        description: 'Restaurants, monuments, and postal boxes are points.'
    };

    mode.enter = function() {
        d3.select('#map').attr('class', function() { return mode.id});

        var map = mode.map,
            history = mode.history,
            controller = mode.controller;

        map.hint('Click on the map to add a place.');

        map.surface.on('click.addplace', function() {
            var node = iD.Node({loc: map.mouseCoordinates(), _poi: true});

            history.perform(
                iD.actions.AddNode(node),
                'added a place');

            controller.enter(iD.modes.Select(node));
        });

        map.keybinding().on('⎋.addplace', function() {
            controller.exit();
        });
    };

    mode.exit = function() {
        mode.map.hint(false);
        mode.map.surface.on('click.addplace', null);
        mode.map.keybinding().on('⎋.addplace', null);
        d3.select('#map').attr('class', null);
    };

    return mode;
};
