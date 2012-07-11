// iD/controller/shape/SelectedWay.js

/*
	Add road or shape -> SelectedWay

	The user has clicked 'Add road or shape', then a way to start the new way at.

*/

define(['dojo/_base/declare',
		'iD/actions/UndoableAction',
		'iD/controller/ControllerState',
		], function(declare){

// ----------------------------------------------------------------------
// SelectedWayNode class

declare("iD.controller.shape.SelectedWay", [iD.controller.ControllerState], {

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
