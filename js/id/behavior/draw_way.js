iD.behavior.DrawWay = function(context, wayId, index, mode, baseGraph) {
    var way = context.entity(wayId),
        isClosed = way.isClosed(),
        isDegenerate = way.isDegenerate(),
        isReverse = typeof index !== 'undefined',
        isOrthogonal = (mode.option === 'orthogonal' && way.nodes.length > 2),
        finished = false,
        annotation = t((isDegenerate ?
            'operations.start.annotation.' :
            'operations.continue.annotation.') + context.geometry(wayId)),
        draw = iD.behavior.Draw(context);

    var mouseCoord = context.map().mouseCoordinates(),
        startIndex = isReverse ? 0 : way.nodes.length - 1,
        start, end, ortho1, ortho2, segment;

    if (isOrthogonal) {
        start = iD.Node({ loc: context.graph().entity(way.nodes[1]).loc }),
        ortho1 = iD.Node({ loc: start.loc });
        ortho2 = iD.Node({ loc: context.graph().entity(way.nodes[0]).loc });
        end = iD.Node({ loc: ortho2.loc });
        segment = iD.Way({
            nodes: [start.id, ortho1.id, ortho2.id, end.id],
            tags: _.clone(way.tags)
        });
    } else {
        start = iD.Node({ loc: context.graph().entity(way.nodes[startIndex]).loc }),
        end = iD.Node({ loc: mouseCoord });
        segment = iD.Way({
            nodes: isReverse ? [end.id, start.id] : [start.id, end.id],
            tags: _.clone(way.tags)
        });
    }

    var f = context[way.isDegenerate() ? 'replace' : 'perform'];
    if (isOrthogonal) {
        f(iD.actions.AddEntity(start),
            iD.actions.AddEntity(ortho1),
            iD.actions.AddEntity(ortho2),
            iD.actions.AddEntity(end),
            iD.actions.AddEntity(segment));
    } else if (isClosed) {
        f(iD.actions.AddEntity(end),
            iD.actions.AddVertex(wayId, end.id, index));
    } else {
        f(iD.actions.AddEntity(start),
            iD.actions.AddEntity(end),
            iD.actions.AddEntity(segment));
    }


    function move(targets) {
        for (var i = 0; i < targets.length; i++) {
            var entity = targets[i].entity,
                loc = targets[i].loc,
                point = targets[i].point,
                which = isOrthogonal ? [ortho1.id, ortho2.id][i] : end.id;

            if (entity) {
                if (entity.type === 'node' && entity.id !== which) {
                    loc = entity.loc;
                } else if (entity.type === 'way' && entity.id !== segment.id) {
                    loc = iD.geo.chooseEdge(context.childNodes(entity), point, context.projection).loc;
                }
            }

            context.replace(iD.actions.MoveNode(which, loc));
        }
    }

    function undone() {
        finished = true;
        context.pop();
        context.enter(iD.modes.Browse(context));
    }

    function setActiveElements() {
        var active = isClosed ? [wayId, end.id] : [segment.id, start.id, end.id];
        context.surface().selectAll(iD.util.entitySelector(active))
            .classed('active', true);
        // context.surface().selectAll(iD.util.entitySelector([way.id]))
            // .classed('active', true);
    }

    var drawWay = function(surface) {
        draw
            .on('move', move)
            .on('click', drawWay.add)
            .on('clickWay', drawWay.addWay)
            .on('clickNode', drawWay.addNode)
            .on('undo', context.undo)
            .on('cancel', drawWay.cancel)
            .on('finish', drawWay.finish);

        if (mode.option === 'orthogonal') {
            var seg = [start.loc];
            if (way.nodes.length > 2) {
                var next = context.entity(way.nodes[1]);
                seg.push(next.loc);
            }
            draw.startSegment(seg);
        }

        context.map()
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
            .on('drawn.draw', null);

        surface.call(draw.off)
            .selectAll('.active')
            .classed('active', false);

        context.history()
            .on('undone.draw', null);
    };

    function ReplaceTemporaryNode(newNode) {
        return function(graph) {
            if (isClosed) {
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
    drawWay.add = function(loc, more) {
        // prevent duplicate nodes
        var last = context.hasEntity(way.nodes[way.nodes.length - (isClosed ? 2 : 1)]);
        if (last && last.loc[0] === loc[0] && last.loc[1] === loc[1]) return;

        var newNode = iD.Node({loc: loc});

        context.replace(
            iD.actions.AddEntity(newNode),
            ReplaceTemporaryNode(newNode),
            annotation);

        if (!more) {
            finished = true;
            context.enter(mode);
        }
    };

    // Connect the way to an existing way.
    drawWay.addWay = function(loc, edge, more) {
        var previousEdge = startIndex ?
            [way.nodes[startIndex], way.nodes[startIndex - 1]] :
            [way.nodes[0], way.nodes[1]];

        // Avoid creating duplicate segments
        if (!isClosed && iD.geo.edgeEqual(edge, previousEdge)) return;

        var newNode = iD.Node({ loc: loc });

        context.perform(
            iD.actions.AddMidpoint({ loc: loc, edge: edge}, newNode),
            ReplaceTemporaryNode(newNode),
            annotation);

        if (!more) {
            finished = true;
            context.enter(mode);
        }
    };

    // Connect the way to an existing node and continue drawing.
    drawWay.addNode = function(node, more) {

        // Avoid creating duplicate segments
        if (way.areAdjacent(node.id, way.nodes[way.nodes.length - 1])) return;

        context.perform(
            ReplaceTemporaryNode(node),
            annotation);

        if (!more) {
            finished = true;
            context.enter(mode);
        }
    };

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
