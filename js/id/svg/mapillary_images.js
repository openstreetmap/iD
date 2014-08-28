iD.svg.MapillaryImages = function (projection, context) {
    function markerPath(selection, klass) {
        selection
            .attr('class', klass)
            .attr('transform', 'translate(0, 0)')
            .attr('d', 'M 0,0 l 0,-10');
    }

    function drawPoints(surface, context, sequences) {

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
        var imagePoints = drawPoints.images(sequences, 100);
        var images = surface.select('.layer-hit').selectAll('g.image')
            .data(imagePoints);


        var image = images.enter()
            .append('g')
            .attr('class', function (d) {
                return 'image point key_' + d.properties.key;
            })
            .attr('transform', function (d) {
                return iD.svg.PointTransform(projection)({loc: d.geometry.coordinates}) + 'rotate(' + d.properties.ca + ',0,0)';
            })
            .on('mouseover', function (d) {
                surface.select('.key_' + d.properties.key).classed('hover', true);
                context.ui().sidebar.showImage(d);
            })
            .on('mouseout', function (d) {
                surface.select('.key_' + d.properties.key).classed('hover', false);
            });
//            .on('click', );
//        images.exit().remove();


        image.append('path')
            .call(markerPath, 'stroke');

        image.append('circle')
            .attr('dx', '0')
            .attr('dy', '0')
            .attr('r', '10');

        // Selecting the following implicitly
        // sets the data (point entity) on the element
        images.select('.shadow');
        images.select('.stroke');

        var sequences = surface.select('.layer-hit').selectAll('g.sequence')
            .data(sequences.features);
        var sequence = sequences.enter()
            .append('g')
            .attr('class', function (d) {
                return 'sequence key_' + d.properties.key;
            })
            .append('path')
            .attr('d', d3.geo.path().projection(projection));

    }

    drawPoints.images = function (sequences, limit) {
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


    return drawPoints;
};
