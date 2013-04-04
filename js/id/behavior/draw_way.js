iD.behavior.DrawWay = function(context, wayId, index, mode, baseGraph) {
    var way = context.entity(wayId),
        isArea = way.geometry() === 'area',
        finished = false,
        annotation = t((way.isDegenerate() ?
            'operations.start.annotation.' :
            'operations.continue.annotation.') + context.geometry(wayId)),
        draw = iD.behavior.Draw(context);

    var startIndex = typeof index === 'undefined' ? way.nodes.length - 1 : 0,
        start = iD.Node({loc: context.graph().entity(way.nodes[startIndex]).loc}),
        end = iD.Node({loc: context.map().mouseCoordinates()}),
        segment = iD.Way({
            nodes: [start.id, end.id],
            tags: _.clone(way.tags)
        });

    var f = context[way.isDegenerate() ? 'replace' : 'perform'];
    if (isArea) {
        f(iD.actions.AddEntity(end),
            iD.actions.AddVertex(wayId, end.id, index));
    } else {
        f(iD.actions.AddEntity(start),
            iD.actions.AddEntity(end),
            iD.actions.AddEntity(segment));
    }

    function move(datum) {
        var loc = context.map().mouseCoordinates();

        if (datum.id === end.id || datum.id === segment.id) {
            context.surface().selectAll('.way, .node')
                .filter(function(d) {
                    return d.id === end.id || d.id === segment.id;
                })
                .classed('active', true);
        } else if (datum.type === 'node') {
            loc = datum.loc;
        } else if (datum.type === 'way') {
            loc = iD.geo.chooseIndex(datum, d3.mouse(context.surface().node()), context).loc;
        }

        context.replace(iD.actions.MoveNode(end.id, loc));
    }

    function undone() {
        finished = true;
        context.enter(iD.modes.Browse(context));
    }

    function lineActives(d) {
        return d.id === segment.id || d.id === start.id || d.id === end.id;
    }

    function areaActives(d) {
        return d.id === wayId || d.id === end.id;
    }

    var drawWay = function(surface) {
        draw.on('move', move)
            .on('click', drawWay.add)
            .on('clickWay', drawWay.addWay)
            .on('clickNode', drawWay.addNode)
            .on('undo', context.undo)
            .on('cancel', drawWay.cancel)
            .on('finish', drawWay.finish);

        context.map()
            .minzoom(16)
            .dblclickEnable(false);

        surface.call(draw)
          .selectAll('.way, .node')
            .filter(isArea ? areaActives : lineActives)
            .classed('active', true);

        context.history()
            .on('undone.draw', undone);
    };

    drawWay.off = function(surface) {
        if (!finished)
            context.pop();

        context.map()
            .minzoom(0)
            .tail(false);

        surface.call(draw.off)
          .selectAll('.way, .node')
            .classed('active', false);

        context.history()
            .on('undone.draw', null);
    };

    function ReplaceTemporaryNode(newNode) {
        return function(graph) {
            if (isArea) {
                return graph
                    .replace(way.removeNode(end.id).addNode(newNode.id, index))
                    .remove(end);

            } else {
                return graph
                    .replace(graph.entity(wayId).addNode(newNode.id, index))
                    .remove(end)
                    .remove(segment)
                    .remove(start);
            }
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
    drawWay.addWay = function(loc, edge) {
        var newNode = iD.Node({ loc: loc });

        context.perform(
            iD.actions.AddMidpoint({ loc: loc, edge: edge}, newNode),
            ReplaceTemporaryNode(newNode),
            annotation);

        finished = true;
        context.enter(mode);
    };

    // Connect the way to an existing node and continue drawing.
    drawWay.addNode = function(node) {

        // Avoid creating duplicate segments
        if (way.areAdjacent(node.id, way.nodes[way.nodes.length - 1])) return;

        context.perform(
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

        window.setTimeout(function() {
            context.map().dblclickEnable(true);
        }, 1000);

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

        window.setTimeout(function() {
            context.map().dblclickEnable(true);
        }, 1000);

        finished = true;
        context.enter(iD.modes.Browse(context));
    };

    return drawWay;
};
