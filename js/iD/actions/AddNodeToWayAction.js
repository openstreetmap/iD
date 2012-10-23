// iD/actions/AddNodeToWayAction.js

define(['dojo/_base/declare','iD/actions/UndoableAction'], function(declare){

    // ----------------------------------------------------------------------
    // AddNodeToWayAction class

    declare("iD.actions.AddNodeToWayAction", [iD.actions.UndoableEntityAction], {

        node: null,
        nodeList: null,
        index: 0,
        firstNode: null,
        autoDelete: true,

        constructor: function(way, node, nodeList, index, autoDelete) {
            // summary:		Add a node to a way at a specified index, or -1 for the end of the way.
            this.entity = way;
            this.node = node;
            this.nodeList = nodeList;
            this.index = index;
            this.autoDelete = autoDelete;
        },

        doAction: function() {
            var way = this.entity; // shorthand

            // undelete way if it was deleted before (only happens on redo)
            if (way.deleted) {
                way.setDeletedState(false);
                if (!this.firstNode.hasParentWays()) {
                    this.firstNode.connection.unregisterPOI(firstNode);
                }
                this.firstNode.addParent(way);
            }

            // add the node
            if (this.index === -1) this.index = this.nodeList.length;
            this.node.entity.addParent(way);
            this.node.connection.unregisterPOI(this.node);
            this.nodeList.splice(this.index, 0, this.node);
            this.markDirty();
            way.calculateBbox();

            return this.SUCCESS;
        },

        undoAction: function() {
            // summary:		Remove the added node. Fixme: if the way is now 1-length, we should
            //				do something like deleting it and converting the remaining node to a POI.
            var way=this.entity;	// shorthand
            if (this.autoDelete && way.length() === 2 &&
                way.parentRelations().length()) return this.FAIL;

                // remove node
                var removed=nodeList.splice(index, 1);
                if (!_.contains(this.nodeList, removed[0])) {
                    removed[0].removeParent(way);
                }
                this.markClean();
                way.connection.refreshEntity(way);

                return this.SUCCESS;
        }
    });

// ----------------------------------------------------------------------
// End of module
});
