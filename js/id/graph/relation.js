iD.Relation = iD.Entity.extend({
    type: "relation",
    members: [],

    extent: function() {
        return [[NaN, NaN], [NaN, NaN]];
    },

    geometry: function() {
        return 'relation';
    }
});
