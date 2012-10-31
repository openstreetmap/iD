iD.Relation = function(id, members, tags, loaded) {
    members = members || [];
    tags = tags || {};
    this.type = 'relation';
    this.id = id;
    this._id = iD.Util.id();
	this.entity = new iD.Entity();
    this.members = members;
    this.tags = tags;
    this.modified = this.id < 0;
    this.loaded = (loaded === undefined) ? true : loaded;
};

iD.Relation.prototype = {
    intersects: function() { return true; }
};

iD.RelationMember = function(entity, role) {
    this.entity = entity;
    this.role = role;
};
