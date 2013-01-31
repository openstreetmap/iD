iD.modes.AddLine = function(context) {
    var mode = {
        id: 'add-line',
        button: 'line',
        title: t('modes.add_line.title'),
        description: t('modes.add_line.description'),
        key: t('modes.add_line.key')
    };

    var behavior,
        defaultTags = {highway: 'residential'};

    mode.enter = function() {
        function start(loc) {
            var graph = context.graph(),
                node = iD.Node({loc: loc}),
                way = iD.Way({tags: defaultTags});

            context.perform(
                iD.actions.AddEntity(node),
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id));

            context.enter(iD.modes.DrawLine(context, way.id, 'forward', graph));
        }

        function startFromWay(other, loc, index) {
            var graph = context.graph(),
                node = iD.Node({loc: loc}),
                way = iD.Way({tags: defaultTags});

            context.perform(
                iD.actions.AddEntity(node),
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id),
                iD.actions.AddVertex(other.id, node.id, index));

            context.enter(iD.modes.DrawLine(context, way.id, 'forward', graph));
        }

        function startFromNode(node) {
            var graph = context.graph(),
                parent = graph.parentWays(node)[0],
                isLine = parent && parent.geometry(graph) === 'line';

            if (isLine && parent.first() === node.id) {
                context.enter(iD.modes.DrawLine(context, parent.id, 'backward', graph));

            } else if (isLine && parent.last() === node.id) {
                context.enter(iD.modes.DrawLine(context, parent.id, 'forward', graph));

            } else {
                var way = iD.Way({tags: defaultTags});

                context.perform(
                    iD.actions.AddEntity(way),
                    iD.actions.AddVertex(way.id, node.id));

                context.enter(iD.modes.DrawLine(context, way.id, 'forward', graph));
            }
        }

        function startFromMidpoint(midpoint) {
            var graph = context.graph(),
                node = iD.Node(),
                way = iD.Way({tags: defaultTags});

            context.perform(
                iD.actions.AddMidpoint(midpoint, node),
                iD.actions.AddEntity(way),
                iD.actions.AddVertex(way.id, node.id));

            context.enter(iD.modes.DrawLine(context, way.id, 'forward', graph));
        }

        behavior = iD.behavior.AddWay(context)
            .on('start', start)
            .on('startFromWay', startFromWay)
            .on('startFromNode', startFromNode)
            .on('startFromMidpoint', startFromMidpoint);

        context.install(behavior);
        context.tail(t('modes.add_line.tail'));
    };

    mode.exit = function() {
        context.uninstall(behavior);
    };

    return mode;
};
