iD.modes.AddPlace = function() {
    var mode = {
        id: 'add-place',
        title: '+ Place',
        description: 'Restaurants, monuments, and postal boxes are points.'
    };

    mode.enter = function() {
        mode.map.hint('Click on the map to add a place.');

        mode.map.surface.on('click.addplace', function() {
            var node = iD.Node({loc: mode.map.mouseCoordinates(), _poi: true});
            mode.history.perform(iD.actions.addNode(node));
            mode.controller.enter(iD.modes.Select(node));
        });

        mode.map.keybinding().on('⎋.addplace', function() {
            mode.controller.exit();
        });
    };

    mode.exit = function() {
        mode.map.hint(false);
        mode.map.surface.on('click.addplace', null);
        mode.map.keybinding().on('⎋.addplace', null);
    };

    return mode;
};
