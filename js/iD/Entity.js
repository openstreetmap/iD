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
    // a relation or way which contains this entity
    addParent: function (x) {
        this.parents[x._id] = x;
    },
    removeParent: function (x) {
        delete this.parents[x._id];
    },
    hasParent: function (x) {
        // summary:	Does this entity have the specified parent (e.g. is it in a certain relation)?
        return !!this.parents[x._id];
    },
    parentObjects: function () {
        var objects = [];
        for (var i in this.parents) {
            objects.push(this.parents[i]);
        }
        return objects;
    },
    hasParentWays: function () {
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
