iD.modes.SelectImage = function (context) {
    var mode = {
        button: 'selectImage',
        id: 'selectImage',
        title: t('modes.selectImage.title'),
        description: t('modes.selectImage.description')
    }, sidebar, currentImage;

    var behaviors = [
        iD.behavior.Hover(context)
            .on('hover', context.ui().sidebar.hover)
//        iD.behavior.Select(context)
    ];

    function click() {
        console.log('selectImage click');
        var datum = d3.event.target.__data__;
        var lasso = d3.select('#surface .lasso').node();
        if (isImage(datum)) {
            console.log('selectImage clicked image', datum);
            if (currentImage) {
                context.surface().selectAll('.key_' + currentImage.properties.key)
                    .classed('selected', false);
            }
            currentImage = datum;
            context.surface().selectAll('.key_' + currentImage.properties.key)
                .classed('selected', true);
            context.ui().sidebar.showImage(currentImage);
        } else if (!(datum instanceof iD.Entity)) {
            if (!d3.event.shiftKey && !lasso)
                context.enter(iD.modes.Browse(context));

        } else if (!d3.event.shiftKey && !lasso) {
            // Avoid re-entering Select mode with same entity.
            if (context.selectedIDs().length !== 1 || context.selectedIDs()[0] !== datum.id) {
                context.enter(iD.modes.Select(context, [datum.id]));
            } else {
                context.mode().reselect();
            }
        } else if (context.selectedIDs().indexOf(datum.id) >= 0) {
            var selectedIDs = _.without(context.selectedIDs(), datum.id);
            context.enter(selectedIDs.length ?
                iD.modes.Select(context, selectedIDs) :
                iD.modes.Browse(context));

        } else {
            context.enter(iD.modes.Select(context, context.selectedIDs().concat([datum.id])));
        }
    }

    function isImage(datum) {
        return datum && datum.properties != undefined && datum.properties.entityType == 'image';
    }

    mode.enter = function () {
        console.log('selectImage.enter');
        mode.reloadMapillaryImages();
        behaviors.forEach(function (behavior) {
            context.install(behavior);
        });

        // Get focus on the body.
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }

        if (sidebar) {
            context.ui().sidebar.show(sidebar);
        } else {
            context.ui().sidebar.select(null);
        }
        context.surface()
            .on('click.image', click);
        context.surface()
            .on('mouseover.image', function () {
                var datum = d3.event.target.__data__;
                if (isImage(datum)) {
                    context.ui().sidebar.showImage(datum);
                }
            })
            .on('mouseout.image', function () {
                var datum = d3.event.target.__data__;
                if (isImage(datum)) {
                    context.ui().sidebar.showImage(currentImage);
                }
            })
    };

    mode.exit = function () {
        console.log('selectImage.exit');

        behaviors.forEach(function (behavior) {
            context.uninstall(behavior);
        });

        if (sidebar) {
            context.ui().sidebar.hide(sidebar);
        }
        context.surface().select('defs').selectAll('marker.arrow')
            .remove();
        context.surface().select('.layer-hit').selectAll('g.image')
            .remove();
        context.surface().select('.layer-hit').selectAll('g.sequence')
            .remove();

    };

    mode.sidebar = function (_) {
        if (!arguments.length) return sidebar;
        sidebar = _;
        return mode;
    };

    mode.markerPath = function (selection, klass) {
        selection
            .attr('class', klass)
            .attr('transform', 'translate(0, 0)')
            .attr('d', 'M 0,0 l 0,-10');
    }

    mode.drawPoints = function (surface, context, sequences) {

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
        var imagePoints = mode.images(sequences, 100);
        var images = surface.select('.layer-hit').selectAll('g.image')
            .data(imagePoints);


        var image = images.enter()
            .append('g')
            .attr('class', function (d) {
                return 'image point key_' + d.properties.key;
            })
            .attr('transform', function (d) {
                return iD.svg.PointTransform(context.projection)({loc: d.geometry.coordinates}) + 'rotate(' + d.properties.ca + ',0,0)';
            })
            .on('mouseover', function (d) {
                surface.select('.key_' + d.properties.key).classed('hover', true);
            })
            .on('mouseout', function (d) {
                surface.select('.key_' + d.properties.key).classed('hover', false);
            });


        image.append('path')
            .call(mode.markerPath, 'stroke');

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
            .attr('d', d3.geo.path().projection(context.projection));

    }

    mode.images = function (sequences, limit) {
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

    mode.reloadMapillaryImages = function () {
        var extent = context.map().extent();
        d3.json('https://mapillary-read-api.herokuapp.com/v1/s/search?min-lat=' + extent[0][1] + '&max-lat=' + extent[1][1] + '&min-lon=' + extent[0][0] + '&max-lon=' + extent[1][0] + '&max-results=2&geojson=true', function (error, data) {
            mode.drawPoints(context.surface(), context, data);

        });
    }

    return mode;
};
