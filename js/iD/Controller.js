define(['dojo/_base/declare','dojo/on','dojo/Evented',
        'iD/actions/UndoStack','iD/tags/PresetList'], function(declare,on,Evented){

// ----------------------------------------------------------------------
// Controller base class

declare("iD.Controller", [Evented], {
	state: null,			// current ControllerState
	map: null,				// current Map
	stepper: null,			// current StepPane
	undoStack: null,		// main undoStack
	editorCache: null,		// cache of tag editor objects, means we don't have to repeatedly load them
	
	constructor:function(map) {
		// summary:		The Controller marshalls ControllerStates and passes events to them.
		this.map = map;
		this.undoStack = new iD.actions.UndoStack();
		this.editorCache = {};
	},

	setStepper: function(stepper) {
		// summary:		Set reference for the singleton-like class for the step-by-step instruction panel.
		this.stepper = stepper;
	},

	setState:function(newState) {
		// summary:		Enter a new ControllerState, firing exitState on the old one, and enterState on the new one.
		if (newState === this.state) { return; }
		if (this.state) {
			this.state.exitState(newState);
			this.emit("exitState", {
                bubbles: true,
                cancelable: true,
                state: this.state.stateNameAsArray()
            });
		}
		newState.setController(this);
		this.state = newState;
		newState.enterState();
		this.emit("enterState", {
            bubbles: true,
            cancelable: true,
            state: this.state.stateNameAsArray()
        });
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
