iD.Util = {};

iD.Util._counters = {};

iD.Util.id = function(counter) {
    counter = counter || 'default';
    if (!iD.Util._counters[counter]) iD.Util._counters[counter] = 0;
    return counter[0] + (--iD.Util._counters[counter]);
};

iD.Util.trueObj = function(arr) {
    var o = {};
    for (var i = 0, l = arr.length; i < l; i++) o[arr[i]] = true;
    return o;
};

iD.Util.friendlyName = function(entity) {
    // Generate a string such as 'river' or 'Fred's House' for an entity.
    if (!entity.tags || !Object.keys(entity.tags).length) { return ''; }

    var mainkeys = ['highway','amenity','railway','waterway'],
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

iD.Util.codeWindow = function(content) {
    top.win = window.open('','contentWindow',
        'width=350,height=350,menubar=0' +
        ',toolbar=1,status=0,scrollbars=1,resizable=1');
    top.win.document.writeln('<pre>' + content + '</pre>');
    top.win.document.close();
};

iD.Util.tagText = function(entity) {
    return d3.entries(entity.tags).map(function(e) {
        return e.key + ': ' + e.value;
    }).join('\n');
};

iD.Util.qsString = function(obj) {
    return Object.keys(obj).sort().map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
    }).join('&');
};

iD.Util.interp = function(p1, p2, t) {
    return {
        lon: p1.lon + (p2.lon - p1.lon) * t,
        lat: p1.lat + (p2.lat - p1.lat) * t
    };
};

iD.Util.dist = function(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
};
