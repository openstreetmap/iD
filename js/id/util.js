iD.util = {};

iD.util.trueObj = function(arr) {
    var o = {};
    for (var i = 0, l = arr.length; i < l; i++) o[arr[i]] = true;
    return o;
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
        if (parts.length === 2) {
            obj[parts[0]] = (null === parts[1]) ? '' : decodeURIComponent(parts[1]);
        }
        return obj;
    }, {});
};

iD.util.qsString = function(obj, noencode) {
    return Object.keys(obj).sort().map(function(key) {
        return encodeURIComponent(key) + '=' + (
            noencode ? obj[key] : encodeURIComponent(obj[key]));
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

iD.util.getStyle = function(selector) {
    for (var i = 0; i < document.styleSheets.length; i++) {
        var rules = document.styleSheets[i].rules || document.styleSheets[i].cssRules;
        for (var k = 0; k < rules.length; k++) {
            var selectorText = rules[k].selectorText && rules[k].selectorText.split(', ');
            if (_.contains(selectorText, selector)) {
                return rules[k];
            }
        }
    }
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

// Return whether point is contained in polygon.
//
// `point` should be a 2-item array of coordinates.
// `polygon` should be an array of 2-item arrays of coordinates.
//
// From https://github.com/substack/point-in-polygon.
// ray-casting algorithm based on
// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
//
iD.util.geo.pointInPolygon = function(point, polygon) {
    var x = point[0],
        y = point[1],
        inside = false;

    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i][0], yi = polygon[i][1];
        var xj = polygon[j][0], yj = polygon[j][1];

        var intersect = ((yi > y) != (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

iD.util.geo.polygonContainsPolygon = function(outer, inner) {
    return _.every(inner, function (point) {
        return iD.util.geo.pointInPolygon(point, outer);
    });
};

iD.util.geo.polygonIntersectsPolygon = function(outer, inner) {
    return _.some(inner, function (point) {
        return iD.util.geo.pointInPolygon(point, outer);
    });
};

// May have issues with self interesecting polygons
iD.util.geo.polygonCentroid = function(polygon) {
    var x = 0,
        y = 0,
        area = iD.util.geo.area(polygon);
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i][0], yi = polygon[i][1];
        var xj = polygon[j][0], yj = polygon[j][1];
        x += (xi + xj) * (xj * yi - xi * yj);
        y += (yi + yj) * (xj * yi - xi * yj);
    }
    return [x / 6 / area, y / 6 / area];
};

iD.util.geo.area = function(polygon) {
    var area = 0;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i][0], yi = polygon[i][1];
        var xj = polygon[j][0], yj = polygon[j][1];
        area += xj * yi - xi * yj;
    }
    return area/2;
};

iD.util.geo.pathLength = function(path) {
    var length = 0,
        dx, dy;
    for (var i = 0; i < path.length - 1; i++) {
        dx = path[i][0] - path[i + 1][0];
        dy = path[i][1] - path[i + 1][1];
        length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
};
