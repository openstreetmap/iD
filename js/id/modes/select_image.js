iD.modes.SelectImage = function (context) {
    var mode = {
        button: 'selectImage',
        id: 'selectImage',
        title: t('modes.selectImage.title'),
        description: t('modes.selectImage.description'),
        key: 'm'
    }, imageView, currentImage;

    function click() {
        var datum = d3.event.target.__data__;
        if (isImage(datum)) {
            if (currentImage === datum) {
                context.surface().selectAll('.image.point')
                    .classed('selected', false);
                currentImage = undefined;
            } else {
                currentImage = datum;
                context.surface().selectAll('.image.point')
                    .classed('selected', function(d) {
                        return d === datum;
                    })
                context.container()
                    .select('#mapillaryImage')
                    .classed('temp', false);
                imageView.show(currentImage);
            }
        }
    }

    function isImage(datum) {
        return datum &&
            datum.properties !== undefined &&
            datum.properties.entityType === 'image';
    }

    mode.enter = function () {
        context.map().enableSequences(true);
        context.container()
            .select('#select_image_checkbox')
            .attr('checked','checked');

        // Get focus on the body.
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }

        imageView = context.imageView();
        imageView.showEmpty();

        context.surface()
            .on('click.image', click)
            .on('mouseover.image', function () {
                var datum = d3.event.target.__data__;
                if (isImage(datum)) {
                    imageView.show(datum);
                    if (currentImage !== datum) {
                        context.container()
                            .select('#mapillaryImage')
                            .classed('temp', true);
                    }
                }
            })
            .on('mouseout.image', function () {
                var datum = d3.event.target.__data__;
                if (isImage(datum)) {
                    if (currentImage) {
                        imageView.show(currentImage);
                    } else {
                        imageView.showEmpty();
                    }
                }
            });
    };

    mode.exit = function () {
        context.map().enableSequences(false);
        context.container().select('#select_image_checkbox')
            .attr('checked', null);

        if (!currentImage) {
            context.container()
                .select('#mapillaryImage')
                .classed('hidden', true)
                .classed('temp', false);
        }

        context.surface().select('defs').selectAll('marker.arrow')
            .remove();
        context.surface().select('.layer-hit').selectAll('g.image')
            .remove();
        context.surface().select('.layer-hit').selectAll('g.sequence')
            .remove();
    };

    return mode;
};
