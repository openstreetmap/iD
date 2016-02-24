iD.svg.Layers = function(projection, context) {
    var svg = d3.select(null),
        layers = [
            { id: 'osm', render: iD.svg.Osm(projection, context) },
            { id: 'gpx', render: iD.svg.Gpx(projection, context) },
            { id: 'mapillary-images', render: iD.svg.MapillaryImages(projection, context) },
            { id: 'mapillary-signs',  render: iD.svg.MapillarySigns(projection, context) }
        ];


    function drawLayers(selection) {
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

    drawLayers.all = function() {
        return layers;
    };

    drawLayers.layer = function(id) {
        return _.find(layers, 'id', id);
    };

    drawLayers.only = function(what) {
        var arr = [].concat(what);
        drawLayers.remove(_.difference(_.pluck(layers, 'id'), arr));
        return drawLayers;
    };

    drawLayers.remove = function(what) {
        var arr = [].concat(what);
        arr.forEach(function(id) {
            layers = _.reject(layers, 'id', id);
        });
        return drawLayers;
    };

    drawLayers.add = function(what) {
        var arr = [].concat(what);
        arr.forEach(function(obj) {
            if ('id' in obj && 'render' in obj) {
                layers.push(obj);
            }
        });
        return drawLayers;
    };

    drawLayers.dimensions = function(_) {
        if (!arguments.length) return svg.dimensions();
        svg.dimensions(_);
        layers.forEach(function(layer) {
            if (layer.render.dimensions) {
                layer.render.dimensions(_);
            }
        });
        return drawLayers;
    };


    return drawLayers;
};
