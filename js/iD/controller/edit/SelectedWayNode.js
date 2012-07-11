// iD/controller/edit/SelectedWayNode.js

define(['dojo/_base/declare','iD/controller/ControllerState'], function(declare){

// ----------------------------------------------------------------------
// SelectedWayNode class

declare("iD.controller.edit.SelectedWayNode", [iD.controller.ControllerState], {

	node: null,
	way: null,

	constructor:function(_node,_way) {
		this.node=_node;
		this.way=_way;
	},
	enterState:function() {
		this.controller.map.getUI(this.way ).setStateClass('shownodes').redraw();
		this.controller.map.getUI(this.node).setStateClass('selected' ).redraw();
	},
	exitState:function() {
		this.controller.map.getUI(this.way ).resetStateClass('shownodes').redraw();
		this.controller.map.getUI(this.node).resetStateClass('selected' ).redraw();
	},
	
	processMouseEvent:function(event,entityUI) {
		var entity=entityUI ? entityUI.entity : null;
		var entityType=entity ? entity.entityType : null;

		if (event.type=='click') {
			switch (entityType) {
				case null:
					return new iD.controller.edit.NoSelection();
				case 'node':
					var ways=entity.parentWays();
					if (entity.hasParent(this.way)) { return new iD.controller.edit.SelectedWayNode(entity,this.way); }
					else if (ways.length==0)        { return new iD.controller.edit.SelectedPOINode(entity); }
					else                            { return new iD.controller.edit.SelectedWayNode(entity,ways[0]); }
				case 'way':
					return new iD.controller.edit.SelectedWay(entityUI.entity);
			}
		}
		return this;
	},
	
});

// ----------------------------------------------------------------------
// End of module
});
