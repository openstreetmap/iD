// iD/actions/UndoableAction.js
// we don't currently do connectionWasDirty, and we should

define(['dojo/_base/declare'], function(declare){

// ----------------------------------------------------------------------
// UndoableAction base class

declare("iD.actions.UndoableAction", null, {
	
	FAIL: 0,
	SUCCESS: 1,
	NO_CHANGE: 2,

	name: "",

	constructor:function() {
	},
	
	doAction:function() {
		return FAIL;
	},
	
	undoAction:function() {
		return FAIL;
	},
	
	mergePrevious:function() {
		return false;
	},

	setName:function(_name) {
		this.name=_name;
	},

});

// ----------------------------------------------------------------------
// UndoableEntityAction class

declare("iD.actions.UndoableEntityAction", [iD.actions.UndoableAction], {
	
	wasDirty: false,
	connectionWasDirty: false,
	initialised: false,
	entity: null,
	
	constructor:function(_entity) {
		this.entity=_entity;
	},

	markDirty:function() {
		if (!this.initialised) { this.init(); }
		if (!this.wasDirty) { this.entity.markDirty(); }
//		if (!this.connectionWasDirty ) { this.entity.connection.markDirty(); }
	},

	markClean:function() {
		if (!this.initialised) { this.init(); }
		if (!this.wasDirty) { this.entity.markClean(); }
//		if (!connectionWasDirty) { this.entity.connection.markClean(); }
	},

	// Record whether or not the entity and connection were clean before this action started
	init:function() {
		this.wasDirty = this.entity.isDirty;
//		this.connectionWasDirty = this.entity.connection.isDirty;
		this.initialised = true;
	},

});


// ----------------------------------------------------------------------
// UndoableEntityAction class

declare("iD.actions.CompositeUndoableAction", [iD.actions.UndoableAction], {
	
	actions: null,
	actionsDone: false,
	
	constructor:function() {
		this.actions=[];
	},

	push:function(action) {
		this.actions.push(action);
	},
	
	clearActions:function() {
		this.actions=[];
	},

	doAction:function() {
		if (this.actionsDone) { return this.FAIL; }
		var somethingDone=false;
		for (var i=0; i<this.actions.length; i++) {
			var action = this.actions[i];
			var result = action.doAction();
			switch (result) {
				case this.NO_CHANGE:
					// splice this one out as it doesn't do anything
					this.actions.splice(i,1);
					i--;
					break;
				case this.FAIL:
					this.undoFrom(i);
					return this.FAIL;
				default:
					somethingDone=true;
					break;
			}
		}
		this.actionsDone = true;
		return somethingDone ? this.SUCCESS : this.NO_CHANGE;
	},

	undoAction:function() {
		if (!this.actionsDone) { return this.FAIL; }
		this.undoFrom(this.actions.length);
		return this.SUCCESS;
	},

	undoFrom:function(index) {
		for (var i=index-1; i>=0; i--) {
			this.actions[i].undoAction();
		}
		this.actionsDone=false;
	},

});

// ----------------------------------------------------------------------
// End of module
});
