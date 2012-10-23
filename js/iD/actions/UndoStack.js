// iD/actions/UndoStack.js
// ** FIXME: a couple of AS3-isms in undoIfAction/removeLastIfAction

// ----------------------------------------------------------------------
// UndoStack base class

if (typeof iD === 'undefined') iD = {};

iD.UndoStack = function() {

    var stack = {},
        undoActions = [],
        redoActions = [];

    var FAIL = 0,
        SUCCESS = 1,
        NO_CHANGE = 2;

    stack.add = function(action) {
        // summary: Add an action to the undo stack
        if (undoActions.length > 0) {
            var previous = undoActions[undoActions.length - 1];
            if (action.mergePrevious(previous)) {
                action.wasDirty = previous.wasDirty;
                action.connectionWasDirty = previous.connectionWasDirty;
                undoActions.pop();
            }
        }
        undoActions.push(action);
        redoActions = [];
    };

    stack.breakUndo = function() {
        // summary:	Wipe the undo stack - typically used after saving.
        undoActions = [];
        redoActions = [];
    };

    stack.canUndo = function() {
        // summary:		Are there any items on the undo stack?
        return undoActions.length > 0;
    };

    stack.canRedo = function() {
        // summary:		Are there any redoable actions?
        return redoActions.length > 0;
    };

    stack.undo = function() {
        // summary:		Undo the most recent action, and add it to the top of the redo stack.
        if (!stack.canUndo()) { return; }
        var action = undoActions.pop();
        action.undo();
        redoActions.push(action);
    };

    stack.undoIfAction = function(_action) {
        // summary:		Undo the most recent action _only_ if it was of a certain type.
        //				Fixme: isInstanceOf needs to be made into JavaScript.
        if (!undoActions.length) { return; }
        if (undoActions[undoActions.length-1].isInstanceOf(_action)) {
            undo();
            return true;
        }
        return false;
    };

    stack.removeLastIfAction = function(_action) {
        // summary:		Remove the most recent action from the stack _only_ if it was of a certain type.
        // Fixme: isInstanceOf needs to be made into JavaScript.
        if (undoActions.length &&
            undoActions[undoActions.length - 1].isInstanceOf(_action)) {
            undoActions.pop();
        }
    };

    stack.getUndoDescription = function() {
        // summary:		Get the name of the topmost item on the undo stack.
        if (!undoActions.length) return null;
        if (undoActions[undoActions.length - 1].name) {
            return undoActions[undoActions.length - 1].name;
        }
        return null;
    };

    stack.getRedoDescription = function() {
        // summary:		Get the name of the topmost item on the redo stack.
        if (!redoActions.length) return null;
        if (redoActions[redoActions.length - 1].name) {
            return redoActions[redoActions.length - 1].name;
        }
        return null;
    };

    stack.redo = function() {
        // summary:		Takes the action most recently undone, does it, and adds it to the undo stack.
        if (!stack.canRedo()) { return; }
        var action = redoActions.pop();
        action.run();
        undoActions.push(action);
    };

    return stack;
};
