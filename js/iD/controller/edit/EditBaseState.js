// iD/controller/edit/EditBaseState.js

define(['dojo/_base/declare','dojo/_base/lang','dojo/_base/array','dojo/on',
        'dijit/registry','dijit/TooltipDialog','dijit/Dialog','dijit/popup',
        'iD/controller/ControllerState','iD/tags/TagEditor'], function(declare,lang,array,on,registry){

// ----------------------------------------------------------------------
// EditBaseState class - provides shared UI functions to edit mode states

declare("iD.controller.edit.EditBaseState", [iD.controller.ControllerState], {

	editortooltip: null,

    constructor: function() {
        // summary:	Base state for the 'Edit object' states - where an
        // object is selected and the user is making changes to it.
    },

    openEditorTooltip: function(x, y, entity) {
        // summary:		Open the initial 'Edit tags/Edit shape' tooltip.
        // x: Number	Screen co-ordinate.
        // y: Number	Screen co-ordinate.
        // entity: iD.Entity	The entity to be edited.
        $('.edit-pane h2').text(iD.Util.friendlyName(entity));
        $('.edit-pane').css({
            left: x,
            top: y
        }).show();
        $('.edit-pane a[href=#close]').click(this.closeEditorTooltip);
    },

    closeEditorTooltip: function(e) {
        if (e) e.preventDefault();
        // summary:		Close the tooltip.
        $('.edit-pane').hide();
    },

    editTags:function(entity) {
        // summary:		Open a tag editor for the selected entity.
        var tagEditor = new iD.tags.TagEditor(entity, this.controller);
        this.closeEditorTooltip();
    }
});

// ----------------------------------------------------------------------
// End of module
});
