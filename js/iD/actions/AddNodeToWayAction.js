// iD/actions/AddNodeToWayAction.js

define(['dojo/_base/declare','iD/actions/UndoableEntityAction'], function(declare){

// ----------------------------------------------------------------------
// AddNodeToWayAction class

declare("iD.actions.AddNodeToWayAction", [iD.actions.UndoableEntityAction], {

	node: null,
	nodeList: null,
	index: 0,
	firstNode: null,
	autoDelete: true,
	
	constructor:function(_way, _node, _nodeList, _index, _autoDelete) {
		this.entity = _way;
		this.node = _node;
		this.nodeList = _nodeList;
		this.index = _index;
		this.autoDelete = _autoDelete;
	},

	doAction:function() {
		var way=this.entity;	// shorthand

		// undelete way if it was deleted before (only happens on redo)
		if (way.deleted) {
			way.setDeletedState(false);
			if (!this.firstNode.hasParentWays()) this.firstNode.connection.unregisterPOI(firstNode);
			this.firstNode.addParent(way);
		}

		// add the node
		if (this.index==-1) this.index=this.nodeList.length;
		this.node.addParent(way);
		this.node.connection.unregisterPOI(this.node);
		this.nodeList.splice(this.index, 0, this.node);
		this.markDirty();
		way.expandBbox(this.node);
		way.refresh();

		return this.SUCCESS;
	},

	undoAction:function() {
		var way=this.entity;	// shorthand
		if (this.autoDelete && way.length()==2 && way.parentRelations().length()) return this.FAIL;

		// remove node
		var removed=nodeList.splice(index, 1);
		if (this.nodeList.indexOf(removed[0])==-1) { removed[0].removeParent(way); }
		this.markClean();
		way.refresh();

		// ** if the way is now 1-length, we should do something like deleting it and
		//    converting the remaining node to a POI (see P2)
		return this.SUCCESS;
	},
});

// ----------------------------------------------------------------------
// End of module
});
