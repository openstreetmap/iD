if (typeof iD === 'undefined') iD = {};

iD.Relation = function(connection, id, members, tags, loaded) {
    this.entityType = 'relation';
    this.connection = connection;
    this.id = id;
    this._id = iD.Util.id();
    this.members = members;
    this.tags = tags;
    this.modified = this.id < 0;
    this.loaded = (loaded === undefined) ? true : loaded;
    _.each(this.members, _.bind(function(member) {
        member.entity.entity.addParent(this);
    }, this));
};

iD.RelationMember = function(entity, role) {
    this.entity = entity;
    this.role = role;
};
