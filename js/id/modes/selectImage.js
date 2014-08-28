iD.modes.SelectImage = function(context) {
    var mode = {
        button: 'selectImage',
        id: 'selectImage',
        title: t('modes.selectImage.title'),
        description: t('modes.selectImage.description')
    }, sidebar;

    var behaviors = [
        iD.behavior.Hover(context)
            .on('hover', context.ui().sidebar.hover),
//        iD.behavior.Select(context)
    ];

        function click() {
            console.log('selectImage click');
            var datum = d3.event.target.__data__;
            var lasso = d3.select('#surface .lasso').node();
            if(datum.properties != undefined && datum.properties.entityType == 'image') {
                context.enter(iD.modes.SelectImage(context, datum))
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

        mode.enter = function() {
        console.log('selectImage.enter');
        behaviors.forEach(function(behavior) {
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
    };

    mode.exit = function() {
        behaviors.forEach(function(behavior) {
            context.uninstall(behavior);
        });

        if (sidebar) {
            context.ui().sidebar.hide(sidebar);
        }
    };

    mode.sidebar = function(_) {
        if (!arguments.length) return sidebar;
        sidebar = _;
        return mode;
    };

    return mode;
};
