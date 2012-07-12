// iD/controller/edit/SelectedPOINode.js

define(['dojo/_base/declare','iD/controller/edit/EditBaseState'], function(declare){

// ----------------------------------------------------------------------
// SelectedPOINode class

declare("iD.controller.edit.SelectedPOINode", [iD.controller.edit.EditBaseState], {

	node: null,
	nodeUI: null,

	constructor:function(_node) {
		this.node=_node;
	},
	enterState:function() {
		var map=this.controller.map;
		this.nodeUI=map.getUI(this.node);
		this.nodeUI.setStateClass('selected');
		this.nodeUI.redraw();
		this.openEditorTooltip(map.lon2screen(this.node.lon),
		                       map.lat2screen(this.node.lat), this.node);
	},
	exitState:function() {
		this.nodeUI.resetStateClass('selected');
		this.nodeUI.redraw();
		this.closeEditorTooltip();
	},
	
	processMouseEvent:function(event,entityUI) {
		var entity=entityUI ? entityUI.entity : null;
		var entityType=entity ? entity.entityType : null;

		if (event.type=='click') {
			switch (entityType) {
				case null: 		return new iD.controller.edit.NoSelection();
				case 'node': 	return new iD.controller.edit.SelectedPOINode(entityUI.entity);
				case 'way': 	return new iD.controller.edit.SelectedWay(entityUI.entity, event);
			}
		}
		return this;
	},
	
});

// ----------------------------------------------------------------------
// End of module
});
