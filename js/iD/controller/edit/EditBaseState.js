// iD/controller/edit/EditBaseState.js

define(['dojo/_base/declare','dojo/_base/lang','dojo/_base/array','dojo/on',
        'dijit/registry','dijit/TooltipDialog','dijit/Dialog','dijit/popup',
        'iD/controller/ControllerState','iD/tags/TagEditor'], function(declare,lang,array,on,registry){

// ----------------------------------------------------------------------
// EditBaseState class - provides shared UI functions to edit mode states

declare("iD.controller.edit.EditBaseState", [iD.controller.ControllerState], {

	editortooltip: null,
	
	constructor:function() {
		// summary:	Base state for the 'Edit object' states - where an
        // object is selected and the user is making changes to it.
	},

	openEditorTooltip:function(x,y,entity) {
		// summary:		Open the initial 'Edit tags/Edit shape' tooltip.
		// x: Number	Screen co-ordinate.
		// y: Number	Screen co-ordinate.
        // entity: iD.Entity	The entity to be edited.
        var h = iD.Util.friendlyName(entity);
        this.editortooltip = new dijit.TooltipDialog({
            content: h + "<button data-dojo-type='dijit.form.Button' id='editTags'  parseOnLoad='false' type='submit'>Edit tags</button> " +
                "<button data-dojo-type='dijit.form.Button' id='editShape' parseOnLoad='false' type='submit'>Edit shape</button> ",
            autoFocus: false
        });
        on(registry.byId('editTags'), 'click', lang.hitch(this,this.editTags,entity));
		dijit.popup.open({ popup: this.editortooltip, x: x, y: y });
	},
	
	closeEditorTooltip:function() {
		// summary:		Close the tooltip.
		array.forEach(['editTags','editShape'], function(b){
			if (!registry.byId(b)) return;
			registry.byId(b).type = ''; // fix Safari issue
			registry.byId(b).destroy();	// remove from registry so we can reinitialise next time
		});
		if (this.editortooltip) {
            dijit.popup.close(this.editortooltip);
        }
	},

	editTags:function(entity) {
		// summary:		Open a tag editor for the selected entity.
		var tagEditor = new iD.tags.TagEditor(entity,this.controller);
		this.closeEditorTooltip();
	}

});

// ----------------------------------------------------------------------
// End of module
});
