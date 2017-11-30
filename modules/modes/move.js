import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';
import { t } from '../util/locale';

import { actionMove } from '../actions';
import { behaviorEdit } from '../behavior';

import {
    modeBrowse,
    modeSelect
} from './index';

import {
    operationCircularize,
    operationDelete,
    operationOrthogonalize,
    operationReflectLong,
    operationReflectShort,
    operationRotate
} from '../operations';


export function modeMove(context, entityIDs, baseGraph) {
    var mode = {
        id: 'move',
        button: 'browse'
    };

    var keybinding = d3_keybinding('move'),
        behaviors = [
            behaviorEdit(context),
            operationCircularize(entityIDs, context).behavior,
            operationDelete(entityIDs, context).behavior,
            operationOrthogonalize(entityIDs, context).behavior,
            operationReflectLong(entityIDs, context).behavior,
            operationReflectShort(entityIDs, context).behavior,
            operationRotate(entityIDs, context).behavior
        ],
        annotation = entityIDs.length === 1 ?
            t('operations.move.annotation.' + context.geometry(entityIDs[0])) :
            t('operations.move.annotation.multiple'),
        prevGraph,
        cache,
        origin,
        nudgeInterval;


    function vecSub(a, b) {
        return [a[0] - b[0], a[1] - b[1]];
    }


    function edge(point, size) {
        var pad = [80, 20, 50, 20],   // top, right, bottom, left
            x = 0,
            y = 0;

        if (point[0] > size[0] - pad[1])
            x = -10;
        if (point[0] < pad[3])
            x = 10;
        if (point[1] > size[1] - pad[2])
            y = -10;
        if (point[1] < pad[0])
            y = 10;

        if (x || y) {
            return [x, y];
        } else {
            return null;
        }
    }


    function doMove(nudge) {
        nudge = nudge || [0, 0];

        var fn;
        if (prevGraph !== context.graph()) {
            cache = {};
            origin = context.map().mouseCoordinates();
            fn = context.perform;
        } else {
            fn = context.overwrite;
        }

        var currMouse = context.mouse(),
            origMouse = context.projection(origin),
            delta = vecSub(vecSub(currMouse, origMouse), nudge);

        fn(actionMove(entityIDs, delta, context.projection, cache), annotation);
        prevGraph = context.graph();
    }


    function startNudge(nudge) {
        if (nudgeInterval) window.clearInterval(nudgeInterval);
        nudgeInterval = window.setInterval(function() {
            context.pan(nudge);
            doMove(nudge);
        }, 50);
    }


    function stopNudge() {
        if (nudgeInterval) {
            window.clearInterval(nudgeInterval);
            nudgeInterval = null;
        }
    }


    function move() {
        doMove();
        var nudge = edge(context.mouse(), context.map().dimensions());
        if (nudge) {
            startNudge(nudge);
        } else {
            stopNudge();
        }
    }


    function finish() {
        d3_event.stopPropagation();
        context.enter(modeSelect(context, entityIDs));
        stopNudge();
    }


    function cancel() {
        if (baseGraph) {
            while (context.graph() !== baseGraph) context.pop();
            context.enter(modeBrowse(context));
        } else {
            context.pop();
            context.enter(modeSelect(context, entityIDs));
        }
        stopNudge();
    }


    function undone() {
        context.enter(modeBrowse(context));
    }


    mode.enter = function() {
        origin = context.map().mouseCoordinates();
        prevGraph = null;
        cache = {};

        behaviors.forEach(function(behavior) {
            context.install(behavior);
        });

        context.surface()
            .on('mousemove.move', move)
            .on('click.move', finish);

        context.history()
            .on('undone.move', undone);

        keybinding
            .on('⎋', cancel)
            .on('↩', finish);

        d3_select(document)
            .call(keybinding);
    };


    mode.exit = function() {
        stopNudge();

        behaviors.forEach(function(behavior) {
            context.uninstall(behavior);
        });

        context.surface()
            .on('mousemove.move', null)
            .on('click.move', null);

        context.history()
            .on('undone.move', null);

        keybinding.off();
    };


    return mode;
}
