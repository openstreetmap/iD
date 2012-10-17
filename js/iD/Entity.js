if (typeof iD === 'undefined') iD = {};

iD.Entity = function() {
    this.parents = {};
    // The ID locally
    this._id = iD.Util.id();
	this.connection =  null;
    // The ID in OSM terms
	this.id = NaN;
	this.loaded = false;
	this.entityType =  '';
	this.modified = false;
	this.deleted = false;
};

iD.Entity.prototype = {
	toString:function() {
		return this.entityType + " . " + this.id;
	},

	// Provoke redraw and other changes
	refresh:function() {
		// summary:		Ask the connection to provoke redraw and other changes.
		this.connection.refreshEntity(this);
	},

	// Bounding box check (to be overridden)
	within:function(left, right, top, bottom) {
		// summary:		Is the entity within the specified bbox?
		return !this.deleted;	// Boolean
	},

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
