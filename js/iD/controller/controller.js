// A controller holds a single action at a time and calls `.enter` and `.exit`
// to bind and unbind actions.
iD.Controller = function(map) {
    var controller = { action: null };

    controller.go = function(x) {
        x.controller = controller;
        x.map = map;
        if (controller.action) {
            controller.action.exit();
        }
        x.enter();
        controller.action = x;
    };

    controller.go(iD.actions.Move);

    return controller;
};
