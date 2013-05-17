iD.behavior.DrawWay = function(context, wayId, index, mode, baseGraph) {
    var way = context.entity(wayId),
        isArea = context.geometry(wayId) === 'area',
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
        var loc;

        if (datum.type === 'node' && datum.id !== end.id) {
            loc = datum.loc;
        } else if (datum.type === 'way' && datum.id !== segment.id) {
            loc = iD.geo.chooseEdge(context.childNodes(datum), context.mouse(), context.projection).loc;
        } else {
            loc = context.map().mouseCoordinates();
        }

        context.replace(iD.actions.MoveNode(end.id, loc));
    }

    function undone() {
        finished = true;
        context.enter(iD.modes.Browse(context));
    }

    function setActiveElements() {
        var active = isArea ? [wayId, end.id] : [segment.id, start.id, end.id];
        context.surface().selectAll(iD.util.entitySelector(active))
            .classed('active', true);
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
            .dblclickEnable(false)
            .on('drawn.draw', setActiveElements);

        setActiveElements();

        surface.call(draw);

        context.history()
            .on('undone.draw', undone);
    };

    drawWay.off = function(surface) {
        if (!finished)
            context.pop();

        context.map()
            .minzoom(0)
            .on('drawn.draw', null);

        surface.call(draw.off)
            .selectAll('.active')
            .classed('active', false);

        context.history()
            .on('undone.draw', null);
    };

    function ReplaceTemporaryNode(newNode) {
        return function(graph) {
            if (isArea) {
                return graph
                    .replace(way.addNode(newNode.id, index))
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

        // prevent duplicate nodes
        var last = context.hasEntity(way.nodes[way.nodes.length - (isArea ? 2 : 1)]);
        if (last && last.loc[0] === loc[0] && last.loc[1] === loc[1]) return;

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

        // Avoid creating duplicate segments
        if (!isArea) {
            if (edge[0] === way.nodes[way.nodes.length - 1] ||
                edge[1] === way.nodes[way.nodes.length - 1]) return;
        }

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

        if (context.hasEntity(wayId)) {
            context.enter(
                iD.modes.Select(context, [wayId])
                    .suppressMenu(true)
                    .newFeature(true));
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

    drawWay.tail = function(text) {
        draw.tail(text);
        return drawWay;
    };

    return drawWay;
};
