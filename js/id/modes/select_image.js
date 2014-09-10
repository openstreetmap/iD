iD.modes.SelectImage = function (context) {
    var mode = {
        button: 'selectImage',
        id: 'selectImage',
        title: t('modes.selectImage.title'),
        description: t('modes.selectImage.description'),
        key: 'm'
    }, imageView, currentImage;

    var behaviors = [
    ];

    function click() {
        var datum = d3.event.target.__data__;
        if (isImage(datum)) {
            if (currentImage) {
                context.surface().selectAll('.key_' + currentImage.properties.key)
                    .classed('selected', false);
            }
            if(currentImage === datum) {
                context.surface().selectAll('.key_' + currentImage.properties.key)
                    .classed('selected', false);
                currentImage = undefined;

            } else {
                currentImage = datum;
                context.surface().selectAll('.key_' + currentImage.properties.key)
                    .classed('selected', true);
            }
//            imageView.selectedImage(currentImage);
            imageView.show(currentImage);
        }
    }

    function isImage(datum) {
        return datum !== undefined && datum && datum.properties !== undefined && datum.properties.entityType === 'image';
    }

    mode.enter = function () {
//        console.log('selectImage.enter');
        context.map().enableSequences(true);
        behaviors.forEach(function (behavior) {
            context.install(behavior);
        });

        // Get focus on the body.
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }

        imageView = context.imageView();
        imageView.showEmpty();
        context.surface()
            .on('click.image', click);
        context.surface()
            .on('mouseover.image', function () {
                var datum = d3.event.target.__data__;
                if (isImage(datum)) {
                    imageView.hoverImage(datum);
                }
            })
            .on('mouseout.image', function () {
                var datum = d3.event.target.__data__;
                if (isImage(datum)) {
                    if(currentImage) {
                        imageView.show(currentImage);
                    } else {
                        imageView.showEmpty();
                    }
                }
            });
    };

    mode.exit = function () {
        context.map().enableSequences(false);
        if(!currentImage) {
            d3.select('#mapillaryImage').classed('hidden', true);

        }
        behaviors.forEach(function (behavior) {
            context.uninstall(behavior);
        });

        context.surface().select('defs').selectAll('marker.arrow')
            .remove();
        context.surface().select('.layer-hit').selectAll('g.image')
            .remove();
        context.surface().select('.layer-hit').selectAll('g.sequence')
            .remove();

    };

    return mode;
};
