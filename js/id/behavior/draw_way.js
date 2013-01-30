iD.behavior.DrawWay = function(wayId, index, mode, baseGraph) {
    var map = mode.map,
        history = mode.history,
        controller = mode.controller,
        way = mode.history.graph().entity(wayId),
        finished = false,
        annotation = 'added to a way',
        draw = iD.behavior.Draw(map);

    var node = iD.Node({loc: map.mouseCoordinates()}),
        nodeId = node.id;

    history[way.isDegenerate() ? 'replace' : 'perform'](
        iD.actions.AddNode(node),
        iD.actions.AddWayNode(wayId, node.id, index));

    function move(datum) {
        var loc = map.mouseCoordinates();

        if (datum.type === 'node' || datum.midpoint) {
            loc = datum.loc;
        } else if (datum.type === 'way') {
            loc = iD.geo.chooseIndex(datum, d3.mouse(map.surface.node()), map).loc;
        }

        history.replace(iD.actions.MoveNode(nodeId, loc));
    }

    function undone() {
        controller.enter(iD.modes.Browse());
    }

    var drawWay = function(surface) {
        draw.on('move', move)
            .on('click', drawWay.add)
            .on('clickWay', drawWay.addWay)
            .on('clickNode', drawWay.addNode)
            .on('clickMidpoint', drawWay.addMidpoint)
            .on('undo', history.undo)
            .on('cancel', drawWay.cancel)
            .on('finish', drawWay.finish);

        map.fastEnable(false)
            .minzoom(16)
            .dblclickEnable(false);

        surface.call(draw)
          .selectAll('.way, .node')
            .filter(function (d) { return d.id === wayId || d.id === nodeId; })
            .classed('active', true);

        history.on('undone.draw', undone);
    };

    drawWay.off = function(surface) {
        if (!finished)
            history.pop();

        map.fastEnable(true)
            .minzoom(0)
            .tail(false);

        window.setTimeout(function() {
            map.dblclickEnable(true);
        }, 1000);

        surface.call(draw.off)
          .selectAll('.way, .node')
            .classed('active', false);

        history.on('undone.draw', null);
    };

    drawWay.annotation = function(_) {
        if (!arguments.length) return annotation;
        annotation = _;
        return drawWay;
    };

    function ReplaceTemporaryNode(newNode) {
        return function(graph) {
            return graph
                .replace(way.removeNode(nodeId).addNode(newNode.id, index))
                .remove(node);
        }
    }

    // Connect the way to an existing node and continue drawing.
    drawWay.addNode = function(node) {
        history.perform(
            ReplaceTemporaryNode(node),
            annotation);

        finished = true;
        controller.enter(mode);
    };

    // Connect the way to an existing way.
    drawWay.addWay = function(way, loc, wayIndex) {
        var newNode = iD.Node({loc: loc});

        history.perform(
            iD.actions.AddNode(newNode),
            iD.actions.AddWayNode(way.id, newNode.id, wayIndex),
            ReplaceTemporaryNode(newNode),
            annotation);

        finished = true;
        controller.enter(mode);
    };

    // Accept the current position of the temporary node and continue drawing.
    drawWay.add = function(loc) {
        var newNode = iD.Node({loc: loc});

        history.replace(
            iD.actions.AddNode(newNode),
            ReplaceTemporaryNode(newNode),
            annotation);

        finished = true;
        controller.enter(mode);
    };

    // Add a midpoint, connect the way to it, and continue drawing.
    drawWay.addMidpoint = function(midpoint) {
        var node = iD.Node();

        history.perform(
            iD.actions.AddMidpoint(midpoint, node),
            ReplaceTemporaryNode(node),
            annotation);

        finished = true;
        controller.enter(mode);
    };

    // Finish the draw operation, removing the temporary node. If the way has enough
    // nodes to be valid, it's selected. Otherwise, return to browse mode.
    drawWay.finish = function() {
        history.pop();
        finished = true;

        var way = history.graph().entity(wayId);
        if (way) {
            controller.enter(iD.modes.Select(way, true));
        } else {
            controller.enter(iD.modes.Browse());
        }
    };

    // Cancel the draw operation and return to browse, deleting everything drawn.
    drawWay.cancel = function() {
        history.perform(
            d3.functor(baseGraph),
            'cancelled drawing');

        finished = true;
        controller.enter(iD.modes.Browse());
    };

    return d3.rebind(drawWay, event, 'on');
};
