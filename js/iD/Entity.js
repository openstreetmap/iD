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
		// summary:		The base class for an entity (way, node or relation).
		this.tags={};
		this.parents=new Hashtable();
	},

	isType:function(type) {
		// summary:		Is this entity of the specified type ('node','way','relation')?
		return this.entityType==type;	// Boolean
	},

	toString:function() {
		return this.entityType+"."+this.id;
	},

	// --------------------------------
	// Provoke redraw and other changes

	refresh:function() {
		// summary:		Ask the connection to provoke redraw and other changes.
		this.connection.refreshEntity(this);
	},

	// ---------------
	// Clean and dirty

	_markClean:function() {
		// summary:		Mark entity as clean. Should only be called from UndoableEntityAction.
		this.modified=false;
	},
	_markDirty:function() {
		// summary:		Mark entity as dirty. Should only be called from UndoableEntityAction.
		this.modified=true;
	},
	isDirty:function() {
		// summary:		Is the entity dirty?
		return this.modified;	// Boolean
	},

	// --------
	// Deletion

	setDeletedState:function(isDeleted) { 
		// summary:		Mark entity as deleted or not.
		this.deleted=isDeleted;
	},

	// -------------------------------------
	// Bounding box check (to be overridden)

	within:function(left,right,top,bottom) { 
		// summary:		Is the entity within the specified bbox?
		return !this.deleted;	// Boolean
	},

	// -------------
	// Tag functions

	getTagsHash:function() {
		// summary:		Tag getter.
		// returns:		The tags hash (reference to the actual object property, not a copy).
		return this.tags;	// Object
	},

	numTags:function() {
		// summary:		Count how many tags this entity has.
		return Object.keys(this.tags).length;	// int
	},

	friendlyName:function() {
		// summary:		Rough-and-ready function to return a human-friendly name 
		//				for the object. Really just a placeholder for something better.
		// returns:		A string such as 'river' or 'Fred's House'.
		if (this.numTags()==0) { return ''; }
		var n=[];
		if (this.tags['name']) { n.push(this.tags['name']); }
		if (this.tags['ref']) { n.push(this.tags['ref']); }
		if (n.length==0) {
			for (var i=0; i<this.MAINKEYS.length; i++) {
				if (this.tags[this.MAINKEYS[i]]) { n.push(this.tags[this.MAINKEYS[i]]); break; }
			}
		}
		return n.length==0 ? 'unknown' : n.join('; ');	// String
	},

	// ---------------
	// Parent-handling

	addParent:function(entity) {
		// summary:		Record a parent (a relation or way which contains this entity).
		this.parents.put(entity,true);
	},
	removeParent:function(entity) {
		// summary:		Remove a parent (e.g. when node removed from a way).
		this.parents.remove(_entity);
	},
	hasParent:function(entity) {
		// summary:		Does this entity have the specified parent (e.g. is it in a certain relation)?
		return this.parents.containsKey(entity);	// Boolean
	},
	parentObjects:function() {
		// summary:		List of all parents of this entity.
		return this.parents.keys();	// Boolean
	},
	hasParentWays:function() {
		// summary:		Does this entity have any parents which are ways?
		var p=this.parentObjects();
		for (var i in p) {
			if (p[i].entityType=='way') { return true; }
		}
		return false;	// Boolean
	},
	parentWays:function() {
		// summary:		Return an array of all ways that this entity is a member of.
		return this._parentObjectsOfClass('way');	// Array
	},
	parentRelations:function() {
		// summary:		Return an array of all relations that this entity is a member of.
		return this._parentObjectsOfClass('relation');	// Array
	},
	_parentObjectsOfClass:function(_class) {
		var p=this.parentObjects(), c=[];
		for (var i in p) {
			if (p[i].entityType==_class) { c.push(p[i]); }
		}
		return c;
	}
	// Halcyon also implements:
	// removeFromParents()
	// hasParents()
	// findParentRelationsOfType(type,role)
	// getRelationMemberships()
	// countParentObjects(within)
	// memberships()

});

// ----------------------------------------------------------------------
// End of module
});
