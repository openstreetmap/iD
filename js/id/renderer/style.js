iD.Style = {};

// all styling that is done outside of CSS in iD.
//
// Since SVG does not support z-index, we sort roads manually with d3's `sort`
// and the `waystack` fn.
//
// This also chooses kosher CSS classes for ways, and images for points

iD.Style.highway_stack = {
    motorway: 0,
    motorway_link: 1,
    trunk: 2,
    trunk_link: 3,
    primary: 4,
    primary_link: 5,
    secondary: 6,
    tertiary: 7,
    unclassified: 8,
    residential: 9,
    service: 10,
    footway: 11
};

iD.Style.waystack = function(a, b) {
    if (!a || !b) return 0;
    if (a.tags.layer !== undefined && b.tags.layer !== undefined) {
        return a.tags.layer - b.tags.layer;
    }
    if (a.tags.bridge) return 1;
    if (b.tags.bridge) return -1;
    var as = 0, bs = 0;
    if (a.tags.highway && b.tags.highway) {
        as -= iD.Style.highway_stack[a.tags.highway];
        bs -= iD.Style.highway_stack[b.tags.highway];
    }
    return as - bs;
};

iD.Style.pointImage = function(d) {
    // TODO: optimize
    for (var k in d.tags) {
        var key = k + '=' + d.tags[k];
        if (iD._pointTable[key]) {
            return 'icons/' + iD._pointTable[key] + '.png';
        }
    }
    return 'icons/unknown.png';
};

iD.Style.TAG_CLASSES = iD.util.trueObj([
    'highway', 'railway', 'motorway', 'amenity', 'natural',
    'landuse', 'building', 'oneway', 'bridge'
]);

iD.Style.styleClasses = function() {
    var tagClassRe = /^tag-/;
    return function(selection) {
        selection.each(function(d) {
            var classes, value = this.className;

            if (value.baseVal !== undefined) value = value.baseVal;

            classes = value.trim().split(/\s+/).filter(function(name) {
                return name.length && !tagClassRe.test(name);
            });

            var tags = d.tags;
            for (var k in tags) {
                if (!iD.Style.TAG_CLASSES[k]) continue;
                classes.push('tag-' + k);
                classes.push('tag-' + k + '-' + tags[k]);
            }

            return selection.attr('class', classes.join(' '));
        });
    };
};
