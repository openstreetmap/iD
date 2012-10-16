// iD/Way.js

define(['dojo/_base/declare','dojo/_base/array','dojo/_base/lang',
        'iD/Entity','iD/actions/AddNodeToWayAction','iD/actions/MoveNodeAction'
       ], function(declare,array,lang){

// ----------------------------------------------------------------------
// Way class

declare("iD.Way", [iD.Entity], {
	nodes: null,
	entityType: "way",
	edgel: NaN,
	edger: NaN,
	edget: NaN,
	edgeb: NaN,

	constructor:function(conn,id,nodes,tags,loaded) {
		// summary:		An OSM way.
		this.connection=conn;
		this.id=Number(id);
		this.nodes=nodes;
		this.tags=tags;
		this.loaded=(loaded==undefined) ? true : loaded;
		this.modified=this.id<0;
        _.each(nodes, _.bind(function(node) {
			node.addParent(this);
		}, this));
		this._calculateBbox();
	},
	
	length:function() {
		// summary:		Return the number of nodes in the way.
		return this.nodes.length;	// int
	},
	
	isClosed:function() {
		// summary:		Is this a closed way (first and last nodes the same)?
		return this.nodes[this.nodes.length-1]==this.nodes[0];	// Boolean
	},

	isType:function(_type) {
		// summary:		Is this a 'way' (always true), an 'area' (closed) or a 'line' (unclosed)?
		switch (_type) {
			case 'way': 	return true;
			case 'area': 	return this.isClosed;
			case 'line': 	return !(this.isClosed);
		}
		return false;	// Boolean
	},

	getNode:function(index) {
		// summary:		Return the node at the given position.
		return this.nodes[index];	// iD.Node
	},
	getFirstNode:function() {
		// summary:		Return the first node in the way.
		return this.nodes[0];		// iD.Node
	},
	getLastNode:function() { 
		// summary:		Return the last node in the way.
		return this.nodes[this.nodes.length-1];	// iD.Node
	},

	// ---------------------
	// Bounding-box handling

	within:function(left,right,top,bottom) {
		if (!this.edgel ||
			(this.edgel<left   && this.edger<left  ) ||
		    (this.edgel>right  && this.edger>right ) ||
		    (this.edgeb<bottom && this.edget<bottom) ||
		    (this.edgeb>top    && this.edgeb>top   ) || this.deleted) { return false; }
		return true;
	},

	_calculateBbox:function() {
		this.edgel=999999; this.edger=-999999;
		this.edgeb=999999; this.edget=-999999;
		for (var i in this.nodes) { this.expandBbox(this.nodes[i]); }
	},
	
	expandBbox:function(node) {
		// summary:		Enlarge the way's bounding box to make sure it includes the co-ordinates of a supplied node.
		this.edgel=Math.min(this.edgel,node.lon);
		this.edger=Math.max(this.edger,node.lon);
		this.edgeb=Math.min(this.edgeb,node.lat);
		this.edget=Math.max(this.edget,node.lat);
	},

	// --------------
	// Action callers

	doAppendNode:function(node, performAction) {
		// summary:		Add a node to the end of the way, using an undo stack.
		// returns:		New length of the way.
		if (node!=this.getLastNode()) performAction(new iD.actions.AddNodeToWayAction(this, node, this.nodes, -1, true));
		return this.nodes.length + 1;	// int
	},

	doPrependNode:function(node, performAction) {
		// summary:		Add a node to the start of the way, using an undo stack.
		// returns:		New length of the way.
		if (node!=this.getFirstNode()) performAction(new iD.actions.AddNodeToWayAction(this, node, this.nodes, 0, true));
		return this.nodes.length + 1;	// int
	},

	doInsertNode:function(index, node, performAction) {
		// summary:		Add a node at a given index within the way, using an undo stack.
		if (index>0 && this.getNode(index-1)==node) return;
		if (index<this.nodes.length-1 && this.getNode(index)==node) return;
		performAction(new iD.actions.AddNodeToWayAction(this, node, this.nodes, index, false));
	},
	
	doInsertNodeAtClosestPosition:function(newNode, isSnap, performAction) {
		// summary:			Add a node into whichever segment of the way is nearest, using an undo stack.
		// isSnap: Boolean	Should the node position be snapped to be exactly on the segment?
		// returns:			The index at which the node was inserted.
		var closestProportion = 1;
		var newIndex = 0;
		var snapped;

		for (var i=0; i<this.nodes.length-1; i++) {
			var node1 = this.getNode(i);
			var node2 = this.getNode(i+1);
			var directDist = this._pythagoras(node1, node2);
			var viaNewDist = this._pythagoras(node1, newNode) + this._pythagoras(node2, newNode);
			var proportion = Math.abs(viaNewDist/directDist - 1);
			if (proportion < closestProportion) {
				newIndex = i+1;
				closestProportion = proportion;
				snapped = this._calculateSnappedPoint(node1, node2, newNode);
			}
		}

		// splice in new node
		if (isSnap) { newNode.doSetLonLatp(snapped.x, snapped.y, performAction); }
		this.doInsertNode(newIndex, newNode, performAction);
		return newIndex;	// int
	},
	
	_pythagoras:function(node1, node2) { return (Math.sqrt(Math.pow(node1.lon-node2.lon,2)+Math.pow(node1.latp-node2.latp,2))); },
	_calculateSnappedPoint:function(node1, node2, newNode) {
		var w = node2.lon  - node1.lon;
		var h = node2.latp - node1.latp;
		var u = ((newNode.lon-node1.lon) * w + (newNode.latp-node1.latp) * h) / (w*w + h*h);
		return { x: node1.lon + u*w, y: node1.latp + u*h };
	},
});

// ----------------------------------------------------------------------
// End of module
});
