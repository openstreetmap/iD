// iD/Controller.js

define(['dojo/_base/declare','dojo/on','iD/actions/UndoStack'], function(declare,on){

// ----------------------------------------------------------------------
// Controller base class

declare("iD.Controller", null, {
	state: null,			// current ControllerState
	map: null,				// current Map
	stepper: null,			// current StepPane
	undoStack: null,		// main undoStack
	
	constructor:function(_map) {
		// summary:		The Controller marshalls ControllerStates and passes events to them.
		this.map=_map;
		this.undoStack=new iD.actions.UndoStack();
	},

	setStepper:function(_stepper) {
		// summary:		Set reference for the singleton-like class for the step-by-step instruction panel.
		this.stepper=_stepper;
	},
	
	setState:function(newState) {
		// summary:		Enter a new ControllerState, firing exitState on the old one, and enterState on the new one.
		if (newState==this.state) { return; }
		if (this.state) {
			this.state.exitState(newState);
			on.emit(window, "exitState", { bubbles: true, cancelable: true, state: this.state.stateNameAsArray() });
		}
		newState.setController(this);
		this.state=newState;
		newState.enterState();
		on.emit(window, "enterState", { bubbles: true, cancelable: true, state: this.state.stateNameAsArray() });
	},
	
	entityMouseEvent:function(event,entityUI) {
		// summary:		Pass a MouseEvent on an EntityUI (e.g. clicking a way) to the current ControllerState.
		if (!this.state) { return; }
		var newState=this.state.processMouseEvent(event,entityUI);
		this.setState(newState);
	}

});

// ----------------------------------------------------------------------
// End of module
});
