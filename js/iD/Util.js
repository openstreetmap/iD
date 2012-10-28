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
    if (!Object.keys(entity.tags).length) { return ''; }

    var mainkeys = ['highway','amenity','railway','waterway'];
    var n = [];

    if (entity.tags.name) n.push(entity.tags.name);
    if (entity.tags.ref) n.push(entity.tags.ref);

    if (!n.length) {
        for (var k in entity.tags) {
            if (mainkeys[k]) {
                n.push(entity.tags[k]);
                break;
            }
        }
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
