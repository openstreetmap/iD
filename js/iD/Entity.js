iD.Entity = function () {
    this.parents = {};
    this._id = iD.Util.id();
    this.id = NaN;
    this.loaded = false;
    this.type = '';
    this.modified = false;
    this.deleted = false;
};

iD.Entity.prototype = {
    // Parent-handling
    addParent: function (x) {
        // summary:		Record a parent (a relation or way which contains this entity).
        this.parents[x._id] = x;
    },
    removeParent: function (x) {
        // summary:		Remove a parent (e.g. when node removed from a way).
        delete this.parents[x._id];
    },
    hasParent: function (x) {
        // summary:		Does this entity have the specified parent (e.g. is it in a certain relation)?
        return !!this.parents[x._id];
    },
    parentObjects: function () {
        // summary:		List of all parents of this entity.
        var objects = [];
        for (var i in this.parents) {
            objects.push(this.parents[i]);
        }
        return objects;
    },
    hasParentWays: function () {
        // summary:		Does this entity have any parents which are ways?
        var parentObjects = this.parentObjects();
        for (var i = 0; i < parentObjects.length; i++) {
            if (parentObjects[i].type === 'way') return true;
        }
    },
    parentWays: function () {
        return this._parentObjectsOfClass('way');
    },
    parentRelations: function () {
        return this._parentObjectsOfClass('relation');
    },
    _parentObjectsOfClass: function(_class) {
        var poc = [];
        var parentObjects = this.parentObjects();
        for (var i = 0; i < parentObjects.length; i++) {
            if (parentObjects[i].type === _class) {
                poc.push(parentObjects[i]);
            }
        }
        return poc;
    }
};
