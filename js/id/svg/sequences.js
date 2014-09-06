iD.svg.Sequences = function (projection, context) {
    var surface, enabled = false;


    function drawSequences(_surface) {
//        console.log('drawSequences');
        surface = _surface;

        if (enabled) {
            drawSequences.reloadMapillaryImages();
        } else {
            drawSequences.removeAll();
        }
    }

    drawSequences.removeAll = function () {
        surface.select('.layer-hit').selectAll('g.image').remove();
        surface.select('.layer-hit').selectAll('g.sequence').remove();
    };
    drawSequences.enable = function (enable) {
        enabled = enable;
        drawSequences(surface);
    }

    drawSequences.plotSequences = function (surface, context, sequences) {
        console.log('plotSequences', surface, sequences);
        var arrow_marker = surface.select('defs').selectAll('marker.arrow')
            .data([0]);
        arrow_marker.enter()
            .append('svg:marker')
            .attr('id', 'mapillary_direction_arrow')
            .attr('refX', '40')
            .attr('refY', '0')
            .attr('markerWidth', '4')
            .attr('markerHeight', '3 ')
            .attr('viewBox', '0 0 80 80')
            .attr('orient', '180')
            .append("polyline")
            .attr('points', '0,0 40,80 80,0');
        var imagePoints = drawSequences.images(sequences, 100);
        var images = surface.select('.layer-hit').selectAll('g.image')
            .data(imagePoints);


        var image = images.enter()
            .append('g')
            .attr('class', function (d) {
                return 'image point key_' + d.properties.key;
            })
            .attr('transform', function (d) {
                var translate = iD.svg.PointTransform(context.projection)({loc: d.geometry.coordinates});
                if (d.properties.ca) {
                    return translate + 'rotate(' + d.properties.ca + ',0,0)'
                }
                return translate;
            })
            .on('mouseover', function (d) {
                surface.select('.key_' + d.properties.key).classed('hover', true);
            })
            .on('mouseout', function (d) {
                surface.select('.key_' + d.properties.key).classed('hover', false);
            });


        image.append('path')
            .call(drawSequences.markerPath, 'stroke');

        image.append('circle')
            .attr('dx', '0')
            .attr('dy', '0')
            .attr('r', '10');

        // Selecting the following implicitly
        // sets the data (point entity) on the element
        images.select('.shadow');
        images.select('.stroke');

        surface.select('.layer-hit').selectAll('g.sequence').remove();
        var sequences = surface.select('.layer-hit').selectAll('g.sequence')
            .data(sequences.features, function (d) {
                return d.properties.key;
            });
        var sequence = sequences.enter()
            .append('g')
            .attr('class', function (d) {
                return 'sequence key_' + d.properties.key;
            })
            .append('path')
            .attr('d', d3.geo.path().projection(context.projection));
    }

    drawSequences.reloadMapillaryImages = function () {
        var extent = context.map().extent();
        d3.json('https://mapillary-read-api.herokuapp.com/v1/s/search?min-lat=' + extent[0][1] + '&max-lat=' + extent[1][1] + '&min-lon=' + extent[0][0] + '&max-lon=' + extent[1][0] + '&max-results=2&geojson=true', function (error, data) {
            drawSequences.plotSequences(context.surface(), context, data);

        });
    }

    drawSequences.images = function (sequences, limit) {
        var graph = context.graph(),
            images = [];

        for (var i = 0; i < sequences.features.length; i++) {
            var sequence = sequences.features[i];
            for (var j = 0; j < sequence.geometry.coordinates.length; j++) {
                images.push({
                    geometry: {
                        type: 'Point',
                        coordinates: sequence.geometry.coordinates[j]
                    },
                    properties: {
                        key: sequence.properties.keys[j],
                        ca: sequence.properties.cas[j],
                        entityType: 'image'
                    }
                });
                if (limit && images.length >= limit) break;
            }
        }

        return images;
    };

    drawSequences.markerPath = function (selection, klass) {
        selection
            .attr('class', klass)
            .attr('transform', 'translate(0, 0)')
            .attr('d', 'M 0,0 l 0,-10');
    }


    return drawSequences;
};
