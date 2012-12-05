iD.Entity = function(a, b, c) {
    if (!(this instanceof iD.Entity)) return new iD.Entity(a, b, c);

    _.extend(this, {tags: {}}, a, b, c);

    if (!this.id) {
        this.id = iD.util.id(this.type);
        this._updated = true;
    }
    delete this._extent;

    if (iD.debug) {
        Object.freeze(this);
        Object.freeze(this.tags);

        if (this.nodes) Object.freeze(this.nodes);
        if (this.members) Object.freeze(this.members);
    }
};

iD.Entity.prototype = {
    update: function(attrs) {
        return iD.Entity(this, attrs, {_updated: true});
    },

    created: function() {
        return this._updated && +this.id.slice(1) < 0;
    },

    modified: function() {
        return this._updated && +this.id.slice(1) > 0;
    },

    hasInterestingTags: function() {
        return _.keys(this.tags).some(function (key) {
            return key != "attribution" && key != "created_by" && key != "source" && key != 'odbl' && key.indexOf('tiger:') != 0;
        });
    }
};

iD.Node = function(attrs) {
    return iD.Entity(attrs || {}, {type: 'node'});
};

iD.Way = function(attrs) {
    return iD.Entity({nodes: []}, attrs || {}, {type: 'way'});
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
    return iD.Entity({members: []}, attrs || {}, {type: 'relation'});
};
