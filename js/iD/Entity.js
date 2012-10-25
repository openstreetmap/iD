if (typeof iD === 'undefined') iD = {};

iD.Entity = function() {
    var entity = {};

    // The ID in OSM terms
    entity.parents = {};
	entity.connection =  null;
    entity._id = iD.Util.id();
	entity.id = NaN;
	entity.loaded = false;
	entity.entityType =  '';
	entity.modified = false;
	entity.deleted = false;

	// Parent-handling
	entity.addParent = function(x) {
		// summary:		Record a parent (a relation or way which contains this entity).
		entity.parents[x._id] = x;
	};
	entity.removeParent = function(x) {
		// summary:		Remove a parent (e.g. when node removed from a way).
        delete entity.parents[x._id];
	};
	entity.hasParent = function(x) {
		// summary:		Does this entity have the specified parent (e.g. is it in a certain relation)?
		return !!entity.parents[x._id];
	};
	entity.parentObjects = function() {
		// summary:		List of all parents of this entity.
		return _.values(entity.parents);
	};
	entity.hasParentWays = function() {
		// summary:		Does this entity have any parents which are ways?
        return !!_.find(entity.parentObjects(), function(p) {
            return p.entityType === 'way';
        });
	};
	entity.parentWays = function() {
		return entity._parentObjectsOfClass('way');
	};
	entity.parentRelations = function() {
		return entity._parentObjectsOfClass('relation');
	};
	function _parentObjectsOfClass(_class) {
        return _.filter(entity.parentObjects(), function(p) {
            return p.entityType === _class;
        });
	}

    return entity;
};

