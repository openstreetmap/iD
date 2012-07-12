// iD/actions/MoveNodeAction.js

define(['dojo/_base/declare','iD/actions/UndoableAction'], function(declare){

// ----------------------------------------------------------------------
// MoveNodeAction class

declare("iD.actions.MoveNodeAction", [iD.actions.UndoableEntityAction], {

	createTime: NaN,
	oldLat: NaN,
	oldLon: NaN,
	newLat: NaN,
	newLon: NaN,       
	setLatLon: null,

	constructor:function(node, newLat, newLon, setLatLon) {
		// summary:		Move a node to a new position.
		this.entity = node;
		this.newLat = newLat;
		this.newLon = newLon;
		this.setLatLon = setLatLon;
		this.createTime = new Date().getTime();
	},

	doAction:function() {
		var node = this.entity;
		this.oldLat = node.lat;
		this.oldLon = node.lon;
		if (this.oldLat==this.newLat && this.oldLon==this.newLon) { return NO_CHANGE; }
		this.setLatLon(this.newLat, this.newLon);
		this.markDirty();
		node.refresh();
		return this.SUCCESS;
	},

	undoAction:function() {
		this.setLatLon(this.oldLat, this.oldLon);
		this.markClean();
		this.refresh();
		return this.SUCCESS;
	},

	mergePrevious:function(prev) {
		if (prev.declaredClass!=this.declaredClass) { return false; }
		
		if (prev.entity == this.entity && prev.createTime+1000>this.createTime) {
			this.oldLat = prev.oldLat;
			this.oldLon = prev.oldLon;
			return true;
		}
		return false;
	},

});

// ----------------------------------------------------------------------
// End of module
});
