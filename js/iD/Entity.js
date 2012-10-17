if (typeof iD === 'undefined') iD = {};

iD._id = 0;

iD.Entity = function() {
    this.tags = {};
    this.parents = {};
    // The ID locally
    this._id = iD._id++;
	this.connection =  null;
    // The ID in OSM terms
	this.id = NaN;
	this.loaded = false;
	this.entityType =  '';
	this.modified = false;
	this.deleted = false;
	this.MAINKEYS = ['highway','amenity','railway','waterway'];
};

iD.Entity.prototype = {
	isType:function(type) {
		// summary:		Is this entity of the specified type ('node','way','relation')?
		return this.entityType === type;
	},

	toString:function() {
		return this.entityType + " . " + this.id;
	},

	// --------------------------------
	// Provoke redraw and other changes
	refresh:function() {
		// summary:		Ask the connection to provoke redraw and other changes.
		this.connection.refreshEntity(this);
	},

	// -------------------------------------
	// Bounding box check (to be overridden)

	within:function(left, right, top, bottom) {
		// summary:		Is the entity within the specified bbox?
		return !this.deleted;	// Boolean
	},

	// -------------
	// Tag functions
	numTags:function() {
		// summary: Count how many tags this entity has.
        return Object.keys(this.tags).length;
	},

	friendlyName:function() {
		// summary:		Rough-and-ready function to return a human-friendly name 
		//				for the object. Really just a placeholder for something better.
		// returns:		A string such as 'river' or 'Fred's House'.
		if (this.numTags()===0) { return ''; }
		var n=[];
		if (this.tags.name) { n.push(this.tags.name); }
		if (this.tags.ref) { n.push(this.tags.ref); }
		if (n.length===0) {
			for (var i=0; i<this.MAINKEYS.length; i++) {
				if (this.tags[this.MAINKEYS[i]]) { n.push(this.tags[this.MAINKEYS[i]]); break; }
			}
		}
		return n.length===0 ? 'unknown' : n.join('; ');	// String
	},

	// ---------------
	// Parent-handling
	addParent: function(entity) {
		// summary:		Record a parent (a relation or way which contains this entity).
		this.parents[entity._id] = entity;
	},
	removeParent: function(entity) {
		// summary:		Remove a parent (e.g. when node removed from a way).
        delete this.parents[entity._id];
	},
	hasParent: function(entity) {
		// summary:		Does this entity have the specified parent (e.g. is it in a certain relation)?
		return !!this.parents[entity._id];
	},
	parentObjects: function() {
		// summary:		List of all parents of this entity.
		return _.values(this.parents);
	},
	hasParentWays: function() {
		// summary:		Does this entity have any parents which are ways?
        return !!_.find(this.parentObjects(), function(p) {
            return p.entityType === 'way';
        });
	},
	parentWays: function() {
		// summary:		Return an array of all ways that this entity is a member of.
		return this._parentObjectsOfClass('way');	// Array
	},
	parentRelations: function() {
		// summary:		Return an array of all relations that this entity is a member of.
		return this._parentObjectsOfClass('relation');	// Array
	},
	_parentObjectsOfClass: function(_class) {
        return _.filter(this.parentObjects(), function(p) {
            return p.entityType === _class;
        });
	}
};
