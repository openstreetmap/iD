iD.BackgroundSource = function(data) {
    var source = _.clone(data),
        offset = [0, 0];

    source.scaleExtent = data.scaleExtent || [0, 20];

    source.offset = function(_) {
        if (!arguments.length) return offset;
        offset = _;
        return source;
    };

    source.nudge = function(_, zoomlevel) {
        offset[0] += _[0] / Math.pow(2, zoomlevel);
        offset[1] += _[1] / Math.pow(2, zoomlevel);
        return source;
    };

    source.url = function(coord) {
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
                data.subdomains[(coord[0] + coord[1]) % data.subdomains.length] : '')
            .replace('{u}', u)
            .replace('{x}', coord[0])
            .replace('{y}', coord[1])
            // TMS-flipped y coordinate
            .replace('{ty}', Math.pow(2, coord[2]) - coord[1] - 1)
            .replace('{z}', coord[2])
            // JOSM style
            .replace('{zoom}', coord[2])
            .replace(/\{(switch\:[^\}]*)\}/, function(s, r) {
                var subdomains = r.split(':')[1].split(',');
                return subdomains[coord[2] % subdomains.length];
            });
    };

    source.intersects = function(extent) {
        return !data.extents || data.extents.some(function(ex) {
            return iD.geo.Extent(ex).intersects(extent);
        });
    };

    source.validZoom = function(z) {
        return source.scaleExtent[0] <= z &&
            (source.name !== 'Locator Overlay' || source.scaleExtent[1] > z);
    };

    source.copyrightNotices = function() {};

    return source;
};

iD.BackgroundSource.Bing = function(data, dispatch) {
    // http://msdn.microsoft.com/en-us/library/ff701716.aspx
    // http://msdn.microsoft.com/en-us/library/ff701701.aspx

    var bing = iD.BackgroundSource(data),
        key = 'Arzdiw4nlOJzRwOz__qailc8NiR31Tt51dN2D7cm57NrnceZnCpgOkmJhNpGoppU', // Same as P2 and JOSM
        url = 'http://dev.virtualearth.net/REST/v1/Imagery/Metadata/Aerial?include=ImageryProviders&key=' +
            key + '&jsonp={callback}',
        providers = [];

    d3.jsonp(url, function(json) {
        providers = json.resourceSets[0].resources[0].imageryProviders.map(function(provider) {
            return {
                attribution: provider.attribution,
                areas: provider.coverageAreas.map(function(area) {
                    return {
                        zoom: [area.zoomMin, area.zoomMax],
                        extent: iD.geo.Extent([area.bbox[1], area.bbox[0]], [area.bbox[3], area.bbox[2]])
                    };
                })
            };
        });
        dispatch.change();
    });

    bing.copyrightNotices = function(zoom, extent) {
        zoom = Math.min(zoom, 21);
        return providers.filter(function(provider) {
            return _.any(provider.areas, function(area) {
                return extent.intersects(area.extent) &&
                    area.zoom[0] <= zoom &&
                    area.zoom[1] >= zoom;
            });
        }).map(function(provider) {
            return provider.attribution;
        }).join(', ');
    };

    return bing;
};
