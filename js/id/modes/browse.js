iD.modes.Browse = function() {
    var mode = {
        button: 'browse',
        id: 'browse',
        title: 'Move',
        description: 'Pan and zoom the map',
        key: 'b'
    };

    var behaviors;

    mode.enter = function() {
        var surface = mode.map.surface;

        behaviors = [
            iD.behavior.Hover(),
            iD.behavior.DragNode(mode),
            iD.behavior.DragMidpoint(mode)];

        behaviors.forEach(function(behavior) {
            behavior(surface);
        });

        surface.on('click.browse', function () {
            var datum = d3.select(d3.event.target).datum();
            if (datum instanceof iD.Entity) {
                mode.controller.enter(iD.modes.Select(datum));
            }
        });
    };

    mode.exit = function() {
        var surface = mode.map.surface;

        behaviors.forEach(function(behavior) {
            behavior.off(surface);
        });

        surface.on('click.browse', null);
    };

    return mode;
};
