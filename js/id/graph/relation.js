iD.Relation = function(sources) {
    if (!sources.length || sources.length === 0) sources = [sources];
    for (var i = 0; i < sources.length; ++i) {
        var source = sources[i];
        for (var prop in source) {
            if (Object.prototype.hasOwnProperty.call(source, prop)) {
                this[prop] = source[prop];
            }
        }
    }

    if (!this.id && this.type) {
        this.id = iD.Entity.id(this.type);
        this._updated = true;
    }

    if (iD.debug) {
        Object.freeze(this);
        Object.freeze(this.tags);

        if (this.nodes) Object.freeze(this.nodes);
        if (this.members) Object.freeze(this.members);
    }
};

iD.Relation.prototype = {
    type: "relation",
    members: [],

    extent: function() {
        return [[NaN, NaN], [NaN, NaN]];
    },

    geometry: function() {
        return 'relation';
    }
};

iD.Entity.simpleExtend(iD.Relation, iD.Entity);
iD.Entity.relation = iD.Relation;
