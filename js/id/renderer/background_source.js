iD.BackgroundSource = {};

// derive the url of a 'quadkey' style tile from a coordinate object
iD.BackgroundSource.template = function(data) {
    var generator = function(coord) {
        var u = '';
        for (var zoom = coord[2]; zoom > 0; zoom--) {
            var b = 0;
            var mask = 1 << (zoom - 1);
            if ((coord[0] & mask) !== 0) b++;
            if ((coord[1] & mask) !== 0) b += 2;
            u += b.toString();
        }

        return data.template
            .replace('{t}', data.subdomains ?
                data.subdomains[coord[2] % data.subdomains.length] : '')
            .replace('{u}', u)
            .replace('{x}', coord[0])
            .replace('{y}', coord[1])
            .replace('{z}', coord[2])
            // JOSM style
            .replace('{zoom}', coord[2])
            .replace(/\{(switch\:[^\}]*)\}/, function(s, r) {
                var subdomains = r.split(':')[1].split(',');
                return subdomains[coord[2] % subdomains.length];
            });
    };

    generator.data = data;

    return generator;
};

iD.BackgroundSource.Custom = function() {
    var template = window.prompt('Enter a tile template. Valid tokens are {z}, {x}, {y} for Z/X/Y scheme and {u} for quadtile scheme.');
    if (!template) return null;
    return iD.BackgroundSource.template({
        template: template,
        name: 'Custom'
    });
};

iD.BackgroundSource.Custom.data = { 'name': 'Custom' };
