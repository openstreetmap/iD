// iD/Entity.js
// Entity classes for iD

define(['dojo/_base/declare','dojo/_base/array',
        'iD/actions/AddNodeToWayAction'
       ], function(declare,array){

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

	constructor:function() {
		this.tags={};
		this.parents=new Hashtable();
	},
	
	isType:function(_type) {
		return this.entityType==_type;
	},

	getTagsHash:function() {
		return this.tags;
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
	
	project:function() {
		this.latp=180/Math.PI * Math.log(Math.tan(Math.PI/4+this.lat*(Math.PI/180)/2));
	},

	within:function(left,right,top,bottom) { return (this.lon>=left) && (this.lon<=right) && (this.lat>=bottom) && (this.lat<=top) && !this.deleted; },
	
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
