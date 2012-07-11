// iD/controller/edit/SelectedPOINode.js

define(['dojo/_base/declare','iD/controller/ControllerState'], function(declare){

// ----------------------------------------------------------------------
// SelectedPOINode class

declare("iD.controller.edit.SelectedPOINode", [iD.controller.ControllerState], {

	node: null,
	nodeUI: null,

	constructor:function(_node) {
		this.node=_node;
	},
	enterState:function() {
		this.nodeUI=this.controller.map.getUI(this.node);
		this.nodeUI.setStateClass('selected');
		this.nodeUI.redraw();
	},
	exitState:function() {
		this.nodeUI.resetStateClass('selected');
		this.nodeUI.redraw();
	},
	
	processMouseEvent:function(event,entityUI) {
		var entity=entityUI ? entityUI.entity : null;
		var entityType=entity ? entity.entityType : null;

		if (event.type=='click') {
			switch (entityType) {
				case null: 		return new iD.controller.edit.NoSelection();
				case 'node': 	return new iD.controller.edit.SelectedPOINode(entityUI.entity);
				case 'way': 	return new iD.controller.edit.SelectedWay(entityUI.entity);
			}
		}
		return this;
	},
	
});

// ----------------------------------------------------------------------
// End of module
});
