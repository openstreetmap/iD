// ----------------------------------------------------------------------
// edit.NoSelection class

iD.controller.edit.NoSelection = function() {};
iD.controller.edit.NoSelection.prototype = {

	constructor: function() {
		// summary:	In 'Edit object' mode but nothing selected.
	},

	enterState: function() {
		// this.controller.stepper.hide();
	},

	processMouseEvent: function(event, entityUI) {
        if (!entityUI) { return this; }
        var entity = entityUI.entity;
        if (event.type === 'click') {
            this.inherited(arguments);
            if (entity.entityType === 'node') {
                var ways = entity.entity.parentWays();
                if (!ways.length) {
                    return new iD.controller.edit.SelectedPOINode(entity);
                } else {
                    return new iD.controller.edit.SelectedWayNode(entity,ways[0]);
                }
            } else if (entity.entityType === 'way') {
                return new iD.controller.edit.SelectedWay(entityUI.entity, event);
            }
        }
        return this;
	}
};
