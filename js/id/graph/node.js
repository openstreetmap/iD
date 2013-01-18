iD.Node = iD.Entity.extend({
    type: "node",

    extent: function() {
        return iD.geo.Extent(this.loc);
    },

    geometry: function() {
        return this._poi ? 'point' : 'vertex';
    }
});
