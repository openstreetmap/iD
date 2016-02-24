iD.svg.Surface = function(projection, context) {
    var svg = d3.select(null),
        layers = [
            { id: 'osm', render: iD.svg.Osm(projection, context) },
            { id: 'gpx', render: iD.svg.Gpx(projection, context) },
            { id: 'mapillary-images', render: iD.svg.MapillaryImages(projection, context) },
            { id: 'mapillary-signs',  render: iD.svg.MapillarySigns(projection, context) }
        ];


    function surface(selection) {
        svg = selection.selectAll('.surface')
            .data([0]);

        svg.enter()
            .append('svg')
            .attr('class', 'surface')
            .append('defs');

        var groups = svg.selectAll('.data-layer')
            .data(layers);

        groups.enter()
            .append('g')
            .attr('class', function(d) { return 'data-layer data-layer-' + d.id; });

        groups
            .each(function(d) { d3.select(this).call(d.render); });

        groups.exit()
            .remove();
    }


    surface.only = function(what) {
        var arr = [].concat(what);
        surface.remove(_.difference(_.pluck(layers, 'id'), arr));
        return surface;
    };

    surface.remove = function(what) {
        var arr = [].concat(what);
        arr.forEach(function(id) {
            layers = _.reject(layers, function(d) { return d.id === id; });
        });
        return surface;
    };

    surface.add = function(what) {
        var arr = [].concat(what);
        arr.forEach(function(obj) {
            if ('id' in obj && 'render' in obj) {
                layers.push(obj);
            }
        });
        return surface;
    };

    surface.dimensions = function(_) {
        if (!arguments.length) return svg.dimensions();
        svg.dimensions(_);
        layers.forEach(function(layer) {
            if (layer.render.dimensions) {
                layer.render.dimensions(_);
            }
        });
        return surface;
    };


    return surface;
};
