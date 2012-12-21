iD.util = {};

iD.util.trueObj = function(arr) {
    var o = {};
    for (var i = 0, l = arr.length; i < l; i++) o[arr[i]] = true;
    return o;
};

iD.util.friendlyName = function(entity) {
    // Generate a string such as 'river' or 'Fred's House' for an entity.
    if (!entity.tags || !Object.keys(entity.tags).length) { return ''; }

    var mainkeys = ['highway','amenity','railway','waterway','natural'],
        n = [];

    if (entity.tags.name) n.push(entity.tags.name);
    if (entity.tags.ref) n.push(entity.tags.ref);

    if (!n.length) {
        for (var k in entity.tags) {
            if (mainkeys.indexOf(k) !== -1) {
                n.push(entity.tags[k]);
                break;
            }
        }
    }

    return n.length === 0 ? 'unknown' : n.join('; ');
};

iD.util.codeWindow = function(content) {
    top.win = window.open('','contentWindow',
        'width=350,height=350,menubar=0' +
        ',toolbar=1,status=0,scrollbars=1,resizable=1');
    top.win.document.writeln('<pre>' + content + '</pre>');
    top.win.document.close();
};

iD.util.tagText = function(entity) {
    return d3.entries(entity.tags).map(function(e) {
        return e.key + ': ' + e.value;
    }).join('\n');
};

iD.util.stringQs = function(str) {
    return str.split('&').reduce(function(obj, pair){
        var parts = pair.split('=');
        obj[parts[0]] = (null === parts[1]) ? '' : decodeURIComponent(parts[1]);
        return obj;
    }, {});
};

iD.util.qsString = function(obj) {
    return Object.keys(obj).sort().map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
    }).join('&');
};

iD.util.prefixDOMProperty = function(property) {
    var prefixes = ['webkit', 'ms', 'moz', 'o'],
        i = -1,
        n = prefixes.length,
        s = document.body;

    if (property in s)
        return property;

    property = property.substr(0, 1).toUpperCase() + property.substr(1);

    while (++i < n)
        if (prefixes[i] + property in s)
            return prefixes[i] + property;

    return false;
};

iD.util.prefixCSSProperty = function(property) {
    var prefixes = ['webkit', 'ms', 'Moz', 'O'],
        i = -1,
        n = prefixes.length,
        s = document.body.style;

    if (property.toLowerCase() in s)
        return property.toLowerCase();

    while (++i < n)
        if (prefixes[i] + property in s)
            return '-' + prefixes[i].toLowerCase() + '-' + property.toLowerCase();

    return false;
};

iD.util.support3d = function() {
    // test for translate3d support. Based on https://gist.github.com/3794226 by lorenzopolidori and webinista
    var transformProp = iD.util.prefixCSSProperty('Transform');
    var el = document.createElement('div'),
        has3d = false;
    document.body.insertBefore(el, null);
    if (el.style[transformProp] !== undefined) {
        el.style[transformProp] = 'translate3d(1px,1px,1px)';
        has3d = window.getComputedStyle(el).getPropertyValue(transformProp);
    }
    document.body.removeChild(el);
    return (has3d && has3d.length>0 && has3d!=="none");
};

iD.util.geo = {};

iD.util.geo.roundCoords = function(c) {
    return [Math.floor(c[0]), Math.floor(c[1])];
};

iD.util.geo.interp = function(p1, p2, t) {
    return [p1[0] + (p2[0] - p1[0]) * t,
            p1[1] + (p2[1] - p1[1]) * t];
};

iD.util.geo.dist = function(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) +
        Math.pow(a[1] - b[1], 2));
};

iD.util.geo.chooseIndex = function(way, point, map) {
    var dist = iD.util.geo.dist,
        projNodes = way.nodes.map(function(n) {
        return map.projection(n.loc);
    });

    for (var i = 0, changes = []; i < projNodes.length - 1; i++) {
        changes[i] =
            (dist(projNodes[i], point) + dist(point, projNodes[i + 1])) /
            dist(projNodes[i], projNodes[i + 1]);
    }

    var idx = _.indexOf(changes, _.min(changes)),
        ratio = dist(projNodes[idx], point) / dist(projNodes[idx], projNodes[idx + 1]),
        loc = iD.util.geo.interp(way.nodes[idx].loc, way.nodes[idx + 1].loc, ratio);

    return {
        index: idx + 1,
        loc: loc
    };
};
