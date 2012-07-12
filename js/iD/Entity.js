// iD/Entity.js
// Entity classes for iD

define(['dojo/_base/declare','dojo/_base/array','dojo/_base/lang',
        'iD/actions/AddNodeToWayAction','iD/actions/MoveNodeAction'
       ], function(declare,array,lang){

// ----------------------------------------------------------------------
// Entity base class

declare("iD.Entity", null, {
	connection: null,
	id: NaN,
	loaded: false,
	tags: null,
	entityType: '',
	parents: null,
	modified: false,
	deleted: false,
	MAINKEYS: ['highway','amenity','railway','waterway'],

	constructor:function() {
		this.tags={};
		this.parents=new Hashtable();
	},
	
	isType:function(_type) {
		return this.entityType==_type;
	},

	toString:function() {
		return this.entityType+"."+this.id;
	},

	// Provoke redraw and other changes

	refresh:function() { this.connection.refreshEntity(this); },
	
	// Clean and dirty (only called from UndoableEntityAction)
	
	markClean:function() { this.modified=false; },
	markDirty:function() { this.modified=true; },
	isDirty:function() { return this.modified; },
	
	// Deletion
	
	setDeletedState:function(isDeleted) { this.deleted=isDeleted; },

	// Bounding box check (to be overridden)

	within:function(left,right,top,bottom) { return !this.deleted; },

	// Tag functions

	getTagsHash:function() {
		return this.tags;
	},
	
	numTags:function() {
		var c=0;
		for (var i in this.tags) { c++; }
		return c;
	},
	
	friendlyName:function() {
		if (this.numTags()==0) { return ''; }
		var n=[];
		if (this.tags['name']) { n.push(this.tags['name']); }
		if (this.tags['ref']) { n.push(this.tags['ref']); }
		if (n.length==0) {
			for (var i=0; i<this.MAINKEYS.length; i++) {
				if (this.tags[this.MAINKEYS[i]]) { n.push(this.tags[this.MAINKEYS[i]]); break; }
			}
		}
		return n.length==0 ? 'unknown' : n.join('; ');
	},

	// Parent-handling
	
	addParent:function(_entity) {
		this.parents.put(_entity,true);
	},
	removeParent:function(_entity) {
		this.parents.remove(_entity);
	},
	hasParent:function(_entity) {
		return this.parents.containsKey(_entity);
	},
	parentObjects:function() {
		return this.parents.keys();
	},
	hasParentWays:function() {
		var p=this.parentObjects();
		for (var i in p) {
			if (p[i].entityType=='way') { return true; }
		}
		return false;
	},
	parentWays:function() {
		return this.parentObjectsOfClass('way');
	},
	parentRelations:function() {
		return this.parentObjectsOfClass('relation');
	},
	parentObjectsOfClass:function(_class) {
		var p=this.parentObjects(), c=[];
		for (var i in p) {
			if (p[i].entityType==_class) { c.push(p[i]); }
		}
		return c;
	},
	// Halcyon also implements:
	// removeFromParents()
	// hasParents()
	// findParentRelationsOfType(type,role)
	// getRelationMemberships()
	// countParentObjects(within)
	// memberships()
	
});

// ----------------------------------------------------------------------
// Node class

declare("iD.Node", [iD.Entity], {
	lat:NaN,
	latp:NaN,
	lon:NaN,
	entityType:"node",

	constructor:function(_conn,_id,_lat,_lon,_tags,_loaded) {
		this.connection=_conn;
		this.id=Number(_id);
		this.lat=Number(_lat);
		this.lon=Number(_lon);
		this.tags=_tags;
		this.loaded=(_loaded==undefined) ? true : _loaded;
		this.project();
		this.modified=this.id<0;
	},
	
	project:function() { this.latp=180/Math.PI * Math.log(Math.tan(Math.PI/4+this.lat*(Math.PI/180)/2)); },
	latp2lat:function(a) { return 180/Math.PI * (2 * Math.atan(Math.exp(a*Math.PI/180)) - Math.PI/2); },

	within:function(left,right,top,bottom) { return (this.lon>=left) && (this.lon<=right) && (this.lat>=bottom) && (this.lat<=top) && !this.deleted; },

	refresh:function() {
		var ways=this.parentWays();
		var conn=this.connection;
		array.forEach(ways,function(way) { conn.refreshEntity(way); });
		this.connection.refreshEntity(this);
	},

	doSetLonLatp:function(lon,latproj,performAction) {
		performAction(new iD.actions.MoveNodeAction(this, this.latp2lat(latproj), lon, lang.hitch(this,this._setLatLonImmediate) ));
	},

	_setLatLonImmediate:function(lat,lon) {
		this.lat = lat;
		this.lon = lon;
		this.project();
		var ways = this.parentWays();
		for (var i=0; i<ways.length; i++) { ways[i].expandBbox(this); }
	},
	
});

// ----------------------------------------------------------------------
// Way class

declare("iD.Way", [iD.Entity], {
	nodes: null,
	entityType: "way",
	edgel: NaN,
	edger: NaN,
	edget: NaN,
	edgeb: NaN,

	constructor:function(_conn,_id,_nodes,_tags,_loaded) {
		this.connection=_conn;
		this.id=Number(_id);
		this.nodes=_nodes;
		this.tags=_tags;
		this.loaded=(_loaded==undefined) ? true : _loaded;
		this.modified=this.id<0;
		var w=this; array.forEach(_nodes,function(node) { 
			node.addParent(w);
		});
		this.calculateBbox();
	},
	
	length:function() {
		return this.nodes.length;
	},
	
	isClosed:function() {
		return this.nodes[this.nodes.length-1]==this.nodes[0];
	},

	isType:function(_type) {
		switch (_type) {
			case 'way': 	return true;
			case 'area': 	return this.isClosed;
			case 'line': 	return !(this.isClosed);
		}
		return false;
	},

	getNode:function(index) { return this.nodes[index]; },
	getFirstNode:function() { return this.nodes[0]; },
	getLastNode:function() { return this.nodes[this.nodes.length-1]; },

	// Bounding-box handling

	within:function(left,right,top,bottom) {
		if (!this.edgel ||
			(this.edgel<left   && this.edger<left  ) ||
		    (this.edgel>right  && this.edger>right ) ||
		    (this.edgeb<bottom && this.edget<bottom) ||
		    (this.edgeb>top    && this.edgeb>top   ) || this.deleted) { return false; }
		return true;
	},

	calculateBbox:function() {
		this.edgel=999999; this.edger=-999999;
		this.edgeb=999999; this.edget=-999999;
		for (var i in this.nodes) { this.expandBbox(this.nodes[i]); }
	},
	
	expandBbox:function(node) {
		this.edgel=Math.min(this.edgel,node.lon);
		this.edger=Math.max(this.edger,node.lon);
		this.edgeb=Math.min(this.edgeb,node.lat);
		this.edget=Math.max(this.edget,node.lat);
	},

	// Action callers

	doAppendNode:function(node, performAction) {
		if (node!=this.getLastNode()) performAction(new iD.actions.AddNodeToWayAction(this, node, this.nodes, -1, true));
		return this.nodes.length + 1;
	},

	doPrependNode:function(node, performAction) {
		if (node!=this.getFirstNode()) performAction(new iD.actions.AddNodeToWayAction(this, node, this.nodes, 0, true));
		return this.nodes.length + 1;
	},

	doInsertNode:function(index, node, performAction) {
		if (index>0 && this.getNode(index-1)==node) return;
		if (index<this.nodes.length-1 && this.getNode(index)==node) return;
		performAction(new iD.actions.AddNodeToWayAction(this, node, this.nodes, index, false));
	},
	
	doInsertNodeAtClosestPosition:function(newNode, isSnap, performAction) {
		var closestProportion = 1;
		var newIndex = 0;
		var snapped;

		for (var i=0; i<this.nodes.length-1; i++) {
			var node1 = this.getNode(i);
			var node2 = this.getNode(i+1);
			var directDist = this.pythagoras(node1, node2);
			var viaNewDist = this.pythagoras(node1, newNode) + this.pythagoras(node2, newNode);
			var proportion = Math.abs(viaNewDist/directDist - 1);
			if (proportion < closestProportion) {
				newIndex = i+1;
				closestProportion = proportion;
				snapped = this.calculateSnappedPoint(node1, node2, newNode);
			}
		}

		// splice in new node
		if (isSnap) { newNode.doSetLonLatp(snapped.x, snapped.y, performAction); }
		this.doInsertNode(newIndex, newNode, performAction);
		return newIndex;
	},
	
	pythagoras:function(node1, node2) { return (Math.sqrt(Math.pow(node1.lon-node2.lon,2)+Math.pow(node1.latp-node2.latp,2))); },
	calculateSnappedPoint:function(node1, node2, newNode) {
		var w = node2.lon  - node1.lon;
		var h = node2.latp - node1.latp;
		var u = ((newNode.lon-node1.lon) * w + (newNode.latp-node1.latp) * h) / (w*w + h*h);
		return { x: node1.lon + u*w, y: node1.latp + u*h };
	},
});

// ----------------------------------------------------------------------
// Relation class

declare("iD.Relation", [iD.Entity], {
	members:null,
	entityType:"relation",

	constructor:function(_conn,_id,_members,_tags,_loaded) {
		this.connection=_conn;
		this.id=Number(_id);
		this.members=_members;
		this.tags=_tags;
		this.modified=this.id<0;
		this.loaded=(_loaded==undefined) ? true : _loaded;
		var r=this; array.forEach(_members,function(member) { 
			member.entity.addParent(r);
		});
	},
	
});

// ----------------------------------------------------------------------
// RelationMember class

declare("iD.RelationMember", [], {
	entity:null,
	role:"",
	constructor:function(_entity,_role) {
		this.entity=_entity;
		this.role=_role;
	},
});

// ----------------------------------------------------------------------
// End of module
});
