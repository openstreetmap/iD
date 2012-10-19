// iD/actions/UndoableAction.js

define(['dojo/_base/declare','iD/actions/UndoableAction'], function(declare){

// ----------------------------------------------------------------------
// CreateEntityAction class

declare("iD.actions.CreateEntityAction", [iD.actions.UndoableEntityAction], {

	setCreate:null,
	deleteAction:null,

	constructor: function(entity,setCreate) {
		// summary:		Create a new entity - way, node or relation.
		this.setCreate = setCreate;
		this.setName("Create " + entity.entityType);
	},

	doAction: function() {
		// summary:		Call out to the specified method (in the Controller) to create the entity.
		//				See undoAction for explanation of special redo handling.
		if (this.deleteAction!==null) {
			this.deleteAction.undoAction();			// redo
		} else {
			this.setCreate(this.entity, false);		// first time
		}
		this.markDirty();
		return this.SUCCESS;
	},

	undoAction: function() {
		// summary:		Special handling for undoing a create. When undo is called, instead 
		//				of simply removing the entity, we work through to make a Delete[Entity]Action, 
		//				call that, and store it for later. Then, when this action is called again 
		//				(i.e. a redo), instead of creating yet another entity, we call the deleteAction.undoAction.
		if (this.deleteAction===null) { this.entity.remove(this.setAction); }
		this.deleteAction.doAction();
		this.markClean();
		return this.SUCCESS;
	},

	setAction: function(action) {
		// summary:		Set the associated delete action (see undoAction for explanation).
		deleteAction = action;
	}

});

// ----------------------------------------------------------------------
// End of module
});
