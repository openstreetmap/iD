// iD/controller/ControllerState.js

define(['dojo/_base/declare','dojo/_base/lang'], function(declare,lang) {

// ----------------------------------------------------------------------
// ControllerState base class

declare("iD.controller.ControllerState", null, {
	controller: null,		// parent Controller
	
	constructor:function() {
		// summary:		Base class for ControllerStates.
	},

	setController:function(_controller) {
		// summary:		Set a reference to the parent Controller.
		this.controller=_controller;
	},
	
	processMouseEvent:function(event,entityUI) {
		// summary:		Process mouse events. Most of the UI handling goes on in here.
		// returns: iD.controller.ControllerState	The ControllerState to move to as a result of the user's actions (or just 'this' for no change).
	},
	
	enterState:function() {
		// summary:		Do any work required for entering the ControllerState, such as highlighting the selected entity.
	},

	exitState:function(newState) {
		// summary:		Do any work required to leave the ControllerState clearly, such as unhighlighting the selected entity.
	},

	stateName:function() {
		// summary:		Return the name of this state as a string, e.g. 'edit.NoSelection'.
		// return:		String
		return this.stateNameAsArray.join('.');
	},
	
	stateNameAsArray:function() {
		// summary:		Return the name of this state as an array, e.g. ['edit','NoSelection'].
		// return:		Array
		return this.__proto__.declaredClass.split('.').slice(2);
	},
	
	getConnection:function() {
		// summary: 	Shorthand to return the Connection associated with this Controller (via its Map object).
		// return:		iD.Connection
		return this.controller.map.conn;
	},
	
	undoAdder:function() {
		// summary:		Shorthand for adding an action to the global undo stack, setting the scope correctly.
		// return:		Function
		return lang.hitch(this.controller.undoStack, this.controller.undoStack.addAction);
	}

});

// ----------------------------------------------------------------------
// End of module
});
