// iD/controller/shape/NoSelection.js

/*
	Add road or shape -> NoSelection

	The user has clicked 'Add road or shape', but hasn't yet started drawing.
	
	Goes to:
	-> click empty area: goes to shape/DrawWay
	-> click way: goes to shape/SelectedWay
	-> click way-node: goes to shape/SelectedWayNode
	-> click POI: ** not done yet, needs to ask "convert to shape"?

*/

define(['dojo/_base/declare','dojo/_base/lang',
		'iD/actions/UndoableAction',
		'iD/controller/ControllerState',
		'iD/controller/shape/DrawWay',
		'iD/controller/shape/SelectedWay',
		'iD/controller/shape/SelectedPOINode',
		], function(declare,lang){

// ----------------------------------------------------------------------
// ControllerState base class

declare("iD.controller.shape.NoSelection", [iD.controller.ControllerState], {

	constructor:function() {
		// summary:		In 'Draw shape' mode but nothing is selected.
	},

	enterState:function() {
		this.controller.stepper.setSteps({
			begin: "Click anywhere on the map to start drawing there",
			draw: "Keep clicking to add each point, and press Enter or double-click when you're done",
			tag: "Set the type of the road or shape"
		},['begin','draw','tag']).highlight('begin');
	},
	
	processMouseEvent:function(event,entityUI) {
		var entity=entityUI ? entityUI.entity : null;
		var entityType=entity ? entity.entityType : null;
		var map=this.controller.map;

		if (event.type=='click') {
			switch (entityType) {
				case 'node':
					// Click to select a node
					var ways=entity.parentWays();
					if (ways.length==0) { return new iD.controller.shape.SelectedPOINode(entity); }
//					               else { return new iD.controller.shape.SelectedWayNode(entity,ways[0]); }
//					               ** FIXME: ^^^ the above should start a new branching way, not select the node
					return this;
				case 'way':
					// Click to select a way
					return new iD.controller.shape.SelectedWay(entityUI.entity);
				default:
					// Click to start a new way
					var undo = new iD.actions.CompositeUndoableAction();
					console.log("Event is ",event.type);
					var startNode = this.getConnection().doCreateNode(
						{}, 
						map.coord2lat(map.mouseY(event)),
						map.coord2lon(map.mouseX(event)), lang.hitch(undo,undo.push) );
					var way = this.getConnection().doCreateWay({}, [startNode], lang.hitch(undo,undo.push) );
					this.controller.undoStack.addAction(undo);
					this.controller.map.createUI(way);
					console.log("Started new way");
					return new iD.controller.shape.DrawWay(way);
			}
		}
		return this;
	},
	
});

// ----------------------------------------------------------------------
// End of module
});
