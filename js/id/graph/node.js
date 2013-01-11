iD.Node = function(sources) {
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

iD.Node.prototype = {
    type: "node",

    extent: function() {
        return [this.loc, this.loc];
    },

    geometry: function() {
        return this._poi ? 'point' : 'vertex';
    }
};

iD.Entity.simpleExtend(iD.Node, iD.Entity);
iD.Entity.node = iD.Node;
