// iD/actions/UndoableAction.js

define(['dojo/_base/declare','iD/actions/UndoableAction'], function(declare){

// ----------------------------------------------------------------------
// CreateEntityAction class

declare("iD.actions.CreateEntityAction", [iD.actions.UndoableEntityAction], {

	setCreate:null,
	deleteAction:null,

	// When undo is called, instead of simply removing the entity, we work through
	// to make a Delete[Entity]Action, call that, and store it for later
	// Then, when this action is called again (i.e. a redo), instead of creating yet another entity, we call the deleteAction.undoAction

	constructor:function(entity,setCreate) {
		this.setCreate = setCreate;
		this.setName("Create "+entity.entityType);
	},

	doAction:function() {
		if (this.deleteAction!=null) {
			this.deleteAction.undoAction();			// redo
		} else {
			this.setCreate(this.entity, false);		// first time
		}
		this.markDirty();
		return this.SUCCESS;
	},

	undoAction:function() {
		// if the undo is called for the first time, call for a deletion, and (via setAction) store the
		// deletion action for later. We'll undo the deletion if we get asked to redo this action
		if (this.deleteAction==null) { this.entity.remove(this.setAction); }
		this.deleteAction.doAction();
		this.markClean();
		return this.SUCCESS;
	},

	setAction:function(action) {
		deleteAction = action;
	},

});

// ----------------------------------------------------------------------
// End of module
});
