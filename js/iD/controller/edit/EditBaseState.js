// iD/controller/edit/EditBaseState.js

define(['dojo/_base/declare','dijit/TooltipDialog','dijit/popup',
        'iD/controller/ControllerState'], function(declare){

// ----------------------------------------------------------------------
// EditBaseState class - provides shared UI functions to edit mode states

declare("iD.controller.edit.EditBaseState", [iD.controller.ControllerState], {

	editortooltip: null,
	
	constructor:function() {
	},
	
	openEditorTooltip:function(x,y,entity) {
		var h=entity.friendlyName(); h = (h=='') ? h : h+"<br/>";
		this.editortooltip = new dijit.TooltipDialog({
			content: h+"<button data-dojo-type='dijit.form.Button' type='submit'>Edit tags</button> "
			          +"<button data-dojo-type='dijit.form.Button' type='submit'>Edit shape</button> ",
			autoFocus: false
		});
		dijit.popup.open({ popup: this.editortooltip, x: x, y: y });
	},
	
	closeEditorTooltip:function() {
		if (this.editortooltip) { dijit.popup.close(this.editortooltip); }
	},
	
});

// ----------------------------------------------------------------------
// End of module
});
