iD.Note = function(feature) {
    this.loc = feature.geometry.coordinates;
    this.properties = feature.properties;
    this.id = 'e' + feature.properties.id;
};

iD.Note.prototype = {
    extent: function() {
        return new iD.geo.Extent(this.loc);
    },
    geometry: function() {
        return 'note';
    },
    tags: {}
};
