// A controller holds a single action at a time and calls `.enter` and `.exit`
// to bind and unbind actions.
iD.Controller = function() {
    var event = d3.dispatch('enter', 'exit');
    var controller = { mode: null };

    controller.enter = function(mode) {
        if (controller.mode) {
            controller.mode.exit();
            event.exit(controller.mode);
        }

        mode.enter();
        controller.mode = mode;
        event.enter(mode);
    };

    return d3.rebind(controller, event, 'on');
};
