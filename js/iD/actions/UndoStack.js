// iD/actions/UndoStack.js
// ** FIXME: a couple of AS3-isms in undoIfAction/removeLastIfAction

define(['dojo/_base/declare'], function(declare){

// ----------------------------------------------------------------------
// UndoStack base class

declare("iD.actions.UndoStack", null, {
	
	undoActions: null,
	redoActions: null,

	FAIL: 0,
	SUCCESS: 1,
	NO_CHANGE: 2,

	constructor:function() {
		// summary:		An undo stack. There can be any number of these, but almost all operations will
		//				take place on the global undo stack - implemented as a singleton-like property of
		//				the Controller.
		this.undoActions=[];
		this.redoActions=[];
	},
	
	addAction:function(_action) {
		// summary:		Do an action, and add it to the undo stack if it succeeded.
		var result = _action.doAction();
		switch (result) {
			case this.FAIL:
				// do something bad
				break;

			case this.NO_CHANGE:
				break;

			case this.SUCCESS:
			default:
				if (this.undoActions.length>0) {
					var previous = this.undoActions[this.undoActions.length-1];
					if (_action.mergePrevious(previous)) {
						_action.wasDirty = previous.wasDirty;
						_action.connectionWasDirty = previous.connectionWasDirty;
						this.undoActions.pop();
					}
				}
				this.undoActions.push(_action);
				this.redoActions=[];
				break;
		}
	},

	breakUndo:function() {
		// summary:		Wipe the undo stack - typically used after saving.
		this.undoActions = [];
		this.redoActions = [];
	},

	canUndo:function() {
		// summary:		Are there any items on the undo stack?
		return this.undoActions.length > 0;
	},

	canRedo:function() {
		// summary:		Are there any redoable actions?
		return this.redoActions.length > 0;
	},

	undo:function() {
		// summary:		Undo the most recent action, and add it to the top of the redo stack.
		if (!this.undoActions.length) { return; }
		var action = undoActions.pop();
		action.undoAction();
		redoActions.push(action);
	},
	undoIfAction:function(_action) {
		// summary:		Undo the most recent action _only_ if it was of a certain type.
		//				Fixme: isInstanceOf needs to be made into JavaScript.
		if (!this.undoActions.length) { return; }
		if (this.undoActions[this.undoActions.length-1].isInstanceOf(_action)) {
			this.undo();
			return true;
		}
		return false;
	},
	removeLastIfAction:function(_action) {
		// summary:		Remove the most recent action from the stack _only_ if it was of a certain type.
		//				Fixme: isInstanceOf needs to be made into JavaScript.
		if (this.undoActions.length && this.undoActions[this.undoActions.length-1].isInstanceOf(_action)) {
			this.undoActions.pop();
		}
	},

	getUndoDescription:function() {
		// summary:		Get the name of the topmost item on the undo stack.
		if (this.undoActions.length==0) return null;
		if (this.undoActions[this.undoActions.length-1].name) {
			return this.undoActions[this.undoActions.length-1].name;
		}
		return null;
	},

	getRedoDescription:function() {
		// summary:		Get the name of the topmost item on the redo stack.
		if (this.redoActions.length==0) return null;
		if (this.redoActions[this.redoActions.length-1].name) {
			return this.redoActions[this.redoActions.length-1].name;
		}
		return null;
	},

	redo:function() {
		// summary:		Takes the action most recently undone, does it, and adds it to the undo stack.
		if (!this.redoActions.length) { return; }
		var action = this.redoActions.pop();
		action.doAction();
		this.undoActions.push(action);
	},

});

// ----------------------------------------------------------------------
// End of module
});
