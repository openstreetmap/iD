if (typeof iD === 'undefined') iD = {};

iD.Util = {};

iD.Util._id = 0;

iD.Util.id = function() {
    return iD.Util._id++;
};

iD.Util.friendlyName = function(entity) {
    // summary:		Rough-and-ready function to return a human-friendly name
    //				for the object. Really just a placeholder for something better.
    // returns:		A string such as 'river' or 'Fred's House'.
    if (_.isEmpty(entity.tags)) { return ''; }

    var mainkeys = ['highway','amenity','railway','waterway'];
    var n = _.compact([entity.tags.name, entity.tags.ref]);

    if (!n.length) {
        var k = _.find(mainkeys, function(m) {
            return !!entity.tags[m];
        });
        if (k) n.push(entity.tags[k]);
    }

    return n.length === 0 ? 'unknown' : n.join('; ');
};

// TODO: don't use a cache here?
iD.Util._presets = {};
iD.Util.presets = function(type, callback) {
    if (iD.Util._presets[type]) return callback(iD.Util._presets[type]);
    $.ajax({
        url: 'presets/' + type + '.json',
        dataType: "json",
        error: function() {
            if (typeof console !== 'undefined') console.error(arguments);
        },
        success: function(resp) {
            iD.Util._presets[type] = resp;
            return callback(resp);
        }
    });
};

iD.Util.tileKey = function(coord) {
    return coord.z + ',' + coord.x + ',' + coord.y;
};
