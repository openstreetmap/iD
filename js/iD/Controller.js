// ----------------------------------------------------------------------
// Controller base class
if (typeof iD === 'undefined') iD = {};

iD.Controller = function() {
    var controller = {},
        state = null;

    controller.undoStack = new iD.UndoStack();

    controller.setState = function(newState) {
        // summary:		Enter a new ControllerState, firing exitState on the old one, and enterState on the new one.
        if (newState === state) { return; }
        if (state) state.exitState();
        newState.controller = controller;
        state = newState;
        newState.enterState();
    };

    return controller;
};
