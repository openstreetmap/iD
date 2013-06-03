iD.modes.Browse = function(context) {
    var mode = {
        button: 'browse',
        id: 'browse',
        title: t('modes.browse.title'),
        description: t('modes.browse.description'),
        key: '1'
    };

    var behaviors = [
        iD.behavior.Hover(context)
            .on('hover', context.ui().sidebar.hover),
        iD.behavior.Select(context),
        iD.behavior.Lasso(context),
        iD.modes.DragNode(context).behavior];

    mode.enter = function() {
        behaviors.forEach(function(behavior) {
            context.install(behavior);
        });

        // Get focus on the body.
        document.activeElement.blur();
        context.ui().sidebar.select(null);
    };

    mode.exit = function() {
        behaviors.forEach(function(behavior) {
            context.uninstall(behavior);
        });
    };

    return mode;
};
