iD.modes.DragNode = function(context) {
    var mode = {
        id: 'drag-node',
        button: 'browse'
    };

    var nudgeInterval,
        activeIDs,
        wasMidpoint,
        cancelled,
        hover = iD.behavior.Hover().altDisables(true);

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

    function connectAnnotation(datum) {
        return t('operations.connect.annotation.' + datum.geometry(context.graph()));
    }

    function origin(entity) {
        return context.projection(entity.loc);
    }

    function start(entity) {
        cancelled = d3.event.sourceEvent.shiftKey;
        if (cancelled) return behavior.cancel();

        wasMidpoint = entity.type === 'midpoint';
        if (wasMidpoint) {
            var midpoint = entity;
            entity = iD.Node();
            context.perform(iD.actions.AddMidpoint(midpoint, entity));

             var vertex = context.surface()
                .selectAll('.vertex')
                .filter(function(d) { return d.id === entity.id; });
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

    function move(entity) {
        if (cancelled) return;
        d3.event.sourceEvent.stopPropagation();

        var nudge = edge(d3.event.point, context.map().size());
        if (nudge) startNudge(nudge);
        else stopNudge();

        var loc = context.map().mouseCoordinates();

        var d = datum();
        if (d.type === 'node' && d.id !== entity.id) {
            loc = d.loc;
        } else if (d.type === 'way') {
            loc = iD.geo.chooseIndex(d, d3.mouse(context.surface().node()), context).loc;
        }

        context.replace(
            iD.actions.MoveNode(entity.id, loc),
            t('operations.move.annotation.' + entity.geometry(context.graph())));
    }

    function end(entity) {
        if (cancelled) return;

        var d = datum();

        if (d.type === 'way') {
            var choice = iD.geo.chooseIndex(d, d3.mouse(context.surface().node()), context);
            context.replace(
                iD.actions.MoveNode(entity.id, choice.loc),
                iD.actions.AddVertex(d.id, entity.id, choice.index),
                connectAnnotation(d));

        } else if (d.type === 'node' && d.id !== entity.id) {
            context.replace(
                iD.actions.Connect([entity.id, d.id]),
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

        context.enter(iD.modes.Browse(context));
    }

    function cancel() {
        behavior.cancel();
        context.enter(iD.modes.Browse(context));
    }

    var behavior = iD.behavior.drag()
        .delegate("g.node, g.point, g.midpoint")
        .surface(context.surface().node())
        .origin(origin)
        .on('start', start)
        .on('move', move)
        .on('end', end);

    mode.enter = function() {
        context.install(hover);

        context.history()
            .on('undone.drag-node', cancel);

        context.surface()
            .selectAll('.node, .way')
            .filter(function(d) { return activeIDs.indexOf(d.id) >= 0; })
            .classed('active', true);
    };

    mode.exit = function() {
        context.uninstall(hover);

        context.history()
            .on('undone.drag_node', null);

        context.surface()
            .selectAll('.active')
            .classed('active', false);

        stopNudge();
    };

    mode.behavior = behavior;

    return mode;
};
