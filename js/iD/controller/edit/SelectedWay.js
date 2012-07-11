// iD/controller/edit/SelectedWay.js

define(['dojo/_base/declare','iD/controller/ControllerState'], function(declare){

// ----------------------------------------------------------------------
// SelectedWay class

declare("iD.controller.edit.SelectedWay", [iD.controller.ControllerState], {

	way: null,
	wayUI: null,

	constructor:function(_way) {
		this.way=_way;
	},
	enterState:function() {
		this.wayUI=this.controller.map.getUI(this.way);
		this.wayUI.setStateClass('selected');
		this.wayUI.setStateClass('shownodes');
		this.wayUI.redraw();
	},
	exitState:function() {
		this.wayUI.resetStateClass('selected');
		this.wayUI.resetStateClass('shownodes');
		this.wayUI.redraw();
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
		} else {
		}
		return this;
	},
	
});

// ----------------------------------------------------------------------
// End of module
});
