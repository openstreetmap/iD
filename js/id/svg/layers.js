iD.svg.Layers = function(projection, context) {
    var dispatch = d3.dispatch('change'),
        svg = d3.select(null),
        layers = [
            { id: 'osm', layer: iD.svg.Osm(projection, context, dispatch) },
            { id: 'gpx', layer: iD.svg.Gpx(projection, context, dispatch) },
            { id: 'mapillary-images', layer: iD.svg.MapillaryImages(projection, context, dispatch) },
            { id: 'mapillary-signs',  layer: iD.svg.MapillarySigns(projection, context, dispatch) }
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
            .each(function(d) { d3.select(this).call(d.layer); });

        groups.exit()
            .remove();
    }

    drawLayers.all = function() {
        return layers;
    };

    drawLayers.layer = function(id) {
        var obj = _.find(layers, 'id', id);
        return obj && obj.layer;
    };

    drawLayers.only = function(what) {
        var arr = [].concat(what);
        drawLayers.remove(_.difference(_.pluck(layers, 'id'), arr));
        return this;
    };

    drawLayers.remove = function(what) {
        var arr = [].concat(what);
        arr.forEach(function(id) {
            layers = _.reject(layers, 'id', id);
        });
        dispatch.change();
        return this;
    };

    drawLayers.add = function(what) {
        var arr = [].concat(what);
        arr.forEach(function(obj) {
            if ('id' in obj && 'layer' in obj) {
                layers.push(obj);
            }
        });
        dispatch.change();
        return this;
    };

    drawLayers.dimensions = function(_) {
        if (!arguments.length) return svg.dimensions();
        svg.dimensions(_);
        layers.forEach(function(obj) {
            if (obj.layer.dimensions) {
                obj.layer.dimensions(_);
            }
        });
        return this;
    };


    return d3.rebind(drawLayers, dispatch, 'on');
};
