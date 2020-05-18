import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t } from '../core/localizer';

import { actionMove } from '../actions/move';
import { actionNoop } from '../actions/noop';
import { behaviorEdit } from '../behavior/edit';
import { geoViewportEdge, geoVecSubtract } from '../geo';
import { modeBrowse } from './browse';
import { modeSelect } from './select';
import { utilKeybinding } from '../util';


import { operationCircularize } from '../operations/circularize';
import { operationDelete } from '../operations/delete';
import { operationOrthogonalize } from '../operations/orthogonalize';
import { operationReflectLong, operationReflectShort } from '../operations/reflect';
import { operationRotate } from '../operations/rotate';


export function modeMove(context, entityIDs, baseGraph) {
    var mode = {
        id: 'move',
        button: 'browse'
    };

    var keybinding = utilKeybinding('move');
    var behaviors = [
        behaviorEdit(context),
        operationCircularize(context, entityIDs).behavior,
        operationDelete(context, entityIDs).behavior,
        operationOrthogonalize(context, entityIDs).behavior,
        operationReflectLong(context, entityIDs).behavior,
        operationReflectShort(context, entityIDs).behavior,
        operationRotate(context, entityIDs).behavior
    ];
    var annotation = entityIDs.length === 1 ?
        t('operations.move.annotation.' + context.graph().geometry(entityIDs[0])) :
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

        var currMouse = context.map().mouse();
        var origMouse = context.projection(_origin);
        var delta = geoVecSubtract(geoVecSubtract(currMouse, origMouse), nudge);

        fn(actionMove(entityIDs, delta, context.projection, _cache));
        _prevGraph = context.graph();
    }


    function startNudge(nudge) {
        if (_nudgeInterval) window.clearInterval(_nudgeInterval);
        _nudgeInterval = window.setInterval(function() {
            context.map().pan(nudge);
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
        var nudge = geoViewportEdge(context.map().mouse(), context.map().dimensions());
        if (nudge) {
            startNudge(nudge);
        } else {
            stopNudge();
        }
    }


    function finish() {
        d3_event.stopPropagation();
        context.replace(actionNoop(), annotation);
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

        context.features().forceVisible(entityIDs);

        behaviors.forEach(context.install);

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

        context.features().forceVisible([]);
    };


    mode.selectedIDs = function() {
        if (!arguments.length) return entityIDs;
        // no assign
        return mode;
    };


    return mode;
}
