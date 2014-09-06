iD.modes.SelectImage = function (context) {
    var mode = {
        button: 'selectImage',
        id: 'selectImage',
        title: t('modes.selectImage.title'),
        description: t('modes.selectImage.description')
    }, sidebar, currentImage;

    var behaviors = [
    ];

    function click() {
        var datum = d3.event.target.__data__;
        var lasso = d3.select('#surface .lasso').node();
        if (isImage(datum)) {
            if (currentImage) {
                context.surface().selectAll('.key_' + currentImage.properties.key)
                    .classed('selected', false);
            }
            currentImage = datum;
            context.surface().selectAll('.key_' + currentImage.properties.key)
                .classed('selected', true);
            context.ui().sidebar.selectImage(currentImage);
            context.ui().sidebar.showSelectedImage(currentImage);
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
                    context.ui().sidebar.hover(datum);
                }
            })
            .on('mouseout.image', function () {
                if (currentImage !== undefined) {
                    context.ui().sidebar.showSelectedImage(currentImage);
                }
            })
    };

    mode.exit = function () {
//        console.log('selectImage.exit');
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
