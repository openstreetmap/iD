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

iD.Util.TAG_CLASSES = {
    'highway': true,
    'railway': true,
    'motorway': true,
    'amenity': true,
    'landuse': true,
    'building': true,
    'bridge': true
};

iD.Util.styleClasses = function(pre) {
    return function(d) {
        var tags = d.tags;
        var c = [pre];
        function clean(x) {
            return iD.Util.TAG_CLASSES[x];
        }
        for (var k in tags) {
            if (!clean(k)) continue;
            c.push(k + '-' + tags[k]);
            c.push(k);
        }
        return c.join(' ');
    };
};
