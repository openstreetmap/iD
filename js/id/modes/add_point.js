iD.modes.AddPoint = function(context) {
    var mode = {
        id: 'add-point',
        button: 'point',
        title: t('modes.add_point.title'),
        description: t('modes.add_point.description'),
        key: '1'
    };

    var behavior = iD.behavior.Draw(context)
        .tail(t('modes.add_point.tail'))
        .on('click', add)
        .on('clickWay', addWay)
        .on('clickNode', addNode)
        .on('cancel', cancel)
        .on('finish', cancel);

    function add(loc) {
        var node = iD.Node({loc: loc});

        context.perform(
            iD.actions.AddEntity(node),
            t('operations.add.annotation.point'));

        context.enter(
            iD.modes.Select(context, [node.id])
                .suppressMenu(true)
                .newFeature(true));
    }

    function addWay(loc, edge) {
        add(loc);
    }

    function addNode(node) {
        add(node.loc);
    }

    function cancel() {
        context.enter(iD.modes.Browse(context));
    }

    mode.enter = function() {
        context.install(behavior);
    };

    mode.exit = function() {
        context.uninstall(behavior);
    };

    return mode;
};
