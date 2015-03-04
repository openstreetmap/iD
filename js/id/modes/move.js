iD.modes.Move = function(context, entityIDs) {
    var mode = {
        id: 'move',
        button: 'browse'
    };

    var keybinding = d3.keybinding('move'),
        edit = iD.behavior.Edit(context),
        annotation = entityIDs.length === 1 ?
            t('operations.move.annotation.' + context.geometry(entityIDs[0])) :
            t('operations.move.annotation.multiple'),
        cache,
        origin,
        delta,
        nudgeInterval;

    function vecSub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }

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

            var orig = context.projection(origin);

            orig = vecSub(orig, nudge);
            origin = context.projection.invert(orig);

            // delta = vecSub(delta, nudge);
            // context.overwrite(
            //     iD.actions.Move(entityIDs, delta, context.projection, cache),
            //     annotation);
        }, 50);
    }

    function stopNudge() {
        if (nudgeInterval) window.clearInterval(nudgeInterval);
        nudgeInterval = null;
    }

    function move() {
        var mouse = context.mouse(),
            orig = context.projection(origin);

        var action = iD.actions.Move(entityIDs, vecSub(mouse, orig), context.projection, cache);
        context.overwrite(action, annotation);
        delta = action.delta();

        // TODO restrict nudging if move was restricted..
        // (because geometry may not be under the mouse pointer)
        var nudge = edge(mouse, context.map().dimensions());
        if (nudge) startNudge(nudge);
        else stopNudge();
    }

    function finish() {
        d3.event.stopPropagation();
        context.enter(iD.modes.Select(context, entityIDs)
            .suppressMenu(true));
        stopNudge();
    }

    function cancel() {
        context.pop();
        context.enter(iD.modes.Select(context, entityIDs)
            .suppressMenu(true));
        stopNudge();
    }

    function undone() {
        context.enter(iD.modes.Browse(context));
    }

    mode.enter = function() {
        origin = context.map().mouseCoordinates();
        delta = [0, 0];
        cache = {};

        context.install(edit);

        context.perform(
            iD.actions.Noop(),
            annotation);

        context.surface()
            .on('mousemove.move', move)
            .on('click.move', finish);

        context.history()
            .on('undone.move', undone);

        keybinding
            .on('⎋', cancel)
            .on('↩', finish);

        d3.select(document)
            .call(keybinding);
    };

    mode.exit = function() {
        stopNudge();

        context.uninstall(edit);

        context.surface()
            .on('mousemove.move', null)
            .on('click.move', null);

        context.history()
            .on('undone.move', null);

        keybinding.off();
    };

    return mode;
};
