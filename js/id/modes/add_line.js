iD.modes.AddLine = function(context) {
    var mode = {
        id: 'add-line',
        button: 'line',
        title: t('modes.add_line.title'),
        description: t('modes.add_line.description'),
        key: '2'
    };

    var behavior = iD.behavior.AddWay(context)
        .tail(t('modes.add_line.tail'))
        .on('start', start)
        .on('startFromWay', startFromWay)
        .on('startFromNode', startFromNode);

    function start(loc) {
        var baseGraph = context.graph(),
            node = iD.Node({loc: loc}),
            way = iD.Way();

        context.perform(
            iD.actions.AddEntity(node),
            iD.actions.AddEntity(way),
            iD.actions.AddVertex(way.id, node.id));

        context.enter(iD.modes.DrawLine(context, way.id, baseGraph));
    }

    function startFromWay(loc, edge) {
        var baseGraph = context.graph(),
            node = iD.Node({loc: loc}),
            way = iD.Way();

        context.perform(
            iD.actions.AddEntity(node),
            iD.actions.AddEntity(way),
            iD.actions.AddVertex(way.id, node.id),
            iD.actions.AddMidpoint({ loc: loc, edge: edge }, node));

        context.enter(iD.modes.DrawLine(context, way.id, baseGraph));
    }

    function startFromNode(node) {
        var baseGraph = context.graph(),
            way = iD.Way();

        context.perform(
            iD.actions.AddEntity(way),
            iD.actions.AddVertex(way.id, node.id));

        context.enter(iD.modes.DrawLine(context, way.id, baseGraph));
    }

    mode.enter = function() {
        context.install(behavior);
    };

    mode.exit = function() {
        context.uninstall(behavior);
    };

    return mode;
};
