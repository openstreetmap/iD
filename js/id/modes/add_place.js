iD.modes.AddPlace = function() {
    var mode = {
        id: 'add-place',
        title: '+ Place'
    };

    mode.enter = function() {
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
        mode.map.surface.on('click.addplace', null);
        mode.map.keybinding().on('⎋.addplace', null);
    };

    return mode;
};
