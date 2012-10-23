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

define(['dojo/_base/declare',
		'iD/actions/UndoableAction',
		'iD/controller/shape/DrawWay',
		'iD/controller/shape/SelectedWay',
		'iD/controller/shape/SelectedPOINode'
		], function(declare) {

// ----------------------------------------------------------------------
// ControllerState base class

declare("iD.controller.shape.NoSelection", null, {

	constructor: function(intent) {
		// summary:		In 'Draw shape' mode but nothing is selected.
        this.intent = intent;
	},

    exitState: function() {
        this.controller.map.div.className = '';
    },

	enterState: function() {
        this.controller.map.div.className = 'state-drawing';
        if (this.intent === 'way') {
            this.controller.stepper.show().step(0);
        } else if (this.intent === 'node') {
            this.controller.stepper.show().message('Click on the map to add a place');
        }
	},

    processMouseEvent: function(event, entityUI) {
        var entity = entityUI ? entityUI.entity : null;
        var entityType = entity ? entity.entityType : null;
        var map = this.controller.map;
        var connection = map.connection;

        if (event.type === 'click') {
            if (entityType === 'node') {
                // Click to select a node
                var ways = entity.parentWays();
                if (!ways.length) { return new iD.controller.shape.SelectedPOINode(entity); }
                //  else { return new iD.controller.shape.SelectedWayNode(entity,ways[0]); }
                //  ** FIXME: ^^^ the above should start a new branching way, not select the node
                return this;
            } else if (entityType === 'way') {
                if (this.intent === 'way') {
                    // Click to select a way
                    return new iD.controller.shape.SelectedWay(entityUI.entity);
                }
            } else {
                if (this.intent === 'way') {
                    // Click to start a new way
                    var undo = new iD.actions.CompositeUndoableAction();
                    var startNode = connection.doCreateNode({}, 
                        map.coord2lat(map.mouseY(event)),
                        map.coord2lon(map.mouseX(event)), _.bind(undo.push, undo) );
                    var way = connection.doCreateWay({}, [startNode], _.bind(undo.push, undo) );
                    this.controller.undoStack.addAction(undo);
                    this.controller.map.createUI(way);
                    return new iD.controller.shape.DrawWay(way);
                } else if (this.intent === 'node') {
                    var action = new iD.actions.CreatePOIAction(connection, {},
                        map.coord2lat(map.mouseY(event)),
                        map.coord2lon(map.mouseX(event)));
                    if (action.run()) {
                        this.controller.undoStack.add(action);
                        var node = action.getNode();
                        this.controller.map.createUI(node);
                        var state = new iD.controller.edit.SelectedPOINode(node);
                        state.controller = this.controller;
                        state.enterState();
                        return state;
                    }
                }
            }
        }
        return this;
    }
});

// ----------------------------------------------------------------------
// End of module
});
