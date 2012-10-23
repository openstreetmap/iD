// iD/controller/shape/SelectedWay.js

// ## Add road or shape -> SelectedWay
// 
// The user has clicked 'Add road or shape',
// then clicks an existing way that their new way will be connected
// to.

define(['dojo/_base/declare',
       'iD/actions/UndoableAction'
], function(declare) {

    // ----------------------------------------------------------------------
    // SelectedWayNode class

    declare("iD.controller.shape.SelectedWay", null, {

        way: null,
        wayUI: null,

        constructor: function(way) {
            // summary:		In 'Draw shape' mode, and a way is selected as the starting point of the new way.
            this.way = way;
        },

        enterState: function() {
            this.wayUI = this.controller.map.getUI(this.way);
            this.wayUI.setStateClass('selected')
                .setStateClass('shownodes')
                .redraw();
            this.controller.stepper.message("Click the point on the way where you want to start your new way");
            return this;
        },

        exitState: function() {
            this.wayUI.resetStateClass('selected')
            .resetStateClass('shownodes')
            .redraw();
            return this;
        },

        processMouseEvent: function(event, entityUI) {
            var entity = entityUI ? entityUI.entity : null;
            var entityType = entity ? entity.entityType : null;
            var way;

            if (event.type === 'click') {
                switch (entityType) {
                    case null:
                        return new iD.controller.shape.NoSelection();
                    case 'node':
                        var ways = entity.entity.parentWays();
                    if (entity.entity.hasParent(this.way)) { 
                        // start a branching way from an existing point
                        way = this.getConnection().doCreateWay({}, [entity], _.bind(this.undoAdder, this));
                        this.controller.map.createUI(way);
                        return new iD.controller.shape.DrawWay(way);
                    } else if (ways.length===0) {
                        // convert POI into way
                        return this;
                    } else {
                        // select another way
                        return new iD.controller.shape.SelectedWay(entity.getParents()[0]);
                    }
                    break;
                    case 'way':
                        if (entity === this.way) {
                        // start a branching way from a new point
                        var map = this.controller.map;
                        var undo = new iD.actions.CompositeUndoableAction();
                        var startNode = this.getConnection().doCreateNode({}, 
                            map.coord2lat(map.mouseY(event)),
                            map.coord2lon(map.mouseX(event)), _.bind(undo.push, undo));
                        entity.doInsertNodeAtClosestPosition(startNode, true, _.bind(undo.push, undo));
                        way = this.getConnection().doCreateWay({}, [startNode], _.bind(undo.push, undo) );
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
        }

    });

    // ----------------------------------------------------------------------
    // End of module
});
