// ----------------------------------------------------------------------
// Controller base class
if (typeof iD === 'undefined') iD = {};

iD.Controller = function(map) {
    var controller = {};

    controller.editorCache = {};
    controller.undoStack = new iD.UndoStack();
    // controller.stepper = new iD.ui.StepPane();

    controller.setState = function(newState) {
        // summary:		Enter a new ControllerState, firing exitState on the old one, and enterState on the new one.
        if (newState === state) { return; }
        if (state) state.exitState();
        newState.controller = controller;
        state = newState;
        newState.enterState();
    };

    controller.entityMouseEvent = function(event, entityUI) {
        // summary:		Pass a MouseEvent on an EntityUI (e.g. clicking a way) to the current ControllerState.
        if (!this.state) { return; }
        var newState = this.state.processMouseEvent(event,entityUI);
        this.setState(newState);
    };

    return controller;
};
