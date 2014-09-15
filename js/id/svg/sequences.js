iD.svg.Sequences = function (projection, context) {
    var surface, enabled = false;

    function drawSequences(_surface) {
        surface = _surface;

        if (enabled) {
            drawSequences.reloadMapillaryImages();
        } else {
            drawSequences.removeAll();
        }
    }

    drawSequences.removeAll = function () {
        surface.selectAll('.layer-hit').selectAll('g.image').remove();
    };

    drawSequences.enable = function (enable) {
        enabled = enable;
        drawSequences(surface);
    };

    drawSequences.imagePoints = [];

    drawSequences.plotSequences = function (surface, context, sequences) {
        //TODO: make d3 follow changes in drawSequences.imagePoints instead of re-populating
        drawSequences.removeAll();
        var points = drawSequences.images(sequences, 1000);
        var newUniquePoints = [];
        for (var i = 0; i < points.length; i++) {
            var found = false;
            var newPointKey = points[i].properties.key;
            for (var j = 0 ; j < drawSequences.imagePoints.length && !found; j++) {
                var oldPointKey = drawSequences.imagePoints[j].properties.key;
                if(oldPointKey === newPointKey) {
                    found = true;
                }
            }
            if(!found) {
                newUniquePoints.push(points[i]);
            }
        }
        drawSequences.imagePoints = drawSequences.imagePoints.concat(newUniquePoints);
        var images = surface.select('.layer-hit').selectAll('g.image')
            .data(drawSequences.imagePoints);
        var pointTransform = iD.svg.PointTransform(context.projection);

        var image = images.enter()
            .append('g')
            .attr('class', 'image point')
            .attr('transform', function (d) {
                var translate = pointTransform({ loc: d.geometry.coordinates });
                if (d.properties.ca) {
                    return translate + 'rotate(' + d.properties.ca + ',0,0)';
                }
                return translate;
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
    };

    drawSequences.reloadMapillaryImages = function () {
        var extent = context.map().extent();
        d3.json('https://mapillary-read-api.herokuapp.com/v1/s/search?min-lat=' +
            extent[0][1] + '&max-lat=' + extent[1][1] + '&min-lon=' +
            extent[0][0] + '&max-lon=' + extent[1][0] +
            '&max-results=100&geojson=true', function (error, data) {
            drawSequences.plotSequences(context.surface(), context, data);
        });
    };

    drawSequences.images = function (sequences, limit) {
        var images = [];

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
            .attr('d', 'M 0,-10 l 0,-20 l -5,20 l 10,0 l -5,-20');
    };

    return drawSequences;
};
