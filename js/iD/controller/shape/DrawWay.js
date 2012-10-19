// iD/controller/shape/DrawWay.js

/*
	Add road or shape -> DrawWay

	The user is drawing a way.

	Goes to:
	-> click empty area: adds point, continues
	-> click way: adds junction, continues
	-> click node: adds to way, continues
	-> double-click, or click this way: goes to Edit/SelectedWay

*/


define(['dojo/_base/declare', 'dojo/_base/lang', 'dojox/gfx/shape', 'iD/controller/ControllerState'], 
       function(declare, lang, shape){

// ----------------------------------------------------------------------
// DrawWay class

declare("iD.controller.shape.DrawWay", [iD.controller.ControllerState], {

	way: null,
	wayUI: null,
	editEnd: false,

	constructor: function(way) {
		this.way = way;
    },

    enterState: function() {
        this.wayUI = this.controller.map.getUI(this.way);
        this.wayUI.setStateClass('selected')
            .setStateClass('shownodes')
            .redraw();
        this.controller.stepper.step(1);
    },

    exitState: function() {
        this.controller.map.clearElastic();
        this.wayUI
            .resetStateClass('selected')
            .resetStateClass('shownodes')
            .redraw();
    },

	processMouseEvent: function(event, entityUI) {
		var entity = entityUI ? entityUI.entity : null;
        var entityType = entity ? entity.entityType : null;
        var map = this.controller.map;
        var ways, undo, action;

        if (event.type === 'mouseover' &&
            entityType === 'way' &&
            entityUI !== this.wayUI) {

            // Mouse over way, show hover highlight
            entityUI.setStateClass('shownodeshover')
                .redraw();
            this.wayUI.redraw();
            this.updateElastic(event);
            return this;

        } else if (event.type=='mouseout' && entityType=='way' &&
                   entityUI !== this.wayUI) {
            // Mouse left way, remove hover highlight
            // Find what object we're moving into
            var into = shape.byId((event.hasOwnProperty('toElement') ? event.toElement : event.relatedTarget).__gfxObject__);
            // If it's a nodeUI that belongs to a hovering way, don't deselect
			if (into &&
                into.hasOwnProperty('source') &&
                into.source.hasStateClass('hoverway') &&
                into.source.entity.entity.hasParent(entity)) {
                return this;
            }
			entityUI.resetStateClass('shownodeshover');
			entityUI.redraw();
			this.wayUI.redraw();
			this.updateElastic(event);
			return this;

		} else if (event.type=='mouseout' && entityType=='node') {
			// Mouse left node, remove hover highlight from parent way too
			ways = entity.entity.parentWays();
			for (var i in ways) {
				var ui = this.controller.map.getUI(ways[i]);
				if (ui && ui.hasStateClass('shownodeshover')) {
					ui.resetStateClass('shownodeshover');
					ui.redraw();
				}
			}
			this.updateElastic(event);
			this.wayUI.redraw();
			return this;

		} else if (event.type=='mousemove') {
			// Mouse moved, update elastic
			this.updateElastic(event);
			return this;

		} else if (event.type=='mousedown') {
			switch (entityType) {
				case 'node':
					// Click on node
					if (entity === this.getDrawingNode()) {
						// Double-click, so complete drawing
						this.controller.stepper.step(2);
						return new iD.controller.edit.SelectedWay(this.way, null);
					} else if (entity === this.getStartNode()) {
						// Start of this way, so complete drawing
						this.appendNode(entity, this.undoAdder() );
						this.controller.stepper.step(2);
						return new iD.controller.edit.SelectedWay(this.way, null);
					} else {
						// Add to way
						this.appendNode(entity, this.undoAdder() );
						return this;
					}
                    break;

				case 'way':
					// Click on way, add new junction node to way
					ways = [entity];	// ** needs to find all the ways under the mouse
					undo = new iD.actions.CompositeUndoableAction();
					var node=this.appendNewNode(event, undo);
					_.each(ways, function(w) {
                        w.doInsertNodeAtClosestPosition(node, true, lang.hitch(undo, undo.push));
                    });
					action = this.undoAdder();
                    action(undo);
					return this;
			}

		} else if (event.type=='click') {
			// Click on empty space, add new node to way
			undo = new iD.actions.CompositeUndoableAction();
			this.appendNewNode(event, undo);
			action = this.undoAdder(); action(undo);
			return this;
		}

		return this;
	},

	updateElastic:function(event) {
		var map = this.controller.map;
		map.drawElastic(
			map.lon2coord(this.getDrawingNode().lon),
			map.lat2coord(this.getDrawingNode().lat),
			map.mouseX(event), map.mouseY(event)
		);
	},

	getDrawingNode:function() {
		return this.editEnd ?
            this.way.nodes[this.way.nodes.length - 1] : this.way.nodes[0];
	},

	getStartNode:function() {
		return this.editEnd ?
            this.way.nodes[0] : this.way.nodes[this.way.nodes.length - 1];
	},

	appendNode:function(node, performAction) {
        if (this.editEnd) {
            this.way.doAppendNode(node, performAction);
            this.controller.map.refreshUI(this.way);
        }
        else { this.way.doPrependNode(node, performAction); }
    },

	appendNewNode:function(event, undo) {
		var map=this.controller.map;
		var node=this.getConnection().doCreateNode({},
			map.coord2lat(map.mouseY(event)),
			map.coord2lon(map.mouseX(event)), lang.hitch(undo,undo.push) );
		this.appendNode(node, lang.hitch(undo,undo.push));
		return node;
	}
});

// ----------------------------------------------------------------------
// End of module
});
