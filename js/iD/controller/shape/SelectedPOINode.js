// iD/controller/shape/SelectedPOINode.js

/*
	Add road or shape -> SelectedPOINode

	The user has clicked 'Add road or shape', then a POI node to be converted to a way.

*/

define(['dojo/_base/declare',
		'iD/actions/UndoableAction',
		'iD/controller/ControllerState',
		], function(declare){

// ----------------------------------------------------------------------
// SelectedPOINode class

declare("iD.controller.shape.SelectedPOINode", [iD.controller.ControllerState], {

	constructor:function() {
	},
	
	processMouseEvent:function(event,entityUI) {
		var entity=entityUI ? entityUI.entity : null;
		var entityType=entity ? entity.entityType : null;

		return this;
	},
	
});

// ----------------------------------------------------------------------
// End of module
});
