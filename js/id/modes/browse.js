iD.modes.Browse = function() {
    var mode = {};

    mode.enter = function() {
        mode.map.surface.on('click.browse', function () {
            var datum = d3.select(d3.event.target).datum();
            if (datum instanceof iD.Entity) {
                mode.controller.enter(iD.modes.Select(datum));
            }
        });
    };

    mode.exit = function() {
        mode.map.surface.on('click.browse', null);
    };

    return mode;
};
