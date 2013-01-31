iD.modes.AddPoint = function(context) {
    var mode = {
        id: 'add-point',
        title: t('modes.add_point.title'),
        description: t('modes.add_point.description'),
        key: t('modes.add_point.key')
    };

    var behavior;

    mode.enter = function() {
        function add(loc) {
            var node = iD.Node({loc: loc});

            context.perform(
                iD.actions.AddEntity(node),
                t('operations.add.annotation.point'));

            context.enter(iD.modes.Select(context, [node.id], true));
        }

        function addWay(way, loc, index) {
            add(loc);
        }

        function addNode(node) {
            add(node.loc);
        }

        function cancel() {
            context.enter(iD.modes.Browse(context));
        }

        behavior = iD.behavior.Draw(context)
            .on('click', add)
            .on('clickWay', addWay)
            .on('clickNode', addNode)
            .on('clickMidpoint', addNode)
            .on('cancel', cancel)
            .on('finish', cancel);

        context.install(behavior);
        context.tail(t('modes.add_point.tail'));
    };

    mode.exit = function() {
        context.tail(false);
        context.uninstall(behavior);
    };

    return mode;
};
