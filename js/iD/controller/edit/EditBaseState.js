// iD/controller/edit/EditBaseState.js

define(['dojo/_base/declare','dijit/TooltipDialog','dijit/popup',
        'iD/controller/ControllerState'], function(declare){

// ----------------------------------------------------------------------
// EditBaseState class - provides shared UI functions to edit mode states

declare("iD.controller.edit.EditBaseState", [iD.controller.ControllerState], {

	editortooltip: null,
	
	constructor:function() {
		// summary:		Base state for the 'Edit object' states - where an object is selected and the user is making changes to it.
	},
	
	openEditorTooltip:function(x,y,entity) {
		// summary:		Open the initial 'Edit tags/Edit shape' tooltip.
		// x: Number	Screen co-ordinate.
		// y: Number	Screen co-ordinate.
		// entity: iD.Entity	The entity to be edited.
		var h=entity.friendlyName(); h = (h=='') ? h : h+"<br/>";
		this.editortooltip = new dijit.TooltipDialog({
			content: h+"<button data-dojo-type='dijit.form.Button' type='submit'>Edit tags</button> "
			          +"<button data-dojo-type='dijit.form.Button' type='submit'>Edit shape</button> ",
			autoFocus: false
		});
		dijit.popup.open({ popup: this.editortooltip, x: x, y: y });
	},
	
	closeEditorTooltip:function() {
		// summary:		Close the tooltip.
		if (this.editortooltip) { dijit.popup.close(this.editortooltip); }
	},
	
});

// ----------------------------------------------------------------------
// End of module
});
