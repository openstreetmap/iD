iD.Relation = function(id, uid, children, tags, loaded) {
    this.id = id;
    this.uid = uid;
    this.children = children || [];
    this.tags = tags || {};
    this.loaded = (loaded === undefined) ? true : loaded;
};

iD.Relation.prototype = {
    type: 'relation',

    intersects: function() { return true; }
};

// iD.Util.extend(iD.Relation, iD.Entity);
