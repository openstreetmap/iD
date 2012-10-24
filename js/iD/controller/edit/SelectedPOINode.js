// ----------------------------------------------------------------------
// edit.SelectedPOINode class

iD.controller.edit.SelectedPOINode = function() {};
iD.controller.edit.SelectedPOINode.prototype = {

    node: null,
    nodeUI: null,

    constructor: function(node) {
        // summary:		In 'Edit object' mode and a POI node is selected.
        this.node = node;
    },

    enterState: function() {
        var map = this.controller.map;
        this.nodeUI = map.getUI(this.node);
        this.nodeUI.setStateClass('selected')
        .redraw();
        this.openEditorTooltip(this.node);
        return this;
    },

    exitState: function() {
        this.nodeUI.resetStateClass('selected')
        .redraw();
        this.closeEditorTooltip();
        return this;
    },

    processMouseEvent: function(event, entityUI) {
        if (event.type !== 'click') return this;
        var entity = entityUI ? entityUI.entity : null;
        var entityType = entity ? entity.entityType : null;
        switch (entityType) {
            case null: return new iD.controller.edit.NoSelection();
            case 'node': return new iD.controller.edit.SelectedPOINode(entityUI.entity);
            case 'way': return new iD.controller.edit.SelectedWay(entityUI.entity, event);
        }
        return this;
    }

};
