iD.Entity = function(a, b) {
    if (!(this instanceof iD.Entity)) return new iD.Entity(a, b);

    _.extend(this, {tags: {}}, a, b);

    if (b) {
        this.modified = true;
    }

    if (iD.debug) {
        Object.freeze(this);
        Object.freeze(this.tags);
    }
};

iD.Entity.prototype = {
    update: function(attrs) {
        return iD.Entity(this, attrs);
    }
};
