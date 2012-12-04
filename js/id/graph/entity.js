iD.Entity = function(a, b) {
    if (!(this instanceof iD.Entity)) return new iD.Entity(a, b);

    _.extend(this, {tags: {}}, a, b);

    if (b) {
        this._updated = true;
    }

    if (!this.id) {
        this.id = iD.util.id(this.type);
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
    return iD.Entity(_.extend({}, attrs || {}, {type: 'node', tags: {}}));
};

iD.Way = function(attrs) {
    return iD.Entity(_.extend({}, attrs || {}, {type: 'way', nodes: [], tags: {}}));
};

iD.Way.isOneWay = function(d) {
    return !!(d.tags.oneway && d.tags.oneway === 'yes');
};

iD.Way.isClosed = function(d) {
    return (!d.nodes.length) || d.nodes[d.nodes.length - 1].id === d.nodes[0].id;
};

iD.Way.isArea = function(d) {
    return iD.Way.isClosed(d) || (d.tags.area && d.tags.area === 'yes');
};

iD.Relation = function(attrs) {
    return iD.Entity(_.extend({}, attrs || {}, {type: 'relation'}));
};
