// iD/controller/edit/EditBaseState.js

define(['dojo/_base/declare','dijit/TooltipDialog','dijit/popup',
        'iD/controller/ControllerState'], function(declare){

// ----------------------------------------------------------------------
// EditBaseState class - provides shared UI functions to edit mode states

declare("iD.controller.edit.EditBaseState", [iD.controller.ControllerState], {

	editortooltip: null,
	
	constructor:function() {
	},
	
	openEditorTooltip:function(x,y) {
console.log("opening at "+x+","+y);
		editortooltip = new dijit.TooltipDialog({
			content: "Fred's House<br/>"+
			         "<button data-dojo-type='dijit.form.Button' type='submit'>Edit tags</button> "+
			         "<button data-dojo-type='dijit.form.Button' type='submit'>Edit shape</button> ",
			autoFocus: false
		});
		dijit.popup.open({ popup: editortooltip, x: x, y: y });
	},
	
	closeEditorTooltip:function() {
		dijit.popup.close(editortooltip);
	},
	
});

// ----------------------------------------------------------------------
// End of module
});
