iD.modes.Browse = function() {
    var mode = {
        button: 'browse',
        id: 'browse',
        title: t('modes.browse.title'),
        description: t('modes.browse.description'),
        key: t('modes.browse.key')
    };

    var behaviors;

    mode.enter = function() {
        var surface = mode.map.surface;

        behaviors = [
            iD.behavior.Hover(),
            iD.behavior.Select(mode),
            iD.behavior.DragNode(mode),
            iD.behavior.DragMidpoint(mode)];

        behaviors.forEach(function(behavior) {
            behavior(surface);
        });
    };

    mode.exit = function() {
        var surface = mode.map.surface;

        behaviors.forEach(function(behavior) {
            behavior.off(surface);
        });
    };

    return mode;
};
