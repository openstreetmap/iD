// iD/controller/ControllerState.js

define(['dojo/_base/declare','dojo/_base/lang'], function(declare,lang) {

// ----------------------------------------------------------------------
// ControllerState base class

declare("iD.controller.ControllerState", null, {
	controller: null,		// parent Controller
	
	constructor:function() {
	},

	setController:function(_controller) {
		this.controller=_controller;
	},
	
	processMouseEvent:function(event,entityUI) {
	},
	
	enterState:function() {
	},

	exitState:function(newState) {
	},

	stateName:function() {
		return this.stateNameAsArray.join('.');
	},
	
	stateNameAsArray:function() {
		return this.__proto__.declaredClass.split('.').slice(2);
	},
	
	getConnection:function() {
		return this.controller.map.conn;
	},
	
	undoAdder:function() {
		/* This is a convenient shorthand for adding an action to the global undo stack,
		   setting the scope correctly. */
		return lang.hitch(this.controller.undoStack, this.controller.undoStack.addAction);
	}

});

// ----------------------------------------------------------------------
// End of module
});
