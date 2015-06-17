iD.behavior.DrawWay = function(context, wayId, index, mode, baseGraph) {
    var way = context.entity(wayId),
        isClosed = way.isClosed(),
        isReverse = typeof index !== 'undefined',
        isOrthogonal = (mode.option === 'orthogonal' && way.nodes.length > 2),
        finished = false,
        annotation = t((way.isDegenerate() ?
            'operations.start.annotation.' :
            'operations.continue.annotation.') + context.geometry(wayId)),
        draw = iD.behavior.Draw(context);

    var mouseCoord = context.map().mouseCoordinates(),
        startIndex = isReverse ? 0 : way.nodes.length - 1,
        start, end, ortho1, ortho2, segment;

    if (isOrthogonal) {
        ortho1 = iD.Node({ loc: context.graph().entity(way.nodes[1]).loc });
        ortho2 = iD.Node({ loc: context.graph().entity(way.nodes[0]).loc });
    } else {
        start = iD.Node({ loc: context.graph().entity(way.nodes[startIndex]).loc });
        end = iD.Node({ loc: mouseCoord });
        segment = iD.Way({
            nodes: isReverse ? [end.id, start.id] : [start.id, end.id],
            tags: _.clone(way.tags)
        });
    }

    var f = context[way.isDegenerate() ? 'replace' : 'perform'];
    if (isOrthogonal) {
        context.replace(
            iD.actions.AddEntity(ortho1),
            iD.actions.AddEntity(ortho2),
            iD.actions.AddVertex(wayId, ortho1.id, -1),
            iD.actions.AddVertex(wayId, ortho2.id, -1));
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
                selfNode = isOrthogonal ? [ortho1.id, ortho2.id][i] : end.id,
                selfWay = (isOrthogonal || isClosed) ? wayId : segment.id;

            if (entity) {    // snap to target entity unless it's self..
                if (entity.type === 'node' && entity.id !== selfNode) {
                    loc = entity.loc;
                } else if (entity.type === 'way' && entity.id !== selfWay) {
                    loc = iD.geo.chooseEdge(context.childNodes(entity), point, context.projection).loc;
                }
            }

            context.replace(iD.actions.MoveNode(selfNode, loc));
        }
    }

    function undone() {
        finished = true;
        context.pop();
        context.enter(iD.modes.Browse(context));
    }

    function setActiveElements() {
        var active = isOrthogonal ? [wayId, ortho1.id, ortho2.id]
            : isClosed ? [wayId, end.id]
            : [segment.id, start.id, end.id];

        context.surface().selectAll(iD.util.entitySelector(active))
            .classed('active', true);
    }

    var drawWay = function(surface) {
        draw
            .on('move', move)
            .on('click', drawWay.add)
            .on('clickWay', drawWay.addWay)
            .on('clickNode', drawWay.addNode)
            .on('clickTargets', drawWay.addTargets)
            .on('undo', context.undo)
            .on('cancel', drawWay.cancel)
            .on('finish', drawWay.finish);

        if (isOrthogonal) {
            draw.startSegment([ortho2.loc, ortho1.loc]);
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


    // Add multiple click targets, snapping to target entities if necessary..
    drawWay.addTargets = function(targets) {
        function vecAdd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }

        var newIds = [],
            entity, target, choice, edge, newNode, i;

        // Avoid creating orthogonal shapes with duplicate nodes (i.e. a line)..
        for (i = 0; i < targets.length; i++) {
            entity = targets[i].entity;
            if (!entity) continue;
            // For now, orthogonal mode only..
            if (entity.id === way.nodes[0] || entity.id === way.nodes[1]) return;
        }

        // For each target: create a node, or snap to an existing entity..
        for (i = 0; i < targets.length; i++) {
            target = targets[i];
            entity = target.entity;

            if (entity) {
                // Get latest.. If multiple nodes snap to the same target entity,
                // it may have been modified during this loop..
                entity = context.entity(entity.id);

                if (entity.type === 'node') {
                    newIds.push(entity.id);
                } else if (entity.type === 'way') {
                    choice = iD.geo.chooseEdge(context.childNodes(entity), target.point, context.projection);
                    edge = [entity.nodes[choice.index - 1], entity.nodes[choice.index]];
                    newNode = iD.Node({loc: choice.loc});
                    context.replace(iD.actions.AddMidpoint({ loc: choice.loc, edge: edge}, newNode));
                    newIds.push(newNode.id);
                }

            } else {
                newNode = iD.Node({loc: target.loc});
                context.replace(iD.actions.AddEntity(newNode));
                newIds.push(newNode.id);
            }
        }

        // Replace temporary nodes..
        context.replace(function(graph) {
                var newWay = way;
                for (var i = 0; i < newIds.length; i++) {
                    newWay = newWay.addNode(newIds[i], -1);
                }
                // For now, orthogonal mode only..
                return graph
                    .replace(newWay)
                    .remove(ortho1)
                    .remove(ortho2);
            }
        );

        // Try to snap other nearby nodes onto the new shape..
        if (!d3.event.altKey) {
            var pad = 3,   // pad extent by a few screen pixels
                proj = context.projection,
                newWay = context.entity(wayId),
                extent = newWay.extent(context.graph()),
                min = vecAdd( proj(extent[0]), [-pad,  pad] ),
                max = vecAdd( proj(extent[1]), [ pad, -pad] ),
                padExtent = iD.geo.Extent(proj.invert(min), proj.invert(max));

            var testNodes = context.intersects(padExtent).filter(function (entity) {
                return entity.type === 'node' && newWay.nodes.indexOf(entity.id) === -1;
            });

            for (i = 0; i < testNodes.length; i++) {
                choice = iD.geo.chooseEdge(context.childNodes(newWay), proj(testNodes[i].loc), proj);
                if (choice.distance < pad) {
                    edge = [newWay.nodes[choice.index - 1], newWay.nodes[choice.index]];
                    context.replace(iD.actions.AddMidpoint({ loc: choice.loc, edge: edge}, testNodes[i]));
                    newWay = context.entity(wayId);
                }
            }
        }

        context.perform(
            iD.actions.ChangeTags(wayId, {building:'yes'}),  // just for show, remove later..
            annotation);

        finished = true;
        context.enter(iD.modes.Browse(context));  // just for show, replace with Select later..
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
    drawWay.add = function(loc) {
        // prevent duplicate nodes
        var last = context.hasEntity(way.nodes[way.nodes.length - (isClosed ? 2 : 1)]);
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
