// iD/controller/shape/SelectedPOINode.js

/*
	Add road or shape -> SelectedPOINode

	The user has clicked 'Add road or shape', then a POI node to be converted to a way.

*/

define(['dojo/_base/declare',
		'iD/actions/UndoableAction'
		], function(declare){

// ----------------------------------------------------------------------
// SelectedPOINode class

declare("iD.controller.shape.SelectedPOINode", null, {

	constructor:function() {
		// summary:		In 'Draw shape' mode and a POI node is selected, to be converted into a way.
		//				Not yet implemented.
	},
	
	processMouseEvent:function(event,entityUI) {
		var entity=entityUI ? entityUI.entity : null;
		var entityType=entity ? entity.entityType : null;

		return this;
	}
	
});

// ----------------------------------------------------------------------
// End of module
});
