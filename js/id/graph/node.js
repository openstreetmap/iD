iD.Node = iD.Entity.extend({
    type: "node",

    extent: function() {
        return [this.loc, this.loc];
    }
});
