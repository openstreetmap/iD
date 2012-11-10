iD.Entity = function(a, b) {
    if (!(this instanceof iD.Entity)) return new iD.Entity(a, b);

    _.extend(this, a, b);

    if (b) {
        this.modified = true;
    }
};

iD.Entity.prototype = {
    update: function(attrs) {
        return iD.Entity(this, attrs);
    }
};
