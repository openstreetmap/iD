// iD/controller/edit/SelectedWayNode.js

define(['dojo/_base/declare','iD/controller/edit/EditBaseState'], function(declare){

// ----------------------------------------------------------------------
// SelectedWayNode class

declare("iD.controller.edit.SelectedWayNode", [iD.controller.edit.EditBaseState], {

	node: null,
	way: null,

	constructor:function(node, way) {
		// summary:		In 'Edit object' mode and a node in a way is selected.
		this.node = node;
		this.way = way;
	},
	enterState:function() {
		var map=this.controller.map;
		map.getUI(this.way).setStateClass('shownodes').redraw();
		map.getUI(this.node).setStateClass('selected' ).redraw();
        this.openEditorTooltip(map.lon2screen(this.node.lon),
                               map.lat2screen(this.node.lat), this.node);
    },
	exitState:function() {
		var map=this.controller.map;
		map.getUI(this.way).resetStateClass('shownodes').redraw();
		map.getUI(this.node).resetStateClass('selected' ).redraw();
        this.closeEditorTooltip();
    },

    processMouseEvent:function(event,entityUI) {
        if (event.type !== 'click') return;
        var entity = entityUI ? entityUI.entity : null;
        var entityType = entity ? entity.entityType : null;

        switch (entityType) {
            case null:
                return new iD.controller.edit.NoSelection();
            case 'node':
                var ways = entity.entity.parentWays();
                if (entity.entity.hasParent(this.way)) {
                    return new iD.controller.edit.SelectedWayNode(entity,this.way);
                } else if (!ways.length) {
                    return new iD.controller.edit.SelectedPOINode(entity);
                } else {
                    return new iD.controller.edit.SelectedWayNode(entity,ways[0]);
                }
                break;
            case 'way':
                return new iD.controller.edit.SelectedWay(entityUI.entity, event);
        }
        return this;
    }

});

// ----------------------------------------------------------------------
// End of module
});
