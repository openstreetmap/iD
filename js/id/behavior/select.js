iD.behavior.Select = function(mode) {
    var controller = mode.controller;

    function click() {
        var datum = d3.select(d3.event.target).datum();
        if (datum instanceof iD.Entity) {
            controller.enter(iD.modes.Select([datum.id]));
        } else {
            controller.enter(iD.modes.Browse());
        }
    }

    var behavior = function(selection) {
        selection.on('click.select', click);
    };

    behavior.off = function(selection) {
        selection.on('click.select', null);
    };

    return behavior;
};
