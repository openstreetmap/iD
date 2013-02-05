iD.BackgroundSource = {};

// derive the url of a 'quadkey' style tile from a coordinate object
iD.BackgroundSource.template = function(options) {
    var subdomains = options.subdomains || [],
        template = options.template,
        scaleExtent = options.scaleExtent || [0, 20];

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

    for (var k in options) {
        generator[k] = options[k];
        console.log(k, generator[k]);
    }


    return generator;
};

iD.BackgroundSource.Custom = function() {
    var template = window.prompt('Enter a tile template. Valid tokens are {z}, {x}, {y} for Z/X/Y scheme and {u} for quadtile scheme.');
    if (!template) return null;
    return iD.BackgroundSource.template(template, null, [0, 20]);
};
