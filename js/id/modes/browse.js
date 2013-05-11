iD.modes.Browse = function(context) {
    var mode = {
        button: 'browse',
        id: 'browse',
        title: t('modes.browse.title'),
        description: t('modes.browse.description'),
        key: '1'
    };

    var behaviors = [
        iD.behavior.Hover(context),
        iD.behavior.Select(context),
        iD.behavior.Lasso(context),
        iD.modes.DragNode(context).behavior];

    mode.enter = function() {
        behaviors.forEach(function(behavior) {
            context.install(behavior);
        });
    };

    mode.exit = function() {
        behaviors.forEach(function(behavior) {
            context.uninstall(behavior);
        });
    };

    return mode;
};
