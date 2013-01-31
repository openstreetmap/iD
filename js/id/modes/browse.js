iD.modes.Browse = function(context) {
    var mode = {
        button: 'browse',
        id: 'browse',
        title: t('modes.browse.title'),
        description: t('modes.browse.description'),
        key: t('modes.browse.key')
    };

    var behaviors = [
        iD.behavior.Hover(),
        iD.behavior.Select(context),
        iD.behavior.DragNode(context),
        iD.behavior.DragMidpoint(context)];

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
