// ----------------------------------------------------------------------
// edit.SelectedWay class

iD.controller.edit.SelectedWay = function() {};
iD.controller.edit.SelectedWay.prototype = {

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
        this.wayUI.resetStateClass('selected');
        this.wayUI.resetStateClass('shownodes');
        this.wayUI.redraw();
        this.closeEditorTooltip();
    },

    processMouseEvent:function(event, entityUI) {
        var entity = entityUI ? entityUI.entity : null;
        var entityType =  entity ? entity.entityType : null;

        if (event.type === 'click') {
            switch (entityType) {
                case null:
                    return new iD.controller.edit.NoSelection();
                case 'node':
                    var ways = entity.entity.parentWays();
                if (entity.entity.hasParent(this.way)) {
                    return new iD.controller.edit.SelectedWayNode(entity, this.way);
                } else if (!ways.length) {
                    return new iD.controller.edit.SelectedPOINode(entity);
                } else {
                    return new iD.controller.edit.SelectedWayNode(entity, ways[0]);
                }
                break;
                case 'way':
                    return new iD.controller.edit.SelectedWay(entityUI.entity, event);
            }
        } else { }
        return this;
    }

};
