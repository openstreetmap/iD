iD.modes.SelectImage = function (context) {
    var mode = {
        button: 'selectImage',
        id: 'selectImage',
        title: t('modes.selectImage.title'),
        description: t('modes.selectImage.description')
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
            currentImage = datum;
            context.surface().selectAll('.key_' + currentImage.properties.key)
                .classed('selected', true);
//            imageView.selectedImage(currentImage);
            imageView.show(currentImage);
        }
    }

    function isImage(datum) {
        return datum != undefined && datum && datum.properties != undefined && datum.properties.entityType == 'image';
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
        console.log('selectImage.enter', imageView);
        context.surface()
            .on('click.image', click);
        context.surface()
            .on('mouseover.image', function () {
                console.log('selectImage.mouseover');
                var datum = d3.event.target.__data__;
                if (isImage(datum)) {
                    imageView.hoverImage(datum);
                }
            })
            .on('mouseout.image', function () {
                var datum = d3.event.target.__data__;
                if (isImage(datum)) {
                    console.log('selectImage.mouseout');
                    if(currentImage) {
                        imageView.show(currentImage);
                    } else {
                        imageView.showEmpty();
                    }
                }
            })
    };

    mode.exit = function () {
        console.log('selectImage.exit');
        context.map().enableSequences(false);
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


    return mode;
};
