// iD/controller/shape/SelectedWay.js

/*
	Add road or shape -> SelectedWay

	The user has clicked 'Add road or shape', then a way to start the new way at.

*/

define(['dojo/_base/declare','dojo/_base/lang',
		'iD/actions/UndoableAction',
		'iD/controller/ControllerState',
		], function(declare,lang){

// ----------------------------------------------------------------------
// SelectedWayNode class

declare("iD.controller.shape.SelectedWay", [iD.controller.ControllerState], {

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
		this.controller.stepper.setSteps({
			begin: "Click anywhere on the map to start drawing there",
			startpoint: "Click the point on the way where you want to start your new way",
			draw: "Keep clicking to add each point, and press Enter or double-click when you're done",
			tag: "Set the type of the road or shape"
		},['begin','startpoint','draw','tag']).highlight('startpoint');
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
					return new iD.controller.shape.NoSelection();
				case 'node':
					var ways=entity.parentWays();
					if (entity.hasParent(this.way)) { 
						// start a branching way from an existing point
						var way = this.getConnection().createWay({}, [entity], lang.hitch(this,this.undoAdder) );
						this.controller.map.createUI(way);
						return new iD.controller.shape.DrawWay(way);
					} else if (ways.length==0) {
						// convert POI into way
						return this;
					} else { 
						// select another way
 						return new iD.controller.shape.SelectedWay(entity.getParents()[0]);
					}
				case 'way':
					if (entity==this.way) {
						// start a branching way from a new point
						var map = this.controller.map;
						var undo = new iD.actions.CompositeUndoableAction();
						var startNode = this.getConnection().createNode(
							{}, 
							map.coord2lat(map.mouseY(event)),
							map.coord2lon(map.mouseX(event)), lang.hitch(undo,undo.push) );
						entity.doInsertNodeAtClosestPosition(startNode, true, lang.hitch(undo,undo.push));
						var way = this.getConnection().createWay({}, [startNode], lang.hitch(undo,undo.push) );
						this.controller.undoStack.addAction(undo);
						this.controller.map.createUI(way);
						return new iD.controller.shape.DrawWay(way);
					} else {
						// select another way
						return new iD.controller.shape.SelectedWay(entity);
					}
			}
		} else {
		}
		return this;
	},
	
});

// ----------------------------------------------------------------------
// End of module
});
