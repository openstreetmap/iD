iD.modes.AddLine = function(context, option) {
    var mode = {
        id: 'add-line',
        button: 'line',
        title: t('modes.add_line.title'),
        description: t('modes.add_line.description'),
        key: '2',
        option: option
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

        if (mode.option === 'orthogonal') {
            context.perform(
                iD.actions.AddEntity(node),
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id),
                iD.actions.AddVertex(way.id, node.id));
        } else {
            context.perform(
                iD.actions.AddEntity(node),
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id));
        }
        context.enter(iD.modes.DrawLine(context, way.id, baseGraph, undefined, mode.option));
    }

    function startFromWay(loc, edge) {
        var baseGraph = context.graph(),
            node = iD.Node({loc: loc}),
            way = iD.Way();

        if (mode.option === 'orthogonal') {
            context.perform(
                iD.actions.AddEntity(node),
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id),
                iD.actions.AddVertex(way.id, node.id),
                iD.actions.AddMidpoint({ loc: loc, edge: edge }, node));
        } else {
            context.perform(
                iD.actions.AddEntity(node),
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id),
                iD.actions.AddMidpoint({ loc: loc, edge: edge }, node));
        }
        context.enter(iD.modes.DrawLine(context, way.id, baseGraph, undefined, mode.option));
    }

    function startFromNode(node) {
        var graph = context.graph(),
            way = iD.Way();

        if (mode.option === 'orthogonal') {
            context.perform(
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id),
                iD.actions.AddVertex(way.id, node.id));
        } else {
            context.perform(
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id));
        }
        context.enter(iD.modes.DrawLine(context, way.id, baseGraph, undefined, mode.option));
    }

    mode.enter = function() {
        context.install(behavior);
    };

    mode.exit = function() {
        mode.option = option;  // reset
        context.uninstall(behavior);
    };

    return mode;
};
