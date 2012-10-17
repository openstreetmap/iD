// iD/controller/edit/NoSelection.js

define(['dojo/_base/declare',
		'iD/controller/edit/EditBaseState',
		'iD/controller/edit/SelectedWay',
		'iD/controller/edit/SelectedWayNode',
		'iD/controller/edit/SelectedPOINode'
		], function(declare){

// ----------------------------------------------------------------------
// edit.NoSelection class

declare("iD.controller.edit.NoSelection", [iD.controller.edit.EditBaseState], {

	constructor:function() {
		// summary:		In 'Edit object' mode but nothing selected.
	},

	enterState:function() {
		this.controller.stepper.hide();
	},

	processMouseEvent:function(event,entityUI) {
		if (!entityUI) { return this; }
		var entity = entityUI.entity;
		if (event.type=='click') {
            this.inherited(arguments);
			switch (entity.entityType) {
				case 'node':
					var ways=entity.entity.parentWays();
					if (!ways.length) { return new iD.controller.edit.SelectedPOINode(entity); }
                    else { return new iD.controller.edit.SelectedWayNode(entity,ways[0]); }
                    break;
				case 'way':
					return new iD.controller.edit.SelectedWay(entityUI.entity, event);
			}
		}
		return this;
	}
});

// ----------------------------------------------------------------------
// End of module
});
