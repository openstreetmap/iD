iD.Relation = function(id, children, tags, loaded) {
    this.id = id;
    this._id = iD.Util.id();
    this.children = children || [];
    this.tags = tags || {};
    this.loaded = (loaded === undefined) ? true : loaded;
};

iD.Relation.prototype = {
    type: 'relation',

    intersects: function() { return true; }
};

// iD.Util.extend(iD.Relation, iD.Entity);
