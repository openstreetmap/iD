iD.Style = {};
iD.Style.highway_stack = [
    'motorway',
    'motorway_link',
    'trunk',
    'trunk_link',
    'primary',
    'primary_link',
    'secondary',
    'tertiary',
    'unclassified',
    'residential',
    'service',
    'footway'
];

iD.Style.waystack = function(a, b) {
    if (!a || !b) return 0;
    if (a.tags.layer !== undefined && b.tags.layer !== undefined) {
        return a.tags.layer - b.tags.layer;
    }
    if (a.tags.bridge) return 1;
    if (b.tags.bridge) return -1;
    var as = 0, bs = 0;
    if (a.tags.highway && b.tags.highway) {
        as -= iD.Style.highway_stack.indexOf(a.tags.highway);
        bs -= iD.Style.highway_stack.indexOf(b.tags.highway);
    }
    return as - bs;
};


iD.Style.TAG_CLASSES = {
    'highway': true,
    'railway': true,
    'motorway': true,
    'amenity': true,
    'landuse': true,
    'building': true,
    'bridge': true
};

iD.Style.styleClasses = function(pre) {
    return function(d) {
        var tags = d.tags;
        var c = [pre];
        function clean(x) {
            return iD.Style.TAG_CLASSES[x];
        }
        for (var k in tags) {
            if (!clean(k)) continue;
            c.push(k + '-' + tags[k]);
            c.push(k);
        }
        return c.join(' ');
    };
};
