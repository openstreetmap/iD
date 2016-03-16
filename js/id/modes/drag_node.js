iD.modes.DragNode = function(context) {
    var mode = {
        id: 'drag-node',
        button: 'browse'
    };

    var nudgeInterval,
        activeIDs,
        wasMidpoint,
        cancelled,
        selectedIDs = [],
        hover = iD.behavior.Hover(context)
            .altDisables(true)
            .on('hover', context.ui().sidebar.hover),
        edit = iD.behavior.Edit(context);

    function edge(point, size) {
        var pad = [30, 100, 30, 100];
        if (point[0] > size[0] - pad[0]) return [-10, 0];
        else if (point[0] < pad[2]) return [10, 0];
        else if (point[1] > size[1] - pad[1]) return [0, -10];
        else if (point[1] < pad[3]) return [0, 10];
        return null;
    }

    function startNudge(nudge) {
        if (nudgeInterval) window.clearInterval(nudgeInterval);
        nudgeInterval = window.setInterval(function() {
            context.pan(nudge);
        }, 50);
    }

    function stopNudge() {
        if (nudgeInterval) window.clearInterval(nudgeInterval);
        nudgeInterval = null;
    }

    function moveAnnotation(entity) {
        return t('operations.move.annotation.' + entity.geometry(context.graph()));
    }

    function connectAnnotation(entity) {
        return t('operations.connect.annotation.' + entity.geometry(context.graph()));
    }

    function origin(entity) {
        return context.projection(entity.loc);
    }

    function start(entity) {
        cancelled = d3.event.sourceEvent.shiftKey ||
            context.features().hasHiddenConnections(entity, context.graph());

        if (cancelled) return behavior.cancel();

        wasMidpoint = entity.type === 'midpoint';
        if (wasMidpoint) {
            var midpoint = entity;
            entity = iD.Node();
            context.perform(iD.actions.AddMidpoint(midpoint, entity));

             var vertex = context.surface()
                .selectAll('.' + entity.id);
             behavior.target(vertex.node(), entity);

        } else {
            context.perform(
                iD.actions.Noop());
        }

        activeIDs = _.pluck(context.graph().parentWays(entity), 'id');
        activeIDs.push(entity.id);

        context.enter(mode);
    }

    function datum() {
        if (d3.event.sourceEvent.altKey) {
            return {};
        }

        return d3.event.sourceEvent.target.__data__ || {};
    }

    // via https://gist.github.com/shawnbot/4166283
    function childOf(p, c) {
        if (p === c) return false;
        while (c && c !== p) c = c.parentNode;
        return c === p;
    }

    function move(entity) {
        if (cancelled) return;
        d3.event.sourceEvent.stopPropagation();

        var nudge = childOf(context.container().node(),
            d3.event.sourceEvent.toElement) &&
            edge(d3.event.point, context.map().dimensions());

        if (nudge) startNudge(nudge);
        else stopNudge();

        var loc = context.projection.invert(d3.event.point);

        var d = datum();
        if (d.type === 'node' && d.id !== entity.id) {
            loc = d.loc;
        } else if (d.type === 'way' && !d3.select(d3.event.sourceEvent.target).classed('fill')) {
            loc = iD.geo.chooseEdge(context.childNodes(d), context.mouse(), context.projection).loc;
        }

        context.replace(
            iD.actions.MoveNode(entity.id, loc),
            moveAnnotation(entity));
    }

    function end(entity) {
        if (cancelled) return;

        var d = datum();

        if (d.type === 'way') {
            var choice = iD.geo.chooseEdge(context.childNodes(d), context.mouse(), context.projection);
            context.replace(
                iD.actions.AddMidpoint({ loc: choice.loc, edge: [d.nodes[choice.index - 1], d.nodes[choice.index]] }, entity),
                connectAnnotation(d));

        } else if (d.type === 'node' && d.id !== entity.id) {
            context.replace(
                iD.actions.Connect([d.id, entity.id]),
                connectAnnotation(d));

        } else if (wasMidpoint) {
            context.replace(
                iD.actions.Noop(),
                t('operations.add.annotation.vertex'));

        } else {
            context.replace(
                iD.actions.Noop(),
                moveAnnotation(entity));
        }

        var reselection = selectedIDs.filter(function(id) {
            return context.graph().hasEntity(id);
        });

        if (reselection.length) {
            context.enter(
                iD.modes.Select(context, reselection)
                    .suppressMenu(true));
        } else {
            context.enter(iD.modes.Browse(context));
        }
    }

    function cancel() {
        behavior.cancel();
        context.enter(iD.modes.Browse(context));
    }

    function setActiveElements() {
        context.surface().selectAll(iD.util.entitySelector(activeIDs))
            .classed('active', true);
    }

    var behavior = iD.behavior.drag()
        .delegate('g.node, g.point, g.midpoint')
        .surface(context.surface().node())
        .origin(origin)
        .on('start', start)
        .on('move', move)
        .on('end', end);

    mode.enter = function() {
        context.install(hover);
        context.install(edit);

        context.history()
            .on('undone.drag-node', cancel);

        context.map()
            .on('drawn.drag-node', setActiveElements);

        setActiveElements();
    };

    mode.exit = function() {
        context.ui().sidebar.hover.cancel();
        context.uninstall(hover);
        context.uninstall(edit);

        context.history()
            .on('undone.drag-node', null);

        context.map()
            .on('drawn.drag-node', null);

        context.surface()
            .selectAll('.active')
            .classed('active', false);

        stopNudge();
    };

    mode.selectedIDs = function(_) {
        if (!arguments.length) return selectedIDs;
        selectedIDs = _;
        return mode;
    };

    mode.behavior = behavior;

    return mode;
};
