iD.behavior.DrawWay = function(wayId, headId, tailId, index, mode, baseGraph) {
    var map = mode.map,
        history = mode.history,
        controller = mode.controller,
        event = d3.dispatch('add', 'addHead', 'addTail', 'addNode', 'addWay'),
        way = mode.history.graph().entity(wayId),
        hover, draw;

    var node = iD.Node({loc: map.mouseCoordinates()}),
        nodeId = node.id;

    history[way.isDegenerate() ? 'replace' : 'perform'](
        iD.actions.AddNode(node),
        iD.actions.AddWayNode(wayId, node.id, index));

    function move() {
        history.replace(iD.actions.MoveNode(nodeId, map.mouseCoordinates()));
    }

    function add() {
        var datum = d3.select(d3.event.target).datum() || {};

        if (datum.id === headId) {
            event.addHead(datum);
        } else if (datum.id === tailId) {
            event.addTail(datum);
        } else if (datum.type === 'node' && datum.id !== nodeId) {
            event.addNode(datum);
        } else if (datum.type === 'way') {
            var choice = iD.geo.chooseIndex(datum, d3.mouse(map.surface.node()), map);
            event.addWay(datum, choice.loc, choice.index);
        } else if (datum.midpoint) {
            var way = history.graph().entity(datum.way);
            event.addWay(way, datum.loc, datum.index);
        } else {
            event.add(map.mouseCoordinates());
        }
    }

    function undone() {
        controller.enter(iD.modes.Browse());
    }

    var drawWay = function(surface) {
        map.fastEnable(false)
            .minzoom(16)
            .dblclickEnable(false);

        surface.call(hover)
            .call(draw)
          .selectAll('.way, .node')
            .filter(function (d) { return d.id === wayId || d.id === nodeId; })
            .classed('active', true);

        history.on('undone.draw', undone);
    };

    drawWay.off = function(surface) {
        map.fastEnable(true)
            .minzoom(0)
            .tail(false);

        window.setTimeout(function() {
            map.dblclickEnable(true);
        }, 1000);

        surface.call(hover.off)
            .call(draw.off)
          .selectAll('.way, .node')
            .classed('active', false);

        history.on('undone.draw', null);
    };

    function ReplaceTemporaryNode(newNode) {
        return function(graph) {
            return graph
                .replace(way.removeNode(nodeId).addNode(newNode.id, index))
                .remove(node);
        }
    }

    // Connect the way to an existing node and continue drawing.
    drawWay.addNode = function(node, annotation) {
        history.perform(
            ReplaceTemporaryNode(node),
            annotation);

        controller.enter(mode);
    };

    // Connect the way to an existing way.
    drawWay.addWay = function(way, loc, wayIndex, annotation) {
        var newNode = iD.Node({loc: loc});

        history.perform(
            iD.actions.AddNode(newNode),
            iD.actions.AddWayNode(way.id, newNode.id, wayIndex),
            ReplaceTemporaryNode(newNode),
            annotation);

        controller.enter(mode);
    };

    // Accept the current position of the temporary node and continue drawing.
    drawWay.add = function(loc, annotation) {
        var newNode = iD.Node({loc: loc});

        history.replace(
            iD.actions.AddNode(newNode),
            ReplaceTemporaryNode(newNode),
            annotation);

        controller.enter(mode);
    };

    // Finish the draw operation, removing the temporary node. If the way has enough
    // nodes to be valid, it's selected. Otherwise, return to browse mode.
    drawWay.finish = function() {
        history.pop();

        var way = history.graph().entity(wayId);
        if (way) {
            controller.enter(iD.modes.Select(way, true));
        } else {
            controller.enter(iD.modes.Browse());
        }
    };

    // Cancel the draw operation and return to browse, deleting everything drawn.
    drawWay.cancel = function() {
        history.perform(d3.functor(baseGraph), 'cancelled drawing');
        controller.enter(iD.modes.Browse());
    };

    hover = iD.behavior.Hover();

    draw = iD.behavior.Draw()
        .on('move', move)
        .on('add', add)
        .on('undo', history.undo)
        .on('cancel', drawWay.cancel)
        .on('finish', drawWay.finish);

    return d3.rebind(drawWay, event, 'on');
};
