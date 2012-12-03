// A controller holds a single action at a time and calls `.enter` and `.exit`
// to bind and unbind actions.
iD.Controller = function(map) {
    var event = d3.dispatch('enter', 'exit');
    var controller = { mode: null };

    controller.enter = function(mode) {
        mode.controller = controller;
        mode.map = map;
        if (controller.mode) {
            controller.mode.exit();
            event.exit(controller.mode);
        }
        mode.enter();
        controller.mode = mode;
        event.enter(mode);
    };

    controller.exit = function() {
        controller.enter(iD.modes.Move);
    };

    controller.exit();

    return d3.rebind(controller, event, 'on');
};
