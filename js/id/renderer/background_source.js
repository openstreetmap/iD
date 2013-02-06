iD.BackgroundSource = {};

// derive the url of a 'quadkey' style tile from a coordinate object
iD.BackgroundSource.template = function(template, subdomains, scaleExtent) {
    scaleExtent = scaleExtent || [0, 18];
    var generator = function(coord) {
        var u = '';
        for (var zoom = coord[2]; zoom > 0; zoom--) {
            var byte = 0;
            var mask = 1 << (zoom - 1);
            if ((coord[0] & mask) !== 0) byte++;
            if ((coord[1] & mask) !== 0) byte += 2;
            u += byte.toString();
        }
        // distribute requests against multiple domains
        var t = subdomains ?
            subdomains[coord[2] % subdomains.length] : '';
        return template
            .replace('{t}', t)
            .replace('{u}', u)
            .replace('{x}', coord[0])
            .replace('{y}', coord[1])
            .replace('{z}', coord[2]);
    };

    generator.scaleExtent = scaleExtent;
    generator.template = template;

    return generator;
};

iD.BackgroundSource.Custom = function() {
    var template = window.prompt('Enter a tile template. Valid tokens are {z}, {x}, {y} for Z/X/Y scheme and {u} for quadtile scheme.');
    if (!template) return null;
    return iD.BackgroundSource.template(template, null, [0, 20]);
};

iD.BackgroundSource.Bing = iD.BackgroundSource.template(
    'http://ecn.t{t}.tiles.virtualearth.net/tiles/a{u}.jpeg?g=587&mkt=en-gb&n=z',
    [0, 1, 2, 3], [0, 20]);

iD.BackgroundSource.Tiger2012 = iD.BackgroundSource.template(
    'http://{t}.tile.openstreetmap.us/tiger2012_roads_expanded/{z}/{x}/{y}.png',
    ['a', 'b', 'c'], [0, 17]);

iD.BackgroundSource.OSM = iD.BackgroundSource.template(
    'http://{t}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ['a', 'b', 'c'], [0, 18]);

iD.BackgroundSource.MapBox = iD.BackgroundSource.template(
    'http://{t}.tiles.mapbox.com/v3/openstreetmap.map-4wvf9l0l/{z}/{x}/{y}.jpg70',
    ['a', 'b', 'c'], [0, 16]);
