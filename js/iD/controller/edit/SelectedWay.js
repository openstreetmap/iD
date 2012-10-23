// iD/controller/edit/SelectedWay.js

define(['dojo/_base/declare','iD/controller/edit/EditBaseState'], function(declare){

    // ----------------------------------------------------------------------
    // edit.SelectedWay class

    declare("iD.controller.edit.SelectedWay", [iD.controller.edit.EditBaseState], {

        way: null,
        wayUI: null,
        entryevent: null,

        constructor:function(way, event) {
            // summary:		In 'Edit object' mode and a way is selected.
            this.way = way;
            this.entryevent = event;
        },

        enterState:function() {
            this.wayUI = this.controller.map.getUI(this.way);
            this.wayUI.setStateClass('selected');
            this.wayUI.setStateClass('shownodes');
            if (this.entryevent) {
                this.openEditorTooltip(this.entryevent.clientX, this.entryevent.clientY, this.way);
            }
            this.wayUI.redraw();
        },

        exitState:function() {
            console.log('exiting');
            this.wayUI.resetStateClass('selected');
            this.wayUI.resetStateClass('shownodes');
            this.wayUI.redraw();
            this.closeEditorTooltip();
        },

        processMouseEvent:function(event, entityUI) {
            if (event.type !== 'click') return this;

            var entity = entityUI ? entityUI.entity : null;
            var entityType =  entity ? entity.entityType : null;

            if (!entityType) {
                return new iD.controller.edit.NoSelection();
            } else if (entityType === 'node') {
                var ways = entity.entity.parentWays();
                if (entity.entity.hasParent(this.way)) {
                    return new iD.controller.edit.SelectedWayNode(entity, this.way);
                } else if (!ways.length) {
                    return new iD.controller.edit.SelectedPOINode(entity);
                } else {
                    return new iD.controller.edit.SelectedWayNode(entity, ways[0]);
                }
            } else if (entityType === 'way') {
                return new iD.controller.edit.SelectedWay(entityUI.entity, event);
            } else {
                return this;
            }
        }
    });

    // ----------------------------------------------------------------------
    // End of module
});
