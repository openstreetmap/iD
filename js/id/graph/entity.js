iD.Entity = function(a, b) {
    if (!(this instanceof iD.Entity)) return new iD.Entity(a, b);

    _.extend(this, {tags: {}}, a, b);

    if (b) {
        this._updated = true;
    }

    if (!this.id) {
        this.id = iD.Util.id(this.type);
        this._updated = true;
    }

    if (iD.debug) {
        Object.freeze(this);
        Object.freeze(this.tags);
    }
};

iD.Entity.prototype = {
    update: function(attrs) {
        attrs._updated = true;
        return iD.Entity(this, attrs);
    },

    created: function() {
        return this._updated && +this.id.slice(1) < 0;
    },

    modified: function() {
        return this._updated && +this.id.slice(1) > 0;
    }
};

iD.Node = function(attrs) {
    return iD.Entity(_.extend({}, attrs || {}, {type: 'node'}));
};

iD.Way = function(attrs) {
    return iD.Entity(_.extend({}, attrs || {}, {type: 'way', nodes: []}));
};

iD.Relation = function(attrs) {
    return iD.Entity(_.extend({}, attrs || {}, {type: 'relation'}));
};
