iD.modes.ImproveWay = function(context, wayId, fixedVertexId) {
    var mode = {
        id: 'improve-way',
        button: context.geometry(wayId)
    };

    var keybinding = d3.keybinding('improve-way');

    mode.enter = function() {
        var way = context.entity(wayId),
            nodes = context.graph().childNodes(way),
            projection = context.projection,
            annotation = t('operations.add.annotation.vertex'),
            nextMode;

        var node = iD.Node({loc: context.map().mouseCoordinates()});

        context.perform(
            iD.actions.Noop(),
            annotation);

        function move() {
            var point = d3.mouse(context.map().surface.node()),
                edgeChoice = iD.geo.chooseEdge(nodes, point, projection),
                vertChoice = iD.geo.chooseVertex(nodes, point, projection),
                loc = projection.invert(point);

            var vertexId = nodes[vertChoice.index].id;
            if (vertChoice.distance < edgeChoice.distance && fixedVertexId !== vertexId) {
                context.pop();
                context.perform(
                    iD.actions.MoveNode(vertexId, loc),
                    annotation);
                nextMode = iD.modes.ImproveWay(context, wayId, vertexId);
            } else {
                context.pop();
                context.perform(
                    iD.actions.AddEntity(node),
                    iD.actions.AddVertex(wayId, node.id, edgeChoice.index),
                    iD.actions.MoveNode(node.id, loc),
                    annotation);
                nextMode = iD.modes.ImproveWay(context, wayId, node.id);
            }
        }

        function click() {
            context.enter(nextMode);
        }

        function finish() {
            d3.event.stopPropagation();
            context.enter(iD.modes.Select(context, [wayId], true));
        }

        function cancel() {
            context.pop();
            context.enter(iD.modes.Select(context, [wayId], true));
        }

        function undone() {
            context.enter(iD.modes.Browse(context));
        }

        context.surface()
            .on('mousemove.improve-way', move)
            .on('click.improve-way', click);

        context.history()
            .on('undone.improve-way', undone);

        keybinding
            .on('⎋', cancel)
            .on('↩', finish);

        d3.select(document)
            .call(keybinding);
    };

    mode.exit = function() {
        context.surface()
            .on('mousemove.improve-way', null)
            .on('click.improve-way', null);

        context.history()
            .on('undone.improve-way', null);

        keybinding.off();
    };

    mode.selection = function() {
        return [wayId];
    };

    return mode;
};
