// iD/actions/UndoStack.js

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
		this.undoActions=[];
		this.redoActions=[];
	},
	
	addAction:function(_action) {
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
		this.undoActions = [];
		this.redoActions = [];
	},

	canUndo:function() {
		return this.undoActions.length > 0;
	},

	canRedo:function() {
		return this.redoActions.length > 0;
	},

	// Undo the most recent action, and add it to the top of the redo stack
	undo:function() {
		if (!this.undoActions.length) { return; }
		var action = undoActions.pop();
		action.undoAction();
		redoActions.push(action);
	},
	undoIfAction:function(_action) {
		if (!this.undoActions.length) { return; }
		if (this.undoActions[this.undoActions.length-1].isInstanceOf(_action)) {
			this.undo();
			return true;
		}
		return false;
	},
	removeLastIfAction:function(_action) {
		if (this.undoActions.length && this.undoActions[this.undoActions.length-1].isInstanceOf(_action)) {
			this.undoActions.pop();
		}
	},

	getUndoDescription:function() {
		if (this.undoActions.length==0) return null;
		if (this.undoActions[this.undoActions.length-1].name) {
			return this.undoActions[this.undoActions.length-1].name;
		}
		return null;
	},

	getRedoDescription:function() {
		if (this.redoActions.length==0) return null;
		if (this.redoActions[this.redoActions.length-1].name) {
			return this.redoActions[this.redoActions.length-1].name;
		}
		return null;
	},

	// Takes the action most recently undone, does it, and adds it to the undo stack
	redo:function() {
		if (!this.redoActions.length) { return; }
		var action = this.redoActions.pop();
		action.doAction();
		this.undoActions.push(action);
	},

});

// ----------------------------------------------------------------------
// End of module
});
