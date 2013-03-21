iD.BackgroundSource = {};

// derive the url of a 'quadkey' style tile from a coordinate object
iD.BackgroundSource.template = function(data) {

    function generator(coord) {
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
    }

    generator.data = data;

    return generator;
};

iD.BackgroundSource.Bing = function(data) {
    var bing = iD.BackgroundSource.template(data),
        url = "http://dev.virtualearth.net/REST/v1/Imagery/Metadata/Aerial/0,0?zl=1&mapVersion=v1&key=Arzdiw4nlOJzRwOz__qailc8NiR31Tt51dN2D7cm57NrnceZnCpgOkmJhNpGoppU&include=ImageryProviders&output=xml";

    var providers;

    d3.json(url, function(err, json) {
        if (json) {
            providers = json.resourceSets[0].resources[0].imageryProviders.map(function(provider) {
                return {
                    attribution: provider.attribution,
                    areas: provider.areas.map(function(area) {
                        return {
                            zoom: [area.zoomMin, area.zoomMax],
                            extent: iD.geo.Extent([area.bbox[1], area.bbox[0]], [area.bbox[3], area.bbox[2]])
                        }
                    })
                };
            });
        }
    });

    bing.copyrightNotices = function(zoom, extent) {
        return providers.filter(function(provider) {
            return _.any(provider.areas, function(area) {
                return extent.intersects(area.extent) &&
                    area.zoom[0] <= zoom &&
                    area.zoom[1] >= zoom;
            })
        }).map(function(provider) {
            return provider.attribution;
        }).join(', ');
    };

    return bing;
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
