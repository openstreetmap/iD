iD.modes.AddPlace = function() {
    var mode = {
        id: 'add-place',
        title: '+ Place'
    };

    mode.enter = function() {
        var surface = mode.map.surface;

        function click() {
            var node = iD.Node({loc: mode.map.mouseCoordinates(), _poi: true});
            mode.history.perform(iD.actions.addNode(node));
            mode.controller.enter(iD.modes.Select(node));
        }

        surface.on('click.addplace', click);

        mode.map.keybinding().on('⎋.exit', function() {
            mode.controller.exit();
        });
    };

    mode.exit = function() {
        mode.map.surface
            .on('click.addplace', null);
        mode.map.keybinding().on('⎋.exit', null);
    };

    return mode;
};
