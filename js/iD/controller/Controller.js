// A controller holds a single action at a time and calls `.enter` and `.exit`
// to bind and unbind actions.
iD.Controller = function(map) {
    var controller = { mode: null };

    controller.enter = function(mode) {
        mode.controller = controller;
        mode.map = map;
        if (controller.mode) {
            controller.mode.exit();
        }
        mode.enter();
        controller.mode = mode;
    };

    controller.enter(iD.modes.Move);

    return controller;
};
