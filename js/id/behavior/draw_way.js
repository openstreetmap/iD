iD.behavior.DrawWay = function(context, wayId, index, mode, baseGraph) {
    var way = context.entity(wayId),
        finished = false,
        annotation = t((way.isDegenerate() ?
            'operations.start.annotation.' :
            'operations.continue.annotation.') + context.geometry(wayId)),
        draw = iD.behavior.Draw(context);

    var node = iD.Node({loc: context.map().mouseCoordinates()}),
        nodeId = node.id;

    context[way.isDegenerate() ? 'replace' : 'perform'](
        iD.actions.AddEntity(node),
        iD.actions.AddVertex(wayId, node.id, index));

    function move(datum) {
        var loc = context.map().mouseCoordinates();

        if (datum.type === 'node') {
            if (datum.id === nodeId) {
                context.surface().selectAll('.way, .node')
                    .filter(function (d) { return d.id === nodeId; })
                    .classed('active', true);
            } else {
                loc = datum.loc;
            }
        } else if (datum.type === 'midpoint' || datum.type === 'way') {
            var way = datum.type === 'way' ?
                datum :
                context.entity(datum.ways[0].id);
            loc = iD.geo.chooseIndex(way, d3.mouse(context.surface().node()), context).loc;
        }

        context.replace(iD.actions.MoveNode(nodeId, loc));
    }

    function undone() {
        context.enter(iD.modes.Browse(context));
    }

    var drawWay = function(surface) {
        draw.on('move', move)
            .on('click', drawWay.add)
            .on('clickWay', drawWay.addWay)
            .on('clickNode', drawWay.addNode)
            .on('clickMidpoint', drawWay.addMidpoint)
            .on('undo', context.undo)
            .on('cancel', drawWay.cancel)
            .on('finish', drawWay.finish);

        context.map()
            .fastEnable(false)
            .minzoom(16)
            .dblclickEnable(false);

        surface.call(draw)
          .selectAll('.way, .node')
            .filter(function (d) { return d.id === wayId || d.id === nodeId; })
            .classed('active', true);

        context.history()
            .on('undone.draw', undone);
    };

    drawWay.off = function(surface) {
        if (!finished)
            context.pop();

        context.map()
            .fastEnable(true)
            .minzoom(0)
            .tail(false);

        window.setTimeout(function() {
            context.map().dblclickEnable(true);
        }, 1000);

        surface.call(draw.off)
          .selectAll('.way, .node')
            .classed('active', false);

        context.history()
            .on('undone.draw', null);
    };

    function ReplaceTemporaryNode(newNode) {
        return function(graph) {
            return graph
                .replace(way.removeNode(nodeId).addNode(newNode.id, index))
                .remove(node);
        };
    }

    // Accept the current position of the temporary node and continue drawing.
    drawWay.add = function(loc) {
        var newNode = iD.Node({loc: loc});

        context.replace(
            iD.actions.AddEntity(newNode),
            ReplaceTemporaryNode(newNode),
            annotation);

        finished = true;
        context.enter(mode);
    };

    // Connect the way to an existing way.
    drawWay.addWay = function(way, loc, wayIndex) {
        var newNode = iD.Node({loc: loc});

        context.perform(
            iD.actions.AddEntity(newNode),
            iD.actions.AddVertex(way.id, newNode.id, wayIndex),
            ReplaceTemporaryNode(newNode),
            annotation);

        finished = true;
        context.enter(mode);
    };

    // Connect the way to an existing node and continue drawing.
    drawWay.addNode = function(node) {
        context.perform(
            ReplaceTemporaryNode(node),
            annotation);

        finished = true;
        context.enter(mode);
    };

    // Add a midpoint, connect the way to it, and continue drawing.
    drawWay.addMidpoint = function(midpoint) {
        var node = iD.Node();

        context.perform(
            iD.actions.AddMidpoint(midpoint, node),
            ReplaceTemporaryNode(node),
            annotation);

        finished = true;
        context.enter(mode);
    };

    // Finish the draw operation, removing the temporary node. If the way has enough
    // nodes to be valid, it's selected. Otherwise, return to browse mode.
    drawWay.finish = function() {
        context.pop();
        finished = true;

        var way = context.entity(wayId);
        if (way) {
            context.enter(iD.modes.Select(context, [way.id], true));
        } else {
            context.enter(iD.modes.Browse(context));
        }
    };

    // Cancel the draw operation and return to browse, deleting everything drawn.
    drawWay.cancel = function() {
        context.perform(
            d3.functor(baseGraph),
            t('operations.cancel_draw.annotation'));

        finished = true;
        context.enter(iD.modes.Browse(context));
    };

    return d3.rebind(drawWay, event, 'on');
};
