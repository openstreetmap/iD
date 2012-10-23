// iD/actions/UndoableAction.js
// we don't currently do connectionWasDirty, and we should

define(['dojo/_base/declare'], function(declare){

// ----------------------------------------------------------------------
// UndoableAction base class

declare("iD.actions.UndoableAction", null, {
	mergePrevious:function() {
		// summary:		If two successive actions can be merged (in particular, two successive node moves), do that.
		return false;
	},
	setName:function(_name) {
		// summary:		Set the name of an action. For UI and debugging purposes.
		this.name=_name;
	}
});

// ----------------------------------------------------------------------
// UndoableEntityAction class

declare("iD.actions.UndoableEntityAction", [iD.actions.UndoableAction], {
	
	wasDirty: false,
	connectionWasDirty: false,
	initialised: false,
	entity: null,
	
	constructor:function(_entity) {
		// summary:		An UndoableEntityAction is a user-induced change to the map data 
		//				(held within the Connection) which can be undone, with a reference
		//				to a particular entity (to which the change was made).
		this.entity=_entity;
	},

	markDirty:function() {
		// summary:	Mark a change to the entity ('dirtying' it).
		if (!this.initialised) this.init();
		if (!this.wasDirty) this.entity._markDirty();
		if (!this.connectionWasDirty) this.entity.connection.modified = true;
	},

    markClean:function() {
        // summary:	If the entity was clean before, revert the dirty flag to that state.
        if (!this.initialised) this.init();
		if (!this.wasDirty) this.entity._markClean();
		if (!this.connectionWasDirty) this.entity.connection.modified = false;
	},

	init:function() {
		// summary:		Record whether or not the entity and connection were clean before this action started
		this.wasDirty = this.entity.modified;
		this.connectionWasDirty = this.entity.connection.modified;
		this.initialised = true;
	},

	toString:function() {
		return this.name + " " + this.entity.entityType + " " + this.entity.id;
	}

});


// ----------------------------------------------------------------------
// CompositeUndoableAction class

declare("iD.actions.CompositeUndoableAction", [iD.actions.UndoableAction], {
	
	actions: null,
	actionsDone: false,
	
	constructor:function() {
		// summary:		A CompositeUndoableAction is a group of user-induced changes to the map data 
		//				(held within the Connection) which are executed, and therefore undone,
		//				in a batch. For example, creating a new node and a new way containing it.
		this.actions = [];
	},

	push:function(action) {
		// summary:		Add a single action to the list of actions comprising this CompositeUndoableAction.
		this.actions.push(action);
	},
	
	clearActions:function() {
		// summary:		Clear the list of actions.
		this.actions = [];
	},

	doAction:function() {
		// summary:		Execute all the actions one-by-one as a transaction (i.e. roll them all back if one fails).
		if (this.actionsDone) { return this.FAIL; }
		var somethingDone = false;
		for (var i = 0; i < this.actions.length; i++) {
			var action = this.actions[i];
			var result = action.doAction();
			switch (result) {
				case this.NO_CHANGE:
					// splice this one out as it doesn't do anything
					this.actions.splice(i,1);
					i--;
					break;
				case this.FAIL:
					this._undoFrom(i);
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
		// summary:		Roll back all the actions one-by-one.
		if (!this.actionsDone) { return this.FAIL; }
		this._undoFrom(this.actions.length);
		return true;
	},

	_undoFrom:function(index) {
		// summary:		Undo all the actions after a certain index.
		for (var i=index-1; i>=0; i--) {
			this.actions[i].undoAction();
		}
		this.actionsDone=false;
	}
});

// ----------------------------------------------------------------------
// End of module
});
