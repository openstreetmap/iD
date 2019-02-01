import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../util/locale';

import { actionMove } from '../actions';
import { behaviorEdit } from '../behavior';
import { geoViewportEdge, geoVecSubtract } from '../geo';
import { modeBrowse, modeSelect } from './index';
import { utilKeybinding } from '../util';

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

    var keybinding = utilKeybinding('move');
    var behaviors = [
        behaviorEdit(context),
        operationCircularize(entityIDs, context).behavior,
        operationDelete(entityIDs, context).behavior,
        operationOrthogonalize(entityIDs, context).behavior,
        operationReflectLong(entityIDs, context).behavior,
        operationReflectShort(entityIDs, context).behavior,
        operationRotate(entityIDs, context).behavior
    ];
    var annotation = entityIDs.length === 1 ?
        t('operations.move.annotation.' + context.geometry(entityIDs[0])) :
        t('operations.move.annotation.multiple');

    var _prevGraph;
    var _cache;
    var _origin;
    var _nudgeInterval;


    function doMove(nudge) {
        nudge = nudge || [0, 0];

        var fn;
        if (_prevGraph !== context.graph()) {
            _cache = {};
            _origin = context.map().mouseCoordinates();
            fn = context.perform;
        } else {
            fn = context.overwrite;
        }

        var currMouse = context.mouse();
        var origMouse = context.projection(_origin);
        var delta = geoVecSubtract(geoVecSubtract(currMouse, origMouse), nudge);

        fn(actionMove(entityIDs, delta, context.projection, _cache), annotation);
        _prevGraph = context.graph();
    }


    function startNudge(nudge) {
        if (_nudgeInterval) window.clearInterval(_nudgeInterval);
        _nudgeInterval = window.setInterval(function() {
            context.pan(nudge);
            doMove(nudge);
        }, 50);
    }


    function stopNudge() {
        if (_nudgeInterval) {
            window.clearInterval(_nudgeInterval);
            _nudgeInterval = null;
        }
    }


    function move() {
        doMove();
        var nudge = geoViewportEdge(context.mouse(), context.map().dimensions());
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
        _origin = context.map().mouseCoordinates();
        _prevGraph = null;
        _cache = {};

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

        d3_select(document)
            .call(keybinding.unbind);
    };


    mode.selectedIDs = function() {
        if (!arguments.length) return entityIDs;
        // no assign
        return mode;
    };


    return mode;
}
